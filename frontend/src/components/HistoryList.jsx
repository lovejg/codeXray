import { useEffect, useState } from "react";

export default function HistoryList() {
  const [history, setHistory] = useState([]);

  const loadHistory = () => {
    fetch("http://localhost:5000/api/history")
      .then((res) => res.json())
      .then((data) => setHistory(data));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/api/history/${id}`, {
      method: "DELETE",
    });
    loadHistory();
  };

  return (
    <div className="panel">
      <h2>분석 히스토리</h2>
      {history.map((item) => (
        <div key={item._id} className="history-item">
          <div>
            <strong>{new Date(item.createdAt).toLocaleString()}</strong>
          </div>
          <pre>{item.code.substring(0, 80)}...</pre>

          <div className="history-actions">
            <button onClick={() => onSelect(item)}>보기</button>
            <button onClick={() => onReanalyze(item)}>재분석</button>
            <button onClick={() => handleDelete(item._id)}>삭제</button>
          </div>
        </div>
      ))}
    </div>
  );
}
