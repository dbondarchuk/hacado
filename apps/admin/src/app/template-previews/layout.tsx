/** Hide Next.js dev overlays during template preview screenshots. */
export default function TemplatePreviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
    </>
  );
}
