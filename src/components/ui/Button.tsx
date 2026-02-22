import { forwardRef, type ComponentProps } from "react";

const variantClasses = {
  primary:
    "bg-accent hover:bg-accent-hover text-white disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-surface-700 hover:bg-surface-600 text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed",
  ghost: "text-text-secondary",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variantClasses;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => {
    const base = `${variantClasses[variant]} transition-colors`;
    return (
      <button
        ref={ref}
        className={className ? `${base} ${className}` : base}
        {...props}
      />
    );
  },
);
