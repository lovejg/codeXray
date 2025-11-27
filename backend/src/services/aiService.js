import OpenAI from "openai";

// OpenAI SDK 사용해서 GPT-4o-mini 호출
function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Set it in your environment or .env file."
    );
  }

  return new OpenAI({ apiKey });
}

export async function analyzeWithOpenAI(prompt) {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}
