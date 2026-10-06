export interface Faq {
  id: string;
  question: string;
  answer: string;
}

// Starting content. Edit or replace it from the admin panel (Website content > FAQ).
export const defaultFaqs: Faq[] = [
  {
    id: "faq-1",
    question: "How do I place an order?",
    answer:
      "Pick what you need on the Shop page and send the order. Someone from our team will call you to confirm the items, price and delivery time. Your order is confirmed only after that call.",
  },
  {
    id: "faq-2",
    question: "How do I pay?",
    answer: "You pay on delivery, in cash or UPI. We do not take payments on the website.",
  },
  {
    id: "faq-3",
    question: "What areas do you deliver to?",
    answer: "We deliver across Hosur. If you are unsure whether we reach your area, call us and we will tell you.",
  },
  {
    id: "faq-4",
    question: "Is there a minimum order or delivery charge?",
    answer: "Yes. The minimum order and delivery charge are shown at checkout and on our Delivery Policy page. Delivery is free above a certain order value.",
  },
  {
    id: "faq-5",
    question: "What if something is wrong with my order?",
    answer: "Tell us within 2 hours of delivery with a photo and we will replace it or refund it. See our Refund Policy for details.",
  },
  {
    id: "faq-6",
    question: "Can I cancel an order?",
    answer: "Yes, before we start preparing it. Call us with your order number. See our Cancellation Policy for details.",
  },
];
