import {
  BaseZodDictionary,
  Reader,
  TReaderProps,
  renderElementToStaticMarkup as baseRenderToStaticMarkup,
} from "@hacado/builder";
import juice from "juice";
import { ReaderBlocks } from "../blocks/reader";
import { tailwindCss } from "./tailwind";

export async function renderToStaticMarkup<T extends BaseZodDictionary>(
  props: Omit<TReaderProps<T>, "blocks">,
) {
  const element = (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: tailwindCss }} />
      </head>
      <body>
        <Reader {...props} blocks={ReaderBlocks} />
      </body>
    </html>
  );

  const rendered = await baseRenderToStaticMarkup(element);
  const markup = juice(rendered, {
    preserveImportant: true,
  });
  return "<!DOCTYPE html>" + markup;
}
