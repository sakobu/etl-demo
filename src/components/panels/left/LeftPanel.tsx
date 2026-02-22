import {
  useRawRecords,
  useSelectedRecordIndex,
  useETLActions,
} from "../../../store/etlStore";
import { Button } from "../../ui/Button";
import { RecordList } from "./RecordList";
import { RecordEditor } from "./RecordEditor";

export function LeftPanel() {
  const rawRecords = useRawRecords();
  const selectedIndex = useSelectedRecordIndex();
  const { addRecord, removeRecord, selectRecord } = useETLActions();

  const handleAdd = () => {
    addRecord({
      row: rawRecords.length + 1,
      data: {
        id: "",
        customerEmail: "",
        amount: 0,
        currency: "USD",
        date: new Date(),
      },
    });
    selectRecord(rawRecords.length);
  };

  const handleDelete = () => {
    if (selectedIndex !== null) {
      removeRecord(selectedIndex);
    }
  };

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Records
        </h2>
        <span className="text-text-muted text-[10px] font-mono">
          {rawRecords.length} total
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          type="button"
          onClick={handleAdd}
          className="text-[10px] px-2 py-1 rounded-sm"
        >
          + Add
        </Button>
        <Button
          variant="secondary"
          type="button"
          onClick={handleDelete}
          disabled={selectedIndex === null}
          className="text-[10px] px-2 py-1 rounded-sm"
        >
          Del
        </Button>
      </div>

      <RecordList />

      {selectedIndex !== null && (
        <RecordEditor key={selectedIndex} index={selectedIndex} />
      )}
    </div>
  );
}
