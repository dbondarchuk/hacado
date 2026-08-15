import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { ModifyAppointmentFormProps } from "./schema";
import { modifyAppointmentFormShortcuts } from "./shortcuts";

export const ModifyAppointmentFormToolbar = (
  props: ConfigurationProps<ModifyAppointmentFormProps>,
) => (
  <ShortcutsToolbar
    shortcuts={modifyAppointmentFormShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
