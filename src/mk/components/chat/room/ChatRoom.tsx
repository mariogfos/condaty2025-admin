import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import styles from "./chatroom.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateStr, getTimePMAM } from "@/mk/utils/date1";
import {
  IconCheck,
  IconImage,
  IconReadMessage,
  IconX,
} from "@/components/layout/icons/IconsBiblioteca";
import { SendEmoticonType, SendMessageType } from "../chat-types";
import { Avatar } from "../../ui/Avatar/Avatar";
import EmojiPicker from "emoji-picker-react";

interface SelectedFile {
  file: File;
  previewURL: string;
}

type ChatRoomPropsType = {
  users: Record<string, any>[];
  roomId: string;
  isGroup: boolean;
  user: Record<string, any>;
  sendMessage: SendMessageType;
  sendEmoticon: SendEmoticonType;
  chats: any;
  typing: any;
  readMessage: Function;
};

const ChatRoom = ({
  users,
  roomId,
  isGroup,
  user,
  sendMessage,
  sendEmoticon,
  chats,
  typing,
  readMessage,
}: ChatRoomPropsType) => {
  const [newMessage, setNewMessage] = useState("");

  const cancelUpload = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewURL);
      setSelectedFile(null);
      fileInputRef.current?.value && (fileInputRef.current.value = "");
      setIsUploading(false);
    }
  };
  const handleSendMessage = async () => {
    if (selectedFile) {
      setIsUploading(true);
      await sendMessage(newMessage, roomId, selectedFile.file);
      cancelUpload();
    } else {
      sendMessage(newMessage, roomId);
    }
    setNewMessage("");
  };

  // Filtrar mensajes de la sala actual
  const messages = useMemo(
    () => chats?.messages?.filter((m: any) => m.roomId === roomId) || [],
    [chats, roomId]
  );

  // Marcar mensajes como leídos
  useEffect(() => {
    if (messages.length) readMessage(messages);
  }, [messages, readMessage]);

  // Auto-scroll al último mensaje
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  let oldDate: string = "null";
  let renderDate = false;
  let lastSender = "";

  const [selectedFile, setSelectedFile] = React.useState<SelectedFile | null>(
    null
  );
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { previewURL } = selectedFile || {};

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setSelectedFile({ file, previewURL });
    }
  };

  //manejo de emoticones
  const [showEmojiPicker, setShowEmojiPicker]: any = useState(null);

  const handleEmojiClick = (msg: any) => {
    // setShowEmojiPicker(!showEmojiPicker);
    setShowEmojiPicker(msg?.id === showEmojiPicker?.id ? null : msg);
  };

  const handleEmojiSelect = (emojiObject: any) => {
    // console.log("Emoji seleccionado:", emojiObject);
    const emojis = JSON.parse(showEmojiPicker.emoticon || "[]");
    emojis.push({
      emoji: emojiObject.emoji,
      sender: user.id,
      time: new Date().toISOString(),
      unified: showEmojiPicker.unified,
    });
    sendEmoticon(JSON.stringify(emojis), showEmojiPicker.id);
    setShowEmojiPicker(null);
  };

  return (
    <div style={{ position: "relative" }}>
      {previewURL && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "400px",
            zIndex: 5000,
            backgroundColor: "var(--cBlack)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconX
            style={{
              position: "absolute",
              right: "32px",
              top: "0",
              zIndex: 10,
            }}
            color="red"
            onClick={() => cancelUpload()}
          />
          {previewURL && (
            <img
              src={previewURL}
              alt="Preview"
              style={{
                objectFit: "contain",
                maxHeight: "100%",
                maxWidth: "100%",
              }}
            />
          )}
        </div>
      )}

      {showEmojiPicker !== null && (
        <div className={styles.emojiPicker}>
          <EmojiPicker
            reactionsDefaultOpen={true}
            onReactionClick={handleEmojiSelect}
            onEmojiClick={handleEmojiSelect}
          />
          <IconX
            size={10}
            color="black"
            onClick={() => handleEmojiClick(null)}
          />
        </div>
      )}
      <div className={styles.chatContainer} ref={chatRef}>
        {messages?.map((msg: any, i: number) => {
          const date = getDateStr(new Date(msg.created_at).toISOString());
          renderDate = false;
          if (oldDate != date) {
            oldDate = date;
            renderDate = true;
          }
          return (
            <Fragment key={i + msg.sender}>
              {renderDate && (
                <div className={styles.dateMarker}>
                  {getDateStr(new Date(msg.created_at).toISOString())}
                </div>
              )}
              <div
                className={`${styles.messageContainer} ${
                  msg.sender === user.id
                    ? styles.myMessage
                    : lastSender !== msg.sender
                    ? styles.otherMessage
                    : styles.otherSameMessage
                }`}
              >
                <div
                  className={msg.sender !== user.id ? styles.avatar : undefined}
                >
                  {msg.sender !== user.id && lastSender !== msg.sender ? (
                    <Avatar
                      w={32}
                      h={32}
                      name={
                        users?.find((e: any) => e.id === msg.sender)?.name ||
                        getFullName(user)
                      }
                    />
                  ) : null}
                </div>
                <div className={styles.messageBubble}>
                  {msg.sender !== user.id && (
                    <div
                      className={styles.emojiIcon}
                      onClick={() => handleEmojiClick(msg)}
                    >
                      😊
                    </div>
                  )}
                  {msg.sender !== user.id && lastSender !== msg.sender && (
                    <div className={styles.messageUser}>
                      {users?.find((e: any) => e.id === msg.sender)?.name ||
                        getFullName(user)}
                    </div>
                  )}
                  {(lastSender = msg.sender) && null}
                  <div style={{ whiteSpace: "pre-line" }}>
                    {msg["$files"].length > 0 && (
                      <a target="_blank" href={msg["$files"][0].url}>
                        <img src={msg["$files"][0].url} width={"100%"} alt="" />
                      </a>
                    )}
                    {msg.text}
                    <div className={styles.messageHour}>
                      {getTimePMAM(msg.created_at)}{" "}
                      {msg.sender === user.id && !msg.received_at && (
                        <IconCheck size={12} />
                      )}
                      {msg.sender === user.id &&
                        msg.received_at &&
                        !msg.read_at && <IconReadMessage size={12} />}
                      {msg.sender === user.id &&
                        msg.received_at &&
                        msg.read_at && (
                          <IconReadMessage size={12} color="var(--cPrimary)" />
                        )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      {msg.emoticon &&
                        (JSON.parse(msg.emoticon) || []).map(
                          (e: any, i: number) => (
                            <span key={i + "em"}>{e.emoji}</span>
                          )
                        )}
                      {((msg.emoticon && JSON.parse(msg.emoticon)) || [])
                        .length || ""}
                    </div>
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
      <div
        style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <IconImage
          color="var(--cWhite)"
          onClick={() => fileInputRef.current?.click()}
        />
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className={styles.chatInput}
          placeholder="Escribe un mensaje..."
          onBlur={typing.inputProps.onBlur}
          onKeyDown={typing.inputProps.onKeyDown}
          style={{ width: "100%" }}
        />
        <button onClick={handleSendMessage} className={styles.chatButton}>
          Enviar
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
