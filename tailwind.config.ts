import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "rgb(var(--estate-navy-rgb) / <alpha-value>)",
        compass: "rgb(var(--compass-blue-rgb) / <alpha-value>)",
        ledger: "rgb(var(--ledger-gray-rgb) / <alpha-value>)",
        coral: "rgb(var(--signal-coral-rgb) / <alpha-value>)",
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        fog: "rgb(var(--fog-rgb) / <alpha-value>)",
        grid: "rgb(var(--grid-line-rgb) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      letterSpacing: {
        eyebrow: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
