/* eslint-disable @next/next/no-img-element */
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import styles from "./chatroom.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateStr, getTimePMAM } from "@/mk/utils/date1";
import {
  IconCheck,
  IconEmoji,
  IconImage,
  IconReadMessage,
  IconSend,
  IconX,
} from "@/components/layout/icons/IconsBiblioteca";
import { SendEmoticonType, SendMessageType } from "../chat-types";

import EmojiPicker from "emoji-picker-react";
import { Avatar } from "../../ui/Avatar/Avatar";
import { useChatProvider } from "../chatBot/useChatProvider";
import { getDateStrMes } from "@/mk/utils/date";

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
  sending: boolean;
  readMessage: Function;
  db: any;
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
  sending,
  readMessage,
  db,
}: ChatRoomPropsType) => {
  const [newMessage, setNewMessage] = useState("");
  const { sendMessageBot } = useChatProvider({ provider: "kimi" });

  useEffect(() => {
    setShowEmojiPicker(null);
    setNewMessage("");
    if (roomId.indexOf("chatBot") > -1 && selectedFile) cancelUpload();
  }, [roomId]);

  const cancelUpload = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewURL);
      setSelectedFile(null);
      fileInputRef.current?.value && (fileInputRef.current.value = "");
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    const messageText = newMessage;
    const hasText = messageText.trim().length > 0;
    if (!hasText && !selectedFile) return;

    setNewMessage("");
    typing.inputProps.onBlur();

    let msgId = 0;
    if (selectedFile) {
      setIsUploading(true);
      msgId = await sendMessage(
        messageText,
        roomId,
        user?.id,
        selectedFile.file
      );
      cancelUpload();
    } else {
      msgId = await sendMessage(messageText, roomId, user?.id);
    }

    if (roomId.indexOf("chatBot") > -1) {
      db.transact(
        db.tx.messages[msgId].update({
          received_at: Date.now(),
        })
      );
      const reply = await sendMessageBot(messageText);
      if (reply != "") {
        await sendMessage(reply, roomId, "chatBot");
        db.transact(
          db.tx.messages[msgId].update({
            read_at: Date.now(),
          })
        );
      }
    }
  };



  const messages = useMemo(
    () => chats?.messages?.filter((m: any) => m.roomId === roomId) || [],
    [chats, roomId]
  );

  useEffect(() => {
    if (messages.length) readMessage(messages);
  }, [messages, readMessage]);

  // Auto-scroll al último mensaje
  const chatRef = useRef<HTMLDivElement>(null);
  let ultSize = useRef<number>(0);
  useEffect(() => {
    if (ultSize.current != messages?.length && chatRef.current) {
      ultSize.current = messages?.length;
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
    if (roomId.indexOf("chatBot") > -1) {
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setSelectedFile({ file, previewURL });
    }
  };

  const [showEmojiPicker, setShowEmojiPicker]: any = useState(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputEmojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiClick = (msg: any) => {
    if (!msg) {
      setShowEmojiPicker(null);
      return;
    }
    if (showEmojiPicker?.id === msg.id) {
      setShowEmojiPicker(null);
      return;
    }

    const chatEl = chatRef.current;
    const msgEl = msgRefs.current[msg.id];
    let placeBelow = false;
    const pickerHeight = 320;
    const margin = 16;

    if (chatEl && msgEl) {
      const chatRect = chatEl.getBoundingClientRect();
      const msgRect = msgEl.getBoundingClientRect();
      const availableAbove = msgRect.top - chatRect.top;
      placeBelow = availableAbove < pickerHeight + margin;
    }

    setShowEmojiPicker({ ...msg, placeBelow });
  };

  const handleEmojiSelect = (emojiObject: any) => {
    const emojis = JSON.parse(showEmojiPicker?.emoticon || "[]");
    const idx = emojis.findIndex((e: any) => e.sender === user.id);

    if (idx >= 0) {
      if (emojis[idx].emoji === emojiObject.emoji) {
        emojis.splice(idx, 1);
      } else {
        emojis[idx] = {
          ...emojis[idx],
          emoji: emojiObject.emoji,
          time: new Date().toISOString(),
          unified: showEmojiPicker?.unified,
        };
      }
    } else {
      emojis.push({
        emoji: emojiObject.emoji,
        sender: user.id,
        time: new Date().toISOString(),
        unified: showEmojiPicker?.unified,
      });
    }

    sendEmoticon(JSON.stringify(emojis), showEmojiPicker.id);
    setShowEmojiPicker(null);
  };

  const onKeyUp = (e: any) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        setNewMessage(newMessage + '\n');
      } else {
        if (newMessage.trim().length > 0 || selectedFile) {
          handleSendMessage();
        }
      }
    }
  };

  const handleInputEmojiSelect = (emojiObject: any) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    textareaRef.current?.focus();
  };

  // Cerrar el picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputEmojiPickerRef.current && !inputEmojiPickerRef.current.contains(event.target as Node)) {
        setShowInputEmojiPicker(false);
      }
    };

    if (showInputEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInputEmojiPicker]);

  return (
    <div className={styles.chatRoomContainer}>
      {/* Área de mensajes con overlay relativo */}
      <div className={styles.messagesArea}>
        <div className={styles.chatMsgContainer} ref={chatRef}>
          {messages?.map((msg: any, i: number) => {
            const userMsg = users?.find((e: any) => e.id === msg.sender);
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
                    {getDateStrMes(new Date(msg.created_at).toISOString())}
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
                  style={{ position: 'relative' }}
                  ref={(el) => {
                    msgRefs.current[msg.id] = el;
                  }}
                >
                  {/* Emoji Picker anclado al mensaje que lo invoca */}
                  {showEmojiPicker?.id === msg.id && (
                    <div
                      className={styles.emojiPicker}
                      style={{
                        ...(showEmojiPicker?.placeBelow
                          ? { top: 'calc(100% + 8px)', bottom: 'auto' }
                          : { bottom: 'calc(100% + 8px)', top: 'auto' }),
                      }}
                    >
                      <EmojiPicker
                        reactionsDefaultOpen={true}
                        onReactionClick={handleEmojiSelect}
                        onEmojiClick={handleEmojiSelect}
                        height={320}
                        style={{
                          backgroundColor: 'var(--cWhite)',
                          border: '1px solid #E8E8E8',
                        }}
                      />
                      <IconX
                        size={10}
                        color="black"
                        onClick={() => handleEmojiClick(null)}
                      />
                    </div>
                  )}
                  <div
                    className={isGroup && msg.sender !== user.id ? styles.avatar : styles.noAvatar}
                  >
                    {isGroup && msg.sender !== user.id && lastSender !== msg.sender ? (
                      <Avatar
                        hasImage={userMsg?.name ? userMsg.has_image : user.has_image}
                        src={getUrlImages('/ADM-' + userMsg?.id + '.webp?d=' + userMsg?.updated_at)}
                        w={32}
                        h={32}
                        name={userMsg?.name ?? getFullName(user)}
                      />
                    ) : null}
                  </div>
                  <div className={styles.messageBubble}>
                    {msg.sender !== user.id && (
                      <div className={styles.emojiIcon} onClick={() => handleEmojiClick(msg)}>
                        😊
                      </div>
                    )}
                    {isGroup && msg.sender !== user.id && lastSender !== msg.sender && (
                      <div className={styles.messageUser}>{userMsg?.name ?? getFullName(user)}</div>
                    )}
                    {(lastSender = msg.sender) && null}
                    <div
                      style={{
                        whiteSpace: 'pre-line',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {msg['$files'].length > 0 && (
                        <a target="_blank" href={msg['$files'][0].url}>
                          <img src={msg['$files'][0].url} width={'100%'} alt="" />
                        </a>
                      )}
                      {msg.text}
                    </div>
                  </div>
                  <div
                    className={
                      styles.bubbleHour +
                      " " +
                      (msg.sender !== user.id && isGroup && styles.isGroup)
                    }
                  >
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
                    {/* Render de reacciones agrupadas y resaltado del usuario actual */}
                    {(() => {
                      const reactions = (msg.emoticon && JSON.parse(msg.emoticon)) || [];
                      type ReactionAgg = { emoji: string; count: number; users: string[] };

                      const grouped: ReactionAgg[] = Object.values(
                        reactions.reduce((acc: Record<string, ReactionAgg>, r: any) => {
                          const key = String(r.emoji);
                          if (!acc[key]) {
                            acc[key] = { emoji: key, count: 0, users: [] };
                          }
                          acc[key].count += 1;
                          acc[key].users.push(String(r.sender));
                          return acc;
                        }, {} as Record<string, ReactionAgg>)
                      );

                      return (
                        <div className={styles.reactionContainer}>
                          {grouped.map((g, i) => (
                            <span
                              key={i + "grp"}
                              className={`${styles.reactionBubble} ${
                                g.users.includes(String(user.id)) ? styles.myReaction : ""
                              }`}
                            >
                              <span>{g.emoji}</span>
                              <span>{g.count}</span>
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
        {previewURL && (
          <div className={styles.previewContainer}>
            <IconX color="red" onClick={() => cancelUpload()} />
            <img src={previewURL} alt="Preview" />
          </div>
        )}
      </div>

      {/* Barra inferior de input y botones: queda visible siempre */}
      <div className={styles.chatInputContainer} aria-busy={isUploading || sending}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className={styles.chatInput}
          placeholder="Escribe un mensaje..."
          onBlur={typing.inputProps.onBlur}
          onKeyDown={typing.inputProps.onKeyDown}
          onKeyUp={onKeyUp}
          ref={textareaRef}
        />

        {/* Overlay de loading mientras se envía o carga */}
        {(isUploading || sending) && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loader} />
            <span className={styles.loadingText}>
              {isUploading ? "Subiendo imagen..." : "Enviando..."}
            </span>
          </div>
        )}

        {/* Selector de emojis para el input */}
        {showInputEmojiPicker && (
          <div
            ref={inputEmojiPickerRef}
            className={styles.inputEmojiPicker}
          >
            <EmojiPicker
              onEmojiClick={handleInputEmojiSelect}
              height={350}
              width={300}
              style={{ backgroundColor: 'var(--cWhite)' }}
            />
          </div>
        )}

        <div className={styles.chatButton}>
          <IconEmoji
            color="var(--cBlackV1)"
            onClick={() => {
              if (!sending && !isUploading) {
                setShowInputEmojiPicker(!showInputEmojiPicker);
              }
            }}
            circle={true}
            style={{
              padding: "4px",
              backgroundColor: "var(--cWhiteV1)",
              opacity: (isUploading || sending) ? 0.5 : 1,
              pointerEvents: (isUploading || sending) ? "none" : "auto",
            }}
            reverse={true}
            title="Emojis"
          />

          {roomId.indexOf("chatBot") === -1 && (
            <IconImage
              color="var(--cBlackV1)"
              onClick={() => {
                if (!sending && !isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              circle={true}
              style={{
                padding: "4px",
                backgroundColor: "var(--cWhiteV1)",
                opacity: (isUploading || sending) ? 0.5 : 1,
                pointerEvents: (isUploading || sending) ? "none" : "auto",
              }}
              title="Adjuntar imagen"
            />
          )}

          <IconSend
            color="var(--cBlackV1)"
            onClick={() => {
              if (!sending && !isUploading) handleSendMessage();
            }}
            circle={true}
            reverse={true}
            style={{
              padding: "4px",
              backgroundColor: "var(--cAccent)",
              opacity: (isUploading || sending) ? 0.65 : 1,
            }}
            title="Enviar mensaje"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;



