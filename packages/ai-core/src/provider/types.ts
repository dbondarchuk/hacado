import type {
  GenerateChunk,
  GenerateInput,
  GenerateResult,
  ProviderCapabilities,
} from "../types";

export interface AIProvider {
  readonly id: string;

  getCapabilities(): ProviderCapabilities;

  generate(input: GenerateInput & { model: string }): Promise<GenerateResult>;

  stream?(
    input: GenerateInput & { model: string },
  ): AsyncIterable<GenerateChunk>;
}

export type ImageGenerationInput = {
  prompt: string;
  size?: string;
  abortSignal?: AbortSignal;
};

export type ImageGenerationResult = {
  url?: string;
  base64?: string;
  mimeType?: string;
  revisedPrompt?: string;
  provider: string;
  model: string;
};

export interface ImageGenerationProvider {
  readonly id: string;
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult>;
}
