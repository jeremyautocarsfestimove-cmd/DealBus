import type { Config } from "tailwindcss";

// Les couleurs pointent sur des variables CSS déclarées dans globals.css,
// au format canaux RGB pour que les modificateurs d'opacité de Tailwind
// (bg-ambre/10, border-ambre/25, bg-asphalte/90…) continuent de marcher.
// Conséquence : une section enveloppée dans .sombre bascule en foncé sans
// qu'aucune classe à l'intérieur ne change.
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        asphalte: {
          DEFAULT: rgb("--c-surface"),
          2: rgb("--c-surface-2"),
          3: rgb("--c-surface-3"),
        },
        // Encre (le nom reste "blanc" pour ne pas toucher les composants)
        blanc: {
          DEFAULT: rgb("--c-encre"),
          dim: "rgb(var(--c-encre) / 0.74)",
          faint: "rgb(var(--c-encre) / 0.62)",
        },
        // Encre fixe : texte posé sur un aplat ambre, sombre dans les deux thèmes
        encre: "#12151B",
        ambre: {
          DEFAULT: rgb("--c-ambre"),
          fort: rgb("--c-ambre-fort"),
          dim: "rgb(var(--c-ambre) / 0.16)",
        },
        vert: {
          DEFAULT: rgb("--c-vert"),
          dim: "rgb(var(--c-vert) / 0.14)",
        },
        bleunuit: {
          DEFAULT: rgb("--c-bleunuit"),
          fort: rgb("--c-bleunuit-fort"),
        },
        ligne: {
          DEFAULT: "rgb(var(--c-encre) / 0.12)",
          strong: "rgb(var(--c-encre) / 0.20)",
        },
      },
      fontFamily: {
        condensed: ["var(--font-barlow)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: { DEFAULT: "3px", sm: "2px" },
      boxShadow: { carte: "0 1px 2px rgb(var(--c-encre) / 0.04)" },
    },
  },
  plugins: [],
};
export default config;
