import {
  BuilderSchema,
  EditorDocumentBlocksDictionary,
  ReaderDocumentBlocksDictionary,
  TemplatesConfiguration,
} from "@hacado/builder";

export type BlockProvider<T extends BuilderSchema = any> = {
  providerName: string; // appName
  priority: number; // higher = wins
  blocks: {
    [K in keyof T]?: {
      schema: T[K];
      editor: EditorDocumentBlocksDictionary<T>[K];
      reader: ReaderDocumentBlocksDictionary<T>[K];
    };
  };
  templates?: TemplatesConfiguration;
};

export type BlockProviderRegistry<T extends BuilderSchema = any> = {
  providers: BlockProvider<T>[];
};

export function resolveProviders<T extends BuilderSchema>(
  registry: BlockProviderRegistry<T>,
) {
  //   const sorted = [...registry.providers].sort(
  //     (a, b) => b.priority - a.priority,
  //   );
  const sorted = registry.providers;

  const resolved = {
    schemas: {} as BuilderSchema,
    editors: {} as EditorDocumentBlocksDictionary<T>,
    readers: {} as ReaderDocumentBlocksDictionary<T>,
    templates: {} as TemplatesConfiguration,
  };

  for (const provider of sorted) {
    for (const [type, block] of Object.entries(provider.blocks)) {
      // FIRST provider wins
      if (!resolved.editors[type]) {
        resolved.schemas[type] = block.schema;
        resolved.editors[type as keyof EditorDocumentBlocksDictionary<T>] =
          block.editor;
        resolved.readers[type as keyof ReaderDocumentBlocksDictionary<T>] =
          block.reader;
      }
    }
    Object.assign(resolved.templates, provider.templates);
  }

  return resolved;
}
