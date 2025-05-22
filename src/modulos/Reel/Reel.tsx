"use client";
import React, { useEffect, useState } from 'react';
import styles from './Reel.module.css';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { getDateTimeAgo } from '@/mk/utils/date';
import { IconComment, IconLike } from '@/components/layout/icons/IconsBiblioteca';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';

const Reel = () => {
  const { user } = useAuth();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Estado de carga inicial del componente

  const {
    data,
    loaded, // Estado 'loaded' del hook useAxios
    error,  // Es crucial manejar el estado de error del hook
    reLoad, 
  } = useAxios("/contents", "GET", {
    perPage: 20,
    page: 1, // Aún no hay paginación aquí, carga solo la página 1
    fullType: "L",
    searchBy: ""
  });

  const { execute: executeLike } = useAxios();
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
const [selectedContentIdForComments, setSelectedContentIdForComments] = useState<number | null>(null);
const [comments, setComments] = useState<any[]>([]);
const [loadingComments, setLoadingComments] = useState(false);
const { execute: executeFetchComments, error: commentsError } = useAxios();
const [newCommentText, setNewCommentText] = useState('');
const [postingComment, setPostingComment] = useState(false);
const { execute: executePostComment, error: postCommentError } = useAxios();

const fetchComments = async (contentId: number) => {
    if (!contentId) return;
    setLoadingComments(true);
    setComments([]); // Limpiar comentarios anteriores
  
    try {
      const response = await executeFetchComments(
        `/comments?fullType=L&id=${contentId}&type=C&perPage=-1&page=1`, 
        'GET'
      );
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setComments(response.data.data);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Error al cargar comentarios:', err);
      setComments([]); // Asegurarse de limpiar en caso de error
    } finally {
      setLoadingComments(false);
    }
  };
  const handlePostComment = async () => {
    if (!newCommentText.trim() || !selectedContentIdForComments || postingComment) {
      return;
    }
    setPostingComment(true);
    try {
      const response = await executePostComment('/comments', 'POST', {
        id: selectedContentIdForComments,
        comment: newCommentText,
        type: 'C',
      });
  
      if (response?.data) { // Asume que una respuesta con 'data' es éxito
        setNewCommentText(''); 
        setContents(prevContents =>
          prevContents.map(content =>
            content.id === selectedContentIdForComments
              ? { ...content, comments_count: (content.comments_count || 0) + 1 }
              : content
          )
        );
        fetchComments(selectedContentIdForComments); // Recarga los comentarios para ver el nuevo
      } else {
        console.error('Error al publicar comentario:', response?.data?.message || 'Respuesta no exitosa.');
        // Aquí podrías mostrar un toast al usuario con el error
      }
    } catch (err) {
      console.error('Error al publicar comentario (catch):', err);
       // Aquí podrías mostrar un toast al usuario, usando postCommentError si está disponible
    } finally {
      setPostingComment(false);
    }
  };
  
  const handleOpenComments = (contentId: number) => {
    setSelectedContentIdForComments(contentId);
    setIsCommentModalOpen(true);
    fetchComments(contentId);
  };
  
  const handleCloseComments = () => {
    setIsCommentModalOpen(false);
    setSelectedContentIdForComments(null);
    setComments([]);
    setNewCommentText(''); // Añade esto
    setPostingComment(false); // Y esto por si se estaba posteando y se cierra
  };

  const handleLike = async (contentId: number) => {
    try {
      const response = await executeLike('/content-like', 'POST', { id: contentId });
      if (response?.data) {
        setContents(prevContents => 
          prevContents.map(content => {
            if (content.id === contentId) {
              return {
                ...content,
                liked: content.liked ? 0 : 1,
                likes: content.liked ? (content.likes > 0 ? content.likes - 1 : 0) : (content.likes || 0) + 1
              };
            }
            return content;
          })
        );
      }
    } catch (err) {
      console.error('Error al dar like:', err);
    }
  };

  useEffect(() => {
    // Este efecto se ejecuta cuando 'data', 'loaded', o 'error' del hook useAxios cambian.
    
    // Es importante verificar 'loaded' del hook useAxios.
    // Si 'loaded' es true, significa que la petición de useAxios (para la carga inicial) ha terminado.
    if (loaded) {
      if (error) {
        console.error("Error al cargar publicaciones:", error);
        setContents([]); // Limpia el contenido si hay un error
        // Aquí podrías añadir un estado para mostrar un mensaje de error al usuario
      } else if (data?.data && Array.isArray(data.data)) {
        // Si hay datos y data.data es un array (incluso vacío)
        setContents(data.data.map((item: any) => ({ 
          ...item, 
          likes: item.likes || 0, 
          comments_count: item.comments_count || 0 
        })));
      } else {
        // Si 'loaded' es true, no hay error, pero no hay data.data o no es un array
        setContents([]); 
      }
      // Una vez que la data (o error) ha sido procesada después de que 'loaded' es true,
      // podemos estar seguros de desactivar el estado de carga del componente.
      setLoading(false);
    }
  }, [data, loaded, error]); // Asegúrate de incluir 'error' en las dependencias

  if (loading) {
    return <div className={styles.loadingState}>Cargando publicaciones...</div>;
  }

  return (
    <div className={styles.reelContainer}>
      {contents?.length > 0 ? (
        contents.map((item: any) => (
          <article key={item.id} className={styles.contentCard}>
            <header className={styles.contentHeader}>
              <div className={styles.userInfo}>
                <Avatar
                  name={getFullName(item?.user)}
                  src={getUrlImages(
                    "/ADM-" +
                    item?.user?.id +
                    ".webp?d=" +
                    item?.user?.updated_at
                  )}
                  w={44}
                  h={44}
                />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{getFullName(item?.user) || 'Usuario Desconocido'}</span>
                  <span className={styles.userRole}>Administrador</span>
                </div>
              </div>
              <time dateTime={item?.created_at} className={styles.postDate}>
                {getDateTimeAgo(item?.created_at)}
              </time>
            </header>

            <section className={styles.contentBody}>
              {item?.title && <h2 className={styles.contentTitle}>{item?.title}</h2>}
              {item?.description && <p className={styles.contentDescription}>{item?.description}</p>}
              
              {item?.images && item?.images[0] && (
                <div className={styles.contentImageContainer}>
                  <img
                    src={getUrlImages(
                      "/CONT-" +
                      item?.id +
                      "-" +
                      item?.images[0]?.id +
                      ".webp" +
                      "?" +
                      item?.updated_at
                    )}
                    alt={item?.title || 'Imagen de la publicación'}
                    className={styles.image}
                    loading="lazy"
                  />
                </div>
              )}
            </section>
            
            <footer className={styles.contentFooter}>
              <div className={styles.contentStats}>
                <button 
                  className={`${styles.statItem} ${item?.liked ? styles.liked : ''}`} 
                  onClick={() => handleLike(item.id)}
                  aria-pressed={!!item?.liked}
                  aria-label={`Me gusta esta publicación, actualmente tiene ${item.likes} me gusta`}
                >
                 <IconLike color={item?.liked ? 'var(--cInfo)' : 'var(--cWhiteV1)'} />
                  <span>{item.likes}</span>
                </button>
                <button 
                className={styles.statItem} 
                onClick={() => handleOpenComments(item.id)} // <--- MODIFICACIÓN AQUÍ
                aria-label={`Comentar esta publicación, actualmente tiene ${item.comments_count} comentarios`}
                >
                <IconComment color={'var(--cWhiteV1)'} /> {/* Añadido color por consistencia */}
                <span>{item.comments_count}</span>
                </button>
              </div>
            </footer>
          </article>
        ))
      ) : (
        // Este mensaje se mostrará si loading es false y contents está vacío
        <div className={styles.noContentState}>
          Aún no hay publicaciones para mostrar.
        </div>
      )}

{isCommentModalOpen && selectedContentIdForComments && (
    <div className={styles.commentModalOverlay} onClick={handleCloseComments}>
      <div className={styles.commentModalContent} onClick={(e) => e.stopPropagation()}>
        <header className={styles.commentModalHeader}>
          <h3 className={styles.commentModalTitle}>Comentarios</h3>
          <button onClick={handleCloseComments} className={styles.commentModalCloseButton} aria-label="Cerrar modal de comentarios">
            &times;
          </button>
        </header>
        <section className={styles.commentModalBody}>
          {loadingComments ? (
            <div className={styles.loadingComments}>Cargando comentarios...</div>
          ) : commentsError ? (
            <div className={styles.commentsError}>Error al cargar comentarios. Intenta de nuevo.</div>
          ) : comments.length > 0 ? (
            <ul className={styles.commentList}>
              {comments.map((comment: any) => (
                <li key={comment.id} className={styles.commentItem}>
                  <Avatar
                    name={getFullName(comment.user)}
                    src={getUrlImages(
                      "/ADM-" + // Asumiendo que los usuarios de comentarios también son ADM o tienes una forma de determinar el prefijo
                      comment.user?.id +
                      ".webp?d=" +
                      comment.user?.updated_at
                    )}
                    w={32}
                    h={32}
                    className={styles.commentAvatar}
                  />
                  <div className={styles.commentContent}>
                    <div className={styles.commentUserInfo}>
                      <span className={styles.commentUserName}>
                        {getFullName(comment.user) || 'Usuario'}
                      </span>
                      <time dateTime={comment.created_at} className={styles.commentDate}>
                        {getDateTimeAgo(comment.created_at)}
                      </time>
                    </div>
                    <p className={styles.commentText}>{comment.comment}</p>
                  </div>
                </li>
              ))}
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
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={postingComment}
            rows={3}
        />
        <button
            className={styles.commentPostButton}
            onClick={handlePostComment}
            disabled={postingComment || !newCommentText.trim()}
        >
            {postingComment ? 'Publicando...' : 'Publicar'}
        </button>
        </footer>
      </div>
    </div>
  )}
    </div>
  );
};

export default Reel;