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
    loadingState,
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

      {loadingState?.active && (
        <LoadingOverlay
          message={loadingState.message || "분석 중이에요"}
          subMessage={
            loadingState.subMessage || "코드를 읽고 인사이트를 준비하는 중..."
          }
          showProgressBar
          progressLabel={
            loadingState.progressLabel || "분석 파이프라인을 준비하고 있어요"
          }
        />
      )}
    </div>
  );
}

export default App;
