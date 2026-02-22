import {
  useIsProcessing,
  useResultStale,
  useBatchResult,
  useETLActions,
} from "../store/etlStore";
import { Button } from "./ui/Button";

export function Header() {
  const isProcessing = useIsProcessing();
  const resultStale = useResultStale();
  const batchResult = useBatchResult();
  const { runPipeline } = useETLActions();

  return (
    <header className="bg-surface-800 border-b border-surface-600 px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold">ETL Pipeline</h1>

      <div className="flex gap-3 items-center">
        {resultStale && (
          <span className="text-status-stale text-sm font-medium px-2 py-0.5 rounded-full bg-status-stale/10">
            Stale
          </span>
        )}

        {batchResult && (
          <span className="text-text-secondary font-mono text-sm">
            {batchResult.durationMs.toFixed(1)}ms
          </span>
        )}

        <Button
          onClick={runPipeline}
          disabled={isProcessing}
          className="rounded-full px-4 py-1.5 text-sm font-medium"
        >
          {isProcessing ? "Processing..." : "Run Pipeline"}
        </Button>
      </div>
    </header>
  );
}
