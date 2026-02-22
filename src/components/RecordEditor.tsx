import { useForm } from "@railway-ts/use-form";
import { transactionSchema, type Transaction } from "../api/etl";
import { useRawRecords, useETLActions } from "../store/etlStore";
import type { ReactNode } from "react";

type RecordEditorProps = {
  index: number;
};

export function RecordEditor({ index }: RecordEditorProps) {
  const rawRecords = useRawRecords();
  const { updateRecord } = useETLActions();
  const record = rawRecords[index];

  const form = useForm(transactionSchema, {
    initialValues: record.data as unknown as Transaction,
    onSubmit: (values) => {
      updateRecord(index, {
        id: values.id,
        customerEmail: values.customerEmail,
        amount: String(values.amount),
        currency: values.currency,
        date: values.date.toISOString().split("T")[0],
      });
    },
  });

  return (
    <div className="border-t border-surface-600 pt-3">
      <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
        Edit Record #{record.row}
      </h3>
      <form
        onSubmit={(e) => void form.handleSubmit(e)}
        className="flex flex-col gap-2"
      >
        <FormField
          label="ID"
          error={form.touched.id ? form.errors.id : undefined}
        >
          <input {...form.getFieldProps("id")} className={fieldInputClass} />
        </FormField>

        <FormField
          label="Email"
          error={
            form.touched.customerEmail ? form.errors.customerEmail : undefined
          }
        >
          <input
            {...form.getFieldProps("customerEmail")}
            className={fieldInputClass}
          />
        </FormField>

        <FormField
          label="Amount"
          error={form.touched.amount ? form.errors.amount : undefined}
        >
          <input
            {...form.getFieldProps("amount")}
            inputMode="decimal"
            className={fieldInputClass}
          />
        </FormField>

        <FormField
          label="Currency"
          error={form.touched.currency ? form.errors.currency : undefined}
        >
          <select
            {...form.getSelectFieldProps("currency")}
            className={fieldInputClass}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </FormField>

        <FormField
          label="Date"
          error={form.touched.date ? form.errors.date : undefined}
        >
          <input
            {...form.getFieldProps("date")}
            type="date"
            className={fieldInputClass}
          />
        </FormField>

        <button
          type="submit"
          disabled={form.isSubmitting}
          className="bg-accent hover:bg-accent-hover text-xs text-text-primary rounded-sm px-3 py-1.5 mt-1 disabled:opacity-50 transition-colors"
        >
          Save
        </button>
      </form>
    </div>
  );
}

const fieldInputClass =
  "w-full bg-surface-900 text-text-primary text-xs px-2 py-1.5 rounded-sm border border-surface-600 focus:border-accent focus:outline-none";

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
        {label}
      </label>
      {children}
      {error && <p className="text-status-fail text-[10px] mt-0.5">{error}</p>}
    </div>
  );
}
