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
  catalog: {
    title: "Catalog",
    theme: sectionTheme,
  },
  customers: {
    title: "Customers",
    theme: sectionTheme,
  },
  settings: {
    title: "Settings",
    theme: sectionTheme,
  },
  website: {
    title: "Website",
    theme: sectionTheme,
  },
  apps: {
    title: "Apps",
    theme: sectionTheme,
  },
  "how-to-guides": {
    title: "How-to guides",
    theme: sectionTheme,
  },
};

export default meta;
