import type { MetaRecord } from "nextra";

const sectionTheme = {
  timestamp: false,
  typesetting: "article" as const,
};

const meta: MetaRecord = {
  "getting-started": {
    title: "Getting started",
    theme: sectionTheme,
  },
  "first-steps": {
    title: "First steps",
    theme: sectionTheme,
  },
  "daily-use": {
    title: "Using your workspace",
    theme: sectionTheme,
  },
  apps: {
    title: "Apps",
    theme: sectionTheme,
  },
};

export default meta;
