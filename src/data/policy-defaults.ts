export const POLICY_SLUGS = ["privacy", "terms", "refunds", "cancellation", "delivery"] as const;
/** Date shown for the built-in text until the owner publishes their own version. */
export const BUILT_IN_POLICY_DATE = "6 October 2026";

export type PolicySlug = (typeof POLICY_SLUGS)[number];

export interface PolicyDoc {
  title: string;
  subtitle: string;
  body: string;
}

/** Placeholders usable inside any policy text, e.g. {{phone}}. Replaced with the live business details. */
export const POLICY_VARIABLES: { name: string; label: string }[] = [
  { name: "shop_name", label: "Shop name" },
  { name: "legal_name", label: "Legal business name" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email" },
  { name: "address", label: "Address" },
  { name: "city", label: "City" },
  { name: "hours", label: "Opening hours" },
  { name: "fssai", label: "FSSAI number" },
  { name: "grievance_name", label: "Grievance officer" },
  { name: "grievance_email", label: "Grievance email" },
  { name: "grievance_phone", label: "Grievance phone" },
  { name: "delivery_fee", label: "Delivery fee (₹)" },
  { name: "free_above", label: "Free delivery above (₹)" },
  { name: "min_order", label: "Minimum order (₹)" },
  { name: "areas", label: "Delivery areas" },
  { name: "slots", label: "Delivery slots" },
];

export const DEFAULT_POLICIES: Record<PolicySlug, PolicyDoc> = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "Your privacy matters to us. Here is how we handle your data.",
    body: `## Information we collect
When you place an order we collect your name, mobile number, delivery address (house number, street, area, landmark and pincode), delivery time preference, any note you write, and what you ordered. Your email address is optional. When you use our contact form we collect your name, mobile number, message and, if you choose to give it, your email address.

## Your location (optional)
If you tap "Use my current location" at checkout, your browser asks for permission and shares your coordinates with us so our delivery team can find you. To fill in your street and area, the coordinates are also sent to OpenStreetMap's address lookup service (nominatim.openstreetmap.org). You can decline, and type your address instead.

## How we use your data
We use your details to call you to confirm your order, deliver it, and answer your questions. An order is confirmed only after someone from {{shop_name}} contacts you. Payment is made on delivery. We do not take card or UPI details on this website. We do not sell your personal information. We share your name, number and address only with the people who deliver your order.

## Keeping the site safe
To prevent fake and repeated orders we keep a scrambled, one-way code derived from your device's internet address (not the address itself) and we limit how many orders one mobile number can place. We may block numbers that are used to place false orders. Our forms may use a privacy-friendly security check (Cloudflare Turnstile).

## Who stores your data
Order and enquiry records are stored with our database provider (Supabase) and the website is hosted by Vercel. If email notifications are switched on, they are sent through Resend. These providers process data on our behalf only to run the shop.

## Data retention and your choices
We keep order records for up to three years for accounting and quality purposes. You can ask us to see, correct or delete your personal data by emailing [{{email}}](mailto:{{email}}) or calling {{phone}}.

## Cookies and local storage
Your browser stores your cart, and (to save you typing) your last delivery details and order numbers, on your own device. Staff sign-in uses essential cookies. We do not use advertising cookies or third-party trackers.

## Complaints
For any privacy concern, contact {{grievance_name}} at [{{grievance_email}}](mailto:{{grievance_email}}) or {{grievance_phone}}.`,
  },

  terms: {
    title: "Terms of Service",
    subtitle: "Please read these terms before placing an order with us.",
    body: `## About these terms
These terms apply when you order from {{shop_name}} ({{legal_name}}), {{address}}. FSSAI licence: {{fssai}}. By sending an order you agree to these terms, our [Privacy Policy](/privacy), [Delivery Policy](/delivery), [Cancellation Policy](/cancellation) and [Refund Policy](/refunds).

## How an order works
- Sending an order on the website is a request, not a confirmed order.
- An order is confirmed only after someone from {{shop_name}} calls you and confirms the items, price and delivery time.
- We may decline or cancel an order, for example if an item is out of stock, the address is outside our delivery area, or we cannot reach you.

## Prices and payment
- Prices are per kilogram or per dozen, as shown on the website, in Indian rupees. The final bill is for the weight we actually pack.
- Delivery fee: ₹{{delivery_fee}}, free on orders of ₹{{free_above}} or more. Minimum order: ₹{{min_order}}.
- Payment is made on delivery. We do not take online payments on this website.

## Delivery
We deliver within {{city}}. Delivery times are confirmed when we call you. See our [Delivery Policy](/delivery).

## Quality
Please check your order when it arrives and store it properly. If something is not right, follow our [Refund Policy](/refunds). We are not responsible for spoilage caused by storage after delivery.

## Misuse
Placing false or repeated orders can lead to a phone number being blocked from ordering.

## Liability
Our liability is limited to the value of the products you purchased. We are not responsible for indirect or consequential losses.

## Contact
{{shop_name}}, {{address}}. Phone {{phone}}, email [{{email}}](mailto:{{email}}).`,
  },

  refunds: {
    title: "Refund & Replacement Policy",
    subtitle: "We stand behind the quality of what we deliver.",
    body: `## How you pay
Orders are paid on delivery. We do not take card or bank details on this website. Because nothing is paid in advance, a refund means we either do not charge you, give your money back at your door, or send a replacement.

## Quality guarantee
If something you receive is not fresh (bad smell, discolouration, damaged or leaking packaging), tell us within 2 hours of delivery with a clear photo. We will replace it or refund it, whichever you prefer.

## When we will refund or replace
- The product is not fresh or the packaging is damaged.
- You received a different item from what we confirmed on the call.
- The weight is noticeably less than what you were charged for.

## When we cannot
Fresh meat and eggs are perishable, so we cannot accept change-of-mind returns. We also cannot refund products that were cooked, frozen or stored incorrectly after delivery, or problems reported after the 2 hour window.

## How to ask
Call {{phone}} or message us on WhatsApp with your order number and a photo. If a refund is due, we return the money the same way you paid (cash or UPI) as soon as we have checked the issue, usually the same day.

## Related
See our [Cancellation Policy](/cancellation) and [Delivery Policy](/delivery).`,
  },

  cancellation: {
    title: "Cancellation Policy",
    subtitle: "Changed your mind? Here is how cancelling works.",
    body: `## When an order is confirmed
Sending an order on the website is a request. It becomes a confirmed order only after someone from {{shop_name}} calls you and confirms the items, price and time. Until then you can cancel freely and you owe nothing.

## Cancelling as a customer
- **Before we call, or before we start preparing it:** cancel at no charge.
- **After your meat has been cut, cleaned or packed to order:** we may not be able to cancel, because fresh meat cannot be resold.
- **Out for delivery:** please call us. If you refuse delivery without a reason, we may ask you to confirm the next order by calling first.

To cancel, call {{phone}} or message us on WhatsApp with your order number.

## When we may cancel
We may cancel an order if an item is out of stock, the address is outside our delivery area, we cannot reach you on the number given, or the order looks fake or abusive. We will tell you, and you are never charged for an order we cancel. Repeated false orders can lead to a number being blocked.

## Payment
You pay on delivery, so cancelling before delivery needs no refund. For problems after delivery see our [Refund Policy](/refunds).`,
  },

  delivery: {
    title: "Delivery Policy",
    subtitle: "Where, when and how much.",
    body: `## Where we deliver
We deliver within {{city}}. Areas we usually cover include {{areas}}. If your area is not listed, call us and we will tell you if we can reach you.

## Minimum order and charges
- Minimum order: ₹{{min_order}}.
- Delivery charge: ₹{{delivery_fee}}. It is free on orders of ₹{{free_above}} or more.
- Prices are per kg or dozen and the final bill is for the weight we actually pack.

## Time slots
{{slots}}

The slot you pick is a preference. We confirm the exact time when we call you, and delivery can take longer during rush hours or bad weather.

## How it works
1. You send an order on the website.
2. Someone from {{shop_name}} calls to confirm it. It is not confirmed before this.
3. We prepare it and deliver it in the slot we agreed.
4. You pay on delivery.

## If nobody is available
Please keep your phone on. If we cannot reach you after a few tries, we may cancel the order. See our [Cancellation Policy](/cancellation). For quality problems see our [Refund Policy](/refunds).

## Contact
Call {{phone}}, open {{hours}}.`,
  },
};
