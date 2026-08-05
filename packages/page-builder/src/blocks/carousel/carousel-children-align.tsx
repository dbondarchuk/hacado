import { useI18n } from "@hacado/i18n/client";
import {
  justifyItemsStyle,
  StyleDefinition,
} from "@hacado/page-builder-base/style";
import { Combobox } from "@hacado/ui";
import { AlignLeft } from "lucide-react";
import * as z from "zod";

const carouselChildrenAlignKeys = [
  "left",
  "center",
  "right",
  "justify",
] as const;

const CarouselChildrenAlignSchema = z.enum(carouselChildrenAlignKeys);
const carouselChildrenAlignToJustifyItemsMap: Record<
  typeof CarouselChildrenAlignSchema._output,
  typeof justifyItemsStyle.schema._output
> = {
  center: "center",
  left: "start",
  right: "end",
  justify: "stretch",
};

export const carouselChildrenAlignStyle = {
  name: "carouselChildrenAlign",
  label: "builder.pageBuilder.blocks.carousel.styles.carouselChildrenAlign",
  category: "layout",
  schema: CarouselChildrenAlignSchema,
  icon: ({ className }: { className?: string }) => (
    <AlignLeft className={className} />
  ),
  defaultValue: "center",
  renderToCSS: (
    value: z.infer<typeof CarouselChildrenAlignSchema> | null | undefined,
  ) => {
    if (!value) return null;
    return `text-align: ${value};
justify-items: ${carouselChildrenAlignToJustifyItemsMap[value]};`;
  },
  component: ({
    value,
    onChange,
  }: {
    value: z.infer<typeof CarouselChildrenAlignSchema>;
    onChange: (value: z.infer<typeof CarouselChildrenAlignSchema>) => void;
  }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={carouselChildrenAlignKeys.map((align) => ({
          value: align,
          shortLabel: t(`pageBuilder.styles.textAlign.${align}`),
          label: (
            <span style={{ textAlign: align }} className="w-full">
              {t(`pageBuilder.styles.textAlign.${align}`)}
            </span>
          ),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof CarouselChildrenAlignSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
  selector: ".carousel-item",
} as const satisfies StyleDefinition<typeof CarouselChildrenAlignSchema>;
