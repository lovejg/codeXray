import { motion } from "framer-motion";

export default function AppHeader({ isHistoryOpen, onToggleHistory }) {
  const MotionHeader = motion.header;

  return (
    <MotionHeader
      className="header"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h1>CodeXray</h1>
        <p>코드를 한눈에 분석하는 AI 코드 인사이트 플랫폼</p>
      </div>
      <button className="ghost-btn history-toggle" onClick={onToggleHistory}>
        {isHistoryOpen ? "히스토리 숨기기" : "히스토리 보기"}
      </button>
    </MotionHeader>
  );
}
