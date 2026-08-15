import { Shortcut } from "@hacado/page-builder-base";
import { AlignLeft, ImageDown, ImageUp, ImageUpscale } from "lucide-react";
import { ImageStylesSchema } from "./styles";

export const imageShortcuts: Shortcut<ImageStylesSchema>[] = [
  {
    label: "builder.pageBuilder.blocks.image.size",
    icon: ({ className }) => <ImageUpscale className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.image.sizes.small",
        value: "small",
        targetStyles: {
          width: {
            value: 200,
            unit: "px",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.sizes.medium",
        value: "medium",
        targetStyles: {
          width: {
            value: 400,
            unit: "px",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.sizes.large",
        value: "large",
        targetStyles: {
          width: {
            value: 600,
            unit: "px",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.sizes.full",
        value: "full",
        targetStyles: {
          width: {
            value: 100,
            unit: "%",
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.sizes.avatar",
        value: "avatar",
        targetStyles: {
          width: {
            value: 128,
            unit: "px",
          },
          height: {
            value: 128,
            unit: "px",
          },
          borderRadius: {
            value: 100,
            unit: "%",
          },
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.image.fit",
    icon: ({ className }) => <ImageUp className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.image.fits.cover",
        value: "cover",
        targetStyles: {
          objectFit: "cover",
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.fits.contain",
        value: "contain",
        targetStyles: {
          objectFit: "contain",
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.fits.fill",
        value: "fill",
        targetStyles: {
          objectFit: "fill",
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.fits.none",
        value: "none",
        targetStyles: {
          objectFit: "none",
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.image.position",
    icon: ({ className }) => <ImageDown className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.image.positions.center",
        value: "center",
        targetStyles: {
          objectPosition: {
            x: 50,
            y: 50,
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.positions.top",
        value: "top",
        targetStyles: {
          objectPosition: {
            x: 50,
            y: 0,
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.positions.bottom",
        value: "bottom",
        targetStyles: {
          objectPosition: {
            x: 50,
            y: 100,
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.positions.left",
        value: "left",
        targetStyles: {
          objectPosition: {
            x: 0,
            y: 50,
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.positions.right",
        value: "right",
        targetStyles: {
          objectPosition: {
            x: 100,
            y: 50,
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.positions.top-left",
        value: "top-left",
        targetStyles: {
          objectPosition: {
            x: 0,
            y: 0,
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.positions.top-right",
        value: "top-right",
        targetStyles: {
          objectPosition: {
            x: 100,
            y: 0,
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.positions.bottom-left",
        value: "bottom-left",
        targetStyles: {
          objectPosition: {
            x: 0,
            y: 100,
          },
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.positions.bottom-right",
        value: "bottom-right",
        targetStyles: {
          objectPosition: {
            x: 100,
            y: 100,
          },
        },
      },
    ],
  },
  {
    label: "builder.pageBuilder.blocks.image.alignment",
    icon: ({ className }) => <AlignLeft className={className} />,
    options: [
      {
        label: "builder.pageBuilder.blocks.image.alignments.standard",
        value: "standard",
        targetStyles: {
          display: "inline-block",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            bottom: prev?.bottom ?? "auto",
            left: {
              value: 0,
              unit: "px",
            },
            right: {
              value: 0,
              unit: "px",
            },
          }),
        },
      },
      {
        label: "builder.pageBuilder.blocks.image.alignments.center",
        value: "center",
        targetStyles: {
          display: "block",
          margin: (prev) => ({
            top: prev?.top ?? "auto",
            bottom: prev?.bottom ?? "auto",
            left: "auto",
            right: "auto",
          }),
        },
      },
    ],
  },
];
