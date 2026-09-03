import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  // mode: "jit",
  safelist: [
    // {
    //   // pattern: /./, // the "." means "everything"
    // },
  ],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    // "./data/**/*.mdx"
  ],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      primary: ["var(--font-primary)"],
      secondary: ["var(--font-secondary)"],
      tertiary: ["var(--font-tertiary)"],
    },
    fontSize: {
      xs: ["0.75rem", "normal"],
      sm: ["0.875rem", "normal"],
      base: ["1rem", "normal"],
      lg: ["1.125rem", "normal"],
      xl: ["1.25rem", "normal"],
      "2xl": ["1.5rem", "normal"],
      "3xl": ["1.875rem", "normal"],
      "4xl": ["2.25rem", "normal"],
      "5xl": ["2.625rem", "normal"],
      "6xl": ["3rem", "normal"],
      "7xl": ["3.375rem", "normal"],
      "8xl": ["3.75rem", "normal"],
      "9xl": ["4.125rem", "normal"],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        primary: ["var(--font-primary)"],
        secondary: ["var(--font-secondary)"],
        tertiary: ["var(--font-tertiary)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, hsl(92.3, 14%, 36.5%) 0%, hsl(92.1, 11.2%, 49%) 100%)",
        "gradient-accent":
          "linear-gradient(135deg, hsl(30, 53.8%, 54.1%) 0%, hsl(30, 45%, 42%) 100%)",
        "gradient-dark":
          "linear-gradient(145deg, hsl(26.5, 29.8%, 16%) 0%, hsl(92.1, 11.2%, 49%) 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "bounce-horizontal": {
          "0%, 100%": {
            transform: "none",
            "animation-timing-function": "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "translateX(25%)",
            "animation-timing-function": "cubic-bezier(0,0,0.2,1)",
          },
        },
        shimmer: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        "marquee-scroll": {
          from: {
            transform: "translate3d(0, 0, 0)",
          },
          to: {
            transform: "translate3d(-50%, 0, 0)",
          },
        },
        blink: {
          "0%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-horizontal": "bounce-horizontal 1s infinite",
        shimmer: "shimmer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "marquee-scroll": "marquee-scroll 200s linear infinite",
        blink: "blink 1s infinite",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            [[
              '[class~="lead"]',
              "strong",
              "ol > li::before",
              "blockquote",
              "h1",
              "h2",
              "h3",
              "h4",
              "figure figcaption",
              "code",
              "a code",
              "a",
              "a:hover",
              "thead",
            ].join(", ")]: {
              color: "inherit",
            },

            "ul > li::before": {
              backgroundColor: "currentColor",
            },

            [["hr", "blockquote", "thead", "tbody tr"].join(", ")]: {
              borderColor: "currentColor",
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
} satisfies Config;

export default config;
