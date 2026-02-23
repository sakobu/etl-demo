import type { ReactNode } from "react";
import type { UseFormReturn, ExtractFieldPaths } from "@railway-ts/use-form";

function deriveLabel(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

type FormFieldLayoutProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

function FormFieldLayout({ label, htmlFor, error, children }: FormFieldLayoutProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[10px] text-text-muted uppercase tracking-wider mb-0.5"
      >
        {label}
      </label>
      {children}
      {error && <p className="text-status-fail text-[10px] mt-0.5">{error}</p>}
    </div>
  );
}

type FormFieldProps<TValues extends Record<string, unknown>> = {
  label?: string;
  name: ExtractFieldPaths<TValues>;
  form: UseFormReturn<TValues>;
  children: ReactNode;
};

export function FormField<TValues extends Record<string, unknown>>({
  label,
  name,
  form,
  children,
}: FormFieldProps<TValues>) {
  const displayLabel = label ?? deriveLabel(name);
  return (
    <FormFieldLayout label={displayLabel} htmlFor={form.getFieldId(name)} error={form.getFieldError(name)}>
      {children}
    </FormFieldLayout>
  );
}
