import { ReaderDocumentBlocksDictionary } from "@hacado/builder/reader";
import { MyCabinetBlockReader } from "./my-cabinet";
import { MyCabinetBlocksSchema } from "./schema";

export const MyCabinetReaders: ReaderDocumentBlocksDictionary<
  typeof MyCabinetBlocksSchema
> = {
  MyCabinet: {
    Reader: MyCabinetBlockReader,
  },
};
