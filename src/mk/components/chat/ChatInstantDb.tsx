"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import styles from "./chat.module.css";
import {
  IconAlert,
  IconBellAlert,
  IconBellAlertOff,
  IconMessage,
} from "@/components/layout/icons/IconsBiblioteca";
import ChatRoom from "./room/ChatRoom";
import TabsButtons from "../ui/TabsButton/TabsButtons";
import useInstandDB from "./provider/useInstandDB";
import ChatBotLLm from "./chatBot/ChatBotLLm";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "../ui/Avatar/Avatar";
import Logo from "@/components/req/Logo";
import { useEvent } from "@/mk/hooks/useEvents";

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
  } = useInstandDB();
  const [open, setOpen] = useState(false);
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
    const newRoomId = openNewChat(userAppId, name);
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
          [idUser]: { ...cM[idUser], count: (cM[idUser]?.count || 0) + 1 },
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
          count: (cM[roomGral]?.count || 0) + 1,
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
              "(GENERAL) "}
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
  const _sendMsg = async (text: string, roomId: string, file?: File) => {
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
    return await sendMessage(text, roomId, file);
  };

  const onNotif = useCallback((e: any) => {
    if (notifAudio)
      soundBell
        .play()
        .catch((err) => console.error("Error al reproducir el audio:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEvent("onNotif", onNotif);
  return (
    <div
      className={
        open
          ? styles.chatContainer + " close " + styles.close
          : styles.chatContainer
      }
    >
      <div
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
      </div>
      <TabsButtons
        tabs={_rooms}
        sel={typeSearch}
        setSel={setTypeSearch}
        text="closeRoom"
      />
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
      />
      <h4 className={styles.onlineUsersTitle}>Usuarios en línea:</h4>
      <div className={styles.onlineUsersList}>
        {usersChat?.map((u: any, i: number) => {
          if (u.id == user.id) return null;
          return (
            <Fragment key={"_" + i + "_" + u.id}>
              <div
                className={
                  uniquePresence.find((e: any) => e.userapp_id == u.id)
                    ? styles.onlineUser
                    : styles.offlineUser
                }
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                onClick={() => _openNewChat(u.id, u.name)}
              >
                {u.id == "chatBot" ? (
                  <Logo width={32} />
                ) : (
                  <Avatar
                    src={getUrlImages(
                      "/ADM-" + u?.id + ".webp?d=" + u?.updated_at
                    )}
                    w={32}
                    h={32}
                    name={u?.name || getFullName(user)}
                  />
                )}
                <div>
                  {getFullName(u, "NmLo")}
                  <br />
                  {countMsg[u.id]?.msg?.text && (
                    <div style={{ color: "var(--cWhiteV1", fontSize: "9px" }}>
                      {(countMsg[u.id]?.msg?.text as string).substring(0, 50)}
                      {(countMsg[u.id]?.msg?.text as string).length > 50 &&
                        "..."}
                    </div>
                  )}
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
                {typing?.active?.find((e: any) => e.userapp_id == u.id)?.name &&
                  (typeSearch == roomGral ||
                    typeSearch.indexOf(user.id) !== false) && (
                    <span style={{ color: "white" }}>
                      ...esta escribiendo...
                    </span>
                  )}
                {u.id == "chatBot" &&
                  countMsg[u.id]?.msg?.received_at &&
                  !countMsg[u.id]?.msg?.read_at && (
                    <span style={{ color: "white" }}>
                      ...esta escribiendo...
                    </span>
                  )}

                {/* {JSON.stringify(countMsg[u.id]?.msg)} */}
              </div>
            </Fragment>
          );
        })}
      </div>

      <div
        style={{
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        Notificaciones audio:
        {notifAudio ? (
          <>
            {" "}
            Encendido
            <IconBellAlert
              color="var(--cPrimary)"
              reverse
              onClick={() => setNotifAudio(false)}
            />
          </>
        ) : (
          <>
            {" "}
            Apagado
            <IconBellAlertOff
              color="var(--cPrimary)"
              reverse
              onClick={() => setNotifAudio(true)}
            />
          </>
        )}
      </div>
      <div style={{ color: "white" }}>
        {botActive && <ChatBotLLm />}
        {/* {botActiveController && <ChatBotLLmCont />} */}
        {/* {JSON.stringify(db)} */}
      </div>
    </div>
  );
}
