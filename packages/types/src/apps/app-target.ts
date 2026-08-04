export const APP_TARGETS = ["company", "member"] as const;
export type AppTarget = (typeof APP_TARGETS)[number];
