import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { acceptInvite, requestInviteCode } from "../src/lib/invite-flow";
import { hashToken, OTP_MAX_ATTEMPTS, OTP_MAX_SENDS } from "../src/lib/invites";

// A tiny in-memory stand-in for Supabase: enough of the query builder for the invite flow.
type Row = Record<string, unknown>;
function fakeSupabase() {
  const tables: Record<string, Row[]> = { admin_invites: [], admins: [] };
  const users: { id: string; email: string; password: string }[] = [];
  let failUserCreate = false;

  class Q {
    private filters: ((r: Row) => boolean)[] = [];
    private op: "select" | "update" | "insert" | "upsert" | "delete" = "select";
    private patch: Row = {};
    private wantRows = false;
    constructor(private t: string) {}
    select() { this.wantRows = true; return this; }
    insert(v: Row | Row[]) { this.op = "insert"; this.patch = v as Row; return this; }
    upsert(v: Row) { this.op = "upsert"; this.patch = v; return this; }
    update(v: Row) { this.op = "update"; this.patch = v; return this; }
    delete() { this.op = "delete"; return this; }
    eq(c: string, v: unknown) { this.filters.push((r) => r[c] === v); return this; }
    ilike(c: string, v: string) { this.filters.push((r) => String(r[c]).toLowerCase() === v.toLowerCase()); return this; }
    is(c: string, v: null) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
    private run() {
      const rows = tables[this.t];
      const hit = rows.filter((r) => this.filters.every((f) => f(r)));
      if (this.op === "update") hit.forEach((r) => Object.assign(r, this.patch));
      if (this.op === "delete") tables[this.t] = rows.filter((r) => !hit.includes(r));
      if (this.op === "insert") rows.push({ id: `id${rows.length + 1}`, ...(this.patch as Row) });
      if (this.op === "upsert") {
        const existing = rows.find((r) => r.email === this.patch.email);
        if (existing) Object.assign(existing, this.patch);
        else rows.push({ ...this.patch });
      }
      return hit;
    }
    maybeSingle() { const hit = this.run(); return Promise.resolve({ data: hit[0] ?? null, error: null }); }
    then(res: (v: { data: Row[]; error: null }) => unknown) { return Promise.resolve({ data: this.run(), error: null }).then(res); }
  }

  const client = {
    from: (t: string) => new Q(t),
    auth: {
      admin: {
        createUser: async ({ email, password }: { email: string; password: string }) => {
          if (failUserCreate) return { data: null, error: new Error("boom") };
          if (users.some((u) => u.email === email)) return { data: null, error: new Error("already registered") };
          users.push({ id: `u${users.length + 1}`, email, password });
          return { data: {}, error: null };
        },
        listUsers: async () => ({ data: { users }, error: null }),
        updateUserById: async (id: string, patch: { password: string }) => {
          Object.assign(users.find((u) => u.id === id)!, { password: patch.password });
          return { data: {}, error: null };
        },
      },
    },
  };
  return { db: client as unknown as SupabaseClient, tables, users, breakUserCreate: () => (failUserCreate = true) };
}

const TOKEN = "tok-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
const GOOD_PW = "Blue-Tractor-Lamp-2026";

function seed(f: ReturnType<typeof fakeSupabase>, over: Row = {}) {
  f.tables.admin_invites.push({
    id: "inv1",
    email: "new@example.com",
    token_hash: hashToken(TOKEN),
    otp_hash: null,
    otp_expires_at: null,
    otp_attempts: 0,
    otp_sends: 0,
    last_otp_sent_at: null,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    invited_by: "boss@example.com",
    used_at: null,
    revoked_at: null,
    ...over,
  });
}

/** Asks for a code and returns the one that was "emailed". */
async function codeFor(f: ReturnType<typeof fakeSupabase>) {
  const sent: { to: string; text: string }[] = [];
  const r = await requestInviteCode(f.db, TOKEN, async (m) => (sent.push({ to: m.to, text: m.text }), { ok: true }));
  assert.equal(r.status, 200);
  return { code: sent[0].text.match(/\b(\d{6})\b/)![1], sent };
}

test("happy path: the code goes only to the invited address, then the admin exists", async () => {
  const f = fakeSupabase();
  seed(f);
  const { code, sent } = await codeFor(f);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "new@example.com");
  assert.equal(f.tables.admin_invites[0].otp_hash !== code, true); // never stored in plain text

  const r = await acceptInvite(f.db, { token: TOKEN, code, password: GOOD_PW });
  assert.equal(r.status, 200);
  assert.equal(f.users.length, 1);
  assert.equal(f.users[0].email, "new@example.com");
  assert.equal(f.tables.admins[0].email, "new@example.com");
  assert.equal(f.tables.admins[0].added_by, "boss@example.com");
  assert.ok(f.tables.admin_invites[0].used_at);
});

