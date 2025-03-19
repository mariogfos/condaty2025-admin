"use client";
import { useState, useEffect, useMemo } from "react";
import { ChatCompletionMessageParam, MLCEngine } from "@mlc-ai/web-llm";
import { initSocket } from "../provider/useInstandDB";
import { id } from "@instantdb/react";

const db: any = initSocket();
const userBot = "chatBot";
const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";
// const selectedModel = "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC";
// Llama-3.2-3B-Instruct-q4f16_1-MLC

const _context: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content:
      "Eres un asistente de la App CONDATY, que es una plataforma de administracion de condominios, hablas en español, eres una mujer, llamada FOSito",
  },
];

const useChatBotLLM = () => {
  const [model, setModel] = useState<any>(null);
  const [engine, setEngine] = useState<any>(null);
  // const [botStatus, setBotStatus]: any = useState(null);

  const initProgressCallback = (initProgress: any) => {
    console.log(initProgress);
    // if (initProgress.progress == 1) setBotStatus(initProgress);
  };

  const initBot = async () => {
    const _engine = new MLCEngine({ initProgressCallback });
    if (!model) {
      const m = await _engine.reload(selectedModel);
      setModel(true);
    }
    setEngine((old: any) => _engine);
  };

  useEffect(() => {
    initBot();
  }, []);

  // useEffect(() => {
  //   console.log("effect engine", engine);
  // }, [engine]);

  const sendMessageBot = async (
    input: string,
    engine: MLCEngine,
    _messages?: ChatCompletionMessageParam[]
  ) => {
    if (!engine || input.trim() === "") {
      // console.log("engine", input, engine);
      return "No se pudo responder tu consulta... intenta en 1 minuto";
    }

    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: input,
    };

    const reply = await engine.chat.completions.create({
      model: selectedModel,
      temperature: 1,
      messages: [...(_messages || []), userMessage],
    });
    // setMessages([
    //   ...(_messages || messages),
    //   userMessage,
    //   reply.choices[0].message,
    // ]);
    // // setInput("");
    return reply.choices[0].message.content;
  };

  // instantDb
  const query = {
    chatbot: {
      $: {
        where: {
          status: "N",
        },
        limit: 1,
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
  };

  const { isLoading, error, data } = db.useQuery(query);

  const getRoomName = (userAppId: string) => {
    let newRoomId = userBot + "--" + userAppId;
    if (userAppId > userBot) {
      newRoomId = userAppId + "--" + userBot;
    }
    return newRoomId;
  };

  let lastMessage = "";
  const sendReply = async (msg: any) => {
    if (lastMessage === msg.id) return;
    lastMessage = msg.id;
    // const msg=data?.chatbot[0];
    await db.transact([
      db.tx.messages[msg.msgId].update({
        received_at: Date.now(),
      }),
    ]);
    const roomId = getRoomName(msg.sender);
    const query = {
      messages: {
        $: {
          where: {
            roomId: roomId,
          },
        },
      },
    };
    const { data: messages } = await db.queryOnce(query);

    const context: ChatCompletionMessageParam[] = _context;
    messages?.messages?.map((e: any, i: number) => {
      if (i < messages?.messages.length)
        context.push({
          role: e.sender == userBot ? "assistant" : "user",
          content: e.text,
        });
    });
    const reply = await sendMessageBot(msg.text, engine, context);
    const _id = id();
    await db.transact([
      db.tx.messages[_id].update({
        text: reply,
        sender: userBot,
        roomId,
        timestamp: Date.now(),
      }),
      db.tx.chatbot[msg.id].update({
        status: "R",
        reply,
      }),
      db.tx.messages[msg.msgId].update({
        read_at: Date.now(),
      }),
    ]);
  };
  const [lastMsg, setLastMsg] = useState("");
  useEffect(() => {
    // console.log("useeffect chat", data);
    if (data?.chatbot && data?.chatbot.length > 0) {
      if (lastMsg == data?.chatbot[0].id) return;
      setLastMsg(data?.chatbot[0].id);
      // console.log("useeffect chat procesar", data?.chatbot[0]);
      sendReply(data?.chatbot[0]);
    }
  }, [data?.chatbot]);

  const result = useMemo(
    () => ({
      sendMessageBot,
      engine,
      initBot,
    }),
    [sendMessageBot, engine, initBot]
  );
  return result;
};

export default useChatBotLLM;
