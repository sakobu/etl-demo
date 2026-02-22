import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  type RawRecord,
  type BatchResult,
  runBatch,
  DEFAULT_RECORDS,
} from "../api/etl";

// ── Helpers ────────────────────────────────────────────────────────
const reindex = (records: RawRecord[]): RawRecord[] =>
  records.map((r, i) => ({ ...r, row: i + 1 }));

// ── Types ──────────────────────────────────────────────────────────
type ETLState = {
  rawRecords: RawRecord[];
  batchResult: BatchResult | null;
  selectedRecordIndex: number | null;
  isProcessing: boolean;
  resultStale: boolean;
};

type ETLActions = {
  setRecords: (records: RawRecord[]) => void;
  addRecord: (record: RawRecord) => void;
  updateRecord: (index: number, data: Record<string, unknown>) => void;
  removeRecord: (index: number) => void;
  runPipeline: () => Promise<void>;
  selectRecord: (index: number | null) => void;
};

export type ETLStore = ETLState & { actions: ETLActions };

// ── Store (private) ────────────────────────────────────────────────
const useETLStore = create<ETLStore>()(
  devtools(
    (set, get) => ({
      rawRecords: [...DEFAULT_RECORDS],
      batchResult: null,
      selectedRecordIndex: null,
      isProcessing: false,
      resultStale: false,

      actions: {
        setRecords: (records) =>
          set(
            (s) => ({
              rawRecords: reindex(records),
              resultStale: s.batchResult !== null,
            }),
            false,
            "setRecords",
          ),

        addRecord: (record) =>
          set(
            (s) => ({
              rawRecords: reindex([...s.rawRecords, record]),
              resultStale: s.batchResult !== null,
            }),
            false,
            "addRecord",
          ),

        updateRecord: (index, data) =>
          set(
            (s) => ({
              rawRecords: s.rawRecords.map((r, i) =>
                i === index ? { ...r, data } : r,
              ),
              resultStale: s.batchResult !== null,
            }),
            false,
            "updateRecord",
          ),

        removeRecord: (index) =>
          set(
            (s) => {
              const rawRecords = reindex(
                s.rawRecords.filter((_, i) => i !== index),
              );
              let selectedRecordIndex = s.selectedRecordIndex;
              if (selectedRecordIndex !== null) {
                if (selectedRecordIndex === index) selectedRecordIndex = null;
                else if (selectedRecordIndex > index) selectedRecordIndex--;
              }
              return {
                rawRecords,
                selectedRecordIndex,
                resultStale: s.batchResult !== null,
              };
            },
            false,
            "removeRecord",
          ),

        runPipeline: async () => {
          set({ isProcessing: true }, false, "runPipeline/start");
          const batchResult = await runBatch(get().rawRecords);
          set(
            { batchResult, isProcessing: false, resultStale: false },
            false,
            "runPipeline/complete",
          );
        },

        selectRecord: (index) =>
          set({ selectedRecordIndex: index }, false, "selectRecord"),
      },
    }),
    { name: "etl-store" },
  ),
);

// ── Public API — atomic selector hooks ─────────────────────────────
export const useRawRecords = () => useETLStore((s) => s.rawRecords);
export const useBatchResult = () => useETLStore((s) => s.batchResult);
export const useIsProcessing = () => useETLStore((s) => s.isProcessing);
export const useResultStale = () => useETLStore((s) => s.resultStale);
export const useSelectedRecordIndex = () =>
  useETLStore((s) => s.selectedRecordIndex);
export const useETLActions = () => useETLStore((s) => s.actions);
