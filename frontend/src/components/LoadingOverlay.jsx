export default function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="loader-card">
        <div className="loader-spinner">
          <span />
          <span />
          <span />
        </div>
        <p className="loader-text">분석 중이에요</p>
        <p className="loader-sub">코드를 읽고 인사이트를 준비하는 중...</p>
      </div>
    </div>
  );
}
