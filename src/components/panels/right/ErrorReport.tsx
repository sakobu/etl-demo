import { useState } from "react";
import type { ReactNode } from "react";
import { isOk } from "@railway-ts/pipelines/result";
import { formatETLError, type RecordTrace } from "../../../api/etl";
import { STAGE_LABELS } from "../center/stageHelpers";
import { CheckIcon, CrossIcon, HalfCircleIcon, DashIcon, ChevronDownIcon, ChevronRightIcon } from "../../ui/icons";

export function ErrorReport({ records }: { records: RecordTrace[] }) {
  const [open, setOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="rounded-md border border-surface-600 bg-surface-900">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-secondary cursor-pointer hover:bg-surface-800 transition-colors rounded-md"
      >
        {open ? <ChevronDownIcon className="inline w-[1em] h-[1em] align-[-0.125em] text-text-muted" /> : <ChevronRightIcon className="inline w-[1em] h-[1em] align-[-0.125em] text-text-muted" />}
        Error Report
        <span className="ml-auto text-text-muted font-mono">
          {records.length} rows
        </span>
      </button>

      {open && (
        <div className="border-t border-surface-600">
          {records.map((record) => {
            const isExpanded = expandedRow === record.row;
            const final = record.final;

            let statusIcon: ReactNode;
            let statusColor: string;
            let statusText: string;

            if (!isOk(final)) {
              statusIcon = <CrossIcon className="inline w-[1em] h-[1em] align-[-0.125em]" />;
              statusColor = "text-status-fail";
              statusText = formatETLError(final.error);
            } else if (final.value.partial) {
              statusIcon = <HalfCircleIcon className="inline w-[1em] h-[1em] align-[-0.125em]" />;
              statusColor = "text-status-partial";
              statusText = "partial";
            } else {
              statusIcon = <CheckIcon className="inline w-[1em] h-[1em] align-[-0.125em]" />;
              statusColor = "text-status-success";
              statusText = "ok";
            }

            return (
              <div key={record.row} className="border-t border-surface-700 first:border-t-0">
                {/* Row summary */}
                <button
                  onClick={() => setExpandedRow(isExpanded ? null : record.row)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-surface-800 transition-colors"
                >
                  <span className="text-text-muted font-mono w-6 text-right">
                    #{record.row}
                  </span>
                  <span className={`w-4 text-center ${statusColor}`}>
                    {statusIcon}
                  </span>
                  <span className="text-text-muted truncate flex-1 text-left font-mono">
                    {statusText}
                  </span>
                  {isExpanded ? <ChevronDownIcon className="inline w-[1em] h-[1em] align-[-0.125em] text-text-muted" /> : <ChevronRightIcon className="inline w-[1em] h-[1em] align-[-0.125em] text-text-muted" />}
                </button>

                {/* Expanded stage trace */}
                {isExpanded && (
                  <div className="px-3 pb-2 ml-12 flex flex-col gap-0.5">
                    {record.stages.map((stage) => {
                      let icon: ReactNode;
                      let color: string;
                      let detail: string;

                      if (stage.status === "ok") {
                        icon = <CheckIcon className="inline w-[1em] h-[1em] align-[-0.125em]" />;
                        color = "text-status-success";
                        detail = `${stage.durationMs.toFixed(1)}ms`;
                      } else if (stage.status === "err") {
                        icon = <CrossIcon className="inline w-[1em] h-[1em] align-[-0.125em]" />;
                        color = "text-status-fail";
                        detail = formatETLError(stage.error);
                      } else {
                        icon = <DashIcon className="inline w-[1em] h-[1em] align-[-0.125em]" />;
                        color = "text-surface-500";
                        detail = "skipped";
                      }

                      return (
                        <div
                          key={stage.stage}
                          className="flex items-baseline gap-2 text-[11px]"
                        >
                          <span className={`w-3 text-center ${color}`}>
                            {icon}
                          </span>
                          <span className="w-16 shrink-0 text-text-muted">
                            {STAGE_LABELS[stage.stage]}
                          </span>
                          <span className={`font-mono ${color} truncate`}>
                            {detail}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
