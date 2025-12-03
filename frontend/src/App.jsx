import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CodeInput from "./components/CodeInput.jsx";
import ResultViewer from "./components/ResultViewer.jsx";
import LoadingOverlay from "./components/LoadingOverlay.jsx";
import HistoryList from "./components/HistoryList.jsx";
import "./App.css";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const toggleHistory = () => setIsHistoryOpen((prev) => !prev);
  const MotionHeader = motion.header;

  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_BASE || "http://localhost:5000",
    []
  );

  const handleAnalyze = async (payload) => {
    setLoading(true);
    setResult(null);
    setShowResult(false);
    try {
      if (payload.repoUrl?.trim()) {
        const res = await fetch(`${API_BASE}/api/analyze/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repoUrl: payload.repoUrl,
            options: payload.options,
            userPrompt: payload.userPrompt,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.message || "GitHub 분석에 실패했습니다.");
        }
        setResult(data.result);
        setShowResult(true);
        return;
      }
      if (payload.file) {
        const formData = new FormData();
        formData.append("file", payload.file);
        formData.append("options", JSON.stringify(payload.options || {}));
        formData.append("userPrompt", payload.userPrompt || "");

        const res = await fetch(`${API_BASE}/api/analyze/file`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.message || "파일 분석에 실패했습니다.");
        }
        setResult(data.result);
        setShowResult(true);
        return;
      }

      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: payload.code,
          options: payload.options,
          userPrompt: payload.userPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "분석에 실패했습니다.");
      }
      setResult(data.result);
      setShowResult(true);
    } catch (err) {
      console.error(err);
      alert("분석 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item) => {
    setResult(item.result);
    setShowResult(true);
  };

  const handleReanalyze = (item) => {
    handleAnalyze({
      code: item.code,
      options: item.options,
      userPrompt: item.userPrompt,
    });
  };

  const handleReset = () => {
    setResult(null);
    setShowResult(false);
  };
  return (
    <div className="app-shell">
      <aside className={`history-drawer ${isHistoryOpen ? "open" : "closed"}`}>
        <button
          className="drawer-handle"
          onClick={toggleHistory}
          aria-label={isHistoryOpen ? "히스토리 닫기" : "히스토리 열기"}
        >
          {isHistoryOpen ? "←" : "→"}
        </button>
        <div className="history-topbar">
          <div>
            <p className="eyebrow">히스토리</p>
            <h2>최근 분석</h2>
          </div>
        </div>
        <HistoryList
          onSelect={handleSelectHistory}
          onReanalyze={handleReanalyze}
        />
      </aside>

      <div className="content-area">
        <MotionHeader
          className="header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>CodeXray</h1>
            <p>코드를 한눈에 분석하는 AI 코드 인사이트 플랫폼</p>
          </div>
          <button className="ghost-btn history-toggle" onClick={toggleHistory}>
            {isHistoryOpen ? "히스토리 숨기기" : "히스토리 보기"}
          </button>
        </MotionHeader>
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
