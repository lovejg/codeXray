export default function LoadingOverlay({
  message = "분석 중이에요",
  subMessage = "코드를 읽고 인사이트를 준비하는 중...",
  showProgressBar = false,
  progressLabel = "",
}) {
  return (
    <div className="loading-overlay">
      <div className="loader-card">
        <div className="loader-spinner">
          <span />
          <span />
          <span />
        </div>
        <p className="loader-text">{message}</p>
        <p className="loader-sub">{subMessage}</p>
        {showProgressBar && (
          <div className="loader-progress">
            <div className="loader-progress-bar" aria-hidden />
            {progressLabel && (
              <div className="loader-progress-label">{progressLabel}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
