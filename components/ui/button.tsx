"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses: Record<string, string> = {
  default:     "bg-[#153DEC] text-white hover:bg-[#1234D0] shadow-[0_1px_2px_rgba(21,61,236,0.3)] hover:shadow-[0_4px_12px_rgba(21,61,236,0.35)]",
  secondary:   "bg-slate-900 text-white hover:bg-slate-800",
  outline:     "border border-[hsl(220_20%_88%)] bg-white text-[#0F1117] hover:bg-[#F7F8FC] hover:border-[hsl(220_20%_80%)]",
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost:       "text-[#4B5563] hover:bg-[#F7F8FC] hover:text-[#0F1117]",
};

const sizeClasses: Record<string, string> = {
  default: "h-10 px-4 text-sm",
  sm:      "h-8 px-3 text-xs",
  lg:      "h-11 px-6 text-sm",
  icon:    "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153DEC] focus-visible:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
