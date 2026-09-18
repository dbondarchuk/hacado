import type { AppLogoProps } from "@hacado/types";

const TEAL = "#1a6462";
const SLATE = "#465a71";

function Sparkle({
  cx,
  cy,
  size = 1,
}: {
  cx: number;
  cy: number;
  size?: number;
}) {
  return (
    <path
      fill={TEAL}
      d={`M${cx} ${cy - size} L${cx + size * 0.28} ${cy - size * 0.28} L${cx + size} ${cy} L${cx + size * 0.28} ${cy + size * 0.28} L${cx} ${cy + size} L${cx - size * 0.28} ${cy + size * 0.28} L${cx - size} ${cy} L${cx - size * 0.28} ${cy - size * 0.28} Z`}
    />
  );
}

export function AutomaticAiDiscoveryLogo({ className }: AppLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        fill={TEAL}
        d="M5.5 3.5h8.2L18 7.8V19.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19.5v-14A1.5 1.5 0 0 1 5.5 3.5Z"
      />
      <path fill={SLATE} d="M5.5 3.5h8.2L16 6H4V5A1.5 1.5 0 0 1 5.5 3.5Z" />
      <path fill={SLATE} d="M13.7 3.5 18 7.8h-2.8A1.5 1.5 0 0 1 13.7 6.3Z" />
      <path
        stroke={SLATE}
        strokeWidth="1.15"
        strokeLinecap="round"
        d="M7 9.2h6.2M7 11.4h5.2M7 13.6h6.2M7 15.8h4.2"
      />
      <path
        stroke={TEAL}
        strokeWidth="1.1"
        strokeLinecap="round"
        d="M16.2 14.2V11.4M16.2 14.2h2.6M16.2 14.2v2.7"
      />
      <circle cx={16.2} cy={14.2} r={1.15} fill={TEAL} />
      <circle cx={16.2} cy={10.6} r={1.05} fill={SLATE} />
      <circle cx={19.5} cy={14.2} r={1.05} fill={SLATE} />
      <circle cx={16.2} cy={17.7} r={1.05} fill={SLATE} />
      <Sparkle cx={19.6} cy={10.2} size={1.05} />
      <Sparkle cx={20.9} cy={12.5} size={0.8} />
      <Sparkle cx={19.15} cy={17.15} size={0.9} />
    </svg>
  );
}
