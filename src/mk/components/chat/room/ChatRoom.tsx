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

import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { Avatar } from "../../ui/Avatar/Avatar";
import { Image } from "../../ui/Image/Image";
import { useChatProvider } from "../chatBot/useChatProvider";
import { getDateStrMes } from "@/mk/utils/date";

interface SelectedFile {
  file: File;
  previewURL: string;
  id: string;
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
    if (roomId.indexOf("chatBot") > -1 && selectedFiles.length > 0) cancelUpload();
  }, [roomId]);

  const cancelUpload = () => {
    selectedFiles.forEach(file => {
      URL.revokeObjectURL(file.previewURL);
    });
    setSelectedFiles([]);
    fileInputRef.current?.value && (fileInputRef.current.value = "");
    setIsUploading(false);
  };

  const removeFile = (id: string) => {
    const fileToRemove = selectedFiles.find(f => f.id === id);
    const indexToRemove = selectedFiles.findIndex(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewURL);
      setSelectedFiles(prev => {
        const updated = prev.filter(f => f.id !== id);
        // Ajustar el índice seleccionado si es necesario
        if (indexToRemove === selectedPreviewIndex && updated.length > 0) {
          setSelectedPreviewIndex(Math.max(0, selectedPreviewIndex - 1));
        } else if (selectedPreviewIndex >= updated.length && updated.length > 0) {
          setSelectedPreviewIndex(updated.length - 1);
        } else if (updated.length === 0) {
          setSelectedPreviewIndex(0);
        }
        return updated;
      });
    }
  };

  const handleSendMessage = async () => {
    const messageText = newMessage;
    const hasText = messageText.trim().length > 0;
    if (!hasText && selectedFiles.length === 0) return;

    setNewMessage("");
    typing.inputProps.onBlur();

    let msgId = 0;
    if (selectedFiles.length > 0) {
      setIsUploading(true);
      // Enviar cada imagen como un mensaje separado
      for (const selectedFile of selectedFiles) {
        msgId = await sendMessage(
          selectedFiles.length === 1 ? messageText : "",
          roomId,
          user?.id,
          selectedFile.file
        );
      }
      // Enviar el texto después de las imágenes si hay múltiples imágenes
      if (selectedFiles.length > 1 && hasText) {
        msgId = await sendMessage(messageText, roomId, user?.id);
      }
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

  const [selectedFiles, setSelectedFiles] = React.useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = React.useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (roomId.indexOf("chatBot") > -1) {
      e.target.value = "";
      return;
    }
    const files = e.target.files;
    if (files) {
      const newFiles: SelectedFile[] = Array.from(files).map(file => ({
        file,
        previewURL: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random()}`
      }));
      setSelectedFiles(prev => {
        const updated = [...prev, ...newFiles];
        setSelectedPreviewIndex(prev.length); // Seleccionar la primera nueva imagen
        return updated;
      });
    }
  };

  // Drag and Drop handlers
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (roomId.indexOf("chatBot") === -1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (roomId.indexOf("chatBot") > -1) {
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      const newFiles: SelectedFile[] = imageFiles.map(file => ({
        file,
        previewURL: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random()}`
      }));
      setSelectedFiles(prev => {
        const updated = [...prev, ...newFiles];
        setSelectedPreviewIndex(prev.length); // Seleccionar la primera nueva imagen
        return updated;
      });
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
        if (newMessage.trim().length > 0 || selectedFiles.length > 0) {
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

  // Navegación con teclado en el preview de imágenes
  useEffect(() => {
    if (selectedFiles.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && selectedPreviewIndex > 0) {
        e.preventDefault();
        setSelectedPreviewIndex(selectedPreviewIndex - 1);
      } else if (e.key === 'ArrowRight' && selectedPreviewIndex < selectedFiles.length - 1) {
        e.preventDefault();
        setSelectedPreviewIndex(selectedPreviewIndex + 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelUpload();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedFiles.length > 0) {
          removeFile(selectedFiles[selectedPreviewIndex].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFiles, selectedPreviewIndex]);

  return (
    <div 
      className={styles.chatRoomContainer}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Overlay de drag and drop */}
      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragContent}>
            <IconImage size={64} color="var(--cPrimary)" />
            <p>Suelta la imagen aquí</p>
          </div>
        </div>
      )}
      
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
                  ref={el => {
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
                        emojiStyle={EmojiStyle.APPLE}
                        style={{
                          backgroundColor: 'var(--cWhite)',
                          border: '1px solid #E8E8E8',
                        }}
                      />
                      <IconX size={10} color="black" onClick={() => handleEmojiClick(null)} />
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
                        <Image 
                          src={msg['$files'][0].url}
                          alt="Imagen adjunta"
                          w={250}
                          expandable={true}
                          expandableIcon={false}
                          expandableZIndex={10002}
                          square={true}
                          style={{ width: '100%', height: 'auto', maxWidth: '250px' }}
                          objectFit="cover"
                        />
                      )}
                      {msg.text}
                    </div>
                  </div>
                  <div
                    className={
                      styles.bubbleHour +
                      ' ' +
                      (msg.sender !== user.id && isGroup && styles.isGroup)
                    }
                  >
                    <div className={styles.messageHour}>
                      {getTimePMAM(msg.created_at)}{' '}
                      {msg.sender === user.id && !msg.received_at && <IconCheck size={12} />}
                      {msg.sender === user.id && msg.received_at && !msg.read_at && (
                        <IconReadMessage size={12} />
                      )}
                      {msg.sender === user.id && msg.received_at && msg.read_at && (
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
                              key={i + 'grp'}
                              className={`${styles.reactionBubble} ${
                                g.users.includes(String(user.id)) ? styles.myReaction : ''
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
        {selectedFiles.length > 0 && (
          <div className={styles.previewContainer}>
            <button 
              className={styles.closePreviewButton}
              onClick={cancelUpload}
              title="Cerrar vista previa (ESC)"
            >
              <IconX color="white" size={24} />
            </button>
            <div className={styles.previewContent}>
              {/* Vista previa grande */}
              <div className={styles.mainPreview}>
                <div className={styles.imageCounter}>
                  {selectedPreviewIndex + 1} / {selectedFiles.length}
                </div>
                
                {/* Botón anterior */}
                {selectedFiles.length > 1 && selectedPreviewIndex > 0 && (
                  <button 
                    className={styles.navButton + ' ' + styles.navPrev}
                    onClick={() => setSelectedPreviewIndex(selectedPreviewIndex - 1)}
                    title="Imagen anterior"
                  >
                    ‹
                  </button>
                )}
                
                {/* Botón siguiente */}
                {selectedFiles.length > 1 && selectedPreviewIndex < selectedFiles.length - 1 && (
                  <button 
                    className={styles.navButton + ' ' + styles.navNext}
                    onClick={() => setSelectedPreviewIndex(selectedPreviewIndex + 1)}
                    title="Siguiente imagen"
                  >
                    ›
                  </button>
                )}
                
                <Image 
                  src={selectedFiles[selectedPreviewIndex].previewURL} 
                  alt="Vista previa principal"
                  w={600}
                  h={400}
                  square={true}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  objectFit="contain"
                />
              </div>
              
              {/* Carrusel de miniaturas */}
              {selectedFiles.length > 1 && (
                <div className={styles.thumbnailCarousel}>
                  <div className={styles.thumbnailGrid}>
                    {selectedFiles.map((file, index) => (
                      <div 
                        key={file.id} 
                        className={`${styles.thumbnailItem} ${
                          index === selectedPreviewIndex ? styles.thumbnailSelected : ''
                        }`}
                        onClick={() => setSelectedPreviewIndex(index)}
                      >
                        <Image 
                          src={file.previewURL} 
                          alt={`Miniatura ${index + 1}`}
                          w={80}
                          h={80}
                          square={true}
                          style={{ width: '100%', height: '100%' }}
                          objectFit="cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior de input y botones: queda visible siempre */}
      <div className={styles.chatInputContainer} aria-busy={isUploading || sending}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
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
              {isUploading ? 'Subiendo imagen...' : 'Enviando...'}
            </span>
          </div>
        )}

        {/* Selector de emojis para el input */}
        {showInputEmojiPicker && (
          <div ref={inputEmojiPickerRef} className={styles.inputEmojiPicker}>
            <EmojiPicker
              onEmojiClick={handleInputEmojiSelect}
              height={350}
              width={300}
              emojiStyle={EmojiStyle.GOOGLE}
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
              padding: '4px',
              backgroundColor: 'var(--cWhiteV1)',
              opacity: isUploading || sending ? 0.5 : 1,
              pointerEvents: isUploading || sending ? 'none' : 'auto',
            }}
            reverse={true}
            title="Emojis"
          />

          {roomId.indexOf('chatBot') === -1 && (
            <IconImage
              color="var(--cBlackV1)"
              onClick={() => {
                if (!sending && !isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              circle={true}
              style={{
                padding: '4px',
                backgroundColor: 'var(--cWhiteV1)',
                opacity: isUploading || sending ? 0.5 : 1,
                pointerEvents: isUploading || sending ? 'none' : 'auto',
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
              padding: '4px',
              backgroundColor: 'var(--cAccent)',
              opacity: isUploading || sending ? 0.65 : 1,
            }}
            title="Enviar mensaje"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;



