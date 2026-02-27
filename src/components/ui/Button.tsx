import type { ComponentProps } from "react";

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

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const base = `${variantClasses[variant]} cursor-pointer transition-colors`;
  return <button className={className ? `${base} ${className}` : base} {...props} />;
}
