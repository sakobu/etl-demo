import { useBatchResult } from "../../store/etlStore";

export function RightPanel() {
  const batchResult = useBatchResult();

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Batch Results
      </h2>
      <p className="mt-4 text-text-muted text-sm">
        Batch semantics — Phase 6
      </p>
      <p className="mt-2 text-text-muted text-sm font-mono">
        {batchResult ? "Results available" : "No results yet"}
      </p>
    </div>
  );
}
