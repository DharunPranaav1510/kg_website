# KG Foods admin: how to use it

A guide for the people who run the shop. No technical knowledge needed.

The admin is at **your website address + /admin** (for example `kgfoods.co.in/admin`). It works on a phone, a tablet and a computer. Most of the day you will only need two screens: **Live orders** and the **status pill**.

---

## 1. Signing in

1. Open the admin address and enter your **email** and **password**. Tap **Show** to check what you typed.
2. If two-step login is on for your account, you then type the **6-digit code** from your authenticator app (Google Authenticator, Microsoft Authenticator or Authy). It signs you in by itself on the sixth digit. You have 5 minutes to enter it.
3. Codes change every 30 seconds. Always use the newest one. If codes keep failing, check that your phone's date and time are set to "automatic".

**First time with two-step login:** the admin shows a QR code. Open the authenticator app, add an account by scanning it (or tap *On this phone? Open your authenticator app*, or type the key), then type the first code.

**If you cannot sign in:** tap **Can't sign in?** on the sign-in page. Five wrong passwords in a row lock sign-in for 15 minutes, so wait and try again. If your password is right but it still fails, your email may not be on the admin list yet: ask the owner.

**Always sign out on shared computers** (Log out at the bottom of the menu).

---

## 2. Finding your way around

**On a phone:** the bar at the bottom has **Today, Orders, Products, Prices** and **More**. *More* opens every other screen. The red number on *Orders* is how many new orders are waiting.

**On a computer:** the menu is on the left, in five groups. The arrows at its top shrink it to icons.

| Group | Screens |
|---|---|
| Orders | Today, Live orders, Order history |
| Catalogue | Products, Update prices, Offers |
| Insights | Sales, Feedback |
| Shop | Shop settings, Website content |
| Account | Security, Activity log, Admins (owner only) |

### The status pill
At the top of every screen, a pill says what customers can do **right now**:

- **Open · closes 5:00 PM**: taking orders.
- **Closed · opens tomorrow 6:30 AM**: shut by the timetable.
- **Orders paused**: you stopped orders by hand.
- **Open late · until 5:00 PM tomorrow**: opened outside the usual hours.

Tap the pill to change it (see section 4).

### Messages at the bottom
After most actions a dark message appears at the bottom with **Undo** for about 7 seconds. If you tapped the wrong thing, press Undo straight away.

---

## 3. A normal day

1. **Morning:** check the status pill says *Open*. Mark anything that is sold out (see Update prices).
2. **During the day:** keep **Live orders** open. For each new order: **call the customer**, then tap **Confirm order**.
3. **When the order leaves:** tap **Out for delivery**. When it reaches the customer: **Mark delivered**.
4. **Evening:** glance at **Today** to see the day's orders and sales.

Customers are not asked for an OTP. **Your phone call is the check** that the order is real, so call before you confirm.

---

## 4. Opening and closing the shop

The shop opens and closes by itself using the **opening hours** (default 6:30 AM to 5:00 PM, every day). You only step in when something unusual happens. Tap the **status pill** to see your options.

| Situation | What you will see | What it does |
|---|---|---|
| Open during hours | **Pause orders** (with a message for customers) | Stops new orders until you resume. Orders already received continue. |
| Paused | **Resume orders** | Orders follow the opening hours again. |
| Closed because of time (after 5 PM, before 6:30 AM, a day off) | **Open until …** | Opens the shop now and keeps it open until the **next regular closing time**. Pressed at 8 PM it stays open until 5 PM the next day. Pressed at 5 AM it stays open until 5 PM that day. Then the usual hours apply again by themselves. |
| Opened late | **Close the shop now** | Closes it again straight away. |

Good to know:
- **Pausing always wins.** If you pause, nobody can order, even during opening hours or after opening late.
- Customers can still **browse** while the shop is closed or paused. They just cannot order. They see a closed view with when you open next.
- The same buttons are also on **Today** and in **Shop settings**.

---

## 5. Live orders

**Orders → Live orders** is the screen to leave open on a tablet or phone at the counter.

### The board
Four columns: **New → Confirmed → Out for delivery → Delivered**. On a phone you see one column at a time. Tap the tabs at the top, or swipe left and right. The screen refreshes itself every 10 seconds ("Updated 4 s ago"). If connection is lost it says *Retrying*.

### An order card shows
- The order number and **how long it has waited**. The time turns amber (*waiting*) then red (*late*) so slow orders stand out.
- The customer's name and a hint: **First order** or how many earlier orders they have had (a quick way to spot fakes).
- What they ordered, the total, the delivery time they chose (**Deliver now** shows in bold), the address (the small pin opens the map), and any note they wrote.

### What you can do
- **Call**: dials the customer.
- The big button is the next step: **Confirm order**, then **Out for delivery**, then **Mark delivered**.
- **More** holds the rest: WhatsApp message, Print slip, Print bill, Step back one status, Cancel order, Block this phone number.
- **Tap anywhere else on the card** to open the **full order** in a side panel: phone, WhatsApp, full address, every item, delivery charge and total, with the same buttons at the bottom.

