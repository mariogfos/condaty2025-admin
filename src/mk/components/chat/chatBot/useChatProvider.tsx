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

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    setError(null);

    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);

    try {
      const systemPrompt = context
        ? [{ role: "system", content: context }]
        : [];
      const apiMessages = [...systemPrompt, ...newMessages].map(
        ({ role, content }) => ({ role, content })
      );

      const response = await sendChatCompletion(provider, apiMessages);

      const botReply: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      setError(err.message || "Error al enviar mensaje");
    } finally {
      setIsLoading(false);
    }
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
