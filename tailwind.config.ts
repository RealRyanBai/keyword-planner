import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#12121a",
          2: "#1a1a26",
          3: "#22222e",
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
