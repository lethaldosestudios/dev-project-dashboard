// src/components/ui/glow-input.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "ghost" | "bordered";
  glowColor?: "blue" | "cyan" | "purple" | "green" | "red";
}

const GlowInput = forwardRef<HTMLInputElement, GlowInputProps>(
  ({ className, variant = "default", glowColor = "blue", type, ...props }, ref) => {
    const baseStyles = 
      "w-full rounded-xl bg-transparent text-sm placeholder:text-white/30 " +
      "transition-all duration-300 focus:outline-none";
    
    const variantStyles = {
      default: "glow-input p-4",
      ghost: "p-3 hover:bg-glass-800/30",
      bordered: "p-4 border border-white/10 hover:border-white/20",
    };
    
    const glowColorStyles = {
      blue: "focus:shadow-glow-blue focus:border-accent-primary/50",
      cyan: "focus:shadow-glow-cyan focus:border-accent-cyan/50",
      purple: "focus:shadow-glow-purple focus:border-accent-purple/50",
      green: "focus:shadow-glow-green focus:border-accent-emerald/50",
      red: "focus:shadow-glow-red focus:border-accent-orange/50",
    };

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          glowColorStyles[glowColor],
          className
        )}
        {...props}
      />
    );
  }
);

GlowInput.displayName = "GlowInput";

export { GlowInput };
