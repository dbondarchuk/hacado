"use client";

import { BuilderKeys, useI18n } from "@hacado/i18n/client";
import {
  Badge,
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hacado/ui";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import {
  getStateCssSelector,
  isParentTarget,
  isPseudoElementState,
  isSelectorTarget,
  isSelfTarget,
  isViewState,
  State,
  states,
  StateTarget,
  StateWithTarget,
} from "../../style/zod";

interface StateSelectorProps {
  states: StateWithTarget[];
  onStatesChange: (states: StateWithTarget[]) => void;
  styleName: string;
  variantIndex: number;
}

const parentLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const StateSelector: React.FC<StateSelectorProps> = ({
  states: currentStates,
  onStatesChange,
  styleName,
  variantIndex,
}) => {
  const t = useI18n("builder");
  const [isOpen, setIsOpen] = useState(false);
  const [newState, setNewState] = useState<State>("hover");
  const [newTargetType, setNewTargetType] =
    useState<StateTarget["type"]>("self");
  const [newParentLevel, setNewParentLevel] = useState<number>(1);
  const [newSelector, setNewSelector] = useState<string>("");
  const [newStateType, setNewStateType] = useState<"block" | "selector">(
    "block",
  );

  const addNewState = () => {
    let stateTarget: StateTarget;

    if (newTargetType === "self") {
      stateTarget = { type: "self" };
    } else if (newTargetType === "parent") {
      stateTarget = { type: "parent", data: { level: newParentLevel } };
    } else {
      stateTarget = {
        type: "selector",
        data: { selector: newSelector, stateType: newStateType },
      };
    }

    const stateWithParent: StateWithTarget = {
      state: newState,
      target: stateTarget,
    };

    // Check if this combination already exists
    const exists = currentStates?.some(
      (s) =>
        s.state === newState &&
        s.target?.type === newTargetType &&
        (newTargetType === "self" ||
          (isParentTarget(s) && s.target.data?.level === newParentLevel) ||
          (isSelectorTarget(s) &&
            s.target.data?.selector === newSelector &&
            s.target.data?.stateType === newStateType)),
    );

    if (!exists) {
      const newStates = [...(currentStates || []), stateWithParent];
      onStatesChange(newStates);
    }

    // Reset form
    setNewState("hover");
    setNewTargetType("self");
    setNewParentLevel(1);
    setNewSelector("");
  };

  const removeState = (state: State, stateTarget: StateTarget | undefined) => {
    if (!stateTarget) return;

    const newStates =
      currentStates?.filter(
        (s) =>
          !(
            s.state === state &&
            s.target?.type === stateTarget.type &&
            (stateTarget.type === "self" ||
              (stateTarget.type === "parent" &&
                isParentTarget(s) &&
                s.target?.data?.level === stateTarget.data?.level) ||
              (stateTarget.type === "selector" &&
                isSelectorTarget(s) &&
                s.target?.data?.selector === stateTarget.data?.selector &&
                s.target?.data?.stateType === stateTarget.data?.stateType))
          ),
      ) || [];
    onStatesChange(newStates);
  };

  const getStateLabel = (stateWithParent: StateWithTarget) => {
    const stateLabel = (() => {
      if (stateWithParent.state === "default") return "";
      if (isPseudoElementState(stateWithParent.state)) {
        return getStateCssSelector(stateWithParent.state);
      }
      if (isViewState(stateWithParent.state)) {
        return getStateCssSelector(stateWithParent.state);
      }
      return `:${t(`pageBuilder.styles.states.${stateWithParent.state}` as BuilderKeys)}`;
    })().toLocaleLowerCase();

    if (isSelfTarget(stateWithParent)) {
      return stateWithParent.state === "default"
        ? t("pageBuilder.styles.states.default").toLocaleLowerCase()
        : stateLabel;
    }

    if (isParentTarget(stateWithParent)) {
      const level = stateWithParent.target?.data?.level;
      let parentLabel = "";
      if (level === 1) parentLabel = "Parent";
      else if (level === 2) parentLabel = "Grandparent";
      else if (level === 3) parentLabel = "Great-grandparent";
      else parentLabel = `${level}th Parent`;
      return `${parentLabel}${stateLabel}`;
    }

    if (isSelectorTarget(stateWithParent)) {
      const selector = stateWithParent.target?.data?.selector;
      const stateType = stateWithParent.target?.data?.stateType;
      return stateType === "block"
        ? `${stateLabel} ${selector}`
        : `${selector}${stateLabel}`;
    }

    return stateLabel;
  };

  const getStateKey = (stateWithParent: StateWithTarget) => {
    if (isSelfTarget(stateWithParent)) {
      return `${stateWithParent.state}-self`;
    }
    if (isParentTarget(stateWithParent)) {
      return `${stateWithParent.state}-parent-${stateWithParent.target?.data?.level}`;
    }
    if (isSelectorTarget(stateWithParent)) {
      return `${stateWithParent.state}-selector-${stateWithParent.target?.data?.stateType}-${stateWithParent.target?.data?.selector}`;
    }
    return `${stateWithParent.state}-unknown`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs" className="w-full h-6 text-xs">
          {t("pageBuilder.styles.states.shortLabel", {
            count: currentStates?.length ?? 0,
          })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          {/* Selected States Display */}
          {currentStates && currentStates.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {t("pageBuilder.styles.states.selectedStates")}
              </Label>
              <div className="flex flex-wrap gap-1">
                {currentStates.map((stateWithParent, index) => (
                  <Badge
                    key={`${getStateKey(stateWithParent)}-${index}`}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() =>
                      removeState(stateWithParent.state, stateWithParent.target)
                    }
                  >
                    {getStateLabel(stateWithParent)}
                    <span className="ml-1">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add New State */}
          <div className="space-y-2 w-full">
            <Label className="text-xs font-medium">
              {t("pageBuilder.styles.states.addNewState")}
            </Label>
            <div className="space-y-2 w-full">
              {/* Target Type Selection */}
              <Select
                value={newTargetType}
                onValueChange={(value) =>
                  setNewTargetType(value as "self" | "parent" | "selector")
                }
              >
                <SelectTrigger size="xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">
                    {t("pageBuilder.styles.states.self")}
                  </SelectItem>
                  <SelectItem value="parent">
                    {t("pageBuilder.styles.states.parent")}
                  </SelectItem>
                  <SelectItem value="selector">
                    {t("pageBuilder.styles.states.selector.title")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Parent Level Selection */}
              {newTargetType === "parent" && (
                <Select
                  value={newParentLevel.toString()}
                  onValueChange={(value) => setNewParentLevel(parseInt(value))}
                >
                  <SelectTrigger size="xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parentLevels.map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {t(`pageBuilder.styles.states.parentLevels.${level}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Custom Selector Input */}
              {newTargetType === "selector" && (
                <>
                  <Select
                    value={newStateType}
                    onValueChange={(value) =>
                      setNewStateType(value as "block" | "selector")
                    }
                  >
                    <SelectTrigger size="xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">
                        {t("pageBuilder.styles.states.selector.block")}
                      </SelectItem>
                      <SelectItem value="selector">
                        {t("pageBuilder.styles.states.selector.selector")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    size={1}
                    placeholder={t(
                      "pageBuilder.styles.states.selector.placeholder",
                    )}
                    value={newSelector}
                    onChange={(e) => setNewSelector(e.target.value)}
                    className="text-xs"
                  />
                </>
              )}

              {/* State Selection */}
              <Select
                value={newState}
                onValueChange={(value) => setNewState(value as State)}
              >
                <SelectTrigger size="xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {t(`pageBuilder.styles.states.${state}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="xs"
                className="w-full"
                onClick={addNewState}
                disabled={
                  currentStates?.some(
                    (s) =>
                      s.state === newState &&
                      s.target?.type === newTargetType &&
                      (newTargetType === "self" ||
                        (newTargetType === "parent" &&
                          isParentTarget(s) &&
                          s.target?.data?.level === newParentLevel) ||
                        (newTargetType === "selector" &&
                          isSelectorTarget(s) &&
                          s.target?.data?.selector === newSelector &&
                          s.target?.data?.stateType === newStateType)),
                  ) ||
                  (newTargetType === "selector" && !newSelector.trim())
                }
                variant="ghost"
              >
                <Plus className="w-3 h-3" />{" "}
                {t("pageBuilder.styles.states.add")}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
