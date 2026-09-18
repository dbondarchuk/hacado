"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
import { Button, Spinner } from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import * as z from "zod";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { AutomaticAiDiscoveryApp } from "./app";
import {
  AutomaticAiDiscoveryAdminKeys,
  AutomaticAiDiscoveryAdminNamespace,
  automaticAiDiscoveryAdminNamespace,
} from "./translations/types";

export const AutomaticAiDiscoveryAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<
    AutomaticAiDiscoveryAdminNamespace,
    AutomaticAiDiscoveryAdminKeys
  >(automaticAiDiscoveryAdminNamespace);
  const { appStatus, isLoading, isValid, onSubmit } = useConnectedAppSetup<any>(
    {
      appId: existingAppId,
      appName: AutomaticAiDiscoveryApp.name,
      schema: z.any(),
      onSuccess,
      onError,
    },
  );

  return (
    <>
      <div className="flex flex-col items-center gap-2 w-full">
        <Button
          disabled={isLoading || !isValid}
          variant="default"
          className="inline-flex gap-2 items-center w-full"
          onClick={() => onSubmit({})}
        >
          {isLoading && <Spinner />}
          <span className="inline-flex gap-2 items-center">
            {t.rich("setup.connect", {
              app: () => (
                <ConnectedAppNameAndLogo
                  appName={AutomaticAiDiscoveryApp.name}
                />
              ),
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
