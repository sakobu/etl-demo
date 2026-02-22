import { useBatchResult } from "../store/etlStore";

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
              ✓ {batchResult.summary.succeeded}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-status-fail">
              ✗ {batchResult.summary.failed}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-status-partial">
              ◐ {batchResult.summary.partial}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-text-secondary">
              {batchResult.summary.total} total
            </span>
          </div>

          <div className="font-mono text-sm flex gap-2 items-center">
            <span className="text-text-secondary">
              {batchResult.partition.successes.length} passed
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-text-secondary">
              {batchResult.partition.failures.length} rejected
            </span>
          </div>
        </>
      )}
    </footer>
  );
}
