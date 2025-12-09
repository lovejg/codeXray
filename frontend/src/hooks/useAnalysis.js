import { useCallback, useState } from "react";
import { API_BASE } from "../config.js";

const parseResponse = async (response, defaultMessage) => {
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || defaultMessage);
  }
  return data.result;
};

const analyzeGithub = (payload) =>
  fetch(`${API_BASE}/api/analyze/github`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repoUrl: payload.repoUrl,
      options: payload.options,
      userPrompt: payload.userPrompt,
      model: payload.model,
      githubToken: payload.githubToken,
    }),
  }).then((res) => parseResponse(res, "GitHub 분석에 실패했습니다."));

const analyzeFile = (payload) => {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("options", JSON.stringify(payload.options || {}));
  formData.append("userPrompt", payload.userPrompt || "");
  formData.append("model", JSON.stringify(payload.model || {}));

  return fetch(`${API_BASE}/api/analyze/file`, {
    method: "POST",
    body: formData,
  }).then((res) => parseResponse(res, "파일 분석에 실패했습니다."));
};

const analyzeCode = (payload) =>
  fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: payload.code,
      options: payload.options,
      userPrompt: payload.userPrompt,
      model: payload.model,
    }),
  }).then((res) => parseResponse(res, "분석에 실패했습니다."));

export default function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleAnalyze = useCallback(async (payload) => {
    setLoading(true);
    setResult(null);
    setShowResult(false);

    try {
      const resultData = await (payload.repoUrl?.trim()
        ? analyzeGithub(payload)
        : payload.file
        ? analyzeFile(payload)
        : analyzeCode(payload));

      setResult(resultData);
      setShowResult(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "분석 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectHistory = useCallback((item) => {
    setResult(item.result);
    setShowResult(true);
  }, []);

  const handleReanalyze = useCallback(
    (item) => {
      handleAnalyze({
        code: item.code,
        options: item.options,
        userPrompt: item.userPrompt,
        model: item.model,
      });
    },
    [handleAnalyze]
  );

  const handleReset = useCallback(() => {
    setResult(null);
    setShowResult(false);
  }, []);

  return {
    result,
    loading,
    showResult,
    handleAnalyze,
    handleSelectHistory,
    handleReanalyze,
    handleReset,
  };
}
