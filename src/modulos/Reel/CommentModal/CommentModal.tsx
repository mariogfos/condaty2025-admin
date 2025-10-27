import React, { useRef, useEffect } from "react";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeAgo } from "@/mk/utils/date";
import { IconX } from "@/components/layout/icons/IconsBiblioteca";
import { Comment } from "../types";
import styles from "./CommentModal.module.css";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number | null;
  comments: Comment[];
  loadingComments: boolean;
  commentsError: any;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  postingComment: boolean;
  postCommentError: any;
  onPostComment: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  contentId,
  comments,
  loadingComments,
  commentsError,
  newCommentText,
  setNewCommentText,
  postingComment,
  postCommentError,
  onPostComment
}) => {
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isOpen]);

  if (!isOpen || !contentId) {
    return null;
  }

  return (
    <div className={styles.commentModalOverlay} onClick={onClose}>
      <div className={styles.commentModalContent} onClick={e => e.stopPropagation()}>
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
            <div className={styles.loadingComments}>Cargando comentarios...</div>
          ) : commentsError ? (
            <div className={styles.commentsError}>
              Error al cargar comentarios. Intenta de nuevo.
            </div>
          ) : comments.length > 0 ? (
            <ul className={styles.commentList}>
              {comments.map((comment: Comment) => (
                <li key={`comment-${comment.id}`} className={styles.commentItem}>
                  <Avatar
                    hasImage={1}
                    name={comment.user?.name || comment.person?.name || 'Usuario'}
                    src={
                      comment.user
                        ? getUrlImages(
                            `/ADM-${comment.user.id}.webp?d=${comment.user.updated_at || ''}`
                          )
                        : comment.person?.id
                        ? getUrlImages(
                            `/OWNER-${comment.person.id}.webp?d=${
                              comment.person.updated_at || ''
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
                          : 'Usuario'}
                      </span>
                      <time dateTime={comment.created_at} className={styles.commentDate}>
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
            <div className={styles.noCommentsYet}>Aún no hay comentarios. ¡Sé el primero!</div>
          )}
        </section>

        <footer className={styles.commentModalFooter}>
          <textarea
            placeholder="Escribe tu comentario..."
            className={styles.commentInput}
            value={newCommentText}
            onChange={e => setNewCommentText(e.target.value)}
            disabled={postingComment}
            rows={3}
          />
          <button
            className={styles.commentPostButton}
            onClick={onPostComment}
            disabled={postingComment || !newCommentText.trim()}
          >
            {postingComment ? 'Publicando...' : 'Comentar'}
          </button>
          {postCommentError && (
            <p className={styles.commentPostError}>Error al publicar. Intenta de nuevo.</p>
          )}
        </footer>
      </div>
    </div>
  );
};

export default CommentModal;
