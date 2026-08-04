"use client";

import { useI18n } from "@timelish/i18n/client";
import { Array as EArray, Option, pipe, String } from "effect";
import { Plus, XIcon } from "lucide-react";
import { forwardRef, ReactElement, useEffect, useState } from "react";
import type { ZodType } from "zod";

import { cva } from "class-variance-authority";
import { cn } from "../utils";
import { Badge } from "./badge";
import { Button } from "./button";
import type { InputProps } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const parseTagOpt = (params: {
  tags: string[];
  tagValidator: ZodType<string>;
}) => {
  const { tags, tagValidator } = params;

  const parsedTags = tags.map((tag) => tagValidator.safeParse(tag));
  const successParsedTags = parsedTags.filter((tag) => tag.success);

  if (successParsedTags.length > 0) {
    return pipe(
      successParsedTags.map((parsed) => parsed.data),
      Option.some,
    );
  }

  return Option.none();
};

const tagInputVariant = cva(
  "has-[:focus-visible]:ring-ring flex w-full flex-wrap gap-2 rounded-md border border-input bg-background text-base ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2",
  {
    variants: {
      h: {
        xs: "min-h-7 px-1.5 py-1",
        sm: "min-h-8 px-2 py-1",
        md: "min-h-9 px-3 py-2",
        lg: "min-h-10 px-4 py-3",
      },
    },
    defaultVariants: {
      h: "sm",
    },
  },
);

type TagInputProps = Omit<InputProps, "value" | "onChange"> & {
  value?: ReadonlyArray<string>;
  onChange: (value: ReadonlyArray<string>) => void;
  tagValidator?: ZodType<string>;
  addItemTemplate?: (props: {
    onAdd: (value: string | string[]) => void;
  }) => ReactElement;
  tagDisplayTransform?: (tag: string) => string;
};

const TagInput = forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
  const t = useI18n("ui");
  const {
    className,
    value = [],
    onChange,
    tagValidator,
    addItemTemplate,
    tagDisplayTransform = (tag) => tag,
    ...domProps
  } = props;

  const [pendingDataPoint, setPendingDataPoint] = useState("");

  useEffect(() => {
    if (pendingDataPoint.includes(",")) {
      const newDataPoints = new Set([
        ...value,
        ...pipe(
          pendingDataPoint,
          String.split(","),
          EArray.filterMap((x) => {
            const trimmedX = pipe(x, String.trim);

            return pipe(
              tagValidator,
              Option.fromNullable,
              Option.match({
                onNone: () => pipe([trimmedX], Option.some),
                onSome: (y) =>
                  parseTagOpt({ tags: [trimmedX], tagValidator: y }),
              }),
            );
          }),
          EArray.flatMap((x) => x),
        ),
      ]);
      onChange(Array.from(newDataPoints));
      setPendingDataPoint("");
    }
  }, [pendingDataPoint, onChange, value, tagValidator]);

  const addDataPoint = (dataPoint: string[]) => {
    pipe(
      tagValidator,
      Option.fromNullable,
      Option.match({
        onNone: () => {
          const newDataPoints = new Set([...value, ...dataPoint]);
          onChange(Array.from(newDataPoints));
          setPendingDataPoint("");
        },
        onSome: (y) =>
          pipe(
            parseTagOpt({ tags: dataPoint, tagValidator: y }),
            Option.match({
              onNone: () => {},
              onSome: (x) => {
                const newDataPoints = new Set([...value, ...x]);
                onChange(Array.from(newDataPoints));
                setPendingDataPoint("");
              },
            }),
          ),
      }),
    );
  };

  const addPendingDataPoint = () => {
    if (pendingDataPoint) {
      addDataPoint([pendingDataPoint]);
    }
  };

  return (
    <div
      className={cn(
        // caveat: :has() variant requires tailwind v3.4 or above: https://tailwindcss.com/blog/tailwindcss-v3-4#new-has-variant
        tagInputVariant({ h: props.h ?? undefined }),
        className,
      )}
    >
      {value.map((item) => (
        <Badge key={item} variant={"secondary"}>
          {tagDisplayTransform(item)}
          <Button
            variant={"ghost"}
            size={"icon"}
            className={"ml-2 h-3 w-3"}
            onClick={() => {
              onChange(value.filter((i) => i !== item));
            }}
          >
            <XIcon className={"w-3"} />
          </Button>
        </Badge>
      ))}
      <input
        className={
          "placeholder:text-neutral-500 dark:placeholder:text-neutral-400 flex-1 outline-none bg-transparent"
        }
        value={pendingDataPoint}
        onChange={(e) => setPendingDataPoint(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addPendingDataPoint();
          } else if (
            e.key === "Backspace" &&
            pendingDataPoint.length === 0 &&
            value.length > 0
          ) {
            e.preventDefault();
            onChange(value.slice(0, -1));
          }
        }}
        {...domProps}
        ref={ref}
      />
      {addItemTemplate && (
        <Popover modal>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-5 px-2"
              type="button"
              title={t("form.addItem")}
            >
              <Plus className="h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            {addItemTemplate({
              onAdd: (value) =>
                addDataPoint(Array.isArray(value) ? value : [value]),
            })}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});

TagInput.displayName = "TagInput";

export { TagInput };
