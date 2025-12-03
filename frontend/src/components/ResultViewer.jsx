import { motion } from "framer-motion";

export default function ResultViewer({ result }) {
  const MotionPanel = motion.div;
  const containerProps = {
    className: "panel result-panel",
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  };

  if (!result) {
    return (
      <MotionPanel {...containerProps}>
        <p className="eyebrow">결과</p>
        <h2>분석을 시작해 보세요</h2>
        <p className="muted">
          코드, 파일, 혹은 GitHub 링크를 입력하면 여기에 요약과 인사이트가
          표시됩니다.
        </p>
        <div className="empty-state">아직 분석된 결과가 없습니다.</div>
      </MotionPanel>
    );
  }

  return (
    <MotionPanel {...containerProps}>
      <p className="eyebrow">결과</p>
      <h2>AI 분석 결과</h2>
      <div className="result-box">
        {result ? <pre>{result}</pre> : "아직 분석된 결과가 없습니다."}
      </div>
    </MotionPanel>
  );
}
