export interface Product {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  image: string;
  badge?: string;
  description: string;
  isEgg?: boolean;
}

export const shopCategories = [
  "All",
  "Chicken",
  "Mutton",
  "Eggs",
  "Frozen Products",
  "Ready To Cook",
] as const;

export type ShopCategory = (typeof shopCategories)[number];

export type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
];

export const products: Product[] = [
  {
    id: "chicken-breast",
    name: "Chicken Breast",
    category: "Chicken",
    pricePerKg: 250, // live: ₹150–₹250, using upper/per-kg rate
    image: "/images/products/chicken-breast.jpg",
    badge: "Bestseller",
    description: "Skinless, boneless. Lean and protein-rich.",
  },
  {
    id: "chicken-thigh",
    name: "Chicken Thigh",
    category: "Chicken",
    pricePerKg: 250, // live: ₹250
    image: "/images/products/chicken-thigh.jpg",
    description: "Bone-in, juicy cut. Perfect for curries and grilling.",
  },
  {
    id: "whole-chicken",
    name: "Whole Chicken",
    category: "Chicken",
    pricePerKg: 200, // live: ₹100–₹1,000 range, ₹200/kg consistent
    image: "/images/products/chicken.jpg",
    description: "Farm-raised whole bird, cleaned and ready to cook.",
  },
  {
    id: "chicken-cutlets",
    name: "Chicken Cutlets",
    category: "Ready To Cook",
    pricePerKg: 180, // live: ₹180/pack
    image: "/images/products/chicken-cutlets.jpg",
    badge: "New",
    description: "Crispy-coated, ready to pan-fry in minutes.",
  },
  {
    id: "chicken-samosas",
    name: "Chicken Samosas",
    category: "Frozen Products",
    pricePerKg: 240, // live: ₹240/pack
    image: "/images/products/chicken-samosas.jpg",
    description: "Hand-folded, spiced filling. Flash-frozen for freshness.",
  },
  {
    id: "chicken-eggs",
    name: "Farm Fresh Eggs",
    category: "Eggs",
    pricePerKg: 58, // live: ₹58/dozen ✅ unchanged
    isEgg: true,
    image: "/images/products/chicken-eggs.jpg",
    description: "Free-range eggs with rich yolks, delivered within 24 hours.",
  },
  {
    id: "tandoori-chicken-legs",
    name: "Tandoori Chicken Legs",
    category: "Ready To Cook",
    pricePerKg: 300, // live: ₹300/pack
    image: "/images/products/tandoori-chicken-legs.jpg",
    badge: "Popular",
    description: "Marinated overnight in an authentic spice blend.",
  },
  {
    id: "mutton-kheema",
    name: "Mutton Kheema",
    category: "Mutton",
    pricePerKg: 360, // live: ₹360/pack
    image: "/images/products/mutton-kheema.jpg",
    description: "Freshly minced lean mutton. No preservatives added.",
  },
  {
    id: "premium-mutton",
    name: "Premium Mutton",
    category: "Mutton",
    pricePerKg: 800, // live: ₹400–₹3,600 range, ₹800/kg retained
    image: "/images/products/mutton.jpg",
    badge: "Premium",
    description: "Hand-selected premium cuts, tender and flavourful.",
  },
];

const featuredIds = [
  "chicken-breast",
  "chicken-thigh",
  "chicken-cutlets",
  "chicken-samosas",
  "tandoori-chicken-legs",
  "mutton-kheema",
];

export const featuredProducts = featuredIds
  .map((id) => products.find((p) => p.id === id))
  .filter((p): p is Product => p !== undefined);

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function filterProducts(
  items: Product[],
  category: ShopCategory,
  query: string
): Product[] {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesSearch =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesSearch;
  });
}

export function sortProducts(items: Product[], sort: SortOption): Product[] {
  const sorted = [...items];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.pricePerKg - b.pricePerKg);
    case "price-desc":
      return sorted.sort((a, b) => b.pricePerKg - a.pricePerKg);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return sorted.sort((a, b) => {
        const aIndex = featuredIds.indexOf(a.id);
        const bIndex = featuredIds.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
  }
}

export function categoryToShopParam(category: string): ShopCategory | null {
  const match = shopCategories.find(
    (c) => c.toLowerCase() === category.toLowerCase()
  );
  return match ?? null;
}