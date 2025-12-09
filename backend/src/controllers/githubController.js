import axios from "axios";
import {
  buildAuditContext,
  clearGithubSessionCache,
  isGithubTokenRevoked,
  markGithubTokenUsed,
  rememberGithubToken,
  revokeGithubToken,
} from "../services/githubIntegrationService.js";

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";

export const startGithubLogin = (req, res) => {
  const authorizeUrl = new URL(GITHUB_AUTH_URL);
  authorizeUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("scope", "repo read:user");

  return res.redirect(authorizeUrl.toString());
};

export const githubCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res
      .status(400)
      .json({ message: "GitHub에서 반환된 코드가 없습니다." });
  }

  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;

    if (!accessToken) {
      return res
        .status(500)
        .json({ message: "GitHub 액세스 토큰을 발급받지 못했습니다." });
    }

    rememberGithubToken(accessToken, {
      ...buildAuditContext(req),
      reason: "oauth_callback",
    });

    const redirectUrl = `${FRONTEND_BASE_URL}/github?token=${accessToken}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    const errorMessage =
      error.response?.data?.error_description ||
      error.message ||
      "GitHub OAuth 처리 중 오류가 발생했습니다.";
    return res
      .status(500)
      .json({ message: `GitHub 토큰 교환에 실패했습니다: ${errorMessage}` });
  }
};

export const getRepos = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "유효한 GitHub 토큰이 필요합니다." });
  }

  const token = authHeader.split(" ")[1];

  if (isGithubTokenRevoked(token)) {
    return res.status(401).json({
      message:
        "해당 GitHub 토큰의 연동이 해제되었습니다. 다시 로그인 후 시도해주세요.",
    });
  }

  markGithubTokenUsed(token, {
    ...buildAuditContext(req),
    reason: "list_repos",
  });

  try {
    const repoRes = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, sort: "updated" },
    });

    return res.json(repoRes.data);
  } catch (error) {
    const providerMessage = error.response?.data?.message;
    const status = error.response?.status;
    const hint =
      status === 401 || status === 403
        ? "GitHub 토큰이 만료되었거나 권한이 부족합니다. 다시 로그인해주세요."
        : "GitHub 저장소 목록을 불러오는 중 오류가 발생했습니다.";

    return res.status(status || 500).json({
      message: providerMessage ? `${hint} (${providerMessage})` : hint,
    });
  }
};

export const deleteGithubIntegration = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : "";

  if (!token) {
    return res
      .status(400)
      .json({ message: "삭제할 GitHub 토큰을 함께 보내주세요." });
  }

  try {
    revokeGithubToken(token, {
      ...buildAuditContext(req),
      reason: "user_disconnect",
    });
    clearGithubSessionCache(token);

    return res.json({
      message: "GitHub 연동이 안전하게 해제되었습니다.",
      nextAction:
        "다시 사용하려면 홈 화면에서 '계정 연동하기' 버튼으로 재로그인하세요.",
    });
  } catch (error) {
    console.error(
      `[GitHub:DISCONNECT] ${error.response?.status || "ERROR"} - ${
        error.message
      }`
    );

    return res.status(500).json({
      message: "연동 해제 중 오류가 발생했습니다.",
      detail:
        error.response?.data?.message ||
        error.message ||
        "GitHub 통신 과정에서 문제가 발생했습니다.",
    });
  }
};
