import { generatePrompt } from "../utils/promptBuilder.js";
import { analyzeWithOpenAI } from "../services/aiService.js";
import { fetchGithubRepo } from "../utils/githubFetcher.js";
import Analysis from "../models/Analysis.js";

export const analyzeCode = async (req, res) => {
  try {
    const { code, options, userPrompt } = req.body; // 프론트에서 받음

    if (!code || code.trim() === "") {
      return res.status(400).json({ message: "코드가 없음" });
    }

    const finalPrompt = generatePrompt(code, options, userPrompt); // 최종 프롬프트 생성

    const result = await analyzeWithOpenAI(finalPrompt); // 최종 프롬프트 AI에 넣고 답변 받기

    const analysis = new Analysis({
      code,
      result,
      options,
      userPrompt,
    });
    await analysis.save(); // DB에 저장

    res.json({ success: true, result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "AI 분석 중 오류 발생" });
  }
};

export const analyzeFile = async (req, res) => {
  try {
    const { options, userPrompt } = req.body;
    const fileContent = req.file.buffer.toString("utf-8"); // 업로드된 파일 내용 읽기

    const finalPrompt = generatePrompt(fileContent, options, userPrompt); // 최종 프롬프트 생성
    const result = await analyzeWithOpenAI(finalPrompt); // 최종 프롬프트 AI에 넣고 답변 받기
    const analysis = new Analysis({
      code: fileContent,
      result,
      options,
      userPrompt,
    });
    await analysis.save();

    res.json({ success: true, result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "파일 분석 중 오류 발생" });
  }
};

export const getHistory = async (req, res) => {
  const list = await Analysis.find().sort({ createdAt: -1 });
  res.json(list);
};

export const getHistoryDetail = async (req, res) => {
  const item = await Analysis.findById(req.params.id);
  res.json(item);
};

export const deleteHistory = async (req, res) => {
  await Analysis.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

export const analyzeGithub = async (req, res) => {
  try {
    const { repoUrl, options, userPrompt } = req.body;

    const code = await fetchGithubRepo(repoUrl); // 깃허브 레포에서 코드 가져오기
    const finalPrompt = generatePrompt(code, options, userPrompt); // 최종 프롬프트 생성
    const result = await analyzeWithOpenAI(finalPrompt); // 최종 프롬프트 AI에 넣고 답변 받기

    const analysis = new Analysis({
      code,
      result,
      options,
      userPrompt,
    });
    await analysis.save(); // DB에 저장

    res.json({ success: true, result });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "GitHub 분석 중 오류 발생" });
  }
};
