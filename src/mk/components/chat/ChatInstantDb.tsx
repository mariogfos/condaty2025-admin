"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "./chat.module.css";
import {
  IconCheck,
  IconGroup,
  IconImage,
  IconReadMessage,
  IconX,
} from "@/components/layout/icons/IconsBiblioteca";
import ChatRoom from "./room/ChatRoom";
import TabsButtons from "../ui/TabsButton/TabsButtons";
import useInstandDB from "./provider/useInstandDB";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "../ui/Avatar/Avatar";
import Logo from "@/components/req/Logo";
import { useEvent } from "@/mk/hooks/useEvents";
import { SendMessageType } from "./chat-types";
import { getTimePMAM } from "@/mk/utils/date1";
import Switch from "../forms/Switch/Switch";

const soundBell = new Audio("/sounds/bellding.mp3");

export default function ChatInstantDb() {
  const {
    user,
    rooms,
    usersChat,
    sendMessage,
    sendEmoticon,
    readMessage,
    openNewChat,
    chats,
    roomGral,
    uniquePresence,
    showToast,
    typing,
    sending,
    db,
  } = useInstandDB();
  const [open, setOpen] = useState(true);
  const [typeSearch, setTypeSearch]: any = useState(roomGral);
  const [_rooms, set_rooms] = useState([]);
  const { dispatch: newMsg } = useEvent("onChatNewMsg");
  const [notifAudio, setNotifAudio] = useState(true);

  useEffect(() => {
    if (
      typeSearch != roomGral &&
      !rooms.find((r: any) => r.value == typeSearch)
    ) {
      setTypeSearch(roomGral);
    } else {
      setTypeSearch(rooms[rooms.length - 1].value);
    }
  }, [rooms, roomGral]);

  const _openNewChat = (userAppId: string, name: string) => {
    let newRoomId = "";
    if (userAppId == roomGral) {
      newRoomId = roomGral;
    } else {
      newRoomId = openNewChat(userAppId, name);
    }
    setTypeSearch(newRoomId);
  };

  const [lastMsg, setLastMsg] = useState(null);
  const [countMsg, setCountMsg]: any = useState({});
  useEffect(() => {
    if (!chats?.messages) return;

    let cM: any = {};
    chats.messages?.map((m: any) => {
      const idUser = (m.roomId as string)
        .replace("--", "")
        .replace(user.id, "");
      cM = { ...cM, [idUser]: { ...cM[idUser], msg: m } };
      if (idUser !== roomGral) {
        if (m.sender === user.id || m.read_at) return;
        cM = {
          ...cM,
          [idUser]: { ...cM[idUser], count: (cM[idUser]?.count ?? 0) + 1 },
        };
      }
    });

    const abrir =
      lastMsg &&
      chats?.messages?.length > lastMsg &&
      (chats?.messages[chats?.messages?.length - 1].sender != user.id ||
        open === false) &&
      typeSearch != chats.messages[chats.messages.length - 1].roomId;

    if (abrir) {
      cM = {
        ...cM,
        [roomGral]: {
          msg: chats?.messages[chats?.messages?.length - 1],
          count: (cM[roomGral]?.count ?? 0) + 1,
        },
      };
      newMsg({
        data: chats?.messages[chats?.messages?.length - 1],
        type: "newMsg",
      });
      if (notifAudio) soundBell.play();
      showToast(
        <>
          <div>
            {chats?.messages[chats?.messages?.length - 1].roomId == roomGral &&
              "(Grupo General) "}
            {
              usersChat?.find(
                (e: any) =>
                  e.id === chats?.messages[chats.messages.length - 1].sender
              )?.name
            }{" "}
            envió un mensaje:
          </div>
          <div
            style={{
              maxWidth: "300px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {chats?.messages[chats.messages.length - 1].text}
          </div>
        </>,
        "info"
      );
    }

    setCountMsg(cM);
    setLastMsg(chats?.messages?.length);
  }, [chats?.messages]);

  useEffect(() => {
    let _r: any = [];
    rooms.forEach((r: any) => {
      const idUser = (r.value as string).replace("--", "").replace(user.id, "");
      _r.push({ ...r, numero: countMsg[idUser]?.count });
    });
    set_rooms(_r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countMsg, rooms]);

  const [botActive, setBotActive] = useState(false);
  const [botActiveController, setBotActiveController] = useState(false);
  const _sendMsg: SendMessageType = async (text, roomId, userId, file) => {
    if (roomId.indexOf("chatBot") > -1) {
      if (text == "_activate_") {
        setBotActive(true);
        return;
      }
      if (text == "_controller_") {
        setBotActiveController(true);
        return;
      }
    }
    return await sendMessage(text, roomId, userId, file);
  };

  const onNotif = useCallback((e: any) => {
    if (notifAudio)
      soundBell
        .play()
        .catch((err) => console.error("Error al reproducir el audio:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEvent("onNotif", onNotif);

  const onOpenChat = useCallback((e: any) => {
    setOpen(!open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEvent("onOpenChat", onOpenChat);

  return (
    <div
      className={
        open
          ? styles.chatContainer + " close " + styles.close
          : styles.chatContainer
      }
    >
      {/* encabezado */}
      <div
        style={{
          height: "54px",
          borderBottom: "1px solid var(--cWhiteV1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          flexShrink: 1,
        }}
      >
        <div
          style={{
            color: "var(--cWhiteV1)",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Activar notificaciones{" "}
          <Switch
            value={notifAudio ? "Y" : "N"}
            name="notifAudio"
            onChange={() => setNotifAudio(!notifAudio)}
            checked={notifAudio}
          />
        </div>
        <IconX onClick={() => setOpen(false)} />
      </div>
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          padding: "24px 0",
        }}
      >
        <div
          style={{
            borderRight: "1px solid var(--cWhiteV1)",
            padding: "0 16px",
            width: "380px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* <TabsButtons
            tabs={_rooms}
            sel={typeSearch}
            setSel={setTypeSearch}
            text="closeRoom"
          /> */}
          <div
            style={{
              flexGrow: 1,
              overflow: "scroll",
              overflowX: "hidden",
              backgroundColor: "blue",
            }}
          >
            {/* <div style={{ height: "100%" }}> */}
            {usersChat?.map((u: any, i: number) => {
              if (u.id == user.id) return null;
              return (
                <ChatContactItem
                  key={"_" + i + "_" + u.id}
                  u={u}
                  user={user}
                  uniquePresence={uniquePresence}
                  openChat={_openNewChat}
                  countMsg={countMsg}
                  typing={typing}
                  typeSearch={typeSearch}
                />
              );
            })}
            {/* </div> */}
          </div>
          <div style={{ flexShrink: 1 }}>Canales de contactos</div>
        </div>
        <div style={{ backgroundColor: "red", width: "100%" }}>
          <ChatRoom
            user={user}
            roomId={typeSearch}
            chats={chats}
            sendMessage={_sendMsg}
            sendEmoticon={sendEmoticon}
            readMessage={readMessage}
            users={usersChat}
            typing={typing}
            sending={sending}
            isGroup={rooms.find((e) => e.value === typeSearch)?.isGroup}
            db={db}
          />
        </div>
      </div>
      {/* <div
        style={{
          position: "absolute",
          left: "-40px",
          backgroundColor: "var(--cBlack",
          top: "10px",
          width: "40px",
          height: "40px",
          padding: "10px",
          borderRadius: "10px 0  0 10px",
        }}
        onClick={() => setOpen(!open)}
      >
        <IconMessage color="var(--cSuccess)" />
      </div> */}

      {/* <div style={{ color: "white" }}>
        {botActive && <ChatBotLLm />}
      </div> */}
    </div>
  );
}

const RenderText = ({ msg, userId, rol }: any) => {
  return (
    <>
      {msg?.sender === userId && !msg?.received_at && <IconCheck size={12} />}
      {msg?.sender === userId && msg?.received_at && !msg?.read_at && (
        <IconReadMessage size={12} />
      )}
      {msg?.sender === userId && msg?.received_at && msg?.read_at && (
        <IconReadMessage size={12} color="var(--cPrimary)" />
      )}
      {msg?.$files && <IconImage size={12} />}
      {msg?.text ?? rol}
    </>
  );
};

const ChatContactItem = ({
  uniquePresence,
  u,
  openChat,
  user,
  countMsg,
  typing,
  typeSearch,
}: any) => {
  return (
    <div
      className={
        styles.itemList +
        " " +
        (typeSearch.indexOf(u.id) != -1 && styles.active)
      }
      onClick={() => openChat(u.id, u.name)}
    >
      <div style={{ position: "relative" }}>
        {u.id == "chatBot" ? (
          <Logo width={40} />
        ) : u.isGroup ? (
          <IconGroup size={40} />
        ) : (
          <Avatar
            src={getUrlImages("/ADM-" + u?.id + ".webp?d=" + u?.updated_at)}
            w={40}
            h={40}
            name={u?.name ?? getFullName(user)}
          />
        )}
        <span
          className={
            styles.presence +
            " " +
            ((uniquePresence.find((e: any) => e.userapp_id == u.id) ||
              u.isGroup) &&
              styles.online)
          }
        ></span>
      </div>
      <div
        className="truncate"
        style={{
          fontSize: "14px",
          color: "var(--cWhite)",
          width: "100%",
        }}
      >
        {getFullName(u, "NmLo")}
        <br />
        <div
          style={{
            color: "var(--cWhiteV1",
            display: "flex",
            gap: "4px",
          }}
          // className="truncate"
        >
          {typing?.active?.find((e: any) => e.userapp_id == u.id)?.name ? (
            "Escribiendo..."
          ) : (
            <RenderText
              msg={countMsg[u.id]?.msg}
              userId={user.id}
              rol={u.role_name}
            />
          )}
          {/* {JSON.stringify(countMsg[u.id]?.msg)} */}
        </div>
      </div>
      {countMsg[u.id]?.count > 0 && (
        <span style={{ position: "relative" }}>
          <div
            style={{
              color: "var(--cWhite)",
              background: "var(--cPrimary)",
              fontSize: "9px",
              borderRadius: "100%",
              width: "16px",
              height: "16px",
              position: "absolute",
              right: "-14px",
              top: "-6px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {countMsg[u.id]?.count}
          </div>
        </span>
      )}
      {/* {typing?.active?.find((e: any) => e.userapp_id == u.id)?.name &&
        (typeSearch == roomGral || typeSearch.indexOf(user.id) !== false) && (
          <span style={{ color: "white" }}>...esta escribiendo...</span>
        )}
      {u.id == "chatBot" &&
        countMsg[u.id]?.msg?.received_at &&
        !countMsg[u.id]?.msg?.read_at && (
          <span style={{ color: "white" }}>...esta escribiendo...</span>
        )} */}
      <div
        style={{
          fontSize: "12px",
          whiteSpace: "nowrap",
          alignSelf: "flex-start",
        }}
      >
        {getTimePMAM(countMsg[u.id]?.msg?.created_at)}
      </div>
    </div>
  );
};
