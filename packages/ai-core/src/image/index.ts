import { getImageGenerationProvider } from "../provider/factory";

export type {
  ImageGenerationInput,
  ImageGenerationProvider,
  ImageGenerationResult,
} from "../provider/types";
export {
  getImageGenerationProvider,
  registerImageGenerationProvider,
} from "../provider/factory";

export function isImageGenerationEnabled(): boolean {
  return (
    process.env.BUILDER_AI_IMAGE_GENERATION_ENABLED === "true" &&
    getImageGenerationProvider() != null
  );
}
