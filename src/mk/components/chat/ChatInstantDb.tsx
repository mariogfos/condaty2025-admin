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
import useInstandDB from "./provider/useInstandDB";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "../ui/Avatar/Avatar";
import Logo from "@/components/req/Logo";
import { useEvent } from "@/mk/hooks/useEvents";
import { SendMessageType } from "./chat-types";
import { getTimePMAM } from "@/mk/utils/date1";
import Switch from "../forms/Switch/Switch";
import Image from "next/image";
import ProfileModal from "@/components/ProfileModal/ProfileModal";

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
  const [open, setOpen] = useState(false);
  const [typeSearch, setTypeSearch]: any = useState(roomGral);
  const [_rooms, set_rooms] = useState([]);
  const { dispatch: newMsg } = useEvent("onChatNewMsg");
  const [notifAudio, setNotifAudio] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeSearch != roomGral &&
      !rooms.find((r: any) => r.value == typeSearch)
    ) {
      setTypeSearch(roomGral);
    } else {
      setTypeSearch(rooms[rooms.length - 1].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const messages: any[] = Array.isArray(chats?.messages)
      ? chats.messages
      : [];

    if (messages.length === 0) {
      setCountMsg({});
      setLastMsg(null);
      return;
    }

    let cM: any = {};
    messages.forEach((m: any) => {
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

    // Último mensaje seguro
    const latestMessage = messages[messages.length - 1];

    const abrir =
      !!lastMsg &&
      !!latestMessage &&
      latestMessage.created_at > lastMsg &&
      latestMessage.sender !== user.id &&
      (typeSearch !== latestMessage.roomId || !open);

    if (abrir) {
      cM = {
        ...cM,
        [roomGral]: {
          msg: latestMessage,
          count: (cM[roomGral]?.count ?? 0) + 1,
        },
      };
      newMsg({ data: latestMessage, type: "newMsg" });
      if (notifAudio) soundBell.play();
      showToast(
        <>
          <div>
            {latestMessage.roomId == roomGral && "(Grupo Admin) "}
            {
              usersChat?.find((e: any) => e.id === latestMessage.sender)?.name
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
            {latestMessage.text}
          </div>
        </>,
        "info"
      );
    }

    setCountMsg(cM);
    setLastMsg(latestMessage?.created_at ?? null);
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

  const _sendMsg: SendMessageType = async (text, roomId, userId, file) => {
    return await sendMessage(text, roomId, userId, file);
  };

  const onNotif = useCallback((e: any) => {
    if (!user?.id) return;
    if (notifAudio)
      soundBell
        .play()
        .catch((err) => console.error("Error al reproducir el audio:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEvent("onNotif", onNotif);

  const onOpenChat = useCallback(
    (e: any) => {
      // console.log(e);
      setOpen(!open);
    },
    [open]
  );

  useEvent("onOpenChat", onOpenChat);

  const [currentRoom, setCurrentRoom]: any = useState(null);

  useEffect(() => {
    setCurrentRoom(rooms?.find((e: any) => e.value == typeSearch));
  }, [rooms, typeSearch]);

  const handleOpenHeaderProfile = () => {
    if (typeSearch === roomGral || typeSearch.indexOf("chatBot") !== -1) return;
    const userId = currentRoom?.value?.replace("--", "").replace(user.id, "");
    if (userId) {
      setSelectedUserId(userId);
      setProfileModalOpen(true);
    }
  };

  const handleCloseProfile = () => {
    setProfileModalOpen(false);
    setSelectedUserId(null);
  };

  return (
    <>
      <div
        className={styles.chatdrop + " " + (open && styles.open)}
        onClick={() => setOpen(false)}
      ></div>
      <div
        className={
          open
            ? styles.chatContainer + " close " + styles.close
            : styles.chatContainer
        }
      >
        {/* encabezado */}
        <div className={styles.chatHeader}>
          <div>
            Activar notificaciones{" "}
            <Switch
              value={notifAudio ? "Y" : "N"}
              name="notifAudio"
              onChange={() => setNotifAudio(!notifAudio)}
              checked={notifAudio}
            />
          </div>
          <div
            onClick={handleOpenHeaderProfile}
            style={{
              cursor:
                typeSearch !== roomGral && typeSearch.indexOf("chatBot") === -1
                  ? "pointer"
                  : "default",
            }}
          >
            <div>
              {typeSearch == roomGral ? (
                <IconGroup size={40} />
              ) : typeSearch.indexOf("chatBot") != -1 ? (
                <Image
                  src="/assets/images/Condy.png"
                  width={40}
                  height={40}
                  alt="Soporte Condy"
                  style={{ borderRadius: "50%" }}
                />
              ) : (
                <Avatar
                  hasImage={
                    usersChat.find(
                      (e: any) =>
                        e.id ==
                        currentRoom?.value
                          .replace("--", "")
                          .replace(user.id, "")
                    )?.has_image
                  }
                  src={getUrlImages(
                    "/ADM-" +
                      currentRoom?.value
                        .replace("--", "")
                        .replace(user.id, "") +
                      ".webp?d=" +
                      new Date().getTime()
                  )}
                  w={40}
                  h={40}
                  name={currentRoom?.text ?? ""}
                />
              )}
            </div>
            <div>{currentRoom && currentRoom.text}</div>
          </div>
          <div>
            <IconX onClick={() => setOpen(false)} />
          </div>
        </div>
        <div className={styles.chatBodyContainer}>
          <div>
            <div>
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
            </div>
            <div>
              <div>Soporte</div>
              {/* <div
                style={{
                  width: "214px",
                  fontSize: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              > */}
              <ChatContactItem
                u={{ id: "chatBot", name: "Condy", isBot: true }}
                user={user}
                uniquePresence={uniquePresence}
                openChat={_openNewChat}
                countMsg={countMsg}
                typing={typing}
                typeSearch={typeSearch}
              />
              {/* <Button
                  variant="secondary"
                  small
                  style={{ justifyContent: "left", gap: "4px" }}
                >
                  <IconWhatsapp /> Contactarme por WhatsApp
                </Button>
                <Button
                  variant="secondary"
                  small
                  style={{ justifyContent: "left", gap: "4px" }}
                >
                  <IconEmail /> Contactarme por E-mail
                </Button> */}
              {/* </div> */}
              <div></div>
            </div>
          </div>
          <div>
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
      </div>

      {/* Modal de perfil de usuario */}
      {selectedUserId && (
        <ProfileModal
          open={profileModalOpen}
          onClose={handleCloseProfile}
          dataID={selectedUserId}
          type="admin"
          title="Perfil de personal"
          titleBack="Volver al chat"
          del={false}
          edit={false}
          zIndex={10001}
        />
      )}
    </>
  );
}

const RenderText = ({ msg, userId, rol }: any) => {
  return (
    <div
      className="truncate"
      style={{ display: "flex", gap: "4px", alignItems: "center", minWidth: 0 }}
    >
      {msg?.sender === userId && !msg?.received_at && <IconCheck size={12} />}
      {msg?.sender === userId && msg?.received_at && !msg?.read_at && (
        <IconReadMessage size={12} />
      )}
      {msg?.sender === userId && msg?.received_at && msg?.read_at && (
        <IconReadMessage size={12} color="var(--cPrimary)" />
      )}
      {msg?.$files?.length > 0 && <IconImage size={12} />}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "inline-block",
          flex: 1,
          minWidth: 0,
        }}
      >
        {msg?.text ?? rol}
      </span>
    </div>
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
      onClick={() => openChat(u.id, getFullName(u, "NsLm"))}
    >
      <div style={{ position: "relative" }}>
        {u.id == "chatBot" ? (
          <Image
            src="/assets/images/Condy.png"
            width={40}
            height={40}
            alt="Soporte Condy"
            style={{ borderRadius: "50%" }}
          />
        ) : u.isGroup ? (
          <IconGroup size={40} />
        ) : (
          <Avatar
            hasImage={u?.name ? u.has_image : user.has_image}
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
        {getFullName(u, "NsLm")}
        <br />
        <div
          className="truncate"
          style={{
            color: "var(--cWhiteV1)" /* corregido: cerramos el paréntesis */,
            display: "flex",
            gap: "4px",
            minWidth: 0 /* necesario para ellipsis dentro de flex */,
            overflow: "hidden" /* evita desbordes */,
          }}
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
