import { forwardRef, type ComponentProps } from "react";

const baseClass =
  "w-full bg-surface-900 text-text-primary text-xs px-2 py-1.5 rounded-sm border border-surface-600 focus:border-accent focus:outline-none";

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={className ? `${baseClass} ${className}` : baseClass}
      {...props}
    />
  ),
);
