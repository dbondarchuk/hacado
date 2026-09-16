/**
 * Install live previews load in an iframe. Root body uses overflow-hidden for
 * the admin shell; restore scrolling so long pack pages can be browsed.
 */
export default function InstallPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              overflow: auto !important;
              height: auto !important;
              min-height: 100%;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
