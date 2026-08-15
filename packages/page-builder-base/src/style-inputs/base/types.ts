import { AllKeys, BaseAllKeys } from "@hacado/i18n";

export interface CSSValueOption<T extends string> {
  value: T;
  label: AllKeys;
  isKeyword?: boolean;
}

export const widthOrHeightOptions = [
  {
    value: "max-content",
    label:
      "builder.pageBuilder.styles.keywords.maxContent" satisfies BaseAllKeys,
    isKeyword: true,
  },
  {
    value: "min-content",
    label:
      "builder.pageBuilder.styles.keywords.minContent" satisfies BaseAllKeys,
    isKeyword: true,
  },
  {
    value: "fit-content",
    label:
      "builder.pageBuilder.styles.keywords.fitContent" satisfies BaseAllKeys,
    isKeyword: true,
  },
  {
    value: "fill",
    label: "builder.pageBuilder.styles.keywords.fill" satisfies BaseAllKeys,
    isKeyword: true,
  },
  {
    value: "content",
    label: "builder.pageBuilder.styles.keywords.content" satisfies BaseAllKeys,
    isKeyword: true,
  },
] as const satisfies CSSValueOption<string>[];
