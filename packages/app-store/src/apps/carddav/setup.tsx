"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps, ConnectedAppStatusWithText } from "@hacado/types";
import {
  Button,
  cn,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Label,
  Spinner,
  toast,
  toastPromise,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useClipboard,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import { CopyIcon, Dices } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { CarddavApp } from "./app";
import {
  CarddavConfiguration,
  CarddavRequest,
  CarddavRequestGetConfigurationActionResponse,
  CarddavRequestInstallActionResponse,
  CarddavRequestResetPasswordActionResponse,
} from "./models";
import {
  CarddavAdminKeys,
  CarddavAdminNamespace,
  carddavAdminNamespace,
} from "./translations/types";

export const CarddavAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<CarddavAdminNamespace, CarddavAdminKeys>(
    carddavAdminNamespace,
  );

  const tApps = useI18n("apps");
  const router = useRouter();

  const [appId, setAppId] = React.useState<string | undefined>(existingAppId);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPasswordRegenerating, setIsPasswordRegenerating] =
    React.useState(false);

  const [appStatus, setAppStatus] =
    React.useState<ConnectedAppStatusWithText>();

  const [configuration, setConfiguration] = React.useState<
    CarddavConfiguration | undefined
  >(undefined);

  React.useEffect(() => {
    if (!existingAppId) return;

    const getData = async () => {
      setIsLoading(true);

      try {
        const { data } = (await adminApi.apps.processRequest(existingAppId, {
          type: "get-configuration",
        })) as CarddavRequestGetConfigurationActionResponse;
        setConfiguration(data as CarddavConfiguration);
      } catch (e: any) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    setAppId(existingAppId);
    getData();
  }, [existingAppId]);

  const { copyToClipboard } = useClipboard();
  const onCopy = (text: string) => {
    copyToClipboard(text);
    toast.success(t("toast.copiedToClipboard"));
  };

  const onRegeneratePassword = async () => {
    try {
      if (!appId || !configuration) return;
      setIsPasswordRegenerating(true);

      const { password } = (await adminApi.apps.processRequest(appId, {
        type: "reset-password",
      })) as CarddavRequestResetPasswordActionResponse;

      setConfiguration((prev) =>
        !prev
          ? undefined
          : {
              ...prev,
              password,
            },
      );

      toast.success(t("toast.regenerateSuccess"));
    } catch (e: any) {
      console.error(e);
      toast.error(t("toast.regenerateError"));
    } finally {
      setIsPasswordRegenerating(false);
    }
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      const promise = new Promise<{
        appId: string;
        status: ConnectedAppStatusWithText;
      }>(async (resolve, reject) => {
        const _appId =
          appId || (await adminApi.apps.addNewApp(CarddavApp.name));
        setAppId(_appId);

        const { data, ...status } = (await adminApi.apps.processRequest(
          _appId,
          {
            type: "install",
          } satisfies CarddavRequest,
        )) as CarddavRequestInstallActionResponse;

        setAppStatus(status);

        if (status.status === "failed") {
          reject(status.statusText);
          return;
        }

        if (status.status === "connected") {
          resolve({ appId: _appId, status });

          setConfiguration(data);
          router.refresh();
          return;
        }

        reject(new Error("Unknown status"));
      });

      const { appId: newAppId } = await toastPromise(promise, {
        success: {
          message: tApps("common.connectedAppSetup.success.title"),
          description: tApps("common.connectedAppSetup.success.description"),
        },
        error: {
          message: tApps("common.connectedAppSetup.error.title"),
          description: tApps("common.connectedAppSetup.error.description"),
        },
      });

      onSuccess(newAppId, true);
    } catch (e: any) {
      onError?.(e instanceof Error ? e.message : e?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2 w-full">
        {configuration && (
          <div className="w-full p-4 bg-muted rounded-md flex flex-col gap-2">
            <p className="text-sm text-muted-foreground mb-2">
              {t("form.info")}
            </p>
            <div className="grid gap-2 content-start w-full">
              <Label htmlFor="carddavUrl" className="text-xs">
                {t("form.carddavUrl.label")}
              </Label>
              <InputGroup>
                <InputGroupInput>
                  <Input
                    id="carddavUrl"
                    placeholder="username"
                    value={configuration?.carddavUrl}
                    readOnly
                    className={InputGroupInputClasses()}
                  />
                </InputGroupInput>
                <InputGroupAddon>
                  <Button
                    variant="ghost"
                    className={InputGroupAddonClasses()}
                    onClick={() => {
                      onCopy(configuration?.carddavUrl || "");
                    }}
                  >
                    <CopyIcon className="!size-3" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className="grid gap-2 content-start w-full">
              <Label htmlFor="username" className="text-xs">
                {t("form.username.label")}
              </Label>
              <InputGroup>
                <InputGroupInput>
                  <Input
                    id="username"
                    value={configuration?.username}
                    readOnly
                    className={InputGroupInputClasses()}
                  />
                </InputGroupInput>
                <InputGroupAddon>
                  <Button
                    variant="ghost"
                    className={InputGroupAddonClasses()}
                    onClick={() => {
                      onCopy(configuration?.username || "");
                    }}
                  >
                    <CopyIcon className="!size-3" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className="grid gap-2 content-start w-full">
              <Label htmlFor="password" className="text-xs">
                {t("form.password.label")}
              </Label>
              <InputGroup>
                <InputGroupAddon>
                  <TooltipResponsive>
                    <TooltipResponsiveTrigger>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          onRegeneratePassword();
                        }}
                        className={InputGroupAddonClasses({
                          variant: "prefix",
                        })}
                      >
                        <Dices
                          className={cn(
                            "!size-3",
                            isPasswordRegenerating && "animate-spin",
                          )}
                        />
                      </Button>
                    </TooltipResponsiveTrigger>
                    <TooltipResponsiveContent>
                      {t("form.password.regenerateTooltip")}
                    </TooltipResponsiveContent>
                  </TooltipResponsive>
                </InputGroupAddon>
                <InputGroupInput>
                  <Input
                    id="password"
                    value={configuration?.password}
                    readOnly
                    className={InputGroupInputClasses({ variant: "both" })}
                  />
                </InputGroupInput>
                <InputGroupAddon>
                  <Button
                    variant="ghost"
                    className={InputGroupAddonClasses({ variant: "suffix" })}
                    onClick={() => {
                      onCopy(configuration?.password || "");
                    }}
                  >
                    <CopyIcon className="!size-3" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        )}
        <Button
          disabled={isLoading}
          type="submit"
          variant="default"
          className="inline-flex gap-2 items-center w-full"
          onClick={onSubmit}
        >
          {isLoading && <Spinner />}
          <span className="inline-flex gap-2 items-center">
            {t.rich(appId ? "form.update" : "form.connect", {
              app: () => <ConnectedAppNameAndLogo appName={CarddavApp.name} />,
            })}
          </span>
        </Button>
      </div>
      {appStatus && (
        <ConnectedAppStatusMessage
          status={appStatus.status}
          statusText={appStatus.statusText}
        />
      )}
    </>
  );
};
