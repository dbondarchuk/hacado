import { getTemplatePreviewDelayMs } from "@/template-previews/preview-config";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TemplatePreviewClient } from "./template-preview-client";

type Props = PageProps<"/template-previews/[templateKey]">;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TemplatePreviewPage(props: Props) {
  const { templateKey } = await props.params;
  const previewDelayMs = getTemplatePreviewDelayMs(templateKey);

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TemplatePreviewClient
        templateKey={templateKey}
        previewDelayMs={previewDelayMs}
      />
    </Suspense>
  );
}
