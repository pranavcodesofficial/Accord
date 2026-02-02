"use client";

import * as React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, icon, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "flex h-14 w-14 items-center justify-center",
          "rounded-full bg-blue-500 text-white",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-200 ease-out",
          "hover:scale-105 hover:bg-blue-600",
          "focus:outline-none focus:ring-4 focus:ring-blue-500/30",
          "active:scale-95",
          className
        )}
        {...props}
      >
        {icon || <PlusIcon className="h-6 w-6" />}
      </button>
    );
  }
);

FloatingActionButton.displayName = "FloatingActionButton";

export { FloatingActionButton };
