import {
  useBatchResult,
  useSelectedRecordIndex,
  useETLActions,
} from "../../../store/etlStore";
import { ArrowLeftIcon } from "../../ui/icons";
import { StageLane } from "./StageLane";
import { BatchOverview } from "./BatchOverview";

export function CenterPanel() {
  const batchResult = useBatchResult();
  const selectedIndex = useSelectedRecordIndex();
  const { selectRecord } = useETLActions();

  // Empty state
  if (batchResult === null) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full">
        <p className="text-text-muted text-sm">
          Run the pipeline to see stage traces
        </p>
      </div>
    );
  }

  // Batch overview — no record selected
  if (selectedIndex === null) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Pipeline Overview
        </h2>
        <BatchOverview
          batchResult={batchResult}
          onSelectRecord={selectRecord}
        />
      </div>
    );
  }

  // Single record view
  const trace = batchResult.records[selectedIndex];
  if (!trace) {
    return (
      <div className="p-4">
        <p className="text-text-muted text-sm">Record not found in results</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Record #{trace.row}
        </h2>
        <button
          type="button"
          onClick={() => selectRecord(null)}
          className="text-[10px] text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="inline w-[1em] h-[1em] align-[-0.125em]" /> All records
        </button>
      </div>
      {/* key resets expandedStage state inside StageLane on record change */}
      <StageLane key={selectedIndex} trace={trace} />
    </div>
  );
}
