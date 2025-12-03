import { motion } from "framer-motion";

export default function ResultViewer({ result, onReset }) {
  const MotionPanel = motion.div;
  const containerProps = {
    className: "panel result-panel",
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    <MotionPanel {...containerProps}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">결과</p>
          <h2>AI 분석 결과</h2>
        </div>
        <div className="panel-actions">
          <button className="ghost-btn" onClick={onReset}>
            새 분석하기
          </button>
        </div>
      </div>
      <div className="result-box">
        {result ? <pre>{result}</pre> : "아직 분석된 결과가 없습니다."}
      </div>
    </MotionPanel>
  );
}
