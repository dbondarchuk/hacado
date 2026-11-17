import type { FormBlockProps } from "./schema";

export const FormBlockPropsDefaults = {
  props: {
    formId: null as string | null,
  },
  style: {
    padding: [
      {
        value: {
          top: { value: 1, unit: "rem" },
          bottom: { value: 1, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
    display: [{ value: "flex" }],
    flexDirection: [{ value: "column" }],
    width: [{ value: { value: 100, unit: "%" } }],
    gap: [{ value: { value: 0.5, unit: "rem" } }],
  },
} as const satisfies FormBlockProps;
