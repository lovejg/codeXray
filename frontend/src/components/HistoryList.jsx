import { useCallback, useEffect, useMemo, useState } from "react";

export default function HistoryList({ onSelect, onReanalyze }) {
  const [history, setHistory] = useState([]);
  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_BASE || "http://localhost:5000",
    []
  );

  const loadHistory = useCallback(() => {
    fetch(`${API_BASE}/api/history`)
      .then((res) => res.json())
      .then((data) => setHistory(data));
  }, [API_BASE]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/api/history/${id}`, {
      method: "DELETE",
    });
    loadHistory();
  };

  return (
    <div className="panel history-panel">
      <div className="history-list-header">
        <div>
          <p className="muted">최근 분석 기록</p>
          <h3>이전 결과를 다시 확인하세요</h3>
        </div>
        <button className="ghost-btn" onClick={loadHistory}>
          새로고침
        </button>
      </div>
      {history.length === 0 && (
        <div className="empty-state">
          <p className="muted">아직 저장된 분석 기록이 없습니다.</p>
        </div>
      )}

      <div className="history-list">
        {history.map((item) => (
          <div key={item._id} className="history-item">
            <div>
              <div className="history-date">
                {new Date(item.createdAt).toLocaleString()}
              </div>
              <pre className="history-snippet">
                {item.code.substring(0, 120)}...
              </pre>
            </div>

            <div className="history-actions">
              <button onClick={() => onSelect?.(item)}>보기</button>
              <button onClick={() => onReanalyze?.(item)}>재분석</button>
              <button onClick={() => handleDelete(item._id)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
