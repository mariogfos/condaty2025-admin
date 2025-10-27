import React, { useEffect, useState, useRef } from "react";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeAgo } from "@/mk/utils/date";
import { IconX } from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import styles from "./CommentsModal.module.css";

type CommentUser = {
  id: string;
  name: string;
  middle_name?: string;
  last_name: string;
  mother_last_name?: string;
  updated_at?: string;
  has_image?: any;
};

type Comment = {
  id: number;
  comment: string;
  user_id: string | null;
  person_id: string | null;
  type: string;
  event_id: number | null;
  content_id: number;
  created_at: string;
  user: CommentUser | null;
  person: CommentUser | null;
};

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number | null;
  onCommentAdded?: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  contentId,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const { execute: executeFetchComments, error: commentsError } = useAxios();
  const { execute: executePostComment, error: postCommentError } = useAxios();

  const fetchComments = async (id: number) => {
    if (!id) return;
    setLoadingComments(true);
    setComments([]);
    try {
      const response = await executeFetchComments(
        `/comments?fullType=L&id=${id}&type=C&perPage=-1&page=1`,
        "GET"
      );
      if (response?.data && Array.isArray(response.data)) {
        setComments(response.data);
      } else {
        if (response?.data?.data && Array.isArray(response.data.data)) {
          setComments(response.data.data);
        } else {
          setComments([]);
        }
      }
    } catch (err) {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !contentId || postingComment) {
      return;
    }
    setPostingComment(true);
    try {
      const response = await executePostComment("/comments", "POST", {
        id: contentId,
        comment: newCommentText,
        type: "C",
      });
      if (response?.data) {
        setNewCommentText("");
        fetchComments(contentId);
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (err) {
    } finally {
      setPostingComment(false);
    }
  };

  useEffect(() => {
    if (isOpen && contentId) {
      fetchComments(contentId);
    }
  }, [isOpen, contentId]);

  useEffect(() => {
    if (isOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.commentModalOverlay} onClick={onClose}>
      <div
        className={styles.commentModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.commentModalHeader}>
          <h3 className={styles.commentModalTitle}>Comentarios</h3>
          <button
            onClick={onClose}
            className={styles.commentModalCloseButton}
            aria-label="Cerrar modal de comentarios"
          >
            <IconX size={24} />
          </button>
        </header>
        <section className={styles.commentModalBody}>
          {loadingComments ? (
            <div className={styles.loadingComments}>
              Cargando comentarios...
            </div>
          ) : commentsError ? (
            <div className={styles.commentsError}>
              Error al cargar comentarios. Intenta de nuevo.
            </div>
          ) : comments.length > 0 ? (
            <ul className={styles.commentList}>
              {comments.map((comment: Comment) => (
                <li
                  key={`comment-${comment.id}`}
                  className={styles.commentItem}
                >
                  <Avatar
                    hasImage={
                      comment.user?.name
                        ? comment.user.has_image
                        : comment.person?.has_image
                    }
                    name={
                      comment.user?.name ||
                      comment.person?.name ||
                      "Usuario"
                    }
                    src={
                      comment.user
                        ? getUrlImages(
                            `/ADM-${comment.user.id}.webp?d=${
                              comment.user.updated_at || ""
                            }`
                          )
                        : comment.person?.id
                        ? getUrlImages(
                            `/OWNER-${comment.person.id}.webp?d=${
                              comment.person.updated_at || ""
                            }`
                          )
                        : undefined
                    }
                    w={32}
                    h={32}
                    className={styles.commentAvatar}
                  />
                  <div className={styles.commentContent}>
                    <div className={styles.commentUserInfo}>
                      <span className={styles.commentUserName}>
                        {comment.user?.name
                          ? getFullName(comment.user)
                          : comment.person?.name
                          ? getFullName(comment.person)
                          : "Usuario"}
                      </span>
                      <time
                        dateTime={comment.created_at}
                        className={styles.commentDate}
                      >
                        {getDateTimeAgo(comment.created_at)}
                      </time>
                    </div>
                    <p className={styles.commentText}>{comment.comment}</p>
                  </div>
                </li>
              ))}
              <div ref={commentsEndRef} />
            </ul>
          ) : (
            <div className={styles.noCommentsYet}>
              Aún no hay comentarios. ¡Sé el primero!
            </div>
          )}
        </section>
        <footer className={styles.commentModalFooter}>
          <textarea
            placeholder="Escribe tu comentario..."
            className={styles.commentInput}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={postingComment}
            rows={3}
          />
          <button
            className={styles.commentPostButton}
            onClick={handlePostComment}
            disabled={postingComment || !newCommentText.trim()}
          >
            {postingComment ? "Publicando..." : "Comentar"}
          </button>
          {postCommentError && (
            <p className={styles.commentPostError}>
              Error al publicar. Intenta de nuevo.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
};

export default CommentsModal;
