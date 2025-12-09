import axios from "axios";
import Admzip from "adm-zip";

const SUPPORTED_EXTENSIONS =
  /(\.m?(j|t)sx?$|\.json$|\.md$|\.ya?ml$|\.yml$|\.py$|\.rb$|\.php$|\.java$|\.kt$|\.go$|\.rs$|\.cs$|\.cpp$|\.c$|\.h$|\.swift$|\.scala$|\.dart$|\.html$|\.css$|\.scss$|\.less$|\.vue$|\.svelte$)/i;

const IGNORED_FOLDERS = [
  "/node_modules/",
  "/.git/",
  "/dist/",
  "/build/",
  "/coverage/",
  "/.next/",
  "/out/",
  "/vendor/",
];

const MAX_FILE_SIZE = 300 * 1024; // 300KB per file to avoid huge prompts

function normalizeGithubUrl(repoUrl) {
  if (!repoUrl || typeof repoUrl !== "string") {
    throw new Error("유효한 GitHub URL을 입력해주세요.");
  }

  const trimmed = repoUrl.trim().replace(/\.git$/, "");
  const match = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:\/)?(?:#.*)?$/i
  );

  if (!match) {
    throw new Error("GitHub 리포지토리 URL 형식이 올바르지 않습니다.");
  }

  const [, owner, repo] = match;
  return { owner, repo };
}

function shouldSkip(entryName) {
  return IGNORED_FOLDERS.some((folder) => entryName.includes(folder));
}

export async function fetchGithubRepo(repoUrl, githubToken) {
  const { owner, repo } = normalizeGithubUrl(repoUrl);
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;

  try {
    const response = await axios.get(apiUrl, {
      responseType: "arraybuffer",
      headers: githubToken
        ? { Authorization: `Bearer ${githubToken}` }
        : undefined,
      maxContentLength: 50 * 1024 * 1024, // 50MB safety net
      maxBodyLength: 50 * 1024 * 1024,
    });

    const zip = new Admzip(response.data);
    let combinedCode = "";

    zip.getEntries().forEach((entry) => {
      if (entry.isDirectory) return;
      if (shouldSkip(entry.entryName)) return;
      if (!SUPPORTED_EXTENSIONS.test(entry.entryName)) return;
      const data = entry.getData();
      if (!data || data.length > MAX_FILE_SIZE) return;

      combinedCode += `
// FILE: ${entry.entryName}
`;
      combinedCode += data.toString("utf8") + "\n";
    });

    if (!combinedCode) {
      throw new Error(
        "선택한 리포지토리에서 지원되는 코드 파일을 찾을 수 없습니다."
      );
    }

    return combinedCode;
  } catch (error) {
    const status = error.response?.status;
    const providerMessage = error.response?.data?.message;
    const hint =
      status === 404
        ? "리포지토리 또는 브랜치를 찾을 수 없습니다. URL을 다시 확인해주세요."
        : status === 401 || status === 403
        ? "비공개 저장소라면 GitHub 토큰을 함께 전달해주세요."
        : "GitHub 저장소를 가져오는 중 오류가 발생했습니다.";

    const message = providerMessage
      ? `${hint} (GitHub 응답: ${providerMessage})`
      : hint;
    throw new Error(message);
  }
}
