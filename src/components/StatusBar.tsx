import { useBatchResult } from "../store/etlStore";
import { CheckIcon, CrossIcon, HalfCircleIcon, DotSeparatorIcon } from "./ui/icons";

export function StatusBar() {
  const batchResult = useBatchResult();

  return (
    <footer className="bg-surface-800 border-t border-surface-600 px-4 py-2 flex items-center justify-between">
      {!batchResult ? (
        <span className="text-text-muted text-sm">
          Run the pipeline to see results
        </span>
      ) : (
        <>
          <div className="font-mono text-sm flex gap-2 items-center">
            <span className="text-status-success">
              <CheckIcon className="inline w-[1em] h-[1em] align-[-0.125em]" /> {batchResult.summary.succeeded}
            </span>
            <DotSeparatorIcon className="inline w-[0.25em] h-[0.25em] align-middle text-text-muted" />
            <span className="text-status-fail">
              <CrossIcon className="inline w-[1em] h-[1em] align-[-0.125em]" /> {batchResult.summary.failed}
            </span>
            <DotSeparatorIcon className="inline w-[0.25em] h-[0.25em] align-middle text-text-muted" />
            <span className="text-status-partial">
              <HalfCircleIcon className="inline w-[1em] h-[1em] align-[-0.125em]" /> {batchResult.summary.partial}
            </span>
            <DotSeparatorIcon className="inline w-[0.25em] h-[0.25em] align-middle text-text-muted" />
            <span className="text-text-secondary">
              {batchResult.summary.total} total
            </span>
          </div>

          <div className="font-mono text-sm flex gap-2 items-center">
            <span className="text-text-secondary">
              {batchResult.partition.successes.length} passed
            </span>
            <DotSeparatorIcon className="inline w-[0.25em] h-[0.25em] align-middle text-text-muted" />
            <span className="text-text-secondary">
              {batchResult.partition.failures.length} rejected
            </span>
          </div>
        </>
      )}
    </footer>
  );
}
