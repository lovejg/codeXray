import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config.js";
import LoadingOverlay from "../components/LoadingOverlay.jsx";

const getTokenFromQuery = () =>
  typeof window === "undefined"
    ? ""
    : new URLSearchParams(window.location.search).get("token") || "";

export default function Github() {
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState("");
  const [loadingState, setLoadingState] = useState({
    active: false,
    message: "",
    subMessage: "",
    progressLabel: "",
  });
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectFeedback, setDisconnectFeedback] = useState({
    type: "",
    message: "",
    nextAction: "",
  });
  const [token, setToken] = useState(() => {
    const queryToken = getTokenFromQuery();
    if (queryToken) return queryToken;
    if (typeof window !== "undefined") {
      return localStorage.getItem("githubAccessToken") || "";
    }
    return "";
  });

  const normalizedToken = useMemo(() => token.trim(), [token]);
  const loginUrl = `${API_BASE}/api/github/login`;
  const loading = loadingState.active;

  const resetDisconnectFeedback = () =>
    setDisconnectFeedback({ type: "", message: "", nextAction: "" });

  const fetchRepos = useCallback(async () => {
    if (!normalizedToken) {
      setRepos([]);
      resetDisconnectFeedback();
      return;
    }

    setLoadingState({
      active: true,
      message: "저장소 목록 불러오는 중",
      subMessage: "GitHub에서 최신 데이터를 가져오고 있어요...",
      progressLabel: "목록 동기화 중",
    });
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/github/repos`, {
        headers: { Authorization: `Bearer ${normalizedToken}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "저장소 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();
      setRepos(data);
    } catch (err) {
      setError(err.message || "저장소 목록을 불러오지 못했습니다.");
      setRepos([]);
    } finally {
      setLoadingState((prev) => ({ ...prev, active: false }));
    }
  }, [normalizedToken]);

  useEffect(() => {
    if (!normalizedToken) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("githubAccessToken", normalizedToken);
    }
    fetchRepos();
  }, [fetchRepos, normalizedToken]);

  const analyzeRepo = async (repoUrl) => {
    setLoadingState({
      active: true,
      message: "저장소 분석을 시작했어요",
      subMessage: "코드를 내려받고 분석 파이프라인을 준비 중입니다.",
      progressLabel: "분석 준비 중...",
    });
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/analyze/github`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl, githubToken: normalizedToken }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "분석 요청이 실패했습니다.");
      }

      localStorage.setItem("analysisResult", JSON.stringify(data.result || ""));
      window.location.assign("/");
    } catch (err) {
      setError(err.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoadingState((prev) => ({ ...prev, active: false }));
    }
  };

  const handleDisconnect = async () => {
    if (!normalizedToken) return;

    setDisconnecting(true);
    setError("");
    resetDisconnectFeedback();

    try {
      const response = await fetch(`${API_BASE}/api/github/integration`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${normalizedToken}` },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "연동 해제에 실패했습니다. 잠시 후 다시 시도해주세요."
        );
      }

      setToken("");
      setRepos([]);
      setDisconnectFeedback({
        type: "success",
        message: data.message || "GitHub 연동이 해제되었습니다.",
        nextAction:
          data.nextAction ||
          "홈 화면에서 '계정 연동하기' 버튼으로 다시 로그인하세요.",
      });
    } catch (err) {
      setDisconnectFeedback({
        type: "error",
        message:
          err.message ||
          "연동 해제 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setDisconnecting(false);
      setShowDisconnectModal(false);
    }
  };

  const handleTokenChange = (value) => {
    setToken(value);
    resetDisconnectFeedback();
    setError("");
    if (!value && typeof window !== "undefined") {
      localStorage.removeItem("githubAccessToken");
    }
  };

  return (
    <div className="panel" style={{ maxWidth: 720, margin: "32px auto" }}>
      <h2>내 GitHub Repository</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        GitHub OAuth로 발급받은 토큰으로 저장소 목록을 불러옵니다. 비공개
        저장소를 분석하려면 계정 연동이 필요합니다.
      </p>

      <div className="input-group">
        <label className="field-label">발급된 GitHub Access Token</label>
        <input
          type="password"
          className="text-field"
          value={token}
          onChange={(e) => handleTokenChange(e.target.value)}
          placeholder="OAuth 연동 후 자동으로 채워집니다"
        />
      </div>

      <div className="helper-inline" style={{ marginBottom: 16 }}>
        <button
          className="ghost-btn"
          type="button"
          onClick={() => (window.location.href = "/")}
        >
          홈으로 돌아가기
        </button>
        <button
          className="ghost-btn"
          type="button"
          onClick={() => (window.location.href = loginUrl)}
        >
          계정 다시 연동하기
        </button>
        <span className="muted">
          계정 연동은 홈 화면 → GitHub 연동 탭에서 시작할 수 있습니다.
        </span>
      </div>

      {normalizedToken ? (
        <div className="helper-inline" style={{ marginBottom: 12 }}>
          <button
            className="ghost-btn"
            type="button"
            onClick={fetchRepos}
            disabled={loading}
          >
            {loading ? "불러오는 중..." : "내 저장소 새로고침"}
          </button>
          <span className="muted">
            최신 목록이 보이지 않으면 새로고침을 눌러주세요.
          </span>
          <button
            className="ghost-btn danger"
            type="button"
            onClick={() => setShowDisconnectModal(true)}
            disabled={disconnecting}
          >
            {disconnecting ? "연동 해제 중..." : "연동 해제"}
          </button>
        </div>
      ) : (
        <p className="muted" style={{ color: "#b00020" }}>
          GitHub 토큰이 없습니다. 홈 화면에서 계정을 연동해주세요.
        </p>
      )}
      {disconnectFeedback.message && (
        <div
          className={`status-banner ${
            disconnectFeedback.type === "error" ? "error" : "success"
          }`}
        >
          <div>{disconnectFeedback.message}</div>
          {disconnectFeedback.nextAction && (
            <div className="muted" style={{ marginTop: 6 }}>
              {disconnectFeedback.nextAction}
              <button
                className="link-btn"
                type="button"
                onClick={() => (window.location.href = loginUrl)}
              >
                다시 연동하기
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="helper-inline" style={{ color: "#b00020" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {repos.length === 0 && !loading && normalizedToken && !error && (
          <p className="muted">불러올 저장소가 없습니다.</p>
        )}

        {repos.map((repo) => (
          <div
            key={repo.id}
            style={{
              marginBottom: "10px",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{repo.full_name}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  {repo.private ? "비공개" : "공개"} ·{" "}
                  {repo.description || "설명 없음"}
                </p>
              </div>
              <button
                onClick={() => analyzeRepo(repo.html_url)}
                disabled={loading}
              >
                🔍 분석하기
              </button>
            </div>
          </div>
        ))}
      </div>
      {showDisconnectModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 style={{ marginTop: 0 }}>GitHub 연동을 해제하시겠어요?</h3>
            <p className="muted" style={{ marginBottom: 16 }}>
              저장된 GitHub 토큰과 연결 정보를 모두 삭제합니다. 이후 저장소를
              다시 불러오려면 OAuth 로그인으로 새 토큰을 발급받아야 합니다.
            </p>
            <div className="modal-actions">
              <button
                className="ghost-btn"
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                disabled={disconnecting}
              >
                취소
              </button>
              <button
                className="danger-btn"
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? "해제 중..." : "연동 해제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingState.active && (
        <LoadingOverlay
          message={loadingState.message || "분석 중이에요"}
          subMessage={
            loadingState.subMessage || "코드를 읽고 인사이트를 준비하는 중..."
          }
          showProgressBar={Boolean(loadingState.progressLabel)}
          progressLabel={loadingState.progressLabel}
        />
      )}
    </div>
  );
}
