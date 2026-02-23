import { useState } from "react";
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { LeftPanel } from "./components/panels/left/LeftPanel";
import { CenterPanel } from "./components/panels/center/CenterPanel";
import { RightPanel } from "./components/panels/RightPanel";

type Tab = "left" | "center" | "right";

const TABS: { key: Tab; label: string }[] = [
  { key: "left", label: "Records" },
  { key: "center", label: "Pipeline" },
  { key: "right", label: "Summary" },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("center");

  return (
    <div className="h-screen flex flex-col bg-surface-900">
      <Header />

      {/* Mobile tab bar */}
      <div className="flex gap-1 px-4 py-2 md:hidden bg-surface-800">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-surface-600 text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main grid — 3 columns on md+, single column on mobile */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[14rem_1fr_20rem] gap-px">
        <div
          className={`overflow-y-auto bg-surface-800 ${activeTab !== "left" ? "hidden md:block" : ""}`}
        >
          <LeftPanel />
        </div>
        <div
          className={`overflow-y-auto bg-surface-800 ${activeTab !== "center" ? "hidden md:block" : ""}`}
        >
          <CenterPanel />
        </div>
        <div
          className={`overflow-y-auto bg-surface-800 ${activeTab !== "right" ? "hidden md:block" : ""}`}
        >
          <RightPanel />
        </div>
      </main>

      <StatusBar />
    </div>
  );
}

export default App;
