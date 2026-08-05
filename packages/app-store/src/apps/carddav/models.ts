import { ConnectedAppStatusWithText, Prettify } from "@hacado/types";

export type CarddavConfiguration = {
  username: string;
  password: string;
  carddavUrl: string;
};

export type CarddavRequestInstallActionType = "install";
export type CarddavRequestResetPasswordActionType = "reset-password";
export type CarddavRequestGetConfigurationActionType = "get-configuration";

export type CarddavRequest = Prettify<{
  type:
    | CarddavRequestInstallActionType
    | CarddavRequestResetPasswordActionType
    | CarddavRequestGetConfigurationActionType;
}>;

export type CarddavRequestInstallActionResponse = ConnectedAppStatusWithText & {
  data: CarddavConfiguration;
};

export type CarddavRequestResetPasswordActionResponse = {
  password: string;
};

export type CarddavRequestGetConfigurationActionResponse = {
  data: CarddavConfiguration;
};
