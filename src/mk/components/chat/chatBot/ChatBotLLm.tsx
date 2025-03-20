import useChatBotLLM from "./useChatBotLLM";

const ChatBotLLm = () => {
  const { progress } = useChatBotLLM();
  const getBotStatus = () => {
    if (progress === null) return "No Activo!";
    if (progress === 1) return "Activado.";
    return JSON.stringify(progress);
    return "Activandose...";
  };

  return <div>Chat Bot: {getBotStatus()}</div>;
};

export default ChatBotLLm;
