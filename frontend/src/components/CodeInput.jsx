import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const inputModes = [
  { key: "paste", label: "코드 붙여넣기" },
  { key: "file", label: "파일 업로드" },
  { key: "github", label: "GitHub 연동" },
];

const modelOptions = [
  { provider: "openai", model: "gpt-4o-mini", label: "OpenAI · GPT-4o-mini" },
  {
    provider: "gemini",
    model: "gemini-2.0-flash",
    label: "Gemini · 2.0 Flash",
  },
  {
    provider: "claude",
    model: "claude-3-5-sonnet-20240620",
    label: "Claude · 3.5 Sonnet",
  },
];

export default function CodeInput({ onAnalyze }) {
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [inputMode, setInputMode] = useState("paste");
  const [model, setModel] = useState(modelOptions[0]);
  const [options, setOptions] = useState({
    architecture: false,
    security: false,
    performance: false,
    testing: false,
    style: false,
    dependencies: false,
  });

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isDisabled = useMemo(() => {
    if (inputMode === "paste") return !code.trim();
    if (inputMode === "file") return !file;
    return !repoUrl.trim();
  }, [inputMode, repoUrl, file, code]);
  const MotionPanel = motion.div;

  const handleSubmit = () => {
    if (isDisabled) {
      alert("선택한 입력 방식에 맞춰 필요한 값을 채워주세요.");
      return;
    }

    onAnalyze({ code, file, repoUrl, options, userPrompt, model });
  };

  const renderModeContent = () => {
    switch (inputMode) {
      case "file":
        return (
          <div className="upload-area">
            <p className="muted">
              .js .ts .jsx .tsx .json .txt 파일을 업로드하면 분석이 진행됩니다.
            </p>
            <label className="upload-btn large">
              파일 선택
              <input
                type="file"
                accept=".js,.ts,.jsx,.tsx,.json,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && <p className="file-name">첨부됨: {file.name}</p>}
          </div>
        );
      case "github":
        return (
          <div className="input-group">
            <label className="field-label">GitHub Repository URL</label>
            <input
              type="text"
              className="text-field"
              placeholder="https://github.com/user/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <div className="helper-inline">
              <button
                className="ghost-btn"
                type="button"
                onClick={() =>
                  (window.location.href =
                    "http://localhost:5000/api/github/login")
                }
              >
                계정 연동하기
              </button>
              <span className="muted">
                연동 없이 공개 저장소도 URL만으로 분석할 수 있습니다.
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="input-group">
            <label className="field-label">코드 붙여넣기</label>
            <textarea
              className="code-textarea tall"
              placeholder="분석할 코드를 붙여넣으세요"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        );
    }
  };

  const handleModelChange = (event) => {
    const nextModel = modelOptions.find(
      (option) => option.provider === event.target.value
    );
    setModel(nextModel || modelOptions[0]);
  };

  return (
    <MotionPanel
      className="panel input-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">입력</p>
          <h2>분석할 코드를 준비하세요</h2>
          <p className="muted">
            필요한 입력 방식을 선택하면 영역이 전환됩니다.
          </p>
        </div>
      </div>

      <div className="input-group">
        <label className="field-label">사용할 AI 모델</label>
        <select
          className="text-field"
          value={model.provider}
          onChange={handleModelChange}
        >
          {modelOptions.map((option) => (
            <option key={option.provider} value={option.provider}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="muted">
          OpenAI, Gemini, Claude 중 원하는 엔진을 선택하세요!
        </p>
      </div>

      <div className="input-mode-tabs">
        {inputModes.map((mode) => (
          <button
            key={mode.key}
            className={`mode-tab ${inputMode === mode.key ? "active" : ""}`}
            onClick={() => setInputMode(mode.key)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="mode-surface">{renderModeContent()}</div>

      <div className="option-grid three-columns">
        {[
          { key: "architecture", label: "아키텍처 분석" },
          { key: "security", label: "보안 점검" },
          { key: "performance", label: "성능 개선" },
          { key: "testing", label: "테스트 검토" },
          { key: "style", label: "스타일/린트" },
          { key: "dependencies", label: "의존성/업데이트" },
        ].map((opt) => (
          <label key={opt.key} className="option-item">
            <input
              type="checkbox"
              checked={!!options[opt.key]}
              onChange={() => toggleOption(opt.key)}
            />
            {opt.label}
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
          {inputMode === "paste" && "붙여넣은 코드로 즉시 분석합니다."}
          {inputMode === "file" && "선택한 파일을 업로드하여 분석합니다."}
          {inputMode === "github" && "레포지토리 URL을 기반으로 분석합니다."}
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
