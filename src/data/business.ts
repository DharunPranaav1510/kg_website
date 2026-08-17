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

  maps: {
    url: "https://www.google.com/maps/place/KG+Meat+Mart/@12.7357689,77.8234953,1004m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3bae70cf4ef5b379:0xf16ac23ad6cb2c2d!8m2!3d12.7357689!4d77.8260702!16s%2Fg%2F1w0p41v9",
    lat: 12.7357689,
    lng: 77.8260702,
  },

  hours: {
    display: "6:30 AM – 8:00 PM",
    days: "Monday – Sunday",
    allDay: true,
    slots: [
      { day: "Monday",    open: "6:30 AM", close: "8:00 PM" },
      { day: "Tuesday",   open: "6:30 AM", close: "8:00 PM" },
      { day: "Wednesday", open: "6:30 AM", close: "8:00 PM" },
      { day: "Thursday",  open: "6:30 AM", close: "8:00 PM" },
      { day: "Friday",    open: "6:30 AM", close: "8:00 PM" },
      { day: "Saturday",  open: "6:30 AM", close: "8:00 PM" },
      { day: "Sunday",    open: "6:30 AM", close: "8:00 PM" },
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
