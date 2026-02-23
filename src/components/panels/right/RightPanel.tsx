import { useState } from "react";
import { useBatchResult } from "../../../store/etlStore";
import { CombineTab } from "./CombineTab";
import { CombineAllTab } from "./CombineAllTab";
import { PartitionTab } from "./PartitionTab";
import { ErrorReport } from "./ErrorReport";

type Tab = "combine" | "combineAll" | "partition";

const TABS: { key: Tab; label: string }[] = [
  { key: "partition", label: "partition" },
  { key: "combine", label: "combine" },
  { key: "combineAll", label: "combineAll" },
];

export function RightPanel() {
  const batchResult = useBatchResult();
  const [activeTab, setActiveTab] = useState<Tab>("partition");

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Batch Results
      </h2>

      {!batchResult ? (
        <p className="text-text-muted text-xs py-4 text-center">
          Run the pipeline to see batch semantics
        </p>
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex gap-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === key
                    ? "bg-surface-600 text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Active tab */}
          {activeTab === "partition" && (
            <PartitionTab partition={batchResult.partition} />
          )}
          {activeTab === "combine" && (
            <CombineTab combine={batchResult.combine} />
          )}
          {activeTab === "combineAll" && (
            <CombineAllTab combineAll={batchResult.combineAll} />
          )}

          {/* Error report */}
          <ErrorReport records={batchResult.records} />
        </>
      )}
    </div>
  );
}
