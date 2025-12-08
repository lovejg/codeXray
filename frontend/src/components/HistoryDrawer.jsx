import HistoryList from "./HistoryList.jsx";

export default function HistoryDrawer({
  isOpen,
  onToggleHistory,
  onSelectHistory,
  onReanalyzeHistory,
}) {
  return (
    <aside className={`history-drawer ${isOpen ? "open" : "closed"}`}>
      <button
        className="drawer-handle"
        onClick={onToggleHistory}
        aria-label={isOpen ? "히스토리 닫기" : "히스토리 열기"}
      >
        {isOpen ? "←" : "→"}
      </button>
      <div className="history-topbar">
        <div>
          <p className="eyebrow">히스토리</p>
          <h2>최근 분석</h2>
        </div>
      </div>
      <HistoryList
        onSelect={onSelectHistory}
        onReanalyze={onReanalyzeHistory}
      />
    </aside>
  );
}
