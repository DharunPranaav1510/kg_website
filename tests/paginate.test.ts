import { test } from "node:test";
import assert from "node:assert/strict";
import { chunk, fetchAll } from "../src/lib/paginate";

test("fetchAll pages until a short page", async () => {
  const total = 2500;
  const calls: number[] = [];
  const { data, error } = await fetchAll<number>(async (from, to) => {
    calls.push(from);
    return { data: Array.from({ length: Math.max(0, Math.min(to + 1, total) - from) }, (_, i) => from + i), error: null };
  });
  assert.equal(error, null);
  assert.equal(data.length, total);
  assert.deepEqual(calls, [0, 1000, 2000]);
});

test("fetchAll stops on error and keeps what it has", async () => {
  let n = 0;
  const { data, error } = await fetchAll<number>(async () =>
    n++ === 0 ? { data: Array(1000).fill(1), error: null } : { data: null, error: new Error("boom") }
  );
  assert.equal(data.length, 1000);
  assert.ok(error);
});

test("chunk", () => assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]));
