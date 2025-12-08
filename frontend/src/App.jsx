import { useState } from "react";
import CodeInput from "./components/CodeInput.jsx";
import ResultViewer from "./components/ResultViewer.jsx";
import LoadingOverlay from "./components/LoadingOverlay.jsx";
import HistoryDrawer from "./components/HistoryDrawer.jsx";
import AppHeader from "./components/AppHeader.jsx";
import useAnalysis from "./hooks/useAnalysis.js";
import "./App.css";

function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const toggleHistory = () => setIsHistoryOpen((prev) => !prev);

  const {
    result,
    loading,
    showResult,
    handleAnalyze,
    handleSelectHistory,
    handleReanalyze,
    handleReset,
  } = useAnalysis();

  return (
    <div
      className={`app-shell ${
        isHistoryOpen ? "history-open" : "history-closed"
      }`}
    >
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onToggleHistory={toggleHistory}
        onSelectHistory={handleSelectHistory}
        onReanalyzeHistory={handleReanalyze}
      />

      <div className="content-area">
        <AppHeader
          isHistoryOpen={isHistoryOpen}
          onToggleHistory={toggleHistory}
        />
        <main className="workspace">
          {!showResult ? (
            <CodeInput onAnalyze={handleAnalyze} />
          ) : (
            <ResultViewer result={result} onReset={handleReset} />
          )}
        </main>
      </div>

      {!isHistoryOpen && (
        <button
          className="history-fab"
          onClick={toggleHistory}
          aria-label="히스토리 열기"
        >
          📜 히스토리
        </button>
      )}

      {loading && <LoadingOverlay />}
    </div>
  );
}

export default App;
