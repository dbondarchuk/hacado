export async function captureOptInPreview(): Promise<string | undefined> {
  const root = document.querySelector("[data-sms-opt-in-preview]");
  if (!(root instanceof HTMLElement)) return undefined;

  const deadline = Date.now() + 4000;
  while (!root.querySelector("#booking-sms-consent") && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }

  if (!root.querySelector("#booking-sms-consent")) return undefined;

  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(root, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      style: {
        position: "relative",
        left: "0",
        top: "0",
        opacity: "1",
        transform: "none",
        colorScheme: "light",
        backgroundColor: "#ffffff",
        color: "hsl(60 4.9% 12%)",
      },
    });

    if (!dataUrl.startsWith("data:image/png")) return undefined;

    return dataUrl;
  } catch (error) {
    console.error("SMS opt-in preview capture failed", error);
    return undefined;
  }
}
