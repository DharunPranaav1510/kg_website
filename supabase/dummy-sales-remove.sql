-- REMOVE the dummy sales data added by dummy-sales-add.sql. Run in the Supabase SQL editor.
-- It deletes every order whose note starts with "DUMMY DATA" (their feedback goes with them).
-- Real orders are never touched. Run the first line alone if you want to see how many will go.

-- select count(*) from public.orders where note like 'DUMMY DATA%';

delete from public.orders where note like 'DUMMY DATA%';
