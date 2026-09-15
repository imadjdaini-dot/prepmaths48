import type { Config } from "tailwindcss";

/**
 * Design tokens extracted from the Prép-Maths48 HTML mockups.
 * Colours are exposed as CSS variables in globals.css and mapped here so we can
 * use them as Tailwind utilities (bg-navy, text-accent, border-line, ...).
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        navy: "var(--navy)",
        "navy-2": "var(--navy-2)",
        "navy-3": "var(--navy-3)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        cyan: "var(--cyan)",
        green: "var(--green)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--r-lg)",
        md: "var(--r-md)",
        sm: "var(--r-sm)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      maxWidth: {
        wrap: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
