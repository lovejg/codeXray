import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config.js";

const getTokenFromQuery = () =>
  typeof window === "undefined"
    ? ""
    : new URLSearchParams(window.location.search).get("token") || "";

export default function Github() {
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(() => {
    const queryToken = getTokenFromQuery();
    if (queryToken) return queryToken;
    if (typeof window !== "undefined") {
      return localStorage.getItem("githubAccessToken") || "";
    }
    return "";
  });

  const normalizedToken = useMemo(() => token.trim(), [token]);

  const fetchRepos = useCallback(async () => {
    if (!normalizedToken) return;

    setLoading(true);
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
      setLoading(false);
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
    setLoading(true);
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

      localStorage.setItem("analysisResult", data.result);
      window.location.assign("/");
    } catch (err) {
      setError(err.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenChange = (value) => {
    setToken(value);
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
        </div>
      ) : (
        <p className="muted" style={{ color: "#b00020" }}>
          GitHub 토큰이 없습니다. 홈 화면에서 계정을 연동해주세요.
        </p>
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
    </div>
  );
}
