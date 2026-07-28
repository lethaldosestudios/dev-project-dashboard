import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // OLED Pure Black Theme
      colors: {
        // Pure OLED black background
        oled: {
          950: "#000000",
          900: "#0a0a0a",
          800: "#141414",
          700: "#1a1a1a",
          600: "#202020",
        },
        // Glossy/Glass accent colors
        glass: {
          primary: "#ffffff1a",
          secondary: "#ffffff0d",
          border: "#ffffff1a",
          glow: "#000000",
        },
        // Liquid glass button colors
        liquid: {
          base: "#ffffff0d",
          hover: "#ffffff1a",
          active: "#ffffff26",
        },
        // Neutral overrides for darker theme
        neutral: {
          950: "#000000",
          900: "#0a0a0a",
          800: "#141414",
          700: "#1a1a1a",
          600: "#202020",
          500: "#2a2a2a",
          400: "#404040",
          300: "#525252",
          200: "#717171",
          100: "#a1a1a1",
          50: "#d1d1d1",
        },
      },
      // Custom box shadows for glassmorphism and glow
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-lg": "0 12px 40px 0 rgba(0, 0, 0, 0.45)",
        "glass-xl": "0 16px 48px 0 rgba(0, 0, 0, 0.5)",
        glow: "0 0 20px rgba(255, 255, 255, 0.1)",
        "glow-md": "0 0 30px rgba(255, 255, 255, 0.15)",
        "glow-lg": "0 0 40px rgba(255, 255, 255, 0.2)",
        "inner-glow": "inset 0 0 30px rgba(255, 255, 255, 0.05)",
        elevated: "0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
        "elevated-lg": "0 20px 60px -15px rgba(0, 0, 0, 0.6), 0 8px 10px -5px rgba(0, 0, 0, 0.4)",
      },
      // Custom backdrop blur for glass effect
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      // Custom border radius
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      // Custom animation for micro-interactions
      animation: {
        "liquid-hover": "liquid-hover 0.3s ease-in-out",
        "glass-glow": "glass-glow 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "liquid-hover": {
          "0%": { transform: "translateY(0)", boxShadow: "0 0 15px rgba(255,255,255,0.1)" },
          "100%": { transform: "translateY(-2px)", boxShadow: "0 4px 25px rgba(255,255,255,0.2)" },
        },
        "glass-glow": {
          "0%": { boxShadow: "0 0 20px rgba(255,255,255,0.1)" },
          "100%": { boxShadow: "0 0 30px rgba(255,255,255,0.15)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,255,255,0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(255,255,255,0.2)" },
        },
      },
      // Custom transition timing
      transitionTimingFunction: {
        liquid: "cubic-bezier(0.25, 0.8, 0.25, 1)",
        glass: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
