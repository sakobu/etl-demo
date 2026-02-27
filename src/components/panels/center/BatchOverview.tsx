import type { BatchResult, RecordTrace, StageTrace } from "../../../api/etl";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  stageStatusClasses,
  isRecoveredPartial,
} from "./stageHelpers";
import { HalfCircleIcon, CrossIcon } from "../../ui/icons";

type Props = {
  batchResult: BatchResult;
  onSelectRecord: (i: number) => void;
};

function DotIcon({
  status,
  recovered,
}: {
  status: StageTrace["status"];
  recovered?: boolean;
}) {
  const cls = stageStatusClasses(status, recovered);

  if (status === "ok") {
    return <span className={`inline-block w-2 h-2 rounded-full ${cls.bg}`} />;
  }
  if (status === "err") {
    if (recovered) {
      return <HalfCircleIcon className={`w-2 h-2 ${cls.text}`} />;
    }
    return <CrossIcon className={`w-2 h-2 ${cls.text}`} />;
  }
  // skipped
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${cls.border} opacity-40`}
    />
  );
}

function RowOutcome({ record }: { record: RecordTrace }) {
  const lastStage = [...record.stages]
    .reverse()
    .find((s) => s.status !== "skipped");
  if (!lastStage)
    return <span className="text-text-muted text-[10px]">-</span>;

  if (isRecoveredPartial(record)) {
    return (
      <span className="text-status-partial text-[10px] font-semibold">
        PARTIAL
      </span>
    );
  }

  if (lastStage.status === "err") {
    return (
      <span className="text-status-fail text-[10px] font-semibold">ERR</span>
    );
  }

  return (
    <span className="text-status-success text-[10px] font-semibold">OK</span>
  );
}

export function BatchOverview({ batchResult, onSelectRecord }: Props) {
  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_2.5rem] gap-0 mb-1 px-1">
        <span />
        {STAGE_ORDER.map((name) => (
          <p
            key={name}
            className="text-[10px] text-text-muted uppercase tracking-wider text-center"
          >
            {STAGE_LABELS[name]}
          </p>
        ))}
        <span />
      </div>

      {/* Record rows */}
      <div className="space-y-0.5">
        {batchResult.records.map((record, i) => {
          const recov = isRecoveredPartial(record);
          return (
            <button
              key={record.row}
              type="button"
              onClick={() => onSelectRecord(i)}
              className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_2.5rem] gap-0 items-center w-full h-7 px-1 rounded-sm cursor-pointer hover:bg-surface-700/30 transition-colors"
            >
              {/* Row number */}
              <span className="text-text-muted text-[10px] font-mono">
                #{record.row}
              </span>

              {/* Stage dots with connecting line */}
              {record.stages.map((stage, si) => (
                <div
                  key={stage.stage}
                  className="flex items-center justify-center relative"
                >
                  {/* Left connector line */}
                  {si > 0 && (
                    <div
                      className={`absolute right-1/2 h-px w-full ${
                        stage.status === "skipped"
                          ? "bg-surface-600/40"
                          : stage.status === "err"
                            ? recov
                              ? "bg-status-partial/30"
                              : "bg-status-fail/30"
                            : "bg-status-success/30"
                      }`}
                    />
                  )}
                  <div className="relative z-10">
                    <DotIcon
                      status={stage.status}
                      recovered={stage.status === "err" ? recov : undefined}
                    />
                  </div>
                </div>
              ))}

              {/* Outcome label */}
              <div className="text-right">
                <RowOutcome record={record} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
