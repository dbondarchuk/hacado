import Link from "next/link";

export function LogoMark() {
  return (
    <span className="brand">
      <svg className="brand-mark" viewBox="0 0 256 256" aria-hidden="true">
        <path
          fill="currentColor"
          d="M 80 28 L 176 28 A 52 52 0 0 1 228 80 L 228 150 A 78 78 0 0 0 150 228 L 80 228 A 52 52 0 0 1 28 176 L 28 80 A 52 52 0 0 1 80 28 Z"
        />
      </svg>
      <span className="brand-name">Hacado</span>
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-word">Docs</span>
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="brand-link" aria-label="Hacado Docs home">
      <LogoMark />
    </Link>
  );
}
