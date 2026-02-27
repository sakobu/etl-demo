import type { RecordTrace, StageName, StageTrace } from "../../../api/etl";
import { isOk } from "@railway-ts/pipelines/result";

export const STAGE_ORDER: StageName[] = [
  "validate",
  "normalize",
  "businessRules",
  "enrich",
];

export const STAGE_LABELS: Record<StageName, string> = {
  validate: "Validate",
  normalize: "Normalize",
  businessRules: "Biz Rules",
  enrich: "Enrich",
};

/** Index of the first stage with status "err", or null if all ok/skipped. */
export function findForkIndex(stages: StageTrace[]): number | null {
  const idx = stages.findIndex((s) => s.status === "err");
  return idx === -1 ? null : idx;
}

/** Split "field: msg; field: msg" into individual items. */
export function parseValidationErrors(error: string): string[] {
  return error.split("; ").filter(Boolean);
}

/** True when a stage errored but the pipeline recovered into a partial result. */
export function isRecoveredPartial(trace: RecordTrace): boolean {
  return isOk(trace.final) && trace.final.value.partial === true;
}

type StageClasses = {
  bg: string;
  text: string;
  border: string;
};

/** Full Tailwind class names for a stage status. */
export function stageStatusClasses(
  status: StageTrace["status"],
  recovered?: boolean,
): StageClasses {
  switch (status) {
    case "ok":
      return {
        bg: "bg-status-success",
        text: "text-status-success",
        border: "border-status-success",
      };
    case "err":
      if (recovered) {
        return {
          bg: "bg-status-partial",
          text: "text-status-partial",
          border: "border-status-partial",
        };
      }
      return {
        bg: "bg-status-fail",
        text: "text-status-fail",
        border: "border-status-fail",
      };
    case "skipped":
      return {
        bg: "bg-surface-600",
        text: "text-surface-600",
        border: "border-surface-600",
      };
  }
}
