import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>That page is not in the guides.</h1>
      <p>The link may be out of date. Start from the introduction instead.</p>
      <Link className="button button-primary" href="/docs/getting-started/introduction">
        Open the guides
      </Link>
    </main>
  );
}
