# Admin redesign: what is built

The interface part of the redesign specification is built. Nothing on the server changed, so every endpoint, limit and check described in `ADMIN_SPEC.md` works as before.

## Built (interface only)
- App shell: five labelled groups, desktop sidebar that shrinks to icons, phone top bar and bottom bar, "More" menu, status pill with a two-tap pause panel, new-order toast on other screens, "Not connected" bar after three failed polls.
- Shared pieces: toasts with Undo and Retry, named confirmations (with an optional reason field), side panels, "More" menus, on-device drafts.
- Today, Live orders (alerts panel, first-use card, folded "Today so far", swipe on phones), the shared order panel, Order history (table and cards), bill toolbar (remembered paper size, missing-field warning).
- Catalogue: Products (labelled stock switch, tags, quick filters, round add button), product form in six sections, Update prices (change column, review, save bar, adjust panel with sample rows), Offers in three steps with preview.
- Insights: Sales (reading first, six charts titled as questions, "Show as table"), Feedback (filters, order panel link, publish preview).
- Shop: Shop settings in three tabs with a live customer preview, opening hours with special days, Website content (eight business cards with a section list, policy versions panel, reviews and FAQ list pattern).
- Account: Security, Admins (new login or existing login, generated temporary password, ready-made invite message), Activity log (sentences, person and type filters), sign-in screen (48 px controls, auto-submit code, 5-minute countdown, "Can't sign in?").

## Not built, because it needs the server
- Specific login messages with tries left and a live lock countdown.
- Backup codes, "remember this device", silent session renewal, SameSite=Lax cookie.
- First sign-in steps for new admins, change own password.
- Owner actions: set temporary password, reset two-step, see and clear locks.
- A sample-bill preview from Business details (open any order and choose Print bill instead).

## Small differences from the written specification
- Reviews and FAQ rows use up and down arrows, not drag handles.
- The "Published" tag on Feedback is remembered on the device that published, because the server does not record it.
- Times in the opening-hours editor use the browser's own time picker, so a browser may show 06:30 AM; the row beside it always says 6:30 AM.
