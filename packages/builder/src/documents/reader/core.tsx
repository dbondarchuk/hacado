import * as z from "zod";
import { BaseBlockProps, BaseZodDictionary, BuilderSchema } from "../types";

export type TReaderBlock = {
  type: string;
  data: any;
  id: string;
  base?: BaseBlockProps;
  metadata?: Record<string, any>;
};

export type TReaderDocument = TReaderBlock;

export type BaseReaderBlockProps<_T extends BuilderSchema = any> = {
  args: Record<string, any>;
  block: TReaderBlock;
  isEditor?: boolean;
  ReaderBlock: React.ComponentType<BaseReaderBlockProps<_T>>;
};

export type ReaderProps<T> = BaseReaderBlockProps & T;

export type ReaderDocumentBlocksDictionary<T extends BuilderSchema = any> = {
  [K in keyof T]: {
    Reader: React.ComponentType<ReaderProps<z.infer<T[K]>>>;
  };
};

export function buildReaderBlockConfigurationDictionary<
  T extends BaseZodDictionary,
>(blocks: ReaderDocumentBlocksDictionary<T>) {
  return blocks;
}
