import { useCallback, useEffect, useMemo, useState } from "react";

const extractKeywords = (text) => {
  const tokens =
    text
      ?.toLowerCase()
      .match(/[a-zA-Z가-힣#_]+/g)
      ?.filter((word) => word.length > 2) || [];

  const counts = tokens.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 5);
};

const buildHeadline = (item) => {
  const promptHeadline = item.userPrompt?.trim();
  if (promptHeadline) {
    return promptHeadline.length > 80
      ? `${promptHeadline.slice(0, 80)}…`
      : promptHeadline;
  }

  const firstLine = item.code
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) return "코드 내용이 없습니다.";

  return firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine;
};

export default function HistoryList({ onSelect, onReanalyze }) {
  const [history, setHistory] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_BASE || "http://localhost:5000",
    []
  );

  const loadHistory = useCallback(
    async (signal) => {
      try {
        const response = await fetch(`${API_BASE}/api/history`, { signal });
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("히스토리를 불러오지 못했습니다.", error);
      }
    },
    [API_BASE]
  );

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId;

    const tick = async () => {
      await loadHistory(controller.signal);
      timeoutId = window.setTimeout(tick, 1000);
    };

    tick();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [loadHistory]);

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/api/history/${id}`, {
      method: "DELETE",
    });
    loadHistory();
  };

  const handlePreview = (item) => {
    if (!item?.code) return;
    setPreviewItem(item);
  };

  return (
    <div className="panel history-panel">
      <div className="history-list-header">
        <div>
          <p className="muted">최근 분석 기록</p>
          <h3>이전 결과를 다시 확인하세요</h3>
        </div>
      </div>
      {history.length === 0 && (
        <div className="empty-state">
          <p className="muted">아직 저장된 분석 기록이 없습니다.</p>
        </div>
      )}

      <div className="history-list">
        {history.map((item) => {
          const keywords = extractKeywords(item.code || item.userPrompt || "");
          const headline = buildHeadline(item);

          return (
            <div key={item._id} className="history-item">
              <div className="history-body">
                <div className="history-date">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
                <div className="history-headline">{headline}</div>
                {keywords.length > 0 && (
                  <div className="history-keywords">
                    {keywords.map((word) => (
                      <span key={word} className="keyword-pill">
                        {word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="history-actions">
                <button
                  onClick={() => handlePreview(item)}
                  disabled={!item.code}
                  className={!item.code ? "muted" : ""}
                >
                  코드 보기
                </button>
                <button onClick={() => onSelect?.(item)}>결과 보기</button>
                <button onClick={() => onReanalyze?.(item)}>재분석</button>
                <button onClick={() => handleDelete(item._id)}>삭제</button>
              </div>
            </div>
          );
        })}
      </div>

      {previewItem && (
        <div
          className="history-preview-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="history-preview-modal">
            <div className="history-preview-header">
              <div>
                <p className="eyebrow">코드 미리보기</p>
                <h3>{buildHeadline(previewItem)}</h3>
                <p className="muted preview-meta">
                  {new Date(previewItem.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                className="ghost-btn"
                onClick={() => setPreviewItem(null)}
              >
                닫기
              </button>
            </div>
            <div className="history-preview-content">
              <pre>{previewItem.code}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
