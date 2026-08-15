import { ConnectedAppData, Customer } from "@hacado/types";
import { FormModel, FormResponseModel } from "./form";

export const FORMS_HOOK_NAME = "forms-hook";

export interface IFormsHook {
  onFormResponseCreated?: (
    appData: ConnectedAppData,
    formResponse: FormResponseModel,
    form: FormModel,
    customer?: Customer | null,
  ) => Promise<void>;
}
