import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [loadingState, setLoadingState] = useState({
    active: false,
    message: "",
    subMessage: "",
    progressLabel: "",
  });
  const [showResult, setShowResult] = useState(false);
  const loading = useMemo(() => loadingState.active, [loadingState.active]);

  const handleAnalyze = useCallback(async (payload) => {
    const isGithub = Boolean(payload.repoUrl?.trim());
    const isFile = Boolean(payload.file);

    setLoadingState({
      active: true,
      message: isGithub
        ? "GitHub 저장소 분석 준비 중"
        : isFile
        ? "파일을 업로드하고 있어요"
        : "코드 분석을 시작했어요",
      subMessage: isGithub
        ? "레포지토리 코드를 내려받고 분석 파이프라인을 준비합니다."
        : isFile
        ? "파일 전송과 분석 파이프라인을 초기화하는 중입니다."
        : "붙여넣은 코드를 정리하고 모델을 호출하는 중입니다.",
      progressLabel: isGithub
        ? "레포지토리 동기화 중"
        : isFile
        ? "파일 업로드 및 전처리 중"
        : "모델 요청 준비 중",
    });
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
      setLoadingState((prev) => ({ ...prev, active: false }));
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

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("analysisResult")
        : null;
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setResult(parsed || "");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to parse stored analysis result", err);
    } finally {
      window.localStorage.removeItem("analysisResult");
    }
  }, []);

  return {
    result,
    loading,
    loadingState,
    showResult,
    handleAnalyze,
    handleSelectHistory,
    handleReanalyze,
    handleReset,
  };
}
