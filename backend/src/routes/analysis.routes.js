import express from "express";
import {
  analyzeCode,
  getHistory,
  getHistoryDetail,
  deleteHistory,
  analyzeFile,
  analyzeGithub,
} from "../controllers/analysisController.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();
router.post("/analyze", analyzeCode); // 코드 분석 요청 처리
router.get("/history", getHistory); // 분석 히스토리 가져오기
router.get("/history/:id", getHistoryDetail); // 분석 히스토리 상세 가져오기
router.delete("/history/:id", deleteHistory); // 히스토리 삭제
router.post("/analyze/file", upload.single("file"), analyzeFile); // 파일 업로드를 통한 코드 분석
router.post("/analyze/github", analyzeGithub); // GitHub 리포지토리 분석

export default router;
