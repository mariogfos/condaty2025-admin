import useChatBotLLM from "./useChatBotLLM";

const ChatBotLLm = () => {
  const { progress } = useChatBotLLM();
  const getBotStatus = () => {
    if (progress === null) return "No Activo!";
    if (progress === 1) return "Activado.";
    return progress?.text;
  };

  return <div>Chat Bot: {getBotStatus()}</div>;
};

export default ChatBotLLm;
