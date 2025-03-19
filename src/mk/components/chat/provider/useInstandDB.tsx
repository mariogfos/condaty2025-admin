import React, { useCallback, useEffect, useMemo, useState } from "react";
import { init, id } from "@instantdb/react";
import useAxios from "@/mk/hooks/useAxios";
import { getFullName } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { IconX } from "@/components/layout/icons/IconsBiblioteca";
import { SendEmoticonType, SendMessageType } from "../chat-types";

const roomGral: string = process.env
  .NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX as string;
let db: any = null;
let room: any = null;
let token: null | string = null;
export const initSocket = () => {
  if (!db) {
    db = init({
      appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID as string,
    });
    room = db.room("chat", roomGral);
    console.log("iniciando conexion a InstantDB");
    return db;
  } else {
    console.log("recuperando conexion a InstantDB");
    return db;
  }
};

initSocket();

type useInstantDbType = {
  getNameRoom: Function;
  openNewChat: Function;
  closeRoom: Function;
  sendMessage: SendMessageType;
  sendEmoticon: SendEmoticonType;
  readMessage: Function;
  showToast: Function;
  chats: any;
  user: any;
  usersChat: any[];
  uniquePresence: any[];
  rooms: any[];
  me: any;
  isLoading: boolean;
  error: any;
  roomGral: string;
  typing: any;
  // engine?: any;
};

