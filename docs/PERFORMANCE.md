# Speed: why the admin can feel slow, and what to do

## What usually makes it slow

1. **Distance between Vercel and Supabase (the big one).**
   Every admin action makes several quick trips from the Vercel server to Supabase. By default Vercel runs your functions in the **USA (Washington, `iad1`)**. If your Supabase project is in **India (Mumbai) or Singapore**, every trip crosses the world (about 200 to 300 ms each), and a page needs several of them.

   **Fix (free, 2 minutes):**
   1. Supabase → Project Settings → General → note the **Region** (for example *South Asia (Mumbai)*).
   2. Vercel → your project → Settings → **Functions** → **Function Region** → pick the nearest match (Mumbai = `bom1`, Singapore = `sin1`).
   3. Redeploy.

   This usually makes the admin 3 to 5 times quicker. If you are about to create the Supabase project again, pick the region closest to **your customers and Vercel's region**.

2. **Cold starts on the free plan.** After a quiet period the first request wakes the server (about 1 second). Later requests are quick. Not fixable on the free plan, but it only affects the first click.

3. **Checking who you are on every request.** This is fixed in code now: the checks run side by side and are remembered for 30 seconds per server, so a page that makes several requests checks once.

4. **Background refreshing.** The admin used to refresh itself even in a background tab. It now only refreshes while the tab is visible.

## How to see what is slow

Vercel → your project → **Observability** (or **Logs**) shows how long each request took. Look at `/api/admin/...` requests: under about 400 ms is good; over a second usually means the region mismatch above.
