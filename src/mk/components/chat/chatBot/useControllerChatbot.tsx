"use client";
import { useState, useEffect, useMemo } from "react";
import { initSocket } from "../../notif/provider/useNotifInstandDB";

const db: any = initSocket();

const useControllerChatbot = () => {
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
    chatbots: {},
  };

  const { data } = db.useQuery(query);

  const [lastChatbot, setLastChatbot] = useState(0);
  const processChatBot = async () => {
    let newChatbot = lastChatbot + 1;
    if (newChatbot >= data?.chatbots.length) newChatbot = 0;
    const chatBotId = data?.chatbots[newChatbot];
    setLastChatbot(newChatbot);
    await db.transact([
      db.tx.chatbot[data?.chatbot[0].id].update({
        status: "A",
        chatbot: chatBotId?.id,
        asignatedAt: Date.now(),
      }),
      db.tx.chatbots[chatBotId.id].delete(),
    ]);
    // console.log("asignando", chatBotId, data?.chatbot[0].id);
  };
  useEffect(() => {
    // console.log("Datatata", data);
    if (data?.chatbot?.length > 0 && data?.chatbots?.length > 0) {
      processChatBot();
    }
  }, [data]);

  const result = useMemo(() => true, []);
  return result;
};

export default useControllerChatbot;
