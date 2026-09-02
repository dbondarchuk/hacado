import { getTemplatePreviewDelayMs } from "@/template-previews/preview-config";
import type { Metadata } from "next";
import { TemplatePreviewClient } from "./template-preview-client";

type Props = PageProps<"/template-previews/[templateKey]">;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TemplatePreviewPage(props: Props) {
  const { templateKey } = await props.params;
  const previewDelayMs = getTemplatePreviewDelayMs(templateKey);

  return (
    <TemplatePreviewClient
      templateKey={templateKey}
      previewDelayMs={previewDelayMs}
    />
  );
}
