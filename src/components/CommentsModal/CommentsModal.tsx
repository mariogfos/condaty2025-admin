"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import useAxios from "@/mk/hooks/useAxios";
import { getDateTimeAgo } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import styles from "./CommentsModal.module.css";

type CommentUser = {
  id: string;
  name: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
  url_avatar?: string | null;
};

type Comment = {
  id: number;
  comment: string;
  created_at: string;
  user: CommentUser | null;
  person: CommentUser | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  contentId: number | null;
  onCommentAdded?: () => void;
};

export default function CommentsModal({
  isOpen,
  onClose,
  contentId,
  onCommentAdded,
}: Props) {
  const { execute: executeFetchComments } = useAxios();
  const { execute: executePostComment } = useAxios();
  const fetchRef = useRef(executeFetchComments);
  const postRef = useRef(executePostComment);
  const requestSequenceRef = useRef(0);
  const commentsEndRef = useRef<HTMLLIElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    fetchRef.current = executeFetchComments;
    postRef.current = executePostComment;
  }, [executeFetchComments, executePostComment]);

  const fetchComments = useCallback(async () => {
    if (!contentId) return;

    const sequence = ++requestSequenceRef.current;
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetchRef.current(
        "/comments",
        "GET",
        {
          fullType: "L",
          id: contentId,
          type: "C",
          perPage: -1,
          page: 1,
        },
        false,
        true,
      );
      const payload = response?.data;

      if (response?.error || !payload?.success) {
        throw new Error(payload?.message || "No se pudieron cargar los comentarios");
      }

      if (sequence !== requestSequenceRef.current) return;

      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : [];
      setComments(items);
    } catch (error) {
      if (sequence !== requestSequenceRef.current) return;
      setComments([]);
      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los comentarios",
      );
    } finally {
      if (sequence === requestSequenceRef.current) setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    if (!isOpen || !contentId) {
      requestSequenceRef.current += 1;
      setComments([]);
      setNewCommentText("");
      setLoadError("");
      setPostError("");
      setLoading(false);
      setPosting(false);
      return;
    }

    void fetchComments();
  }, [contentId, fetchComments, isOpen]);

  useEffect(() => {
    if (!isOpen || loading) return;
    commentsEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [comments, isOpen, loading]);

  const handlePostComment = async (event?: FormEvent) => {
    event?.preventDefault();
    const comment = newCommentText.trim();
    if (!comment || !contentId || posting) return;

    setPosting(true);
    setPostError("");

    try {
      const response = await postRef.current(
        "/comments",
        "POST",
        { id: contentId, comment, type: "C" },
        false,
        true,
      );
      const payload = response?.data;

      if (response?.error || !payload?.success) {
        throw new Error(payload?.message || "No se pudo publicar el comentario");
      }

      setNewCommentText("");
      await fetchComments();
      onCommentAdded?.();
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (error) {
      setPostError(
        error instanceof Error
          ? error.message
          : "No se pudo publicar el comentario",
      );
    } finally {
      setPosting(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handlePostComment();
    }
  };

  return (
    <DataModal
      open={isOpen}
      onClose={onClose}
      title="Comentarios"
      buttonText=""
      buttonCancel=""
      className={styles.modalBody}
      maxWidth={620}
      style={{
        width: "min(620px, calc(100vw - 24px))",
        height: "min(720px, calc(100vh - 32px))",
      }}
      zIndex={1140}
      ignoreTranslation
    >
      <div className={styles.summary}>
        <span className={styles.summaryIcon} aria-hidden="true">
          <MessageCircle size={15} />
        </span>
        <strong>
          {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
        </strong>
      </div>

      <div className={styles.commentsViewport} aria-live="polite">
        {loading ? (
          <div className={styles.state}>
            <span className={styles.spinner} aria-hidden="true" />
            <strong>Cargando conversación</strong>
            <span>Un momento, por favor.</span>
          </div>
        ) : loadError ? (
          <div className={styles.state}>
            <span className={styles.stateIcon} aria-hidden="true">
              <RefreshCw size={20} />
            </span>
            <strong>No pudimos cargar los comentarios</strong>
            <span>{loadError}</span>
            <button type="button" onClick={() => void fetchComments()}>
              Reintentar
            </button>
          </div>
        ) : comments.length > 0 ? (
          <ul className={styles.commentList}>
            {comments.map((comment) => {
              const author = comment.user || comment.person;
              const authorName = author
                ? getFullName(author) || "Usuario"
                : "Usuario";

              return (
                <li key={comment.id} className={styles.commentItem}>
                  <Avatar
                    name={authorName}
                    src={author?.url_avatar || undefined}
                    w={38}
                    h={38}
                  />
                  <div className={styles.commentBubble}>
                    <div className={styles.commentMeta}>
                      <strong data-i18n-ignore="true">{authorName}</strong>
                      <time dateTime={comment.created_at}>
                        {getDateTimeAgo(comment.created_at)}
                      </time>
                    </div>
                    <p data-i18n-ignore="true">{comment.comment}</p>
                  </div>
                </li>
              );
            })}
            <li ref={commentsEndRef} className={styles.scrollAnchor} />
          </ul>
        ) : (
          <div className={styles.state}>
            <span className={styles.stateIcon} aria-hidden="true">
              <MessageCircle size={20} />
            </span>
            <strong>Inicia la conversación</strong>
            <span>Sé la primera persona en comentar esta publicación.</span>
          </div>
        )}
      </div>

      <form className={styles.composer} onSubmit={handlePostComment}>
        <div className={styles.inputShell}>
          <textarea
            ref={inputRef}
            value={newCommentText}
            onChange={(event) => setNewCommentText(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Escribe un comentario…"
            aria-label="Nuevo comentario"
            disabled={posting}
            rows={2}
            maxLength={2000}
          />
          <button
            type="submit"
            aria-label="Publicar comentario"
            disabled={posting || !newCommentText.trim()}
          >
            <Send size={17} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.composerMeta}>
          {postError ? (
            <span className={styles.postError}>{postError}</span>
          ) : (
            <span>Ctrl/⌘ + Enter para publicar</span>
          )}
          <span>{newCommentText.length}/2000</span>
        </div>
      </form>
    </DataModal>
  );
}
