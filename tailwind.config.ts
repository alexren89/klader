import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Klader primary — Plum
        plum: {
          50:  "#F4EEF9",
          100: "#E7DAF1",
          200: "#CDB4E2",
          300: "#AE89CE",
          400: "#8757B2",
          500: "#5C2E8E",
          600: "#4C2576",
          700: "#3A1C5C",
          800: "#2C1545",
          900: "#231337",
        },
        // Klader accent — Coral
        coral: {
          50:  "#FFF1EE",
          100: "#FFE1DA",
          200: "#FFC6BA",
          300: "#FFA292",
          400: "#FF7E6B",
          500: "#F2604A",
          600: "#D74B36",
          700: "#B23A28",
        },
        // Warm plum-tinted neutrals (replaces stone/sand/sage)
        neutral: {
          0:   "#FFFFFF",
          50:  "#F8F5FB",
          100: "#F0E9F5",
          200: "#E5DCEC",
          300: "#D2C6DD",
          400: "#AB9EBA",
          500: "#7E7189",
          600: "#594E66",
          700: "#3E3349",
          800: "#2C2138",
          900: "#231337",
        },
        // Keep stone/sage/sand as aliases so existing pages don't break
        stone: {
          50:  "#F8F5FB",
          100: "#F0E9F5",
          200: "#E5DCEC",
          300: "#D2C6DD",
          400: "#AB9EBA",
          500: "#7E7189",
          600: "#594E66",
          700: "#3E3349",
          800: "#2C2138",
          900: "#231337",
          950: "#150C24",
        },
        sage: {
          50:  "#F4EEF9",
          100: "#E7DAF1",
          200: "#CDB4E2",
          300: "#AE89CE",
          400: "#8757B2",
          500: "#5C2E8E",
          600: "#4C2576",
          700: "#3A1C5C",
          800: "#2C1545",
          900: "#231337",
          950: "#150C24",
        },
        sand: {
          50:  "#FFF1EE",
          100: "#FFE1DA",
          200: "#FFC6BA",
          300: "#FFA292",
          400: "#FF7E6B",
          500: "#F2604A",
          600: "#D74B36",
          700: "#B23A28",
          800: "#8C2B1E",
          900: "#5C1A12",
          950: "#2E0D09",
        },
      },
      fontFamily: {
        sans:    ["var(--font-body)",    "Schibsted Grotesk", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Unbounded",         "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)",    "Martian Mono",      "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl": "14px",
        "3xl": "20px",
        "4xl": "28px",
        "pill": "999px",
      },
      boxShadow: {
        card:       "0 2px 6px rgba(35,19,55,0.07)",
        "card-hover": "0 8px 24px rgba(35,19,55,0.13)",
        focus:      "0 0 0 3px rgba(92,46,142,0.28)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s cubic-bezier(0.22,1,0.36,1)",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};

export default config;
