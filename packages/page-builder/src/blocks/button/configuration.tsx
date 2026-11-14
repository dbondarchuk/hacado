"use client";

import { useModalBlockDefinitions } from "@hacado/builder/editor";
import { PageInput, SelectInput } from "@hacado/builder/inputs";
import { ConfigurationProps } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import type { BuilderKeys } from "@hacado/i18n/keys";
import { StylesConfigurationPanel } from "@hacado/page-builder-base/configuration-panel";
import { Combobox } from "@hacado/ui/combobox";
import { Label } from "@hacado/ui/label";
import { deepMemo } from "@hacado/ui/utils";
import { useCallback, useMemo } from "react";
import { usePageModals } from "../../modals/use-page-modals";
import {
  ButtonDefaultAction,
  ButtonDefaultTarget,
  ButtonDefaultUrl,
  ButtonProps,
} from "./schema";
import { buttonShortcuts } from "./shortcuts";
import { styles } from "./styles";

const isLinkProps = (
  props: ButtonProps["props"],
): props is ButtonProps["props"] & { type: "link" } => {
  return !props?.type || props?.type === "link";
};

const isActionProps = (
  props: ButtonProps["props"],
): props is ButtonProps["props"] & { type: "action" } => {
  return props?.type === "action";
};

export const ButtonConfiguration = deepMemo(
  ({ data, setData, base, onBaseChange }: ConfigurationProps<ButtonProps>) => {
    const t = useI18n("builder");
    const modals = usePageModals();
    const modalDefinitions = useModalBlockDefinitions();
    const modalLabelsByType = useMemo(
      () =>
        Object.fromEntries(
          modalDefinitions.map((definition) => [
            definition.type,
            t(definition.displayName as BuilderKeys),
          ]),
        ),
      [modalDefinitions, t],
    );

    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as ButtonProps["props"] }),
      [setData, data],
    );

    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as ButtonProps["style"] }),
      [setData, data],
    );

    const type = data.props?.type ?? "link";

    const url = isLinkProps(data.props)
      ? (data.props?.url ?? ButtonDefaultUrl)
      : undefined;

    const target = isLinkProps(data.props)
      ? (data.props?.target ?? ButtonDefaultTarget)
      : undefined;

    const action = isActionProps(data.props)
      ? (data.props.action ?? ButtonDefaultAction)
      : undefined;

    const actionData = isActionProps(data.props)
      ? data.props.actionData
      : undefined;

    const modalId = (actionData?.modalId as string | undefined) ?? "";

    const closeCurrentValue = "__current__";

    const modalOptions = useMemo(
      () =>
        modals.map((modal) => ({
          value: modal.actionId,
          label: (
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <span className="truncate">
                {modalLabelsByType[modal.type] ?? modal.type}
              </span>
              <span className="truncate text-muted-foreground">
                {modal.actionId}
              </span>
            </span>
          ),
        })),
      [modalLabelsByType, modals],
    );

    const closeModalOptions = useMemo(
      () => [
        {
          value: closeCurrentValue,
          label: t("pageBuilder.blocks.button.actions.closeModal.current"),
        },
        ...modalOptions,
      ],
      [modalOptions, t],
    );

    const setModalAction = (nextAction: string, nextModalId?: string) => {
      updateProps({
        ...data.props,
        action: nextAction,
        actionData: {
          modalId: nextModalId ?? modalId,
        },
      });
    };

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={buttonShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <>
          <SelectInput
            label={t("pageBuilder.blocks.button.type")}
            options={[
              {
                value: "link",
                label: t("pageBuilder.blocks.button.types.link"),
              },
              {
                value: "action",
                label: t("pageBuilder.blocks.button.types.action"),
              },
            ]}
            defaultValue={type}
            onChange={(type) => updateProps({ ...data.props, type })}
          />
          {type === "link" && (
            <>
              <PageInput
                label={t("pageBuilder.blocks.button.url")}
                defaultValue={url ?? ButtonDefaultUrl}
                onChange={(url) => updateProps({ ...data.props, url })}
              />
              <div className="flex flex-col gap-2">
                <Label>{t("pageBuilder.blocks.button.target")}</Label>
                <Combobox
                  values={[
                    {
                      value: "_self",
                      label: t("pageBuilder.blocks.button.targets._self"),
                    },
                    {
                      value: "_blank",
                      label: t("pageBuilder.blocks.button.targets._blank"),
                    },
                  ]}
                  value={target ?? ButtonDefaultTarget}
                  size="sm"
                  className="w-full"
                  onItemSelect={(value) =>
                    updateProps({ ...data.props, target: value })
                  }
                />
              </div>
            </>
          )}
          {type === "action" && (
            <>
              <SelectInput
                label={t("pageBuilder.blocks.button.action")}
                options={[
                  {
                    value: "open-modal",
                    label: t(
                      "pageBuilder.blocks.button.actions.openModal.label",
                    ),
                  },
                  {
                    value: "close-modal",
                    label: t(
                      "pageBuilder.blocks.button.actions.closeModal.label",
                    ),
                  },
                ]}
                defaultValue={action ?? ButtonDefaultAction}
                onChange={(nextAction) => setModalAction(nextAction)}
              />
              {action === "open-modal" && (
                <div className="flex flex-col gap-2">
                  <Label>
                    {t("pageBuilder.blocks.button.actions.openModal.modalId")}
                  </Label>
                  <Combobox
                    values={modalOptions}
                    value={modalId || undefined}
                    size="sm"
                    className="w-full"
                    placeholder={t(
                      "pageBuilder.blocks.button.actions.openModal.helperText",
                    )}
                    onItemSelect={(value) => setModalAction(action, value)}
                  />
                </div>
              )}
              {action === "close-modal" && (
                <div className="flex flex-col gap-2">
                  <Label>
                    {t("pageBuilder.blocks.button.actions.openModal.modalId")}
                  </Label>
                  <Combobox
                    values={closeModalOptions}
                    value={modalId || closeCurrentValue}
                    size="sm"
                    className="w-full"
                    onItemSelect={(value) =>
                      setModalAction(
                        action,
                        value === closeCurrentValue ? "" : value,
                      )
                    }
                  />
                </div>
              )}
            </>
          )}
        </>
      </StylesConfigurationPanel>
    );
  },
);
