"use client";

import {
  AppSelectorInput,
  BooleanInput,
  ConfigurationProps,
  SelectInput,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { SlotOrBlockStylesPanel } from "@hacado/page-builder-base";
import { Button, deepMemo, Input, Label } from "@hacado/ui";
import { Trash2 } from "lucide-react";
import { useCallback } from "react";
import { GIFT_CARD_STUDIO_APP_NAME } from "../../const";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import {
  DEFAULT_AMOUNT_PRESETS,
  MAX_AMOUNT_PRESETS,
  nextPresetAmount,
} from "./presets";
import { GiftCardPurchaseShowcaseBlockProps, styles } from "./schema";

const SLOT_KEYS = ["title", "abovePreview", "belowPreview"] as const;

export const GiftCardPurchaseShowcaseBlockConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    metadata,
    onMetadataChange,
    selectedSlot,
  }: ConfigurationProps<GiftCardPurchaseShowcaseBlockProps>) => {
    const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
      giftCardStudioAdminNamespace,
    );

    const updateStyle = useCallback(
      (style: unknown) =>
        setData({
          ...data,
          style: style as GiftCardPurchaseShowcaseBlockProps["style"],
        }),
      [setData, data],
    );

    const updateProps = useCallback(
      (props: Partial<GiftCardPurchaseShowcaseBlockProps["props"]>) =>
        setData({
          ...data,
          props: {
            ...data.props,
            ...props,
          },
        }),
      [setData, data],
    );

    const appId = (metadata?.giftCardStudioAppId as string) ?? "";
    const presets = data.props?.amountPresets?.length
      ? data.props.amountPresets.slice(0, MAX_AMOUNT_PRESETS)
      : [...DEFAULT_AMOUNT_PRESETS];
    const previewPosition =
      data.props?.previewPosition === "right" ? "right" : "left";

    return (
      <SlotOrBlockStylesPanel
        slotKeys={SLOT_KEYS}
        selectedSlot={selectedSlot}
        availableStyles={styles}
        blockStyles={data.style ?? {}}
        onBlockStylesChange={updateStyle}
        base={base}
        onBaseChange={onBaseChange}
      >
        <AppSelectorInput
          label={t("block.giftCardPurchase.configuration.app.label")}
          helperText={t("block.giftCardPurchase.configuration.app.helperText")}
          defaultValue={appId}
          appName={GIFT_CARD_STUDIO_APP_NAME}
          onChange={(value) =>
            onMetadataChange({
              ...metadata,
              giftCardStudioAppId: value ?? "",
            })
          }
        />
        <BooleanInput
          label={t("block.giftCardPurchase.configuration.hideTitle.label")}
          defaultValue={data.props?.hideTitle ?? true}
          onChange={(value) => updateProps({ hideTitle: value })}
        />
        <BooleanInput
          label={t("block.giftCardPurchase.configuration.hideSteps.label")}
          defaultValue={data.props?.hideSteps ?? false}
          onChange={(value) => updateProps({ hideSteps: value })}
        />
        <SelectInput
          label={t(
            "block.giftCardPurchaseShowcase.configuration.previewPosition.label",
          )}
          defaultValue={previewPosition}
          options={[
            {
              value: "left",
              label: t(
                "block.giftCardPurchaseShowcase.configuration.previewPosition.left",
              ),
            },
            {
              value: "right",
              label: t(
                "block.giftCardPurchaseShowcase.configuration.previewPosition.right",
              ),
            },
          ]}
          onChange={(value) =>
            updateProps({
              previewPosition: value === "right" ? "right" : "left",
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          {t(
            "block.giftCardPurchaseShowcase.configuration.previewPosition.helperText",
          )}
        </p>
        <BooleanInput
          label={t(
            "block.giftCardPurchaseShowcase.configuration.abovePreviewFirstOnMobile.label",
          )}
          defaultValue={data.props?.abovePreviewFirstOnMobile ?? true}
          onChange={(value) =>
            updateProps({ abovePreviewFirstOnMobile: value })
          }
        />
        <div className="flex flex-col gap-2">
          <Label>
            {t(
              "block.giftCardPurchaseShowcase.configuration.amountPresets.label",
            )}
          </Label>
          {presets.map((preset, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={preset}
                aria-label={t(
                  "block.giftCardPurchaseShowcase.configuration.amountPresets.label",
                )}
                onChange={(event) => {
                  const nextValue = event.target.valueAsNumber;
                  if (!Number.isFinite(nextValue) || nextValue <= 0) return;
                  const next = [...presets];
                  next[index] = nextValue;
                  updateProps({ amountPresets: next });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={presets.length <= 1}
                aria-label={t(
                  "block.giftCardPurchaseShowcase.configuration.amountPresets.remove",
                )}
                onClick={() =>
                  updateProps({
                    amountPresets: presets.filter(
                      (_, presetIndex) => presetIndex !== index,
                    ),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {presets.length < MAX_AMOUNT_PRESETS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateProps({
                  amountPresets: [...presets, nextPresetAmount(presets)],
                })
              }
            >
              {t(
                "block.giftCardPurchaseShowcase.configuration.amountPresets.add",
              )}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {t(
              "block.giftCardPurchaseShowcase.configuration.amountPresets.helperText",
            )}
          </p>
        </div>
      </SlotOrBlockStylesPanel>
    );
  },
);
