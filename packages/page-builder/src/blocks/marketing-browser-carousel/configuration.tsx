"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ConfigurationProps,
  FileInput,
  generateId,
  SliderInput,
  TextInput,
  useBlock,
  useSelectedBlockId,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { Button, Checkbox, cn, deepMemo, Label } from "@hacado/ui";
import { GripVertical, Plus, Timer, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  type MarketingBrowserCarouselProps,
  type MarketingBrowserCarouselSlide,
} from "./schema";
import { marketingBrowserCarouselShortcuts } from "./shortcuts";
import { styles } from "./styles";

const CONFIG_PANEL_DEBOUNCE_MS = 300;

function SortableSlideRow({
  slide,
  index,
  onLabelChange,
  onSrcChange,
  onAddressChange,
  onRemove,
}: {
  slide: MarketingBrowserCarouselSlide;
  index: number;
  onLabelChange: (v: string) => void;
  onSrcChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onRemove: () => void;
}) {
  const t = useI18n("builder");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={rowStyle}
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-2",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex flex-row gap-2 w-full items-center">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none  text-muted-foreground hover:text-foreground"
          aria-label={t("pageBuilder.blocks.marketingBrowserCarousel.reorder")}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="text-xs font-medium text-muted-foreground flex-1">
          {t("pageBuilder.blocks.marketingBrowserCarousel.slideNumber", {
            number: index + 1,
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0  text-muted-foreground hover:text-destructive "
          onClick={onRemove}
          aria-label={t(
            "pageBuilder.blocks.marketingBrowserCarousel.removeSlide",
          )}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <TextInput
        label={t("pageBuilder.blocks.marketingBrowserCarousel.slideTabLabel")}
        defaultValue={slide.label}
        debounceMs={CONFIG_PANEL_DEBOUNCE_MS}
        onChange={onLabelChange}
      />
      <FileInput
        label={t("pageBuilder.blocks.marketingBrowserCarousel.slideImageUrl")}
        accept="image/*"
        defaultValue={slide.src}
        onChange={onSrcChange}
      />
      <TextInput
        label={t("pageBuilder.blocks.marketingBrowserCarousel.slideAddressBar")}
        defaultValue={slide.addressBar ?? ""}
        debounceMs={CONFIG_PANEL_DEBOUNCE_MS}
        onChange={onAddressChange}
      />
    </div>
  );
}

export const MarketingBrowserCarouselConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<MarketingBrowserCarouselProps>) => {
    const t = useI18n("builder");
    const selectedBlockId = useSelectedBlockId();
    const liveBlock = useBlock(selectedBlockId ?? "");

    const liveData = useMemo((): MarketingBrowserCarouselProps => {
      if (liveBlock?.data)
        return liveBlock.data as MarketingBrowserCarouselProps;
      return data;
    }, [liveBlock, data]);

    const updateStyle = useCallback(
      (s: unknown) => {
        if (!liveBlock) return;
        setData({
          ...(liveBlock.data as MarketingBrowserCarouselProps),
          style: s as MarketingBrowserCarouselProps["style"],
        });
      },
      [liveBlock, setData],
    );

    const updateProps = useCallback(
      (p: MarketingBrowserCarouselProps["props"]) => {
        if (!liveBlock) return;
        setData({
          ...(liveBlock.data as MarketingBrowserCarouselProps),
          props: p,
        });
      },
      [liveBlock, setData],
    );

    const slides = liveData.props?.slides ?? [];
    const slideIds = useMemo(() => slides.map((s) => s.id), [slides]);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 6 },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    const onDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = slideIds.indexOf(String(active.id));
        const newIndex = slideIds.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        updateProps({
          ...liveData.props,
          slides: arrayMove(slides, oldIndex, newIndex),
        });
      },
      [liveData.props, slideIds, slides, updateProps],
    );

    const patchSlide = useCallback(
      (id: string, patch: Partial<MarketingBrowserCarouselSlide>) => {
        updateProps({
          ...liveData.props,
          slides: slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        });
      },
      [liveData.props, slides, updateProps],
    );

    const removeSlide = useCallback(
      (id: string) => {
        updateProps({
          ...liveData.props,
          slides: slides.filter((s) => s.id !== id),
        });
      },
      [liveData.props, slides, updateProps],
    );

    const addSlide = useCallback(() => {
      updateProps({
        ...liveData.props,
        slides: [
          ...slides,
          {
            id: generateId(),
            label: "",
            src: "/assets/placeholder/128x128.png",
            addressBar: "",
          },
        ],
      });
    }, [liveData.props, slides, updateProps]);

    return (
      <StylesConfigurationPanel
        styles={liveData.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={marketingBrowserCarouselShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium">
              {t("pageBuilder.blocks.marketingBrowserCarousel.slides")}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSlide}
            >
              <Plus className="mr-1 size-4" />
              {t("pageBuilder.blocks.marketingBrowserCarousel.addSlide")}
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={slideIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {slides.map((slide, index) => (
                  <SortableSlideRow
                    key={slide.id}
                    slide={slide}
                    index={index}
                    onLabelChange={(label) => patchSlide(slide.id, { label })}
                    onSrcChange={(src) => patchSlide(slide.id, { src })}
                    onAddressChange={(addressBar) =>
                      patchSlide(slide.id, { addressBar })
                    }
                    onRemove={() => removeSlide(slide.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="mbc-tabs"
              checked={liveData.props?.showTabs ?? true}
              onCheckedChange={(v) =>
                updateProps({
                  ...liveData.props,
                  showTabs: v === true,
                })
              }
            />
            <Label htmlFor="mbc-tabs" className="cursor-pointer font-normal">
              {t("pageBuilder.blocks.marketingBrowserCarousel.showTabs")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="mbc-dots"
              checked={liveData.props?.showDots ?? true}
              onCheckedChange={(v) =>
                updateProps({
                  ...liveData.props,
                  showDots: v === true,
                })
              }
            />
            <Label htmlFor="mbc-dots" className="cursor-pointer font-normal">
              {t("pageBuilder.blocks.marketingBrowserCarousel.showDots")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="mbc-chrome"
              checked={liveData.props?.showBrowserChrome ?? true}
              onCheckedChange={(v) =>
                updateProps({
                  ...liveData.props,
                  showBrowserChrome: v === true,
                })
              }
            />
            <Label htmlFor="mbc-chrome" className="cursor-pointer font-normal">
              {t(
                "pageBuilder.blocks.marketingBrowserCarousel.showBrowserChrome",
              )}
            </Label>
          </div>
        </div>

        <SliderInput
          label={t("pageBuilder.blocks.marketingBrowserCarousel.autoRotate")}
          defaultValue={liveData.props?.autoRotateMs ?? 0}
          debounceMs={CONFIG_PANEL_DEBOUNCE_MS}
          onChange={(autoRotateMs) =>
            updateProps({ ...liveData.props, autoRotateMs })
          }
          iconLabel={<Timer className="size-4" />}
          units={t("pageBuilder.blocks.marketingBrowserCarousel.milliseconds")}
          min={0}
          max={20000}
          step={500}
        />
      </StylesConfigurationPanel>
    );
  },
);
