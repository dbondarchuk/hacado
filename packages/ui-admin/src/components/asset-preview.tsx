import { AssetEntity } from "@hacado/types";
import { cn, Dialog, DialogContent, DialogTrigger, Link } from "@hacado/ui";
import { mimeTypeToExtension } from "@hacado/utils";
import { FileIcon, Play } from "lucide-react";
// import Image from "next/image";
import React from "react";
import { DefaultExtensionType, defaultStyles } from "react-file-icon";

export const AssetPreviewSizes = {
  sm: {
    image: {
      width: 60,
      height: 60,
    },
    video: {
      className: "w-12 h-8",
      icon: 10,
    },
    file: 16,
  },
  md: {
    image: {
      width: 250,
      height: 250,
    },
    video: {
      className: "w-48 h-28",
      icon: 24,
    },
    file: 32,
  },
  lg: {
    image: {
      width: 500,
      height: 500,
    },
    video: {
      className: "w-96 h-52",
      icon: 48,
    },
    file: 52,
  },
};

export type AssetPreviewProps = {
  size?: keyof typeof AssetPreviewSizes;
  className?: string;
} & (
  | {
      asset: AssetEntity;
    }
  | {
      src: string;
      mimeType: string;
      description?: string;
    }
);

export const AssetPreview: React.FC<AssetPreviewProps> = ({
  size = "sm",
  className,
  ...props
}) => {
  const mimeType = "asset" in props ? props.asset.mimeType : props.mimeType;
  const src = "asset" in props ? `/assets/${props.asset.filename}` : props.src;
  const description =
    "asset" in props ? props.asset.description : props.description;

  return (
    <>
      {mimeType.startsWith("image/") ? (
        <Dialog>
          <DialogTrigger asChild>
            <div className="w-full flex justify-center">
              <img
                alt={description || ""}
                src={src}
                width={AssetPreviewSizes[size].image.width}
                height={AssetPreviewSizes[size].image.height}
                className={cn("cursor-pointer", className)}
              />
            </div>
          </DialogTrigger>
          <DialogContent
            className="max-w-7xl border-0 bg-transparent p-0 shadow-none"
            closeClassName="bg-background"
          >
            <div className="relative h-[calc(100vh-220px)] w-full overflow-clip rounded-md bg-transparent shadow-none">
              <img
                src={src}
                alt={description || ""}
                className="h-full w-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : mimeType.startsWith("video/") ? (
        <Dialog>
          <DialogTrigger asChild>
            <div className="rounded-sm p-2 flex flex-col gap-1 items-center cursor-pointer">
              <div
                className={cn(
                  "rounded-md bg-gray-500 text-white flex justify-center items-center",
                  AssetPreviewSizes[size].video.className,
                  className,
                )}
              >
                <Play size={AssetPreviewSizes[size].video.icon} />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent
            className="max-w-7xl border-0 bg-transparent p-0 shadow-none"
            closeClassName="bg-background"
          >
            <div className="relative h-[calc(100vh-220px)] w-full overflow-clip rounded-md bg-transparent shadow-none">
              <video
                controls
                src={src}
                className="cursor-pointer object-cover max-h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="rounded-sm border-dashed border p-2 flex flex-col gap-1 items-center">
          <Link
            className={cn("flex self-center", className)}
            variant="ghost"
            target="_blank"
            href={src}
          >
            <FileIcon
              size={AssetPreviewSizes[size].file}
              extension={src.substring(src.lastIndexOf(".") + 1)}
              {...defaultStyles[
                mimeTypeToExtension(mimeType) as DefaultExtensionType
              ]}
            />
          </Link>
          <span className="text-muted-foreground">{mimeType}</span>
        </div>
      )}
    </>
  );
};
