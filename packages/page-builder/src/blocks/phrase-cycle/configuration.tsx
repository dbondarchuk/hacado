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
import { generateId } from "@hacado/builder/helpers";
import { SelectInput, SliderInput, TextInput } from "@hacado/builder/inputs";
import { ConfigurationProps } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base/configuration-panel";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { Label } from "@hacado/ui/label";
import { deepMemo } from "@hacado/ui/utils";
import { Clock, GripVertical, Plus, Timer, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  PhraseCyclePhrase,
  PhraseCycleProps,
  PhraseMotion,
  phraseMotions,
} from "./schema";
import { phraseCycleShortcuts } from "./shortcuts";
import { styles } from "./styles";

const motionLabelKey = {
  fade: "fade",
  "fade-up": "fadeUp",
  "fade-down": "fadeDown",
  "fade-left": "fadeLeft",
  "fade-right": "fadeRight",
} as const;

function SortablePhraseRow({
  phrase,
  index,
  onTextChange,
  onRemove,
}: {
  phrase: PhraseCyclePhrase;
  index: number;
  onTextChange: (text: string) => void;
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
  } = useSortable({ id: phrase.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2",
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label={t("pageBuilder.blocks.phraseCycle.reorder")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <TextInput
          label={t("pageBuilder.blocks.phraseCycle.phraseNumber", {
            number: index + 1,
          })}
          defaultValue={phrase.text}
          onChange={onTextChange}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={t("pageBuilder.blocks.phraseCycle.removePhrase")}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export const PhraseCycleConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<PhraseCycleProps>) => {
    const t = useI18n("builder");
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as PhraseCycleProps["style"] }),
      [setData, data],
    );
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as PhraseCycleProps["props"] }),
      [setData, data],
    );
    const phrases = data.props?.phrases ?? [];
    const phraseIds = useMemo(
      () => phrases.map((phrase) => phrase.id),
      [phrases],
    );
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );
    const motionOptions = phraseMotions.map((motion) => ({
      value: motion,
      label: t(
        `pageBuilder.blocks.phraseCycle.motions.${motionLabelKey[motion]}`,
      ),
    }));

    const onDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = phraseIds.indexOf(String(active.id));
        const newIndex = phraseIds.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        updateProps({
          ...data.props,
          phrases: arrayMove(phrases, oldIndex, newIndex),
        });
      },
      [data.props, phraseIds, phrases, updateProps],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={phraseCycleShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium">
              {t("pageBuilder.blocks.phraseCycle.phrases")}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateProps({
                  ...data.props,
                  phrases: [...phrases, { id: generateId(), text: "" }],
                })
              }
            >
              <Plus className="mr-1 size-4" />
              {t("pageBuilder.blocks.phraseCycle.addPhrase")}
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={phraseIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {phrases.map((phrase, index) => (
                  <SortablePhraseRow
                    key={phrase.id}
                    phrase={phrase}
                    index={index}
                    onTextChange={(text) =>
                      updateProps({
                        ...data.props,
                        phrases: phrases.map((item) =>
                          item.id === phrase.id ? { ...item, text } : item,
                        ),
                      })
                    }
                    onRemove={() =>
                      updateProps({
                        ...data.props,
                        phrases: phrases.filter(
                          (item) => item.id !== phrase.id,
                        ),
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <SelectInput
          label={t("pageBuilder.blocks.phraseCycle.enterMotion")}
          size="sm"
          defaultValue={data.props?.enterMotion ?? "fade-up"}
          onChange={(enterMotion) =>
            updateProps({
              ...data.props,
              enterMotion: enterMotion as PhraseMotion,
            })
          }
          options={motionOptions}
        />
        <SelectInput
          label={t("pageBuilder.blocks.phraseCycle.exitMotion")}
          size="sm"
          defaultValue={data.props?.exitMotion ?? "fade-up"}
          onChange={(exitMotion) =>
            updateProps({
              ...data.props,
              exitMotion: exitMotion as PhraseMotion,
            })
          }
          options={motionOptions}
        />
        <SliderInput
          label={t("pageBuilder.blocks.phraseCycle.enterDuration")}
          defaultValue={data.props?.enterDurationMs ?? 450}
          onChange={(enterDurationMs) =>
            updateProps({ ...data.props, enterDurationMs })
          }
          iconLabel={<Timer className="size-4" />}
          units={t("pageBuilder.blocks.phraseCycle.milliseconds")}
          min={0}
          max={1500}
          step={50}
        />
        <SliderInput
          label={t("pageBuilder.blocks.phraseCycle.exitDuration")}
          defaultValue={data.props?.exitDurationMs ?? 400}
          onChange={(exitDurationMs) =>
            updateProps({ ...data.props, exitDurationMs })
          }
          iconLabel={<Timer className="size-4" />}
          units={t("pageBuilder.blocks.phraseCycle.milliseconds")}
          min={0}
          max={1500}
          step={50}
        />
        <SliderInput
          label={t("pageBuilder.blocks.phraseCycle.pauseAfterPhrase")}
          defaultValue={data.props?.pauseAfterPhraseMs ?? 1600}
          onChange={(pauseAfterPhraseMs) =>
            updateProps({ ...data.props, pauseAfterPhraseMs })
          }
          iconLabel={<Clock className="size-4" />}
          units={t("pageBuilder.blocks.phraseCycle.milliseconds")}
          min={0}
          max={8000}
          step={100}
        />
      </StylesConfigurationPanel>
    );
  },
);
