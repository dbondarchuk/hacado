import { InputProps, TextareaProps } from "@hacado/ui";
import { propertiesToArray } from "@hacado/utils";
import React from "react";
import { ContentEditableMentions } from "./content-editable-mention";
import { MentionData, TextareaMentions } from "./textarea-mention";

export type ArgumentsAutocompleteProps = {
  args?: Record<string, any>;
  value?: string;
  onChange?: (value: string) => void;
  documentElement?: Document;
} & (
  | (Omit<TextareaProps, "onChange"> & {
      asInput?: false;
      asContentEditable?: false;
    })
  | (Omit<InputProps, "onChange" | "value"> & {
      asInput: true;
      asContentEditable?: false;
      // asContentEditable?: boolean;
    })
  | (Omit<
      React.HTMLAttributes<HTMLElement>,
      "onInput" | "onChange" | "value"
    > & {
      asInput?: false;
      asContentEditable: true;
      placeholder?: string;
      element: React.ComponentProps<typeof ContentEditableMentions>["element"];
      // asContentEditable?: boolean;
    })
);

export const ArgumentsAutocomplete = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  ArgumentsAutocompleteProps
>(({ args, asInput, value, onChange, asContentEditable, ...rest }, ref) => {
  const argsJson = JSON.stringify(args);

  const argsData = React.useMemo(
    () => (argsJson ? propertiesToArray(JSON.parse(argsJson)) : []),
    [argsJson],
  );

  const insertTransform = React.useCallback((value: MentionData) => {
    if (value.display === "[]") {
      return `{{#${value.id}}}{{.}}{{/${value.id}}}`;
    }

    return `{{${value.id}}}`;
  }, []);

  const itemRenderer = React.useCallback(
    (item: MentionData) => (
      <div className="flex flex-col gap2">
        {item.id}
        <span className="text-xs text-muted-foreground">{item.display}</span>
      </div>
    ),
    [],
  );

  return !!asContentEditable ? (
    // @ts-expect-error ignore props spread
    <ContentEditableMentions
      ref={ref}
      trigger="{{"
      data={argsData}
      value={value || ""}
      onChange={onChange}
      insertTransform={insertTransform}
      itemRenderer={itemRenderer}
      placeholder={rest.placeholder}
      {...rest}
    />
  ) : (
    <TextareaMentions
      ref={ref}
      trigger="{{"
      asInput={asInput as any}
      // asContentEditable={"asContentEditable" in rest && rest.asContentEditable}
      data={argsData}
      value={value || ""}
      onChange={onChange}
      insertTransform={insertTransform}
      itemRenderer={itemRenderer}
      {...rest}
    />
  );
});
