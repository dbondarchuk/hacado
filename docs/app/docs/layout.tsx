import { LogoMark } from "@/components/logo";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import type { ReactNode } from "react";

const navbar = (
  <Navbar logo={<LogoMark />}>
    <a className="nav-text-link" href="https://hacado.com">
      Website
    </a>
    <a className="nav-text-link" href="https://app.hacado.com/auth/signin">
      Log in
    </a>
  </Navbar>
);

const footer = (
  <Footer>
    <div className="docs-footer">
      <nav className="docs-footer-links" aria-label="Footer">
        <a href="/docs/getting-started/introduction">Introduction</a>
        <a href="/docs/first-steps">First steps</a>
        <a href="/docs/daily-use/settings">Settings</a>
        <a href="/docs/daily-use/connect-domain">Your web address</a>
        <a href="/docs/apps/overview">Apps</a>
        <a href="https://hacado.com">Hacado</a>
      </nav>
      <p>Copyright © {new Date().getFullYear()} Hacado.</p>
    </div>
  </Footer>
);

export default async function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Layout
      navbar={navbar}
      pageMap={await getPageMap("/docs")}
      footer={footer}
      editLink={null}
      feedback={{ content: null }}
      sidebar={{ defaultOpen: true }}
      nextThemes={{
        attribute: "class",
        defaultTheme: "system",
        disableTransitionOnChange: true,
        storageKey: "theme",
      }}
    >
      {children}
    </Layout>
  );
}
