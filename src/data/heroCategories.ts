export interface HeroCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
}

export const heroCategories: HeroCategory[] = [
  {
    id: "chicken",
    name: "Chicken",
    description: "Farm-raised, antibiotic-free",
    image: "/images/categories/category-chicken.jpg",
    href: "/shop?category=Chicken",
  },
  {
    id: "mutton",
    name: "Mutton",
    description: "Tender, grain-fed premium cuts",
    image: "/images/categories/category-mutton.jpg",
    href: "/shop?category=Mutton",
  },
  {
    id: "eggs",
    name: "Eggs",
    description: "Free-range, naturally raised",
    image: "/images/categories/category-eggs.jpg",
    href: "/shop?category=Eggs",
  },
  {
    id: "ready-to-cook",
    name: "Ready To Cook",
    description: "Marinated & seasoned, oven-ready",
    image: "/images/categories/category-ready-to-cook.png",
    href: "/shop?category=Ready%20To%20Cook",
  },
];