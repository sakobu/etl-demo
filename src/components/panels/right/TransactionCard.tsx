import type { ProcessedTransaction } from "../../../api/etl";

export function TransactionCard({ transaction: tx }: { transaction: ProcessedTransaction }) {
  if (tx.partial) {
    return (
      <div className="rounded-md bg-surface-900 border border-surface-600 p-3 border-l-[3px] border-l-status-partial">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-mono text-text-secondary">{tx.id}</span>
          <span className="text-[10px] font-medium text-status-partial uppercase tracking-wide">
            &#9684; partial
          </span>
        </div>
        <p className="mt-1 text-xs text-text-muted">{tx.message}</p>
        <p className="mt-0.5 text-xs text-status-fail font-mono">{tx.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-surface-900 border border-surface-600 p-3 border-l-[3px] border-l-status-success">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-mono text-text-secondary">{tx.id}</span>
        <span className="text-xs font-mono text-status-success">
          ${tx.amountUSD.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-xs text-text-muted">{tx.customerName}</span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-surface-700 text-text-secondary uppercase">
          {tx.tier}
        </span>
      </div>
    </div>
  );
}
