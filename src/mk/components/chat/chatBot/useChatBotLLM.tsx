"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ChatCompletionMessageParam, MLCEngine } from "@mlc-ai/web-llm";
import { initSocket } from "../provider/useInstandDB";
import { id } from "@instantdb/react";
import { useEvent } from "@/mk/hooks/useEvents";

const db: any = initSocket();
const userBot = "chatBot";
const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";
// const selectedModel = "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC";
// Llama-3.2-3B-Instruct-q4f16_1-MLC

const _context: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content:
      "Eres un asistente de soporte para la App CONDATY, que es una plataforma de administracion de condominios, hablas en español, eres una mujer, llamada CONDATITA",
  },
];

const useChatBotLLM = () => {
  const [engine, setEngine] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);

  // const onChatCloseRoom = useCallback(async (payload: any) => {
  //   if (payload.indexOf("chatBot") > -1) {
  //     const del: any[] = [];
  //     const query = {
  //       messages: {
  //         $: {
  //           where: {
  //             roomId: payload,
  //           },
  //         },
  //       },
  //     };
  //     const { data: _chats } = await db.queryOnce(query);
  //     _chats.messages.forEach((e: any) => {
  //       del.push(db.tx.messages[e.id].delete());
  //     });

  //     if (del.length > 0) db.transact(del);
  //   }
  // }, []);

  const onChatSendMsg = useCallback(async (payload: any) => {
    if (payload?.roomId.indexOf("chatBot") > -1) {
      await db.transact(
        db.tx.chatbot[id()].update({ ...payload, status: "N" })
      );
    }
  }, []);

  useEvent("onChatSendMsg", onChatSendMsg);
  // useEvent("onChatCloseRoom", onChatCloseRoom);

  const initProgressCallback = (initProgress: any) => {
    // console.log(initProgress);

    // if (progress === null) setProgress(() => 0);
    setProgress(() => initProgress);
    if (initProgress?.progress === 1) {
      setProgress(() => 1);
    }
  };

  const initBot = useCallback(async () => {
    const _engine = new MLCEngine({ initProgressCallback });
    await _engine.reload(selectedModel);
    setEngine(() => _engine);
  }, []);

  useEffect(() => {
    console.log("useeffect useCHatBotLLM");
    initBot();
  }, [initBot]);

  const sendMessageBot = useCallback(
    async (
      input: string,
      engine: MLCEngine,
      _messages?: ChatCompletionMessageParam[]
    ) => {
      if (!engine || input.trim() === "") {
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
      return reply.choices[0].message.content;
    },
    []
  );

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

  const { data } = db.useQuery(query);

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
        created_at: Date.now(),
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
    if (data?.chatbot && data?.chatbot.length > 0) {
      if (lastMsg == data?.chatbot[0].id) return;
      setLastMsg(data?.chatbot[0].id);
      sendReply(data?.chatbot[0]);
    }
  }, [data?.chatbot]);

  const result = useMemo(
    () => ({
      sendMessageBot,
      engine,
      initBot,
      progress,
    }),
    [sendMessageBot, engine, initBot, progress]
  );
  return result;
};

export default useChatBotLLM;
