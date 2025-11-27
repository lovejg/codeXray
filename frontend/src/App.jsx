import { useState } from "react";
import { motion } from "framer-motion";
import CodeInput from "./components/CodeInput.jsx";
import ResultViewer from "./components/ResultViewer.jsx";
import LoadingOverlay from "./components/LoadingOverlay.jsx";
import HistoryList from "./components/HistoryList.jsx";
import "./App.css";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (payload) => {
    setLoading(true);
    setResult(null);
    if (payload.repoUrl) {
      const res = await fetch("http://localhost:5000/api/analyze/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(data.result);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      alert("분석 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item) => {
    setResult(item.result);
  };

  const handleReanalyze = (item) => {
    handleAnalyze({
      code: item.code,
      options: item.options,
      userPrompt: item.userPrompt,
    });
  };

  return (
    <div className="app-container">
      <motion.header
        className="header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>CodeXray</h1>
        <p>코드를 한눈에 분석하는 AI 코드 인사이트 플랫폼</p>
      </motion.header>

      <main className="main-layout">
        <CodeInput onAnalyze={handleAnalyze} />
        <ResultViewer result={result} />
      </main>

      <section style={{ marginTop: "30px" }}>
        <HistoryList
          onSelect={handleSelectHistory}
          onReanalyze={handleReanalyze}
        />
      </section>

      {loading && <LoadingOverlay />}
    </div>
  );
}

export default App;
