import {
  BuilderSchema,
  ReaderDocumentBlocksDictionary,
  TemplatesConfiguration,
} from "@hacado/builder";

export type BlockProvider<T extends BuilderSchema = any> = {
  providerName: string; // appName
  priority: number; // higher = wins
  blocks: {
    [K in keyof T]?: {
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
    readers: {} as ReaderDocumentBlocksDictionary<T>,
  };

  for (const provider of sorted) {
    for (const [type, block] of Object.entries(provider.blocks)) {
      // FIRST provider wins
      if (!resolved.readers[type]) {
        resolved.readers[type as keyof ReaderDocumentBlocksDictionary<T>] =
          block.reader;
      }
    }
  }

  return resolved;
}
