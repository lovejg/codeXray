import express from "express";
import { analyzeCode } from "../controllers/analysisController.js";

const router = express.Router();
router.post("/analyze", analyzeCode);

export default router;
