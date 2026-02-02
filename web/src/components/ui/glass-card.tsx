import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "subtle";
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-white/60 backdrop-blur-xl border-gray-200/60 shadow-sm hover:shadow-md",
      elevated: "bg-white/80 backdrop-blur-2xl border-gray-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
      subtle: "bg-white/40 backdrop-blur-md border-gray-100/40",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border transition-all duration-200",
          variants[variant],
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
