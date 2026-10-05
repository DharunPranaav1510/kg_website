// Fetch helper for admin API calls. A 401 means the short-lived session
// expired: bounce through the refresh route (which falls back to login).
export async function adminApi(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (res.status === 401) {
    window.location.href = "/api/admin/refresh";
    throw new Error("Session expired");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error([data.error ?? "Something went wrong", data.detail].filter(Boolean).join(" — "));
  return data;
}
