import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { API_BASE } from "../config";

const inputModes = [
  { key: "paste", label: "코드 붙여넣기" },
  { key: "file", label: "파일 업로드" },
  { key: "github", label: "GitHub 연동" },
];

const defaultProvider = "openai";
const defaultModel = import.meta.env.VITE_OPENAI_MODEL;

const modelOptions = [
  {
    provider: "openai",
    model: import.meta.env.VITE_OPENAI_MODEL,
    label: `OpenAI · ${import.meta.env.VITE_OPENAI_MODEL}`,
  },
  {
    provider: "gemini",
    model: import.meta.env.VITE_GEMINI_MODEL,
    label: `Gemini · ${import.meta.env.VITE_GEMINI_MODEL}`,
  },
  {
    provider: "claude",
    model: import.meta.env.VITE_CLAUDE_MODEL,
    label: `Claude · ${import.meta.env.VITE_CLAUDE_MODEL}`,
  },
];

export default function CodeInput({ onAnalyze }) {
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState(() => {
    if (typeof window === "undefined") return "";
    const fromQuery = new URLSearchParams(window.location.search).get("token");
    if (fromQuery) return fromQuery;
    return localStorage.getItem("githubAccessToken") || "";
  });
  const [userPrompt, setUserPrompt] = useState("");
  const [inputMode, setInputMode] = useState("paste");
  const initialModel =
    modelOptions.find((m) => m.provider === defaultProvider) || modelOptions[0];
  if (initialModel && defaultModel) initialModel.model = defaultModel;
  const [model, setModel] = useState(initialModel);
  const [options, setOptions] = useState({
    architecture: false,
    security: false,
    performance: false,
    testing: false,
    style: false,
    dependencies: false,
  });
  const [repoOptions, setRepoOptions] = useState([]);
  const [repoError, setRepoError] = useState("");
  const [repoLoading, setRepoLoading] = useState(false);

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isDisabled = useMemo(() => {
    if (inputMode === "paste") return !code.trim();
    if (inputMode === "file") return !file;
    return !repoUrl.trim();
  }, [inputMode, repoUrl, file, code]);
  const MotionPanel = motion.div;

  const normalizedGithubToken = useMemo(
    () => githubToken.trim(),
    [githubToken]
  );

  useEffect(() => {
    if (!normalizedGithubToken) {
      setRepoOptions([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("githubAccessToken");
      }
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("githubAccessToken", normalizedGithubToken);
    }

    const fetchRepos = async () => {
      setRepoLoading(true);
      setRepoError("");

      try {
        const response = await fetch(`${API_BASE}/api/github/repos`, {
          headers: { Authorization: `Bearer ${normalizedGithubToken}` },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "저장소 목록을 불러오지 못했습니다.");
        }

        const data = await response.json();
        setRepoOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setRepoOptions([]);
        setRepoError(err.message || "저장소 목록을 불러오지 못했습니다.");
      } finally {
        setRepoLoading(false);
      }
    };

    fetchRepos();
  }, [normalizedGithubToken]);

  const handleSubmit = () => {
    if (isDisabled) {
      alert("선택한 입력 방식에 맞춰 필요한 값을 채워주세요.");
      return;
    }

    onAnalyze({
      code,
      file,
      repoUrl,
      options,
      userPrompt,
      model,
      githubToken: normalizedGithubToken || undefined,
    });
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
            {repoOptions.length > 0 && (
              <div className="input-group" style={{ marginTop: "12px" }}>
                <label className="field-label">내 저장소 선택</label>
                <select
                  className="text-field"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                >
                  <option value="">저장소를 선택하세요</option>
                  {repoOptions.map((repo) => (
                    <option key={repo.id} value={repo.html_url}>
                      {repo.full_name}
                    </option>
                  ))}
                </select>
                <p className="muted">
                  GitHub 계정으로 연동된 저장소를 바로 선택할 수 있습니다.
                </p>
              </div>
            )}
            <label className="field-label" style={{ marginTop: "12px" }}>
              GitHub Access Token (옵션)
            </label>
            <input
              type="password"
              className="text-field"
              placeholder="비공개 저장소면 토큰을 입력하세요"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
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
              {repoLoading && (
                <span className="muted"> · 저장소 불러오는 중...</span>
              )}
              {repoError && (
                <span className="muted" style={{ color: "#b00020" }}>
                  · {repoError}
                </span>
              )}
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
