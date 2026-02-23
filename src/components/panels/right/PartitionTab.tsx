import type { ProcessedTransaction } from "../../../api/etl";
import { TransactionCard } from "./TransactionCard";

type Props = {
  partition: { successes: ProcessedTransaction[]; failures: string[] };
};

export function PartitionTab({ partition }: Props) {
  const { successes, failures } = partition;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
        Keep both sides &middot; ETL-friendly
      </p>

      {/* Successes */}
      <section>
        <h4 className="text-xs font-semibold text-status-success mb-2">
          Successes ({successes.length})
        </h4>
        {successes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {successes.map((tx, i) => (
              <TransactionCard key={i} transaction={tx} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted italic">No successes</p>
        )}
      </section>

      {/* Failures */}
      <section>
        <h4 className="text-xs font-semibold text-status-fail mb-2">
          Failures ({failures.length})
        </h4>
        {failures.length > 0 ? (
          <div className="flex flex-col gap-2">
            {failures.map((error, i) => (
              <div
                key={i}
                className="rounded-md bg-surface-900 border border-status-fail/40 p-3 border-l-[3px] border-l-status-fail"
              >
                <p className="text-xs font-mono text-text-secondary">{error}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted italic">No failures</p>
        )}
      </section>

      {/* Educational callout */}
      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2">
        <p className="text-xs text-text-secondary">
          <span className="text-accent font-medium">&rarr;</span> Partial
          success is useful &mdash; good records are saved while bad ones are
          quarantined for review.
        </p>
      </div>
    </div>
  );
}
