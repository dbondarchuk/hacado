import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "Hacado Docs",
  tagline: "Hacado: all-in-one appointment booking platform.",
  favicon: "img/favicon.ico",

  url: "https://docs.hacado.com",
  baseUrl: "/",

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  plugins: [
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          {
            from: "/docs/daily-use/first-steps-after-setup",
            to: "/docs/first-steps",
          },
        ],
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          path: "docs",
          sidebarPath: "./sidebars.ts",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    /** Default OG / Twitter image; swap for a dedicated 1200×630 graphic when ready. */
    image: "img/logo.png",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "",
      logo: {
        alt: "Hacado",
        src: "img/navbar-logo.svg",
        srcDark: "img/navbar-logo-dark.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://hacado.com",
          label: "Website",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "/docs/getting-started/introduction",
            },
            {
              label: "First steps",
              to: "/docs/first-steps",
            },
            {
              label: "Settings",
              to: "/docs/daily-use/settings",
            },
            {
              label: "Your web address",
              to: "/docs/daily-use/connect-domain",
            },
            {
              label: "Apps",
              to: "/docs/apps/overview",
            },
          ],
        },
        {
          title: "Product",
          items: [
            {
              label: "Hacado",
              href: "https://hacado.com",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Hacado.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      {
        // ... Your options.
        // `hashed` is recommended as long-term-cache of index file is possible.
        hashed: true,

        // For Docs using Chinese, it is recomended to set:
        // language: ["en", "zh"],

        // Customize the keyboard shortcut to focus search bar (default is "mod+k"):
        // searchBarShortcutKeymap: "s", // Use 'S' key
        // searchBarShortcutKeymap: "ctrl+shift+f", // Use Ctrl+Shift+F

        // If you're using `noIndex: true`, set `forceIgnoreNoIndex` to enable local index:
        // forceIgnoreNoIndex: true,

        // Enable Ask AI integration:
        // askAi: {
        //   project: "your-project-name",
        //   apiUrl: "https://your-api-url.com/api/stream",
        //   hotkey: "cmd+I", // Optional: keyboard shortcut to trigger Ask AI
        // },
      },
    ],
  ],
};

export default config;
