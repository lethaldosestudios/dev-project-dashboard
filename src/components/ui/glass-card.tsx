// src/components/ui/glass-card.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
  glow?: "none" | "subtle" | "strong";
  hoverEffect?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { 
      className, 
      variant = "default", 
      glow = "none", 
      hoverEffect = true,
      children,
      ...props 
    },
    ref
  ) => {
    const baseStyles = "rounded-2xl p-6 transition-all duration-300";
    
    const variantStyles = {
      default: "bg-glass-800/50 backdrop-blur-xl border border-glass",
      elevated: "bg-glass-900/60 backdrop-blur-2xl border border-glass shadow-glass",
      bordered: "bg-glass-800/40 backdrop-blur-lg border-2 border-glass",
    };
    
    const glowStyles = {
      none: "",
      subtle: "shadow-glow-blue/50",
      strong: "shadow-glow-blue",
    };
    
    const hoverStyles = hoverEffect 
      ? "hover:bg-glass-700/60 hover:border-glass-hover hover:shadow-glass-lg hover:translate-y-[-2px]"
      : "";
    
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          glowStyles[glow],
          hoverStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
