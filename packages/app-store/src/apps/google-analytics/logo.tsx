import type { AppLogoProps } from "@hacado/types";

export function GoogleAnalyticsLogo({ className }: AppLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="3" y="14" width="4" height="7" rx="1" fill="#F9AB00" />
      <rect x="10" y="8" width="4" height="13" rx="1" fill="#E37400" />
      <rect x="17" y="3" width="4" height="18" rx="1" fill="#E37400" />
    </svg>
  );
}
