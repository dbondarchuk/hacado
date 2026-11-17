import { FormsBlockDefaults } from "../apps/forms/blocks/defaults";
import { FORMS_APP_NAME } from "../apps/forms/const";

/** Per-app block defaults for Builder AI hydrate (server-safe barrels). */
export const AppsBlocksDefaults: Record<string, Record<string, unknown>> = {
  [FORMS_APP_NAME]: FormsBlockDefaults,
};
