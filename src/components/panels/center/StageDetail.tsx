import type { StageTrace } from "../../../api/etl";
import { formatStageError, parseValidationErrors } from "./stageHelpers";

type Props = {
  stage: StageTrace;
  recovered?: boolean;
};

export function StageDetail({ stage, recovered }: Props) {
  if (stage.status === "skipped") return null;

  if (stage.status === "ok") {
    return (
      <div className="mt-3 rounded-md bg-surface-900 border border-surface-600 p-3">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
          Output
        </p>
        <pre className="font-mono text-[10px] text-text-secondary whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
          {JSON.stringify(stage.value, null, 2)}
        </pre>
      </div>
    );
  }

  // err
  const isRecovered = stage.status === "err" && recovered;
  const parts = parseValidationErrors(stage.error);
  const errorText = formatStageError(stage.error);
  const borderCls = isRecovered ? "border-status-partial/30" : "border-status-fail/30";
  const textCls = isRecovered ? "text-status-partial/90" : "text-status-fail/90";

  return (
    <div className={`mt-3 rounded-md bg-surface-900 border ${borderCls} p-3`}>
      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
        {isRecovered ? "Recovered" : "Error"}
      </p>
      {parts.length > 1 ? (
        <ul className={`list-disc list-inside text-xs ${textCls} space-y-0.5`}>
          {parts.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : (
        <p className={`text-xs ${textCls}`}>{errorText}</p>
      )}
    </div>
  );
}
