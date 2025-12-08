import { generatePrompt } from "../utils/promptBuilder.js";
import { analyzeWithOpenAI } from "../services/aiService.js";
import { fetchGithubRepo } from "../utils/githubFetcher.js";
import Analysis from "../models/Analysis.js";

function chunkTextBySize(text, maxSize = 15000) {
  const lines = text.split("\n");
  const chunks = [];
  let cur = "";
  for (const line of lines) {
    if ((cur + "\n" + line).length > maxSize) {
      if (cur.length > 0) chunks.push(cur);
      cur = line;
    } else {
      cur = cur.length === 0 ? line : cur + "\n" + line;
    }
  }
  if (cur.length > 0) chunks.push(cur);
  return chunks;
}

export const analyzeCode = async (req, res) => {
  try {
    const { code, options, userPrompt } = req.body; // 프론트에서 받음

    if (!code || code.trim() === "") {
      return res.status(400).json({ message: "코드가 없음" });
    }

    // If input is large, summarize chunks first to stay within token limits
    let finalInput = code;
    if (code.length > 15000) {
      const chunks = chunkTextBySize(code, 12000);
      const summaries = [];
      for (const chunk of chunks) {
        const prompt = generatePrompt(chunk, options, userPrompt, "summarize");
        const s = await analyzeWithOpenAI(prompt);
        summaries.push(s);
      }
      // combine summaries for final analysis
      finalInput = summaries.join("\n\n---SUMMARY---\n\n");
    }

    const finalPrompt = generatePrompt(finalInput, options, userPrompt); // 최종 프롬프트 생성

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
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "파일이 필요합니다." });
    }
    const fileContent = req.file.buffer.toString("utf-8"); // 업로드된 파일 내용 읽기

    const parsedOptions =
      typeof options === "string" && options.length > 0
        ? JSON.parse(options)
        : options;

    let finalInput = fileContent;
    if (fileContent.length > 15000) {
      const chunks = chunkTextBySize(fileContent, 12000);
      const summaries = [];
      for (const chunk of chunks) {
        const prompt = generatePrompt(
          chunk,
          parsedOptions,
          userPrompt,
          "summarize"
        );
        const s = await analyzeWithOpenAI(prompt);
        summaries.push(s);
      }
      finalInput = summaries.join("\n\n---SUMMARY---\n\n");
    }

    const finalPrompt = generatePrompt(finalInput, parsedOptions, userPrompt); // 최종 프롬프트 생성
    const result = await analyzeWithOpenAI(finalPrompt); // 최종 프롬프트 AI에 넣고 답변 받기
    const analysis = new Analysis({
      code: fileContent,
      result,
      options: parsedOptions,
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
    let finalInput = code;
    if (code.length > 15000) {
      const chunks = chunkTextBySize(code, 12000);
      const summaries = [];
      for (const chunk of chunks) {
        const prompt = generatePrompt(chunk, options, userPrompt, "summarize");
        const s = await analyzeWithOpenAI(prompt);
        summaries.push(s);
      }
      finalInput = summaries.join("\n\n---SUMMARY---\n\n");
    }

    const finalPrompt = generatePrompt(finalInput, options, userPrompt); // 최종 프롬프트 생성
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
