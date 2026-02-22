import {
  useRawRecords,
  useSelectedRecordIndex,
  useBatchResult,
  useETLActions,
} from "../../../store/etlStore";
import { Button } from "../../ui/Button";
import { isOk, isErr } from "@railway-ts/pipelines/result";

export function RecordList() {
  const rawRecords = useRawRecords();
  const selectedIndex = useSelectedRecordIndex();
  const batchResult = useBatchResult();
  const { selectRecord } = useETLActions();

  if (rawRecords.length === 0) {
    return (
      <p className="text-text-muted text-xs py-4 text-center">
        No records. Click + Add to create one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {rawRecords.map((record, i) => {
        const isSelected = selectedIndex === i;
        const trace = batchResult?.records[i];

        let borderClass = "border-l-surface-600";
        if (trace) {
          if (isErr(trace.final)) {
            borderClass = "border-l-status-fail";
          } else if (isOk(trace.final) && trace.final.value.partial) {
            borderClass = "border-l-status-partial";
          } else if (isOk(trace.final)) {
            borderClass = "border-l-status-success";
          }
        }

        const data = record.data;

        return (
          <Button
            key={i}
            variant="ghost"
            aria-pressed={isSelected}
            onClick={() => selectRecord(isSelected ? null : i)}
            className={`w-full text-left border-l-[3px] px-2 py-1.5 rounded-r-sm ${borderClass} ${
              isSelected
                ? "bg-surface-700"
                : "hover:bg-surface-700/50"
            }`}
          >
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-text-secondary">
                #{record.row}{" "}
                <span className="text-text-primary">
                  {data.id || "(empty)"}
                </span>
              </span>
              {data.currency ? (
                <span className="text-text-muted">
                  {data.amount.toFixed(2)} {data.currency}
                </span>
              ) : null}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {data.customerEmail || "(no email)"}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
