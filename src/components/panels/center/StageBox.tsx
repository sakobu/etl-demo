import type { StageTrace } from "../../../api/etl";
import { STAGE_LABELS } from "./stageHelpers";
import { CheckIcon, HalfCircleIcon, CrossIcon } from "../../ui/icons";

type Props = {
  stage: StageTrace;
  isExpanded: boolean;
  onToggle: () => void;
  recovered?: boolean;
};

export function StageBox({ stage, isExpanded, onToggle, recovered }: Props) {
  const label = STAGE_LABELS[stage.stage];

  if (stage.status === "skipped") {
    return (
      <div className="rounded-md border-2 border-surface-600 opacity-40 px-3 py-2 text-xs bg-surface-900">
        <p className="font-semibold text-text-muted">{label}</p>
        <p className="text-text-muted mt-0.5">Skipped</p>
      </div>
    );
  }

  const isOk = stage.status === "ok";
  const isRecovered = stage.status === "err" && recovered;
  const borderColor = isOk
    ? "border-status-success"
    : isRecovered
      ? "border-status-partial"
      : "border-status-fail";
  const ring = isExpanded ? "ring-1 ring-accent" : "";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-md border-2 ${borderColor} ${ring} px-3 py-2 text-xs bg-surface-900 transition-colors text-left w-full cursor-pointer`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-text-primary flex items-center gap-1.5">
          {isOk ? (
            <CheckIcon className="inline w-[1em] h-[1em] align-[-0.125em] text-status-success" />
          ) : isRecovered ? (
            <HalfCircleIcon className="inline w-[1em] h-[1em] align-[-0.125em] text-status-partial" />
          ) : (
            <CrossIcon className="inline w-[1em] h-[1em] align-[-0.125em] text-status-fail" />
          )}
          {label}
        </span>
        <span className="text-text-muted font-mono text-[10px]">
          {stage.durationMs.toFixed(1)}ms
        </span>
      </div>
      {!isOk && (
        <p className={`${isRecovered ? "text-status-partial/80" : "text-status-fail/80"} mt-1 truncate`}>{stage.error}</p>
      )}
    </button>
  );
}
