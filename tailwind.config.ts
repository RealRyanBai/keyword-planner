import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "SF Pro Display",
          "Segoe UI", "system-ui", "sans-serif",
        ],
        mono: ["SF Mono", "JetBrains Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
