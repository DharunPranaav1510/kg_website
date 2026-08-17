export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  itemCount: string;
  href: string;
}

export const categories: Category[] = [
  {
    id: "chicken",
    name: "Chicken",
    description: "Farm-raised, antibiotic-free",
    image: "/images/categories/category-chicken.jpg",
    itemCount: "12+ cuts",
    href: "/shop?category=Chicken",
  },
  {
    id: "mutton",
    name: "Mutton",
    description: "Tender, grain-fed premium cuts",
    image: "/images/categories/category-mutton.jpg",
    itemCount: "8+ cuts",
    href: "/shop?category=Mutton",
  },
  {
    id: "eggs",
    name: "Eggs",
    description: "Free-range, naturally raised",
    image: "/images/categories/category-eggs.jpg",
    itemCount: "4 varieties",
    href: "/shop?category=Eggs",
  },
  {
    id: "frozen-products",
    name: "Frozen Products",
    description: "Flash-frozen for peak freshness",
    image: "/images/categories/category-frozen-products.png",
    itemCount: "10+ items",
    href: "/shop?category=Frozen%20Products",
  },
  {
    id: "ready-to-cook",
    name: "Ready To Cook",
    description: "Marinated & seasoned, oven-ready",
    image: "/images/categories/category-ready-to-cook.png",
    itemCount: "15+ dishes",
    href: "/shop?category=Ready%20To%20Cook",
  },
];
