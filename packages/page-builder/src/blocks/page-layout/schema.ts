import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { zColorNullable, zFontFamily } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const PageLayoutPropsSchema = z.object({
  backgroundColor: zColorNullable.describe(
    "Page-level background color override",
  ),
  textColor: zColorNullable.describe("Default text color for the page"),
  fontFamily: zFontFamily.describe("Default font family token for the page"),
  fullWidth: z.coerce
    .boolean<boolean>()
    .describe("Stretch page content to full viewport width"),
  children: z.array(z.any()).describe("Top-level blocks on the page"),
});

export type PageLayoutProps = z.infer<typeof PageLayoutPropsSchema>;
export type PageLayoutReaderProps = BaseReaderBlockProps<any> & PageLayoutProps;

export { PageLayoutDefaultProps } from "./defaults";