const useInstandDB = (): useInstantDbType => {
  const { user, showToast } = useAuth();
  // const { engine, messages, sendMessageBot } = useChatBotLLM();
  const [rooms, setRooms]: any = useState([
    {
      value: roomGral,
      text: "GENERAL",
      closeRoom: "GENERAL",
      isGroup: true,
      newMsg: 0,
      lastMsg: "",
    },
  ]);
  const { data: usersChat } = useAxios("users", "GET", {
    perPage: -1,
    cols: "id,name",
  });

  const { user: me, peers, publishPresence } = db.rooms.usePresence(room);
  const typing = db.rooms.useTypingIndicator(room, "chat");

  const connectDB = async () => {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "include", // Envía cookies
      body: JSON.stringify({ id: user?.id }),
    });
    const data = await response.json();
    if (data?.success) {
      token = data?.token;
      await db.auth.signInWithToken(data.token);
      publishPresence({ name: getFullName(user), userapp_id: user?.id });
    }
  };

  useEffect(() => {
    if (!token) connectDB();
    return () => {
      publishPresence(undefined);
    };
  }, []);

  const [uniquePresence, setUniquePresence] = useState([]);

  useEffect(() => {
    const uniquePeers: any = Object.values(peers).reduce(
      (acc: any, peer: any) => {
        if (!acc[peer.userapp_id] && peer.userapp_id != user?.id) {
          acc[peer.userapp_id] = peer;
        }
        return acc;
      },
      {}
    );

    const uniquePeersArray: any = Object.values(uniquePeers);
    setUniquePresence(uniquePeersArray);
  }, [peers]);

  const query = {
    messages: {
      $: {
        where: {
          or: [
            { roomId: roomGral },
            { roomId: { $like: "%" + user.id + "%" } },
          ],
        },
      },
      $files: {},
    },
  };
  const { isLoading, error, data: chats } = db.useQuery(query);

  useEffect(() => {
    if (!user) {
      publishPresence(null);
    }
  }, [user, publishPresence]);

  useEffect(() => {
    if (chats?.messages?.length > 0) {
      const now = Date.now();
      chats?.messages?.map((m: any) => {
        if (m.sender !== user.id && !m.received_at) {
          db.transact(
            db.tx.messages[m.id].update({
              received_at: now,
            })
          );
        }
      });
    }
  }, [chats?.messages, user?.id]);

  const readMessage = useCallback(
    async (msgsRead: any[]) => {
      if (msgsRead?.length > 0) {
        const now = Date.now();
        msgsRead?.map((m: any) => {
          if (m.sender !== user.id && m.received_at && !m.read_at) {
            db.transact(
              db.tx.messages[m.id].update({
                read_at: now,
              })
            );
          }
        });
      }
    },
    [user?.id]
  );

  const uploadImageInstantDB = async (
    file: File,
    roomId: string,
    msgId: string
  ) => {
    try {
      const opts = {
        contentType: file.type,
        contentDisposition: "inline",
      };

      const filename =
        roomId +
        "/" +
        msgId +
        "." +
        // @ts-ignore
        file.name?.split(".").pop().toLowerCase();
      const { data } = await db.storage.uploadFile(filename, file, opts);
      await db.transact(db.tx.messages[msgId].link({ $files: data.id }));
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };
  const sendMessage: SendMessageType = useCallback(
    async (text: string, roomId: string, file?: File) => {
      if (text.trim()) {
        const _id = id();
        await db.transact(
          db.tx.messages[_id].update({
            text,
            sender: user.id,
            roomId,
            timestamp: Date.now(),
          })
        );
        if (file) {
          await uploadImageInstantDB(file, roomId, _id);
        }

        if (roomId.indexOf("chatBot") > -1) {
          await db.transact(
            db.tx.chatbot[id()].update({
              text,
              sender: user.id,
              roomId,
              msgId: _id,
              created_at: Date.now(),
              status: "N",
            })
          );
        }

        return _id;
      }
      return false;
    },
    [user?.id]
  );

  const sendEmoticon: SendEmoticonType = useCallback(
    async (emoticon: string, msgId: string) => {
      if (emoticon.trim()) {
        const data = await db.transact(
          db.tx.messages[msgId].update({
            emoticon,
          })
        );
        return data;
      }
      return false;
    },
    [user?.id]
  );

  const getNameRoom = useCallback(
    (userAppId: string) => {
      let newRoomId = user.id + "--" + userAppId;
      if (userAppId > user.id) {
        newRoomId = userAppId + "--" + user.id;
      }
      return newRoomId;
    },
    [user?.id]
  );

  const getChats = () => chats;
  const closeRoom = (roomIdDel: any) => {
    setRooms(rooms.filter((r: any) => r.value != roomIdDel));
    //if chatBot
    // console.log("eliminar room", roomIdDel);
    if (roomIdDel.indexOf("chatBot") > -1) {
      const del: any[] = [];
      const _chats = getChats();
      _chats.messages.forEach((e: any) => {
        // console.log("seborrara", e.id);
        del.push(db.tx.messages[e.id].delete());
      });

      if (del.length > 0) db.transact(del);
    }
  };

  const openNewChat = useCallback(
    (userAppId: string, name: string) => {
      const newRoomId = getNameRoom(userAppId);
      if (!rooms.find((r: any) => r.value === newRoomId)) {
        let _name = (
          <div>
            {name}{" "}
            <IconX
              color="white"
              size={12}
              onClick={() => closeRoom(newRoomId)}
            />
          </div>
        );
        setRooms([
          ...rooms,
          { value: newRoomId, text: name, closeRoom: _name },
        ]);
      }
      return newRoomId;
    },
    [rooms, getNameRoom, closeRoom]
  );

  const result = useMemo(
    () => ({
      getNameRoom,
      openNewChat,
      closeRoom,
      sendMessage,
      sendEmoticon,
      readMessage,
      chats,
      user,
      usersChat: [
        ...(usersChat?.data || []),
        { id: "chatBot", name: "FOSito" },
      ],
      uniquePresence: [
        ...(uniquePresence || []),
        { name: "FOSito", userapp_id: "chatBot", peerId: "chatBot" },
      ],
      rooms,
      me,
      isLoading,
      error,
      roomGral,
      showToast,
      typing,
      // bot,
    }),
    [
      getNameRoom,
      openNewChat,
      closeRoom,
      sendMessage,
      sendEmoticon,
      readMessage,
      chats,
      user,
      usersChat,
      uniquePresence,
      rooms,
      me,
      isLoading,
      error,
      showToast,
      typing,
      // bot,
    ]
  );

  return result;
};

export default useInstandDB;
