import { useState } from "react";
import type { RecordTrace, StageName } from "../../../api/etl";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  findForkIndex,
  isRecoveredPartial,
} from "./stageHelpers";
import { StageBox } from "./StageBox";
import { StageDetail } from "./StageDetail";

type Props = {
  trace: RecordTrace;
};

/** Column center percentages for a 4-column grid with gap. */
const COL_CENTERS = [12.5, 37.5, 62.5, 87.5];

export function StageLane({ trace }: Props) {
  const [expandedStage, setExpandedStage] = useState<StageName | null>(null);
  const { stages } = trace;
  const forkIdx = findForkIndex(stages);
  const recovered = isRecoveredPartial(trace);

  const toggleStage = (s: StageName) =>
    setExpandedStage((prev) => (prev === s ? null : s));

  // Build segments for the active path
  const successSegments: { from: number; to: number }[] = [];
  const errorSegments: { from: number; to: number }[] = [];

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (s.status === "ok") {
      const from = i === 0 ? 0 : COL_CENTERS[i - 1];
      const to = COL_CENTERS[i];
      successSegments.push({ from, to });
    } else if (s.status === "err") {
      const from = i === 0 ? 0 : COL_CENTERS[i - 1];
      const to = COL_CENTERS[i];
      errorSegments.push({ from, to });
    }
  }

  // Expanded stage data
  const expandedTrace = expandedStage
    ? (stages.find((s) => s.stage === expandedStage) ?? null)
    : null;

  return (
    <div>
      {/* Column headers */}
      <div className="grid grid-cols-4 gap-3 mb-2 px-1">
        {STAGE_ORDER.map((name) => (
          <p
            key={name}
            className="text-[10px] text-text-muted uppercase tracking-wider text-center"
          >
            {STAGE_LABELS[name]}
          </p>
        ))}
      </div>

      {/* Track area */}
      <div className="relative min-h-30">
        {/* Reference lines */}
        <div className="absolute top-7 left-0 right-0 h-0.5 bg-status-success/15" />
        <div className="absolute bottom-7 left-0 right-0 h-0.5 bg-status-fail/15" />

        {/* Active success path segments */}
        {successSegments.map(({ from, to }) => (
          <div
            key={`s-${from}-${to}`}
            className="absolute top-7 h-0.5 bg-status-success/60"
            style={{ left: `${from}%`, width: `${to - from}%` }}
          />
        ))}

        {/* Active error path segments */}
        {errorSegments.map(({ from, to }) => (
          <div
            key={`e-${from}-${to}`}
            className={`absolute bottom-7 h-0.5 ${recovered ? "bg-status-partial/60" : "bg-status-fail/60"}`}
            style={{ left: `${from}%`, width: `${to - from}%` }}
          />
        ))}

        {/* Fork connector — vertical gradient from success to error track */}
        {forkIdx !== null && (
          <div
            className="absolute w-0.5 z-10"
            style={{
              left: `${COL_CENTERS[forkIdx]}%`,
              top: "28px",
              bottom: "28px",
              background: `linear-gradient(to bottom, var(--color-status-success), var(--color-${recovered ? "status-partial" : "status-fail"}))`,
              opacity: 0.5,
            }}
          />
        )}

        {/* Stage boxes — positioned on success or error track */}
        <div className="relative grid grid-cols-4 gap-3 h-full min-h-30">
          {stages.map((stage) => {
            const onErrorTrack =
              stage.status === "err" || stage.status === "skipped";
            return (
              <div
                key={stage.stage}
                className={`flex flex-col ${onErrorTrack ? "justify-end" : "justify-start"}`}
              >
                <StageBox
                  stage={stage}
                  isExpanded={expandedStage === stage.stage}
                  onToggle={() => toggleStage(stage.stage)}
                  recovered={stage.status === "err" ? recovered : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded detail */}
      {expandedTrace && (
        <StageDetail
          stage={expandedTrace}
          recovered={expandedTrace.status === "err" ? recovered : undefined}
        />
      )}
    </div>
  );
}
