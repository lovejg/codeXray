import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const optionPresets = [
  { key: "architecture", label: "아키텍처 분석" },
  { key: "security", label: "보안 점검" },
  { key: "performance", label: "성능 개선" },
  { key: "testing", label: "테스트 검토" },
];

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

  const isDisabled = useMemo(
    () => !repoUrl.trim() && !file && !code.trim(),
    [repoUrl, file, code]
  );
  const MotionPanel = motion.div;

  const handleSubmit = () => {
    if (isDisabled) {
      alert("코드, 파일, 또는 GitHub 링크 중 하나를 입력해주세요.");
      return;
    }

    onAnalyze({ code, file, repoUrl, options, userPrompt });
  };

  return (
    <MotionPanel
      className="panel input-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">입력</p>
          <h2>코드 / 파일 / GitHub 분석</h2>
          <p className="muted">
            한 번의 클릭으로 원하는 분석 방식을 선택하세요.
          </p>
        </div>
        <button
          className="ghost-btn"
          onClick={() =>
            (window.location.href = "http://localhost:5000/api/github/login")
          }
        >
          🔗 GitHub 계정 연동
        </button>
      </div>

      <div className="input-group">
        <label className="field-label">GitHub Repository URL (선택)</label>
        <input
          type="text"
          className="text-field"
          placeholder="https://github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
      </div>

      <div className="input-grid">
        <div>
          <label className="field-label">코드 붙여넣기</label>
          <textarea
            className="code-textarea"
            placeholder="분석할 코드를 붙여넣으세요"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div className="upload-card">
          <label className="field-label">파일 업로드</label>
          <div className="upload-box">
            <p className="muted">.js .ts .jsx .tsx .json .txt 파일 지원</p>
            <label className="upload-btn">
              📁 파일 선택
              <input
                type="file"
                accept=".js,.ts,.jsx,.tsx,.json,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && <p className="file-name">첨부됨: {file.name}</p>}
          </div>
        </div>
      </div>

      <div className="option-grid">
        {optionPresets.map((opt) => (
          <label key={opt.key} className="option-item">
            <input
              type="checkbox"
              checked={options[opt.key]}
              onChange={() => toggleOption(opt.key)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      <div className="input-group">
        <label className="field-label">AI에게 추가 요청</label>
        <textarea
          className="prompt-textarea"
          placeholder="예) 코드 복잡도 완화 아이디어를 알려줘"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
        />
      </div>

      <div className="action-row">
        <div className="helper-text">
          <span className="dot" />
          붙여넣기, 파일 업로드, GitHub 주소 중 하나만 입력해도 됩니다.
        </div>
        <button
          className="analyze-btn"
          onClick={handleSubmit}
          disabled={isDisabled}
        >
          🔍 분석 시작
        </button>
      </div>
    </MotionPanel>
  );
}
