"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Spinner,
  toast,
  useClipboard,
} from "@hacado/ui";
import { Copy, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

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

export type PaymentLinkQrCodeDialogProps = {
  paymentId: string;
  children: React.ReactNode;
};

export const PaymentLinkQrCodeDialog = ({
  paymentId,
  children,
}: PaymentLinkQrCodeDialogProps) => {
  const t = useI18n("admin");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { copyToClipboard } = useClipboard();

  useEffect(() => {
    if (!open) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const resolveUrl = async () => {
      setLoading(true);
      try {
        const { url: resolved } =
          await adminApi.payments.getPaymentLinkUrl(paymentId);
        if (!cancelled) {
          setUrl(resolved);
        }
      } catch {
        if (!cancelled) {
          setUrl(null);
          toast.error(t("payment.card.qrCode.loadError"));
          setOpen(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void resolveUrl();

    return () => {
      cancelled = true;
    };
  }, [open, paymentId, t]);

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
      toast.info(t("payment.card.qrCode.copied"));
    } catch {
      toast.error(t("payment.card.qrCode.copyError"));
    }
  };

  const copyUrl = async () => {
    if (!url) {
      return;
    }

    try {
      copyToClipboard(url);
      toast.info(t("payment.card.linkCopied"));
    } catch {
      toast.error(t("common.toasts.error"));
    }
  };

  const downloadQr = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error(t("payment.card.qrCode.downloadError"));
      return;
    }

    try {
      await downloadOrSharePng(
        pngFileFromCanvas(canvas, `payment-link-${paymentId}-qr.png`),
      );
    } catch {
      toast.error(t("payment.card.qrCode.downloadError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("payment.card.qrCode.title")}</DialogTitle>
          <DialogDescription>
            {t("payment.card.qrCode.description")}
          </DialogDescription>
        </DialogHeader>
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
                  title={t("payment.card.qrCode.alt", { url })}
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
                    title={t("payment.card.qrCode.copyUrl")}
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
              {t("payment.card.qrCode.copy")}
            </Button>
            <Button onClick={() => downloadQr()} disabled={loading || !url}>
              <Download />
              {t("payment.card.qrCode.download")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
