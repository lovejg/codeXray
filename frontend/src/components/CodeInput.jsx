import { useState } from "react";
import { motion } from "framer-motion";

export default function CodeInput({ onAnalyze }) {
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [options, setOptions] = useState({
    architecture: false,
    security: false,
    performance: false,
    testing: false,
  });

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    // 일단 깃허브부터 우선처리
    if (repoUrl.trim()) {
      onAnalyze({ repoUrl, options, userPrompt });
      return;
    }

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(options));
      formData.append("userPrompt", userPrompt);

      fetch("http://localhost:5000/api/analyze/file", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => onAnalyze({ result: data.result }))
        .catch(() => alert("파일 분석 실패"));

      return;
    }

    if (!code.trim()) {
      alert("코드를 입력하거나 파일 또는 GitHub 링크를 넣어주세요.");
      return;
    }

    onAnalyze({ code, options, userPrompt });
  };

  return (
    <motion.div
      className="panel input-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <h2>코드 / 파일 / GitHub 분석</h2>
      <button
        style={{ marginBottom: "10px" }}
        onClick={() =>
          (window.location.href = "http://localhost:5000/api/github/login")
        }
      >
        🔗 GitHub 계정 연동
      </button>

      <input
        type="text"
        placeholder="GitHub Repository URL (선택)"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        style={{ marginBottom: "10px", width: "100%", padding: "8px" }}
      />

      <textarea
        className="code-textarea"
        placeholder="분석할 코드를 붙여넣으세요"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <input
        type="file"
        accept=".js,.ts,.jsx,.tsx,.json,.txt"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <div className="option-grid">
        {[
          { key: "architecture", label: "아키텍처 분석" },
          { key: "security", label: "보안 점검" },
          { key: "performance", label: "성능 개선" },
          { key: "testing", label: "테스트 검토" },
        ].map((opt) => (
          <label key={opt.key} className="option-item">
            <input type="checkbox" onChange={() => toggleOption(opt.key)} />
            {opt.label}
          </label>
        ))}
      </div>

      <textarea
        className="prompt-textarea"
        placeholder="AI에게 추가로 요청할 내용을 입력하세요"
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
      />

      <button className="analyze-btn" onClick={handleSubmit}>
        🔍 분석 시작
      </button>

      <input
        type="file"
        accept=".js,.ts,.jsx,.tsx,.json,.txt"
        onChange={(e) => setFile(e.target.files[0])}
      />
    </motion.div>
  );
}
