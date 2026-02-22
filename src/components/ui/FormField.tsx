import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
};

function FormField({ label, name, error, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[10px] text-text-muted uppercase tracking-wider mb-0.5"
      >
        {label}
      </label>
      {children}
      {error && <p className="text-status-fail text-[10px] mt-0.5">{error}</p>}
    </div>
  );
}

type ConnectedFormFieldProps<TValues extends Record<string, unknown>> = {
  label: string;
  name: keyof TValues & string;
  form: { touched: Record<string, boolean>; errors: Record<string, string> };
  children: ReactNode;
};

export function ConnectedFormField<TValues extends Record<string, unknown>>({
  label,
  name,
  form,
  children,
}: ConnectedFormFieldProps<TValues>) {
  const error = form.touched[name] ? form.errors[name] : undefined;
  return (
    <FormField label={label} name={name} error={error}>
      {children}
    </FormField>
  );
}
