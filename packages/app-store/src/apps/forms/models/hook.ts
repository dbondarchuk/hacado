import { ConnectedAppData } from "@hacado/types/apps";
import { Customer } from "@hacado/types/customers";
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
