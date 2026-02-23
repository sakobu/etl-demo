import { isOk, type Result } from "@railway-ts/pipelines/result";
import type { ProcessedTransaction } from "../../../api/etl";

type Props = {
  combineAll: Result<ProcessedTransaction[], string[]>;
};

export function CombineAllTab({ combineAll }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
        All or nothing &middot; all errors collected
      </p>

      {isOk(combineAll) ? (
        <div className="rounded-md border border-status-success/40 bg-status-success/5 p-4">
          <p className="text-sm font-medium text-status-success">
            Batch Succeeded
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {combineAll.value.length} records processed
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-status-fail/40 bg-status-fail/5 p-4">
          <p className="text-sm font-medium text-status-fail">
            Batch Failed &mdash; {combineAll.error.length} error{combineAll.error.length !== 1 && "s"}
          </p>
          <ol className="mt-2 flex flex-col gap-1 list-decimal list-inside">
            {combineAll.error.map((e, i) => (
              <li key={i} className="text-xs font-mono text-text-secondary">
                {e}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs italic text-text-muted">
            Every error is visible, but you still lose all successes
          </p>
        </div>
      )}
    </div>
  );
}
