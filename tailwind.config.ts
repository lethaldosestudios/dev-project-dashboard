import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // OLED Black theme - pure blacks with glassmorphism
        background: "#000000",
        foreground: "#ffffff",
        
        // Glassmorphism color palette
        glass: {
          900: "rgba(10, 10, 10, 0.9)",
          800: "rgba(20, 20, 20, 0.8)",
          700: "rgba(30, 30, 30, 0.7)",
          600: "rgba(40, 40, 40, 0.6)",
          500: "rgba(60, 60, 60, 0.5)",
          400: "rgba(80, 80, 80, 0.4)",
          300: "rgba(100, 100, 100, 0.3)",
          200: "rgba(120, 120, 120, 0.2)",
          100: "rgba(140, 140, 140, 0.1)",
        },
        
        // Accent colors for liquid glass effects
        accent: {
          primary: "#00d4ff",
          secondary: "#ff2d55",
          purple: "#8b5cf6",
          cyan: "#06b6d4",
          emerald: "#10b981",
          orange: "#f59e0b",
        },
        
        // Glow colors
        glow: {
          blue: "0 0 20px rgba(0, 212, 255, 0.3)",
          cyan: "0 0 20px rgba(6, 182, 212, 0.3)",
          purple: "0 0 20px rgba(139, 92, 246, 0.3)",
          red: "0 0 20px rgba(255, 45, 85, 0.3)",
          green: "0 0 20px rgba(16, 185, 129, 0.3)",
        },
        
        // Border colors with opacity
        border: {
          glass: "rgba(255, 255, 255, 0.1)",
          "glass-hover": "rgba(255, 255, 255, 0.2)",
        },
      },
      tokens: {
        bg: "var(--color-bg)",
        fg: "var(--color-fg)",
        accent: {
          primary: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
          purple: "var(--accent-purple)",
          cyan: "var(--accent-cyan)",
          emerald: "var(--accent-emerald)",
          orange: "var(--accent-orange)",
        },
        ring: "var(--focus-ring)",
      },
      
      // Custom backdrop blur values for glassmorphism
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "40px",
      },
      
      // Custom animation utilities
      animation: {
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "liquid": "liquid 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(0, 212, 255, 0.5)" },
        },
        liquid: {
          "0%, 100%": { 
            backgroundPosition: "0% 50%",
            transform: "scale(1)",
          },
          "50%": { 
            backgroundPosition: "100% 50%",
            transform: "scale(1.02)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      
      // Custom border radius for glassmorphism
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      
      // Custom box shadows for elevated cards
      boxShadow: {
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glass-lg": "0 12px 48px rgba(0, 0, 0, 0.4)",
        "glass-xl": "0 16px 64px rgba(0, 0, 0, 0.5)",
        "glow-blue": "0 0 20px rgba(0, 212, 255, 0.3)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.3)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
        "inner-glow": "inset 0 0 30px rgba(255, 255, 255, 0.05)",
      },
      
      // Custom transition timing
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      
      // Custom gradient backgrounds
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(20, 20, 20, 0.8) 0%, rgba(40, 40, 40, 0.4) 100%)",
        "liquid-glass": "linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};

export default config;
