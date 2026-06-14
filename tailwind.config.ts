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
        sand: {
          50:  "#FAF7F2",
          100: "#F3EDE0",
          200: "#E8DACB",
          300: "#D9C2A5",
          400: "#C9A87C",
          500: "#B8916A",
          600: "#A07855",
          700: "#856043",
          800: "#6A4D35",
          900: "#3D2B1E",
          950: "#1E1510",
        },
        stone: {
          50:  "#FAFAF8",
          100: "#F5F2ED",
          200: "#EBE5DC",
          300: "#D9D0C4",
          400: "#B8AFA2",
          500: "#8C8278",
          600: "#6B6159",
          700: "#4D453E",
          800: "#332E28",
          900: "#1A1714",
          950: "#0D0C0A",
        },
        sage: {
          50:  "#f4f7f4",
          100: "#e6ede6",
          200: "#cddacd",
          300: "#a9bfa9",
          400: "#7f9e80",
          500: "#5e8060",
          600: "#4a674b",
          700: "#3d533e",
          800: "#334334",
          900: "#2b382c",
          950: "#141f15",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
