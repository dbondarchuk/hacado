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

const downloadCanvasPng = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
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
      await navigator.clipboard.writeText(url);
      toast.info(t("pages.toasts.urlCopied"));
    } catch (error) {
      toast.error(t("pages.toasts.urlCopyError"));
    }
  };

  const downloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error(t("pages.toasts.qrCodeDownloadError"));
      return;
    }

    downloadCanvasPng(canvas, `${pageSlug}-qr.png`);
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
                  onClick={copyUrl}
                  className={cn(
                    "cursor-pointer text-ellipsis",
                    InputGroupInputClasses(),
                  )}
                />
              </InputGroupInput>
              <InputGroupAddon>
                <Button
                  variant="outline"
                  onClick={copyUrl}
                  disabled={loading || !url}
                  className={InputGroupAddonClasses()}
                >
                  <Copy />
                  {t("pages.table.qrCode.copy")}
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </>
        )}
        <div className="flex w-full items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={copyQr} disabled={loading || !url}>
            <Copy />
            {t("pages.table.qrCode.copy")}
          </Button>
          <Button onClick={downloadQr} disabled={loading || !url}>
            <Download />
            {t("pages.table.qrCode.download")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
