/**
 * Self-hosted Pexels clips for marketing (UI / product lifestyle).
 * Downloaded under public/assets/videos; seed uploads like other assets.
 * License: https://www.pexels.com/license/ (free to use; attribution appreciated).
 */
export const marketingVideos = {
  /** Laptop typing — product / admin UI feel */
  laptopUi: "/assets/videos/laptop-ui-typing.mp4",
  /** Close laptop work — dashboard vibe */
  laptopDashboard: "/assets/videos/laptop-office-dashboard.mp4",
  /** Hands on phone app — client booking */
  phoneApp: "/assets/videos/phone-app-hands.mp4",
  /** Salon desk with laptop */
  salonLaptop: "/assets/videos/salon-laptop.mp4",
  /** Screen-forward laptop work */
  laptopScreen: "/assets/videos/laptop-screen-work.mp4",
  /** Phone scroll — booking on mobile */
  phoneScroll: "/assets/videos/phone-booking-scroll.mp4",
  /** Woman on laptop — studio owner */
  womanLaptop: "/assets/videos/woman-laptop-ui.mp4",
  /** Tight UI close-up */
  laptopCloseup: "/assets/videos/laptop-closeup-ui.mp4",
} as const;

export type MarketingVideoKey = keyof typeof marketingVideos;
