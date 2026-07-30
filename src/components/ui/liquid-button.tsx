// src/components/ui/liquid-button.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  (
    { 
      className, 
      variant = "primary", 
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props 
    },
    ref
  ) => {
    const baseStyles = 
      "relative inline-flex items-center justify-center font-medium transition-all duration-300 " +
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background " +
      "disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantStyles = {
      primary: 
        "liquid-glass text-white border border-white/20 shadow-glow-blue/50 " +
        "hover:bg-glass-600/30 hover:shadow-glow-blue",
      secondary: 
        "bg-glass-800/50 text-white/90 border border-white/10 " +
        "hover:bg-glass-700/60 hover:border-white/20 hover:text-white",
      ghost: 
        "text-white/70 hover:text-white hover:bg-glass-800/30",
      outline: 
        "border border-white/20 text-white/90 hover:bg-glass-800/30 hover:border-white/30",
    };
    
    const sizeStyles = {
      sm: "h-8 px-3 text-sm gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };
    
    const iconSizeStyles = {
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div 
              className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
          </div>
        ) : null}
        
        {!isLoading && leftIcon && (
          <span className={cn(iconSizeStyles[size], "shrink-0")}>{leftIcon}</span>
        )}
        
        <span className={cn(isLoading ? "invisible" : "visible")}>
          {children}
        </span>
        
        {!isLoading && rightIcon && (
          <span className={cn(iconSizeStyles[size], "shrink-0")}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

LiquidButton.displayName = "LiquidButton";

export { LiquidButton };
