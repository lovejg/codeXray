import OpenAI from "openai";
import axios from "axios";

const DEFAULT_MODELS = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  claude: "claude-3-haiku-20240307",
};

function getEnvKey(key, provider) {
  const apiKey = process.env[key];
  if (!apiKey) {
    throw new Error(`${key} is not set. Required for ${provider} requests.`);
  }
  return apiKey;
}

function getOpenAIClient() {
  const apiKey = getEnvKey("OPENAI_API_KEY", "OpenAI");
  return new OpenAI({ apiKey });
}

async function runOpenAI(prompt, model) {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

async function runGemini(prompt, model) {
  const apiKey = getEnvKey("GEMINI_API_KEY", "Gemini");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const response = await axios.post(
      url,
      { contents: [{ parts: [{ text: prompt }] }] },
      { params: { key: apiKey } }
    );

    const parts = response.data.candidates?.[0]?.content?.parts || [];
    return parts.map((part) => part.text).join(" ");
  } catch (error) {
    const providerError = error.response?.data?.error;
    const providerMessage =
      providerError?.message || error.response?.data?.message;
    const statusInfo = error.response?.status
      ? ` (HTTP ${error.response.status})`
      : "";
    const details = providerError?.status || providerError?.code;
    const fullMessage = [providerMessage, details, statusInfo]
      .filter(Boolean)
      .join(" | ");
    throw new Error(
      fullMessage
        ? `Gemini 요청 실패: ${fullMessage}`
        : "Gemini 호출 중 오류가 발생했습니다."
    );
  }
}

async function runClaude(prompt, model) {
  const apiKey = getEnvKey("ANTHROPIC_API_KEY", "Claude");

  console.log(
    "Using Claude Key:",
    apiKey ? apiKey.slice(0, 10) + "..." : "No Key"
  );
  console.log("Requesting Model:", model);

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": apiKey,
        },
      }
    );

    const textContent = response.data.content?.find(
      (part) => part.type === "text"
    );
    return textContent?.text || "";
  } catch (error) {
    const status = error.response?.status;
    const respData = error.response?.data;

    // Provide a clearer message for 404 (model not found)
    if (status === 404) {
      const body = JSON.stringify(respData).slice(0, 1000);
      const fallback =
        (process.env.ANTHROPIC_FALLBACK_OPENAI || "false").toLowerCase() ===
        "true";
      if (fallback) {
        console.warn(
          `Claude model not found (${model}) - falling back to OpenAI as ANTHROPIC_FALLBACK_OPENAI=true`
        );
        try {
          return await runOpenAI(prompt, DEFAULT_MODELS.openai);
        } catch (e) {
          console.error("Fallback to OpenAI failed:", e);
          // continue to throw the original helpful error below
        }
      }

      throw new Error(
        `Claude 모델을 찾을 수 없습니다: ${model} (HTTP 404). 확인하세요: 모델 이름이 정확한지, Anthropic 계정에서 해당 모델에 대한 접근 권한이 있는지. 필요한 경우 ANTHROPIC_MODEL (또는 CLAUDE_MODEL) 환경 변수를 사용해 계정에서 접근 가능한 모델 이름을 설정하세요. 응답 요약: ${body}`
      );
    }

    const providerError = respData?.error;
    const providerMessage = providerError?.message || respData?.message;
    const detail =
      providerError?.type || providerError?.code || providerError?.detail;
    const statusInfo = status ? ` (HTTP ${status})` : "";
    const fullMessage = [providerMessage, detail, statusInfo]
      .filter(Boolean)
      .join(" | ");
    throw new Error(
      fullMessage
        ? `Claude 요청 실패: ${fullMessage}`
        : "Claude 호출 중 오류가 발생했습니다."
    );
  }
}

export async function analyzeWithAI(prompt, modelSelection = {}) {
  const provider = modelSelection.provider || "openai";
  const model =
    modelSelection.model || DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai;

  switch (provider) {
    case "gemini":
      return runGemini(prompt, model);
    case "claude":
      return runClaude(prompt, model);
    case "openai":
    default:
      return runOpenAI(prompt, model);
  }
}
