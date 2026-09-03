/** Curated assets for section templates - local logos + verified remote images. */

export const TEMPLATE_LOGOS = [
  { src: "/pages/templates/logos/bench-svgrepo-com.svg", name: "Bench Salon" },
  {
    src: "/pages/templates/logos/coconut-tree-svgrepo-com.svg",
    name: "Palm Spa",
  },
  {
    src: "/pages/templates/logos/cocktail-svgrepo-com.svg",
    name: "Lounge Beauty",
  },
  { src: "/pages/templates/logos/hotel-svgrepo-com.svg", name: "Hotel Spa" },
  {
    src: "/pages/templates/logos/ice-cream-svgrepo-com.svg",
    name: "Glow Studio",
  },
  {
    src: "/pages/templates/logos/milk-tea-svgrepo-com.svg",
    name: "Tea & Nails",
  },
  {
    src: "/pages/templates/logos/polaroid-svgrepo-com.svg",
    name: "Polaroid Hair",
  },
  { src: "/pages/templates/logos/surf-svgrepo-com.svg", name: "Coastal Spa" },
  {
    src: "/pages/templates/logos/wallet-svgrepo-com.svg",
    name: "Wallet Wellness",
  },
  { src: "/pages/templates/logos/wine-svgrepo-com.svg", name: "Vintage Salon" },
  {
    src: "/pages/templates/logos/airplane-svgrepo-com.svg",
    name: "Jetset Beauty",
  },
  { src: "/pages/templates/logos/suv-svgrepo-com.svg", name: "Mobile Glam" },
  {
    src: "/pages/templates/logos/indicator-svgrepo-com.svg",
    name: "Indicator Nails",
  },
] as const;

/** Verified Unsplash URLs (HEAD 200). */
export const SALON_IMAGES = {
  interior:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
  styling:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
  nails:
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80",
  treatment:
    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1200&q=80",
  chair:
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
  dashboard:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
  workspace:
    "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80",
  spa: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80",
} as const;
