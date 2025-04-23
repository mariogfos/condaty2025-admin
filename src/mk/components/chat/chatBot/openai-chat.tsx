type ChatCompletionRequestMessage = {
  role: string;
  content: string;
};
export async function sendChatCompletion(
  provider: "chatgpt" | "deepseek",
  messages: ChatCompletionRequestMessage[]
): Promise<string> {
  const apiKey =
    provider === "chatgpt"
      ? process.env.NEXT_PUBLIC_OPENAI_API_KEY
      : process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

  const url =
    provider === "chatgpt"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.deepseek.com/v1/chat/completions";

  const model =
    provider === "chatgpt" ? "gpt-4.1-nano-2025-04-14" : "deepseek-chat";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message ?? "Error en la API");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}
