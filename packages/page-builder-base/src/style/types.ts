import { AllKeys } from "@hacado/i18n";
import * as z from "zod";
import { AllStylesNames } from "./styles";
import { Breakpoint, StateWithTarget } from "./zod";

// Style category union type
export type StyleCategory =
  | "typography"
  | "layout"
  | "spacing"
  | "background"
  | "effects"
  | "border"
  | "misc";

export type BaseStyleDictionary = {
  [name: string]: z.ZodType<any, any>;
};

// Style definition interface
export interface StyleDefinition<
  T extends z.ZodType<any, any>,
  TName extends string = any,
> {
  name: TName;
  label: AllKeys;
  icon: (props: { className?: string }) => React.ReactNode;
  category: StyleCategory;
  schema: T;
  defaultValue?: z.infer<T>;
  renderToCSS: (
    value?: z.infer<T> | null | undefined,
    isEditor?: boolean,
  ) => string | null;
  component: React.ComponentType<{
    value: z.infer<T>;
    onChange: (value: z.infer<T>) => void;
  }>;
  // Optional selector to indicate if this style should be applied to children
  selector?: string;
}

// Style variant interface
export interface StyleVariant<T extends z.ZodType> {
  breakpoint?: Breakpoint[] | null;
  state?: StateWithTarget[] | null;
  value: z.infer<T>;
}

export type StyleDictionary<T extends BaseStyleDictionary> = {
  [name in keyof T]: StyleDefinition<T[name], Extract<name, string>>;
};

// Style support configuration
export interface StyleSupport {
  allowedStyles?: AllStylesNames[];
  blockedStyles?: AllStylesNames[];
  // customStyles?: StyleDefinition[];
}
