"use client";

import { AllKeys, BuilderKeys, useI18n } from "@hacado/i18n/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Separator,
  ToolbarButton,
  ToolbarGroup,
} from "@hacado/ui";
import { AlertTriangle, Check, TriangleAlert } from "lucide-react";
import { Fragment, useMemo } from "react";
import {
  useBlocks,
  useEditorStateErrors,
  useSetSelectedBlockId,
} from "../../../documents/editor/context";

export const ToolbarErrorGroup = () => {
  const editorErrors = useEditorStateErrors();
  const blocks = useBlocks();
  const tBuilder = useI18n("builder");
  const t = useI18n();

  const setSelectedBlockId = useSetSelectedBlockId();

  const errors = useMemo(
    () => Object.entries(editorErrors || {}),
    [editorErrors],
  );

  const errorsCount = useMemo(() => errors.length, [errors]);
  const hasErrors = useMemo(() => errorsCount > 0, [errorsCount]);

  const flattendErrors = useMemo(
    () =>
      errors.flatMap(([blockId, { type, error }]) =>
        error.issues.map((issue) => ({
          blockId,
          type,
          displayName: blocks[type].displayName,
          error: issue.message,
          property: issue.path.slice(1).join("."),
        })),
      ),
    [errors, blocks],
  );

  return (
    <ToolbarGroup>
      {hasErrors ? (
        <Popover>
          <PopoverTrigger asChild>
            <ToolbarButton
              tooltip={tBuilder("baseBuilder.builderToolbar.errors", {
                count: errorsCount,
              })}
            >
              <TriangleAlert className="text-destructive" />
            </ToolbarButton>
          </PopoverTrigger>
          <PopoverContent>
            <ScrollArea className="max-w-80">
              <div className="w-full flex flex-col gap-2">
                {flattendErrors.map(
                  ({ blockId, displayName, property, error }, index) => (
                    <Fragment key={blockId}>
                      <div
                        role="button"
                        onClick={() => setSelectedBlockId(blockId)}
                        className="w-full text-destructive cursor-pointer [&>svg]:inline-flex [&>svg]:size-4 text-sm"
                      >
                        <AlertTriangle />{" "}
                        <em>
                          {t.has(displayName) ? t(displayName) : displayName}.
                          {property}:
                        </em>{" "}
                        {t.has(error as BuilderKeys)
                          ? tBuilder(error as BuilderKeys)
                          : t.has(error as AllKeys)
                            ? t(error as AllKeys)
                            : error}
                      </div>
                      {index < flattendErrors.length - 1 && <Separator />}
                    </Fragment>
                  ),
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      ) : (
        <ToolbarButton
          tooltip={tBuilder("baseBuilder.builderToolbar.noErrors")}
        >
          <Check className="text-green-600" />
        </ToolbarButton>
      )}
    </ToolbarGroup>
  );
};
