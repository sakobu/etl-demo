import { useForm } from "@railway-ts/use-form";
import { transactionSchema } from "../../../api/etl";
import { useRawRecords, useETLActions } from "../../../store/etlStore";
import { FormField } from "../../ui/FormField";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";

type RecordEditorProps = {
  index: number;
};

export function RecordEditor({ index }: RecordEditorProps) {
  const rawRecords = useRawRecords();
  const { updateRecord } = useETLActions();
  const record = rawRecords[index];

  const form = useForm(transactionSchema, {
    initialValues: record.data,
    onSubmit: (values) => {
      updateRecord(index, values);
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
        <FormField form={form} name="id" label="ID">
          <Input {...form.getFieldProps("id")} />
        </FormField>

        <FormField form={form} name="customerEmail" label="Email">
          <Input {...form.getFieldProps("customerEmail")} />
        </FormField>

        <FormField form={form} name="amount">
          <Input {...form.getFieldProps("amount")} inputMode="decimal" />
        </FormField>

        <FormField form={form} name="currency">
          <Select {...form.getSelectFieldProps("currency")}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
        </FormField>

        <FormField form={form} name="date">
          <Input {...form.getFieldProps("date")} type="date" />
        </FormField>

        <Button
          type="submit"
          disabled={form.isSubmitting}
          className="text-xs rounded-sm px-3 py-1.5 mt-1"
        >
          Save
        </Button>
      </form>
    </div>
  );
}
