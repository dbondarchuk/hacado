"use client";

import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { useEditorReadOnly } from "@udecode/plate/react";
import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";

import { ToolbarGroup } from "@hacado/ui";
import { InlineEquationToolbarButton } from "./inline-equation-toolbar-button";
import { LinkToolbarButton } from "./link-toolbar-button";
import { MarkToolbarButton } from "./mark-toolbar-button";
import { MoreDropdownMenu } from "./more-dropdown-menu";
import { TurnIntoDropdownMenu } from "./turn-into-dropdown-menu";

export function FloatingToolbarButtons({
  isMarkdown,
}: {
  isMarkdown?: boolean;
}) {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          {/* <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup> */}

          <ToolbarGroup>
            <TurnIntoDropdownMenu isMarkdown={isMarkdown} />

            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={ItalicPlugin.key}
              tooltip="Italic (⌘+I)"
            >
              <ItalicIcon />
            </MarkToolbarButton>

            {!isMarkdown && (
              <MarkToolbarButton
                nodeType={UnderlinePlugin.key}
                tooltip="Underline (⌘+U)"
              >
                <UnderlineIcon />
              </MarkToolbarButton>
            )}

            <MarkToolbarButton
              nodeType={StrikethroughPlugin.key}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={CodePlugin.key} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            {!isMarkdown && <InlineEquationToolbarButton />}

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}

      {isMarkdown && (
        <ToolbarGroup>{!readOnly && <MoreDropdownMenu />}</ToolbarGroup>
      )}
    </>
  );
}
