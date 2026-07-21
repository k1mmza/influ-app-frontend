import type { Config } from "tailwindcss";

/**
 * "The Traveler's Ledger" — travelogue theme, scoped to public marketing pages.
 *
 * Bound to src/app/(marketing)/marketing.css via Tailwind's `@config` directive.
 * This is deliberately NOT merged into tailwind.config.ts: both systems define
 * `primary`, `secondary`, `background` and `surface` with different values, so a
 * merge would restyle authenticated pages and every shared shadcn primitive.
 *
 * Two settings do the isolation work:
 *   prefix "tv-"       every utility is tv-*, so collision with the existing
 *                      system is structurally impossible, not just avoided.
 *   preflight: false   globals.css already emits base resets; a second copy
 *                      would fight it.
 *
 * Token source of truth: /design-tokens.md at the repo root.
 */
const config: Config = {
  prefix: "tv-",
  darkMode: ["class"],
  corePlugins: { preflight: false },
  // `(marketing)` needs the [(] [)] character-class form: fast-glob reads bare
  // parens as an extglob group, and backslash-escaping them silently matches
  // ZERO files as soon as a {a,b} brace list is also present in the pattern.
  // Verified — this glob must resolve to the route-group files or the whole
  // theme compiles to nothing.
  content: [
    "./src/app/[(]marketing[)]/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/marketing/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "background": "#fcf9f4",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#f3f0eb",
        "inverse-primary": "#ffb5a1",
        "inverse-surface": "#31302d",
        "on-background": "#1c1c19",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "on-primary-container": "#fffbff",
        "on-primary-fixed": "#3b0800",
        "on-primary-fixed-variant": "#7f2a12",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#5b694c",
        "on-secondary-fixed": "#131f09",
        "on-secondary-fixed-variant": "#3e4b31",
        "on-surface": "#1c1c19",
        "on-surface-variant": "#56423d",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#4f3e00",
        "on-tertiary-fixed": "#241a00",
        "on-tertiary-fixed-variant": "#574500",
        "outline": "#89726c",
        "outline-variant": "#ddc0b9",
        "primary": "#9b3f25",
        "primary-container": "#bb563b",
        "primary-fixed": "#ffdbd1",
        "primary-fixed-dim": "#ffb5a1",
        "secondary": "#556347",
        "secondary-container": "#d8e8c5",
        "secondary-fixed": "#d8e8c5",
        "secondary-fixed-dim": "#bdccaa",
        "surface": "#fcf9f4",
        "surface-bright": "#fcf9f4",
        "surface-container": "#f0ede8",
        "surface-container-high": "#ebe8e3",
        "surface-container-highest": "#e5e2dd",
        "surface-container-low": "#f6f3ee",
        "surface-container-lowest": "#ffffff",
        "surface-dim": "#dcdad5",
        "surface-tint": "#9e4127",
        "surface-variant": "#e5e2dd",
        "tertiary": "#735c00",
        "tertiary-container": "#cca830",
        "tertiary-fixed": "#ffe088",
        "tertiary-fixed-dim": "#e9c349",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        // 9999px per design-tokens.md, overriding the 0.75rem Stitch exported.
        full: "9999px",
      },
      spacing: {
        "gutter": "24px",
        "unit": "8px",
        "section-gap": "80px",
        "margin-safe": "32px",
      },
      fontFamily: {
        "display-lg": ["var(--font-tv-serif)", "serif"],
        "headline-lg": ["var(--font-tv-serif)", "serif"],
        "headline-lg-mobile": ["var(--font-tv-serif)", "serif"],
        "headline-md": ["var(--font-tv-serif)", "serif"],
        "italic-serif": ["var(--font-tv-serif)", "serif"],
        "body-lg": ["var(--font-tv-body)", "sans-serif"],
        "body-md": ["var(--font-tv-body)", "sans-serif"],
        "label-caps": ["var(--font-tv-body)", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "italic-serif": ["20px", { lineHeight: "1.4", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.1em", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};

export default config;
