import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Github() {
  const [repos, setRepos] = useState([]);
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    fetch("http://localhost:5000/api/github/repos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRepos(data));
  }, []);

  const analyzeRepo = async (repoUrl) => {
    const res = await fetch("http://localhost:5000/api/analyze/github", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repoUrl }),
    });

    const data = await res.json();

    localStorage.setItem("analysisResult", data.result);
    window.location.href = "/";
  };

  return (
    <div className="panel">
      <h2>내 GitHub Repository</h2>

      {repos.map((repo) => (
        <div key={repo.id} style={{ marginBottom: "10px" }}>
          <button onClick={() => analyzeRepo(repo.html_url)}>
            🔍 {repo.name}
          </button>
        </div>
      ))}
    </div>
  );
}
