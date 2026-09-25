import { getTemplatePreviewDelayMs } from "@/template-previews/preview-config";
import { TemplatePreviewClient } from "@/template-previews/template-preview-client";
import type { Metadata } from "next";
import { Suspense } from "react";

type Props = {
  params: Promise<{ templateKey: string }>;
};

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
