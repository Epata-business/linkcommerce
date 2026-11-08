import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["var(--font-montserrat)", "sans-serif"],
      },
      colors: {
        brand: {
          blue:   "#153DEC",
          "blue-hover": "#1234D0",
          "blue-light": "#EEF1FD",
          violet: "#8381FB",
          "violet-light": "#F0EFFE",
          black:  "#080A12",
          night:  "#02053D",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle:  "#F7F8FC",
          muted:   "#F0F1F7",
        },
        muted: {
          DEFAULT: "hsl(220 20% 96%)",
          foreground: "hsl(220 10% 46%)",
        },
        border: {
          DEFAULT: "hsl(220 20% 91%)",
          subtle:  "hsl(220 20% 95%)",
        },
        text: {
          primary:   "#0F1117",
          secondary: "#4B5563",
          tertiary:  "#9CA3AF",
          link:      "#153DEC",
        },
      },
      borderRadius: {
        "2.5xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:   "0 1px 3px rgba(15,17,23,0.04), 0 1px 2px rgba(15,17,23,0.03)",
        "card-hover": "0 4px 12px rgba(15,17,23,0.08), 0 1px 3px rgba(15,17,23,0.04)",
        modal:  "0 20px 60px rgba(15,17,23,0.18), 0 8px 20px rgba(15,17,23,0.08)",
        brand:  "0 4px 14px rgba(21,61,236,0.3)",
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease forwards",
        "fade-in":    "fadeIn 0.3s ease forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "float":      "float 6s ease-in-out infinite",
        "slide-in":   "slideIn 0.35s ease forwards",
        "count-up":   "countUp 0.8s ease forwards",
        "slide-down": "slideDown 0.25s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        glowPulse: {
          "0%,100%": { opacity: "0.4" },
          "50%":     { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px) rotateX(8deg) rotateY(-4deg)" },
          "50%":     { transform: "translateY(-12px) rotateX(6deg) rotateY(-2deg)" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        countUp: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
