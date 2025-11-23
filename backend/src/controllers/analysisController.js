import { generatePrompt } from "../utils/promptBuilder.js";
import { analyzeWithOpenAI } from "../services/aiService.js";

export const analyzeCode = async (req, res) => {
  try {
    const { code, options, userPrompt } = req.body;

    if (!code || code.trim() === "") {
      return res.status(400).json({ message: "코드가 없음" });
    }

    const finalPrompt = generatePrompt(code, options, userPrompt);

    const result = await analyzeWithOpenAI(finalPrompt);

    res.json({ success: true, result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "AI 분석 중 오류 발생" });
  }
};
