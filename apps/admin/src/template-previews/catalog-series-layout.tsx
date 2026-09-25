import { CookiesProvider } from "@/components/cookies-provider";

/** Shared shell for series pack demos (`/a|b|c|d/...`). */
export default function CatalogSeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CookiesProvider>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              overflow: auto !important;
              height: auto !important;
              min-height: 100%;
            }
            nextjs-portal,
            [data-nextjs-toast],
            [data-nextjs-dev-tools-button],
            #devtools-indicator,
            #__next-build-watcher,
            .nextjs-toast-errors-parent,
            button[aria-label*="Issue"],
            button[aria-label*="issue"],
            [data-nextjs-dialog-overlay] {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          `,
        }}
      />
      {children}
    </CookiesProvider>
  );
}