### Alerts (so you never miss an order)
Tap **Alerts** at the top:
- **Sound**: a beep for every new order. Tap **Test sound** once so the browser allows it.
- **Browser notification**: a pop-up even if you are in another tab.
- **Keep screen awake**: stops the screen going to sleep.

The first time you open the screen, a card offers to set these up. If your browser says notifications are blocked, click the lock icon next to the web address and choose *Allow*.

### Today so far
The panel under the title shows the time since the last order, today's top sellers and orders by hour. Tap it to fold it away.

### Cancelling and blocking
- **Cancel order** asks you to confirm. Use it for fake or unreachable orders.
- **Block this phone number** asks for a short reason. The number can no longer order online. You can undo this in Shop settings.

---

## 6. Order history

**Orders → Order history** lists every order.

- Choose **Today, 7 days, 30 days** or **All**, and filter by status.
- Search by name, phone, email or order number.
- Tap a row to open the full order. Change the status from the coloured status menu (cancelling asks first).
- **Download CSV** saves the list as a spreadsheet for your accountant.
- If nothing matches, the screen offers a wider date range.

### Printing a bill
Open any order and choose **Print bill** (or use **More → Print bill**).
- Choose **80 mm receipt** (the counter printer) or **A4**. The admin remembers your choice.
- Check the **Payment** line (To be paid on delivery, Cash, UPI or Card) and press **Print**.
- A yellow warning appears if the GSTIN, FSSAI number, address or phone are missing. Fix them in *Website content → Business details → Legal and bill*.
- **Print slip** gives a small slip for the kitchen or the delivery person instead.

---

## 7. Products

**Catalogue → Products** is your product list.

- **Search**, pick a category, or use the quick filters: **Sold out, Hidden, On offer**.
- The switch on each product is **In stock / Sold out**. It works immediately, and customers see *Sold out* at once. Undo is offered.
- **Edit** opens the product form. **More → Delete** asks first and offers *Hide from shop instead* (usually the better choice).
- **Add product**: the orange button at the top right on a computer, the round **+** on a phone. If the list is empty you can **Import default products** to start.

### The product form
- **Basics:** photo (JPG, PNG or WebP, up to 4 MB, or *Use a link instead*), name, category, price, short description, badge.
- **Availability:** Visible in shop, In stock, Featured on home page, Sold per dozen (for eggs, the price is per dozen).
- **Weights** (folded): which quantities customers may pick. Leave empty for the standard steps.
- **Tax** (folded): a GST rate for this product only, and the HSN code. Empty means the category rate is used.
- **Offer** (folded): offer price, label, start and end time.
- **Selling schedule** (folded): sell only on certain days or times, for example Sundays 6:30 AM to 12:00 PM.

The folded sections show a summary line, so you can see what is set without opening them. If you close the form with unsaved changes, it asks first and keeps a **draft** on the device.

---

## 8. Update prices

**Catalogue → Update prices** is the fastest way to change many prices.

1. Type a new price next to each product (Enter moves to the next one). Changed rows turn yellow and show the difference, like **+₹10 (+4.2%)**.
2. When you have changed some, a bar appears at the bottom: **Discard, Review, Save**.
3. **Review** lists every change as old price → new price. You can remove any line.
4. **Save** puts the new prices live for customers straight away. Nothing changes for customers until you save.

**Adjust many at once** raises or lowers all the products currently shown (use the category buttons first to narrow them): choose Raise or Lower, percent or rupees, the amount, and rounding to ₹1, ₹5 or ₹10. It shows three examples, then **Apply to table** fills in the new prices. You still press Save.

Each save can include up to 200 changes. The **Sold out switch** on this screen acts immediately, like on Products.

---

## 9. Offers

**Catalogue → Offers** puts slow-selling products on sale. The shop shows the old price crossed out.

At the top, **Running now** lists current offers (with *Remove*), and **Scheduled** lists offers that have not started yet. To make a new offer:

1. **Choose products.** The list shows how much each sold in the last 30 days, slowest first. *Pick the 5 slowest* is a shortcut.
2. **Set the offer:** percent off (1 to 90), a label, and optional start and end times (Indian time). *Today, 3 days, 1 week* buttons set the end quickly.
3. **Check and apply.** You see exactly how each product will look. Press **Apply offer to N products**.

---

## 10. Sales

**Insights → Sales** shows how the shop is doing. Pick **Today, 7 days, 30 days, 90 days** or **This month**. Everything is compared with the period before.

- Four numbers: **Sales, Orders, Average order, Cancelled**, each marked *up* or *down*.
- **What stands out** explains the main points in plain sentences.
- Charts answer questions: *When do orders come in? Which days are busiest? What sells most? Where does the money come from? Which delivery slots do customers pick? Are customers coming back?*
- Switch **Show as table** on any chart to see the exact numbers.

Cancelled orders are not counted as sales. Totals include delivery charges.

---

## 11. Feedback

**Insights → Feedback** shows ratings customers leave after a delivered order.

