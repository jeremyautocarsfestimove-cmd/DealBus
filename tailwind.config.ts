import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalte: { DEFAULT: "#12151B", 2: "#1B2028", 3: "#232A35" },
        blanc: { DEFAULT: "#F5F2EA", dim: "rgba(245,242,234,0.78)", faint: "rgba(245,242,234,0.56)" },
        ambre: { DEFAULT: "#E8A63D", dim: "rgba(232,166,61,0.14)" },
        vert: { DEFAULT: "#34B37A", dim: "rgba(52,179,122,0.14)" },
        bleunuit: "#2A3752",
        ligne: { DEFAULT: "rgba(245,242,234,0.10)", strong: "rgba(245,242,234,0.18)" },
      },
      fontFamily: {
        condensed: ["var(--font-barlow)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: { DEFAULT: "3px", sm: "2px" },
    },
  },
  plugins: [],
};
export default config;
