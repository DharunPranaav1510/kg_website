export const business = {
  name: "KG Meat Mart",
  shortName: "KG Foods",
  tagline: "Fresh • Hygienic • Trusted",
  website: "https://www.kgfoods.co.in",

  address: {
    street: "NH 44, Hamumanthapuram, Anna Nagar",
    city: "Hosur",
    state: "Tamil Nadu",
    pincode: "635109",
    full: "NH 44, Hamumanthapuram, Anna Nagar, Hosur, Tamil Nadu 635109",
  },

  contact: {
    phone: "+919677833339",
    phoneDisplay: "+91 96778 33339",
    whatsapp: "+919677833339",
    email: "dskarthik63@gmail.com",
  },

  // Filled in from the admin panel (Website content > Business details).
  legal: {
    gstin: "33AAGFK8402Q2ZZ",
    legalName: "KG BROILERS & EGGS",
    fssai: "12418011000652",
    // Printed at the top of bills. Empty = the shop address / phone from above.
    billAddress: "76/1, Bye-Pass Road, Hosur - 635 109",
    billPhone: "94432 45378",
    // Online bills are numbered PREFIX/00057 so they never clash with the counter's own bill numbers.
    billPrefix: "WEB",
    billFooter: "ALL IS WELL",
    grievanceName: "",
    grievanceEmail: "",
    grievancePhone: "",
  },

  // GST: 5% on frozen products. Edited in Admin > Website content > Business details.
  tax: {
    enabled: true,
    inclusive: false,
    categoryRates: { "Frozen Products": 5 } as Record<string, number>,
  },

  // Short badges shown on the home page.
  highlights: ["100% Halal", "Right-size birds"],

  announcement: {
    enabled: false,
    text: "",
    link: "",
  },

  maps: {
    url: "https://www.google.com/maps/place/KG+Meat+Mart/@12.7357689,77.8234953,1004m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3bae70cf4ef5b379:0xf16ac23ad6cb2c2d!8m2!3d12.7357689!4d77.8260702!16s%2Fg%2F1w0p41v9",
    lat: 12.7357689,
    lng: 77.8260702,
  },

  // The real timetable lives in the admin panel (Shop settings > Opening hours). This is the starting point.
  hours: {
    display: "6:30 AM – 5:00 PM",
    days: "Monday – Sunday",
    allDay: false,
    slots: [
      { day: "Sunday",    open: "6:30 AM", close: "5:00 PM" },
      { day: "Monday",    open: "6:30 AM", close: "5:00 PM" },
      { day: "Tuesday",   open: "6:30 AM", close: "5:00 PM" },
      { day: "Wednesday", open: "6:30 AM", close: "5:00 PM" },
      { day: "Thursday",  open: "6:30 AM", close: "5:00 PM" },
      { day: "Friday",    open: "6:30 AM", close: "5:00 PM" },
      { day: "Saturday",  open: "6:30 AM", close: "5:00 PM" },
    ],
  },

  delivery: {
    minOrder: 200, // ₹
    fee: 50, // ₹, fixed delivery charge
    freeAbove: 0, // ₹, orders at or above this are free. 0 = delivery is never free
    radiusKm: 6, // delivery circle around the shop. 0 = no limit
    slots: ["Morning (7 – 10 AM)", "Noon (10 AM – 1 PM)", "Afternoon (1 – 4 PM)"],
    // Suggestions shown while typing the area. Customers can still type any
    // other area; edit this list to match where you actually deliver.
    areas: [
      "Anna Nagar",
      "Bagalur Road",
      "Housing Board Colony",
      "Mathigiri",
      "Moranapalli",
      "Mookandapalli",
      "Rayakottai Road",
      "SIPCOT",
      "Thally Road",
      "Zuzuvadi",
    ],
  },

  social: {
    instagram: "https://www.instagram.com/kgmeatmart",
    facebook: null,
  },

  seo: {
    description:
      "KG Meat Mart — fresh chicken, mutton, eggs and ready-to-cook products in Hosur. Visit us at NH 44, Anna Nagar or order online at kgfoods.co.in.",
    keywords: [
      "meat shop hosur",
      "chicken hosur",
      "mutton hosur",
      "fresh meat hosur",
      "KG Meat Mart",
      "NH 44 hosur",
    ],
  },
} as const;