- The big number is the average. Tap a star bar to see only that rating.
- Filters: **All, With comments, Low ratings**. Low ratings are worth a call.
- Tap the order number to open the order (and call the customer).
- **Show on the website** (for written 4 and 5 star comments) shows how the review will look, with the first name only, then publishes it. You can hide or edit it later in Website content → Reviews.

---

## 12. Website content

**Shop → Website content** controls what customers read. **Save and publish** puts changes live straight away.

### Business details
Cards for each topic. The list on the left (a dropdown on phones) jumps to a card, and a dot shows which cards have unsaved changes.
- **Shop and contact:** phone, WhatsApp, email.
- **Address and location:** address, shop latitude and longitude (the centre of your delivery circle), areas you deliver to. *Check on map* confirms the pin is right.
- **Delivery:** delivery charge (default ₹50), delivery radius (default 6 km), minimum order, free-delivery amount, and the delivery time slots. "Deliver now" is always offered first.
- **GST:** on or off, whether prices include GST or GST is added on top, and the rate per category (frozen products default to 5%).
- **Legal and bill:** legal name, GSTIN, FSSAI number, bill address and phone, bill number prefix, bill footer message.
- **Grievance officer, Highlights, Notice bar** (a one-line message above every page, for festival timings).

At the bottom, one bar names what you changed. Press **Save and publish**, or **Discard**.

### Policies
Privacy, Terms, Refunds, Cancellation and Delivery. Edit the title and text (the buttons add headings, bold, lists and links). **Versions** keeps the last 20 saves, so you can *Preview* and *Restore* an older one. **More → Reset to built-in text** returns to the original. Have a lawyer or CA read the final wording.

### Reviews and FAQ
Add, edit, reorder with the arrows, and hide with the **Visible** switch. Until you edit them, the website shows built-in examples: press **Copy defaults** to start editing, then replace the sample reviews with real ones.

---

## 13. Shop settings

**Shop → Shop settings** has three tabs. A small preview on the right always shows **what customers see**.

1. **Orders on or off:** *Follow opening hours* or *Pause orders now* (with a message and ready-made phrases). This is also where you open late or close the shop now.
2. **Opening hours:** switch each day on or off and set its times. **Copy Monday to all days** saves typing.
   - **Special days:** a holiday (Closed) or one date with different hours, with a note such as *Diwali*. They replace the weekly hours on that date. Past dates are folded away.
   - Press **Save and publish**. The website follows the new hours straight away.
3. **Blocked numbers:** add a number with a reason, or **Unblock**. Blocked numbers cannot place orders.

---

## 14. Activity log

**Account → Activity log** is a record of who did what: sign-ins (including failed ones, marked *Failed*), price changes with old and new values, order changes, content edits, pauses and openings. Filter by person or type, or search any word. It shows the latest 300 actions. If something changed and nobody knows why, look here first.

---

## 15. Security

**Account → Security**
- **Two-step login:** turn it on or off (it cannot be turned off if the owner has made it compulsory).
- **Sign out of all devices:** use this if you lost a phone or signed in on a shared computer. It also signs you out here.

**Lost your phone or forgot your password?** Ask the owner. They can reset your sign-in in Supabase (Authentication → Users).

Good habits: use a long password that is not used anywhere else, never share it, and never send your codes to anyone.

---

## 16. Admins (owner only)

Only the owner (`dpranaav@gmail.com`) sees **Account → Admins**.

- **Add admin:** enter their email. Choose *Create a new login* (the admin makes a temporary password for them; **Generate** makes a strong one) or *This person already has a login*. After adding, copy the ready-made message, or tap **Send on WhatsApp**, and send it to them privately. The password is shown only once.
- **Remove admin** asks first. They lose access within about 30 seconds. The owner cannot be removed.

---

## 17. Something looks wrong

| Problem | What to do |
|---|---|
| New orders do not show | Check the red "Not connected" bar. Check your internet. Reload the page. |
| No sound on new orders | Open Alerts, switch Sound on, tap Test sound. Check the phone is not on silent. |
| Customers say they cannot order | Check the status pill. If it says Closed and it should be open, tap it and choose *Open until …*. Check the shop is not Paused. |
| Prices did not change on the site | Check you pressed **Save** on Update prices. Reload the website once. |
| A page asks me to sign in again | Your session ended. Sign in again. Unsaved forms are kept as a draft on that device. |
| "Not saved" message | Read the reason shown, fix it, then press **Retry**. |
| Wrong order status | Use **Undo**, or open the order and use *Step back*. |

For anything else, ask the owner or the person who set up the website.

---

### Quick reference

| I want to… | Go to |
|---|---|
| Confirm or move an order | Live orders |
| Stop orders for a while | Status pill → Pause orders |
| Open after 5 PM | Status pill → Open until … |
| Mark something sold out | Products or Update prices (the switch) |
| Change many prices | Update prices |
| Run a sale | Offers |
| Print a bill | Open the order → Print bill |
| Change opening hours or add a holiday | Shop settings → Opening hours |
| See today's sales | Today or Sales |
| Edit policies, phone number, delivery charge | Website content |
| Block a fake caller | Order → More → Block this phone number |
| See who changed something | Activity log |