test("an invite can only be used once", async () => {
  const f = fakeSupabase();
  seed(f);
  const { code } = await codeFor(f);
  assert.equal((await acceptInvite(f.db, { token: TOKEN, code, password: GOOD_PW })).status, 200);
  const again = await acceptInvite(f.db, { token: TOKEN, code, password: GOOD_PW + "x" });
  assert.equal(again.status, 400);
  assert.equal(f.users.length, 1);
});

test("a wrong code is refused and the code dies after too many tries", async () => {
  const f = fakeSupabase();
  seed(f);
  const { code } = await codeFor(f);
  const wrong = code === "000000" ? "111111" : "000000";
  for (let i = 1; i < OTP_MAX_ATTEMPTS; i++) {
    const r = await acceptInvite(f.db, { token: TOKEN, code: wrong, password: GOOD_PW });
    assert.equal(r.status, 400);
    assert.equal(r.countFail, true);
  }
  const last = await acceptInvite(f.db, { token: TOKEN, code: wrong, password: GOOD_PW });
  assert.equal(last.body.needNewCode, true);
  // even the right code no longer works: a new one has to be requested
  const late = await acceptInvite(f.db, { token: TOKEN, code, password: GOOD_PW });
  assert.equal(late.status, 400);
  assert.equal(f.users.length, 0);
  assert.equal(f.tables.admins.length, 0);
});

test("without asking for a code first nothing can be accepted", async () => {
  const f = fakeSupabase();
  seed(f);
  const r = await acceptInvite(f.db, { token: TOKEN, code: "123456", password: GOOD_PW });
  assert.equal(r.status, 400);
  assert.equal(f.users.length, 0);
});

test("expired, cancelled and unknown links give the same answer", async () => {
  for (const over of [{ expires_at: new Date(Date.now() - 1000).toISOString() }, { revoked_at: new Date().toISOString() }]) {
    const f = fakeSupabase();
    seed(f, over);
    const a = await requestInviteCode(f.db, TOKEN, async () => ({ ok: true }));
    assert.equal(a.status, 400);
  }
  const f = fakeSupabase();
  seed(f);
  const unknown = await requestInviteCode(f.db, "some-other-token", async () => ({ ok: true }));
  assert.equal(unknown.status, 400);
  assert.equal(unknown.body.error, (await requestInviteCode(f.db, "", async () => ({ ok: true }))).body.error);
});

test("an expired code needs a new one", async () => {
  const f = fakeSupabase();
  seed(f);
  const { code } = await codeFor(f);
  f.tables.admin_invites[0].otp_expires_at = new Date(Date.now() - 1000).toISOString();
  const r = await acceptInvite(f.db, { token: TOKEN, code, password: GOOD_PW });
  assert.equal(r.body.needNewCode, true);
});

test("a weak password does not use up the invitation", async () => {
  const f = fakeSupabase();
  seed(f);
  const { code } = await codeFor(f);
  const weak = await acceptInvite(f.db, { token: TOKEN, code, password: "short1" });
  assert.equal(weak.status, 400);
  assert.equal(weak.countFail, undefined);
  assert.equal(f.tables.admin_invites[0].used_at, null);
  assert.equal((await acceptInvite(f.db, { token: TOKEN, code, password: GOOD_PW })).status, 200);
});

test("codes are rate limited per invitation", async () => {
  const f = fakeSupabase();
  seed(f);
  const send = async () => ({ ok: true as const });
  assert.equal((await requestInviteCode(f.db, TOKEN, send)).status, 200);
  const soon = await requestInviteCode(f.db, TOKEN, send);
  assert.equal(soon.status, 429); // one a minute
  assert.ok(soon.body.wait);
  f.tables.admin_invites[0].last_otp_sent_at = new Date(Date.now() - 120_000).toISOString();
  f.tables.admin_invites[0].otp_sends = OTP_MAX_SENDS;
  assert.equal((await requestInviteCode(f.db, TOKEN, send)).status, 429); // overall cap
});

test("if the email cannot be sent no code is stored", async () => {
  const f = fakeSupabase();
  seed(f);
  const r = await requestInviteCode(f.db, TOKEN, async () => ({ ok: false as const, error: "no mail" }));
  assert.equal(r.status, 502);
  assert.equal(f.tables.admin_invites[0].otp_hash, null);
});

test("if the account cannot be created the invitation is given back", async () => {
  const f = fakeSupabase();
  seed(f);
  const { code } = await codeFor(f);
  f.breakUserCreate();
  const r = await acceptInvite(f.db, { token: TOKEN, code, password: GOOD_PW });
  assert.equal(r.status, 500);
  assert.equal(f.tables.admin_invites[0].used_at, null);
  assert.equal(f.tables.admins.length, 0);
});

test("an older login for the same email gets its password reset", async () => {
  const f = fakeSupabase();
  seed(f);
  f.users.push({ id: "old", email: "new@example.com", password: "old-password-1" });
  const { code } = await codeFor(f);
  assert.equal((await acceptInvite(f.db, { token: TOKEN, code, password: GOOD_PW })).status, 200);
  assert.equal(f.users.length, 1);
  assert.equal(f.users[0].password, GOOD_PW);
});
