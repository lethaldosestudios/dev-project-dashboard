"use client";

import * as React from "react";
import { cn } from "@/lib/utils-shadcn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-white/5 bg-oled-800/50 px-3 py-2 " +
          "text-sm text-white placeholder:text-neutral-500 " +
          "transition-all duration-300 " +
          "focus:outline-none focus:border-white/20 focus:shadow-glow focus:bg-oled-800/70 " +
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
