export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  image: string;
  rating: number;
  quote: string;
  product: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Priya Nair",
    role: "Home Chef",
    location: "Hosur, Tamil Nadu",
    image: "/images/testimonials/customer-1.jpg",
    rating: 5,
    quote:
      "The chicken breast is so fresh — you can tell the difference the moment you open the pack. No odd smell, no excess water. I've switched from my local market entirely. My family noticed the taste upgrade immediately.",
    product: "Chicken Breast",
  },
  {
    id: "t2",
    name: "Rahul Krishnan",
    role: "Restaurant Owner",
    location: "Anna Nagar, Hosur",
    image: "/images/testimonials/customer-2.jpg",
    rating: 5,
    quote:
      "We source our mutton exclusively from KG Foods for our restaurant. The cuts are consistent, the quality is exceptional, and the cold-chain delivery means it arrives in perfect condition every single time. Our customers have taken notice.",
    product: "Mutton Cuts",
  },
  {
    id: "t3",
    name: "Deepa Suresh",
    role: "Working Parent",
    location: "Velachery, Hosur",
    image: "/images/testimonials/customer-3.jpg",
    rating: 5,
    quote:
      "The tandoori chicken legs are a weekly staple at our place now. Twenty minutes in the oven and it tastes like it came from a proper restaurant. The kids are obsessed. Best thing I've discovered for busy weeknight dinners.",
    product: "Tandoori Chicken Legs",
  },
];
