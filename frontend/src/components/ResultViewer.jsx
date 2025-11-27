import { motion } from "framer-motion";

export default function ResultViewer({ result }) {
  if (!result) {
    return <div className="result">분석 결과가 여기에 표시됩니다.</div>;
  }

  return (
    <motion.div
      className="panel result-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <h2>AI 분석 결과</h2>
      <div className="result-box">
        {result ? <pre>{result}</pre> : "아직 분석된 결과가 없습니다."}
      </div>
    </motion.div>
  );
}
