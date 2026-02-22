import { forwardRef, type ComponentProps } from "react";

const baseClass =
  "w-full bg-surface-900 text-text-primary text-xs px-2 py-1.5 rounded-sm border border-surface-600 focus:border-accent focus:outline-none";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={className ? `${baseClass} ${className}` : baseClass}
      {...props}
    />
  ),
);
