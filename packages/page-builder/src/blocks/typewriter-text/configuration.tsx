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
  generateId,
  SliderInput,
  TextInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { Button, Checkbox, cn, deepMemo, Label } from "@timelish/ui";
import {
  Clock,
  GripVertical,
  Hourglass,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { TypewriterPhrase, TypewriterTextProps } from "./schema";
import { typewriterTextShortcuts } from "./shortcuts";
import { styles } from "./styles";

function SortablePhraseRow({
  phrase,
  index,
  onTextChange,
  onRemove,
}: {
  phrase: TypewriterPhrase;
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2",
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label={t("pageBuilder.blocks.typewriterText.reorder")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <TextInput
          label={t("pageBuilder.blocks.typewriterText.phraseNumber", {
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
        aria-label={t("pageBuilder.blocks.typewriterText.removePhrase")}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export const TypewriterTextConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<TypewriterTextProps>) => {
    const t = useI18n("builder");
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as TypewriterTextProps["style"] }),
      [setData, data],
    );
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as TypewriterTextProps["props"] }),
      [setData, data],
    );

    const phrases = data.props?.phrases ?? [];
    const phraseIds = useMemo(() => phrases.map((p) => p.id), [phrases]);

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

    const setPhraseText = useCallback(
      (id: string, text: string) => {
        updateProps({
          ...data.props,
          phrases: phrases.map((p) => (p.id === id ? { ...p, text } : p)),
        });
      },
      [data.props, phrases, updateProps],
    );

    const removePhrase = useCallback(
      (id: string) => {
        updateProps({
          ...data.props,
          phrases: phrases.filter((p) => p.id !== id),
        });
      },
      [data.props, phrases, updateProps],
    );

    const addPhrase = useCallback(() => {
      updateProps({
        ...data.props,
        phrases: [...phrases, { id: generateId(), text: "" }],
      });
    }, [data.props, phrases, updateProps]);

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={typewriterTextShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium">
              {t("pageBuilder.blocks.typewriterText.phrases")}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPhrase}
            >
              <Plus className="mr-1 size-4" />
              {t("pageBuilder.blocks.typewriterText.addPhrase")}
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
                    onTextChange={(text) => setPhraseText(phrase.id, text)}
                    onRemove={() => removePhrase(phrase.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <SliderInput
          label={t("pageBuilder.blocks.typewriterText.typeDelay")}
          defaultValue={data.props?.typeDelayMs ?? 100}
          onChange={(typeDelayMs) =>
            updateProps({ ...data.props, typeDelayMs })
          }
          iconLabel={<Timer className="size-4" />}
          units={t("pageBuilder.blocks.typewriterText.milliseconds")}
          min={0}
          max={500}
          step={10}
        />
        <SliderInput
          label={t("pageBuilder.blocks.typewriterText.deleteDelay")}
          defaultValue={data.props?.deleteDelayMs ?? 50}
          onChange={(deleteDelayMs) =>
            updateProps({ ...data.props, deleteDelayMs })
          }
          iconLabel={<Hourglass className="size-4" />}
          units={t("pageBuilder.blocks.typewriterText.milliseconds")}
          min={0}
          max={300}
          step={5}
        />
        <SliderInput
          label={t("pageBuilder.blocks.typewriterText.pauseAfterPhrase")}
          defaultValue={data.props?.pauseAfterPhraseMs ?? 2000}
          onChange={(pauseAfterPhraseMs) =>
            updateProps({ ...data.props, pauseAfterPhraseMs })
          }
          iconLabel={<Clock className="size-4" />}
          units={t("pageBuilder.blocks.typewriterText.milliseconds")}
          min={0}
          max={8000}
          step={100}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="typewriter-cursor"
            checked={!!data.props?.showCursor}
            onCheckedChange={(checked) =>
              updateProps({
                ...data.props,
                showCursor: !!checked,
              })
            }
          />
          <Label htmlFor="typewriter-cursor">
            {t("pageBuilder.blocks.typewriterText.showCursor")}
          </Label>
        </div>
      </StylesConfigurationPanel>
    );
  },
);
