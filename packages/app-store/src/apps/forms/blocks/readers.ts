import { ReaderDocumentBlocksDictionary } from "@hacado/builder";
import { FormBlockReader } from "./form";
import type { FormsBlocksSchema } from "./schema";

export const FormsReaders: ReaderDocumentBlocksDictionary<
  typeof FormsBlocksSchema
> = {
  Form: {
    Reader: FormBlockReader,
  },
};
