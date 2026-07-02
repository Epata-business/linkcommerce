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
          blue:  "#153DEC",
          violet:"#8381FB",
          black: "#080A12",
          night: "#02053D",
        },
        muted: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "hsl(215.4 16.3% 46.9%)",
        },
        border: "hsl(214.3 31.8% 91.4%)",
      },
      animation: {
        "fade-up":    "fadeUp 0.6s ease forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "float":      "float 6s ease-in-out infinite",
        "slide-in":   "slideIn 0.4s ease forwards",
        "count-up":   "countUp 0.8s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
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
          "0%":   { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        countUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
