import useAxios from "@/mk/hooks/useAxios";
import { useEvent } from "@/mk/hooks/useEvents";
import { useCallback, useState } from "react";

export type Provider = "chatgpt" | "deepseek";

export type ChatMessage = {
  role: string;
  content: string;
};
export type UseChatProviderOptions = {
  provider: Provider;
  context?: string;
};
export function useChatProvider({ provider, context }: UseChatProviderOptions) {
  const { execute } = useAxios();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClose = useCallback(
    (roomId: any) => {
      console.log("onClose", roomId);
      if (roomId.indexOf("chatBot") > -1) {
        setError(null);
        setIsLoading(false);
      }
      execute("chatbot-clear", "POST", {}, false, true);
    },
    [execute]
  );

  useEvent("onChatCloseRoom", onClose);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    setError(null);
    let response = "";
    try {
      const { data, error } = await execute("chatbot", "POST", {
        message: content,
        context: context ?? "",
        provider: provider || "chatgpt",
      });
      if (data.success === true) {
        response = data.data;
      } else {
        setError(error);
        response = "No se pudo responder la pregunta, intenta mas tarde";
      }
    } catch (err: any) {
      setError(err.message);
      response = "No se pudo responder la pregunta, intenta mas tarde";
    } finally {
      setIsLoading(false);
    }
    return response;
  };

  return {
    isLoading,
    error,
    sendMessageBot: sendMessage,
  };
}
