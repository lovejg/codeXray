const activeGithubTokens = new Map();
const revokedGithubTokens = new Map();

function maskToken(token = "") {
  if (!token) return "[no-token]";
  if (token.length <= 8) return `${token.slice(0, 2)}***${token.slice(-2)}`;
  return `${token.slice(0, 4)}***${token.slice(-4)}`;
}

function auditLog(action, token, metadata = {}) {
  const timestamp = new Date().toISOString();
  const parts = [`[GitHub:${action}]`, timestamp, `token=${maskToken(token)}`];

  if (metadata.ip) parts.push(`ip=${metadata.ip}`);
  if (metadata.userAgent) parts.push(`ua=${metadata.userAgent}`);
  if (metadata.reason) parts.push(`reason=${metadata.reason}`);

  console.info(parts.join(" "));
}

export function rememberGithubToken(token, metadata = {}) {
  if (!token) return;
  activeGithubTokens.set(token, {
    createdAt: new Date().toISOString(),
    ...metadata,
  });
  auditLog("TOKEN_STORED", token, metadata);
}

export function markGithubTokenUsed(token, metadata = {}) {
  if (!token) return;
  const existing = activeGithubTokens.get(token) || {};
  activeGithubTokens.set(token, {
    ...existing,
    lastUsedAt: new Date().toISOString(),
    ...metadata,
  });
}

export function revokeGithubToken(token, metadata = {}) {
  if (!token) {
    throw new Error("토큰이 제공되지 않았습니다.");
  }

  activeGithubTokens.delete(token);
  revokedGithubTokens.set(token, {
    revokedAt: new Date().toISOString(),
    ...metadata,
  });
  auditLog("TOKEN_REVOKED", token, metadata);
  return { revoked: true };
}

export function isGithubTokenRevoked(token) {
  return revokedGithubTokens.has(token);
}

export function clearGithubSessionCache(token) {
  activeGithubTokens.delete(token);
}

export function buildAuditContext(req) {
  return {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  };
}
