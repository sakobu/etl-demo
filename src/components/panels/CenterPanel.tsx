import { useSelectedRecordIndex } from "../../store/etlStore";

export function CenterPanel() {
  const selectedIndex = useSelectedRecordIndex();

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Pipeline
      </h2>
      <p className="mt-4 text-text-muted text-sm">
        Stage visualization — Phase 5
      </p>
      <p className="mt-2 text-text-muted text-sm font-mono">
        {selectedIndex !== null
          ? `Record #${selectedIndex + 1} selected`
          : "No record selected"}
      </p>
    </div>
  );
}
