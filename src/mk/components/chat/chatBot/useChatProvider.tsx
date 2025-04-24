import { useState } from "react";
import { sendChatCompletion } from "./openai-chat";

type Provider = "chatgpt" | "deepseek";

export type ChatMessage = {
  role: string;
  content: string;
};
interface UseChatProviderOptions {
  provider: Provider;
  context?: string;
}
export function useChatProvider({ provider, context }: UseChatProviderOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    content: string,
    prevMessages?: ChatMessage[],
    _context?: string
  ) => {
    setIsLoading(true);
    setError(null);

    const newMessages = [
      ...(prevMessages ?? messages),
      { role: "user", content },
    ];
    setMessages(newMessages);
    let response = "";
    try {
      const systemPrompt =
        _context ?? context ? [{ role: "system", content: context }] : [];
      const apiMessages: any = [...systemPrompt, ...newMessages].map(
        ({ role, content }) => ({ role, content })
      );

      response = await sendChatCompletion(provider, apiMessages);
      // console.log(response);
      const botReply: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      response = "";
      setError(err.message ?? "Error al enviar mensaje");
    } finally {
      setIsLoading(false);
    }
    return response;
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
