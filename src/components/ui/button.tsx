"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils-shadcn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium " +
  "transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Liquid Glass - Primary
        liquid: 
          "bg-liquid-base text-white border border-white/10 " +
          "shadow-glow hover:bg-liquid-hover hover:border-white/20 hover:shadow-glow-md " +
          "active:bg-liquid-active active:scale-[0.98]",
        
        // Liquid Glass - Subtle
        subtle: 
          "bg-glass-primary/50 text-neutral-100 border border-white/5 " +
          "hover:bg-glass-primary/70 hover:border-white/10 hover:shadow-glow " +
          "active:bg-glass-primary active:scale-[0.98]",
        
        // Glass Ghost
        ghost: 
          "bg-transparent text-neutral-300 hover:bg-white/5 hover:text-white " +
          "border border-transparent hover:border-white/10",
        
        // Minimal
        minimal: 
          "bg-transparent text-neutral-400 hover:text-white " +
          "hover:bg-white/5",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "liquid",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
