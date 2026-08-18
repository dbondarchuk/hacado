"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Modal,
  Spinner,
  toast,
  useClipboard,
} from "@hacado/ui";
import { Copy, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { getShortPageUrl } from "./short-url-actions";

const QR_SIZE = 256;

const canvasToPngBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Failed to create PNG"));
    }, "image/png");
  });

const pngFileFromCanvas = (canvas: HTMLCanvasElement, filename: string) => {
  const dataUrl = canvas.toDataURL("image/png");
  const commaIndex = dataUrl.indexOf(",");
  const binary = atob(dataUrl.slice(commaIndex + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: "image/png" });
};

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const prefersNativeShare = () =>
  isIos() || window.matchMedia("(pointer: coarse)").matches;

const triggerFileDownload = (file: File) => {
  const blobUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.rel = "noopener";
  link.style.display = "none";

  if (isIos()) {
    link.target = "_blank";
  } else {
    link.download = file.name;
  }

  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
};

const downloadOrSharePng = async (file: File) => {
  const canShareFile =
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFile && prefersNativeShare()) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
    }
  }

  triggerFileDownload(file);
};

export const PageQrCodeDialog = ({
  isOpen,
  onClose,
  pageSlug,
  websiteUrl,
  linkShorteningEnabled,
}: {
  isOpen: boolean;
  onClose: () => void;
  pageSlug: string;
  websiteUrl: string;
  linkShorteningEnabled: boolean;
}) => {
  const t = useI18n("admin");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { copyToClipboard } = useClipboard();

  useEffect(() => {
    if (!isOpen) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const resolveUrl = async () => {
      setLoading(true);
      let resolved = `${websiteUrl}/${pageSlug}`;
      if (linkShorteningEnabled) {
        const result = await getShortPageUrl(pageSlug);
        if (result.ok) {
          resolved = result.url;
        }
      }
      if (!cancelled) {
        setUrl(resolved);
        setLoading(false);
      }
    };

    void resolveUrl();

    return () => {
      cancelled = true;
    };
  }, [isOpen, pageSlug, websiteUrl, linkShorteningEnabled]);

  const copyQr = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": canvasToPngBlob(canvas),
        }),
      ]);
      toast.info(t("pages.toasts.qrCodeCopied"));
    } catch {
      toast.error(t("pages.toasts.qrCodeCopyError"));
    }
  };

  const copyUrl = async () => {
    if (!url) {
      return;
    }

    try {
      copyToClipboard(url);
      toast.info(t("pages.toasts.urlCopied"));
    } catch (error) {
      toast.error(t("pages.toasts.urlCopyError"));
    }
  };

  const downloadQr = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error(t("pages.toasts.qrCodeDownloadError"));
      return;
    }

    try {
      await downloadOrSharePng(pngFileFromCanvas(canvas, `${pageSlug}-qr.png`));
    } catch {
      toast.error(t("pages.toasts.qrCodeDownloadError"));
    }
  };

  return (
    <Modal
      title={t("pages.table.qrCode.title")}
      description={t("pages.table.qrCode.description")}
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-lg"
    >
      <div className="flex flex-col items-center gap-4 pt-2">
        {loading || !url ? (
          <div className="flex size-64 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        ) : (
          <>
            <div className="rounded-md bg-white p-2">
              <QRCodeCanvas
                ref={canvasRef}
                value={url}
                level="M"
                marginSize={2}
                size={QR_SIZE}
                bgColor="#ffffff"
                fgColor="#000000"
                title={t("pages.table.qrCode.alt", { url })}
                className="max-w-full aspect-square"
              />
            </div>
            <InputGroup className="w-full">
              <InputGroupInput>
                <Input
                  value={url}
                  readOnly
                  onClick={() => copyUrl()}
                  className={cn(
                    "cursor-pointer text-ellipsis",
                    InputGroupInputClasses(),
                  )}
                />
              </InputGroupInput>
              <InputGroupAddon>
                <Button
                  variant="outline"
                  onClick={() => copyUrl()}
                  disabled={loading || !url}
                  className={InputGroupAddonClasses()}
                  title={t("pages.table.qrCode.copyUrl")}
                >
                  <Copy />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </>
        )}
        <div className="flex w-full items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => copyQr()}
            disabled={loading || !url}
          >
            <Copy />
            {t("pages.table.qrCode.copy")}
          </Button>
          <Button onClick={() => downloadQr()} disabled={loading || !url}>
            <Download />
            {t("pages.table.qrCode.download")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
