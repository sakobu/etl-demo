import { isOk, type Result } from "@railway-ts/pipelines/result";
import type { ProcessedTransaction } from "../../../api/etl";

type Props = {
  combine: Result<ProcessedTransaction[], string>;
};

export function CombineTab({ combine }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
        All or nothing &middot; first error wins
      </p>

      {isOk(combine) ? (
        <div className="rounded-md border border-status-success/40 bg-status-success/5 p-4">
          <p className="text-sm font-medium text-status-success">
            Batch Succeeded
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {combine.value.length} records processed
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-status-fail/40 bg-status-fail/5 p-4">
          <p className="text-sm font-medium text-status-fail">Batch Failed</p>
          <p className="mt-2 text-xs font-mono text-text-secondary">
            {combine.error}
          </p>
          <p className="mt-2 text-xs italic text-text-muted">
            One bad record killed the entire batch
          </p>
        </div>
      )}
    </div>
  );
}
