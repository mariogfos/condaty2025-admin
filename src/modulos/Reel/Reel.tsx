"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './Reel.module.css';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { getDateTimeAgo } from '@/mk/utils/date';
import { IconComment, IconLike, IconArrowLeft, IconArrowRight, IconShare, IconAdress, IconX, IconDocs } from '@/components/layout/icons/IconsBiblioteca';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';

type User = {
  id: string;
  name: string;
  middle_name?: string;
  last_name: string;
  mother_last_name?: string;
  updated_at: string;
};

type Image = {
  id: number;
  content_id: number;
  ext: string;
};

type Comment = {
  id: number;
  user: User;
  comment: string;
  created_at: string;
};

type ContentItem = {
  id: number;
  destiny: string;
  client_id: string;
  user_id: string;
  title: string | null;
  description: string;
  url: string;
  type: "V" | "D" | "I";
  views: number;
  status: string;
  likes: number;
  nimages: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  comments_count: number;
  liked: 0 | 1;
  images: Image[];
  user: User;
  currentImageIndex?: number;
  isDescriptionExpanded?: boolean;
};

const Reel = () => {
  const { user } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [initialLoadingState, setInitialLoadingState] = useState(true);
  const [loadingMoreState, setLoadingMoreState] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImageForModal, setSelectedImageForModal] = useState<string | null>(null);
  const [totalDBItems, setTotalDBItems] = useState(0);
  const itemsPerPage = 20;

  const observer = useRef<IntersectionObserver | null>(null);

  const {
    data: initialData,
    loaded: initialHookLoaded,
    error: initialError,
    reLoad: reLoadInitial,
  } = useAxios("/contents", "GET", {
    perPage: itemsPerPage,
    page: 1,
    fullType: "L",
    searchBy: ""
  }, false);

  const {
    execute: fetchMoreContents,
  } = useAxios();

  const { execute: executeLike } = useAxios();
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedContentIdForComments, setSelectedContentIdForComments] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { execute: executeFetchComments, error: commentsError } = useAxios();
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const { execute: executePostComment, error: postCommentError } = useAxios();

  useEffect(() => {
    reLoadInitial();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialHookLoaded && initialLoadingState) return;
    
    if (initialLoadingState) {
        setInitialLoadingState(false);
    }

    if (initialError) {
      setContents([]);
      setHasMore(false);
    } else if (initialData?.data && initialData?.message?.total !== undefined) {
      const initialItems = initialData.data.map((item: any) => ({
        ...item,
        likes: item.likes || 0,
        comments_count: item.comments_count || 0,
        currentImageIndex: 0,
        isDescriptionExpanded: false,
      }));
      setContents(initialItems);

      const totalFromAPI = initialData.message.total;
      setTotalDBItems(totalFromAPI);
      
      const calculatedLastPage = Math.ceil(totalFromAPI / itemsPerPage);
      const currentPage = 1;
      setHasMore(calculatedLastPage > currentPage);

      if (totalFromAPI === 0 || initialItems.length === 0) {
        setHasMore(false);
      }
    } else {
      setContents([]);
      setHasMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, initialHookLoaded, initialError]);

  useEffect(() => {
    const loadMoreItems = async () => {
      if (page > 1 && hasMore && !initialLoadingState && !loadingMoreState) {
        setLoadingMoreState(true);
        
        const result = await fetchMoreContents("/contents", "GET", {
          perPage: itemsPerPage,
          page: page,
          fullType: "L",
          searchBy: ""
        });

        setLoadingMoreState(false);

        if (result.error) {
          setHasMore(false);
        } else if (result.data?.data) {
          if (result.data.data.length > 0) {
            const incomingItems = result.data.data.map((item: any) => ({
              ...item,
              likes: item.likes || 0,
              comments_count: item.comments_count || 0,
              currentImageIndex: 0,
              isDescriptionExpanded: false,
            }));
            
            setContents(prevContents => {
              const existingIds = new Set(prevContents.map(content => content.id));
              const uniqueNewItems = incomingItems.filter((item: any) => !existingIds.has(item.id));
              return [...prevContents, ...uniqueNewItems];
            });
            
            const calculatedLastPage = Math.ceil(totalDBItems / itemsPerPage);
            setHasMore(calculatedLastPage > page);
          } else {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      }
    };

    loadMoreItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, initialLoadingState, loadingMoreState, fetchMoreContents, totalDBItems]);


  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (initialLoadingState || loadingMoreState) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMoreState) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [initialLoadingState, loadingMoreState, hasMore]);

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
    } catch (err) {}
  };

  const handleToggleDescription = (contentId: number) => {
    setContents(prevContents =>
      prevContents.map(content =>
        content.id === contentId
          ? { ...content, isDescriptionExpanded: !content.isDescriptionExpanded }
          : content
      )
    );
  };

  const fetchComments = async (contentId: number) => {
    if (!contentId) return;
    setLoadingComments(true);
    setComments([]);
    try {
      const response = await executeFetchComments(
        `/comments?fullType=L&id=${contentId}&type=C&perPage=-1&page=1`,
        'GET'
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
      if (response?.data) {
        setNewCommentText('');
        setContents(prevContents =>
          prevContents.map(content =>
            content.id === selectedContentIdForComments
              ? { ...content, comments_count: (content.comments_count || 0) + 1 }
              : content
          )
        );
        fetchComments(selectedContentIdForComments);
      }
    } catch (err) {} 
    finally {
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
    setNewCommentText('');
    setPostingComment(false);
  };

  const handleImageNavigation = (contentId: number, direction: 'prev' | 'next') => {
    setContents(prevContents =>
      prevContents.map((content: ContentItem) => {
        if (content.id === contentId && content.images && content.images.length > 1) {
          let newIndex = content.currentImageIndex || 0;
          if (direction === 'next') {
            newIndex = (newIndex + 1) % content.images.length;
          } else {
            newIndex = (newIndex - 1 + content.images.length) % content.images.length;
          }
          return { ...content, currentImageIndex: newIndex };
        }
        return content;
      })
    );
  };

  const handleOpenImageModal = (imageUrl: string) => {
    setSelectedImageForModal(imageUrl);
  };

  const handleCloseImageModal = () => {
    setSelectedImageForModal(null);
  };
  
  const renderMedia = (item: ContentItem) => {
    const currentImageIndex = item.currentImageIndex || 0;

    if (item.type === "I" && item.images && item.images.length > 0) {
      const currentImageObject = item.images[currentImageIndex];
      if (!currentImageObject) return null;
      const imageUrl = getUrlImages(`/CONT-${item.id}-${currentImageObject.id}.${currentImageObject.ext}?d=${item.updated_at}`);
      return (
        <div className={styles.contentMediaContainer} onClick={() => handleOpenImageModal(imageUrl)}>
          <img
            src={imageUrl}
            alt={item.title || `Imagen ${currentImageIndex + 1} de la publicación`}
            className={styles.imageCard}
            loading="lazy"
          />
          {item.images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); handleImageNavigation(item.id, 'prev'); }}
                className={`${styles.carouselButton} ${styles.prevButton}`}
                aria-label="Imagen anterior"
              >
                <IconArrowLeft color="var(--cWhite)" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleImageNavigation(item.id, 'next'); }}
                className={`${styles.carouselButton} ${styles.nextButton}`}
                aria-label="Siguiente imagen"
              >
                <IconArrowRight color="var(--cWhite)" />
              </button>
              <div className={styles.carouselIndicator}>
                {currentImageIndex + 1} / {item.images.length}
              </div>
            </>
          )}
        </div>
      );
    } else if (item.type === "V") {
      let embedUrl = '';
      let isInstagram = false;

      if (item.url.includes('youtube.com/watch?v=') || item.url.includes('youtu.be/')) {
        let videoId = '';
        if (item.url.includes('watch?v=')) {
            const urlParams = typeof URL !== 'undefined' ? new URLSearchParams(new URL(item.url).search) : null;
            videoId = urlParams?.get('v') || '';
        } else if (item.url.includes('youtu.be/')) {
            videoId = item.url.substring(item.url.lastIndexOf('/') + 1).split('?')[0];
        }
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (item.url.includes('youtube.com/shorts/')) {
        const videoId = item.url.split('shorts/')[1]?.split('?')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (item.url.includes('vimeo.com/')) {
        const videoId = item.url.split('/').pop()?.split('?')[0];
        if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
      } else if (item.url.includes('instagram.com/reel/')) {
        const reelId = item.url.split('reel/')[1]?.split('/')[0];
        if (reelId) {
            isInstagram = true; 
        }
      } else if (item.url.includes('instagram.com/p/')) {
         const postId = item.url.split('p/')[1]?.split('/')[0];
         if (postId) {
            isInstagram = true;
         }
      }

      if (embedUrl) {
        return (
          <div className={`${styles.contentMediaContainer} ${isInstagram ? styles.instagramEmbedContainer : styles.videoEmbedContainer}`}>
            <iframe
              src={embedUrl}
              title={item.title || 'Video content'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={!isInstagram}
              className={`${styles.videoFrame} ${isInstagram ? styles.instagramFrame : ''}`}
              loading="lazy"
              scrolling={isInstagram ? "no" : "auto"}
            ></iframe>
          </div>
        );
      } else if (item.url) { 
        return (
            <div className={`${styles.contentMediaContainer} ${styles.externalMediaLink}`}>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                    Ver contenido multimedia <IconShare size={16} />
                </a>
                <p className={styles.externalMediaUrl}>{item.url}</p>
            </div>
        );
      }
    } else if (item.type === "D") {
        const docUrlIsPlaceholder = item.url === "pdf" || (item.url.endsWith(".pdf") && !item.url.startsWith('http') && !item.url.startsWith('/'));
        let docUrl = item.url;
        let effectiveDocUrl = docUrl;

        if (typeof window !== 'undefined') { 
            if (docUrlIsPlaceholder) {
               docUrl = getUrlImages(`/CONT-${item.id}.pdf?d=${item.updated_at}`); 
            } else if (!item.url.startsWith('http') && !item.url.startsWith('/')) {
                docUrl = getUrlImages(item.url.startsWith('/') ? item.url : `/${item.url}`);
            }
            effectiveDocUrl = docUrl.startsWith('http') ? docUrl : `${window.location.origin}${docUrl}`;
        }
        
        return (
            <div className={`${styles.contentMediaContainer} ${styles.documentPreviewContainer}`}>
                <IconAdress size={48} color="var(--cWhiteV2)" />
                <h4 className={styles.documentTitlePreview}>{item.title || "Documento"}</h4>
                <p className={styles.documentInfoPreview}>
                    {item.description ? (item.description.substring(0, 70) + (item.description.length > 70 ? "..." : "")) : "Haga clic para ver el documento"}
                </p>
                <a href={effectiveDocUrl} target="_blank" rel="noopener noreferrer" className={styles.documentLinkButton}>
                    Abrir Documento <IconDocs size={14}/>
                </a>
            </div>
        );
    }
    return null;
  };

  if (initialLoadingState && page === 1 && contents.length === 0) {
    return <div className={styles.loadingState}>Cargando publicaciones...</div>;
  }

  return (
    <div className={styles.reelContainer}>
      {contents.length > 0 ? (
        contents.map((item: ContentItem) => (
          <article key={`content-${item.id}`} className={styles.contentCard}>
            <header className={styles.contentHeader}>
              <div className={styles.userInfo}>
                <Avatar
                  name={getFullName(item.user)}
                  src={getUrlImages(`/ADM-${item.user?.id}.webp?d=${item.user?.updated_at}`)}
                  w={44}
                  h={44}
                />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{getFullName(item.user) || 'Usuario Desconocido'}</span>
                  <span className={styles.userRole}>Administrador</span>
                </div>
              </div>
              <time dateTime={item.created_at} className={styles.postDate}>
                {getDateTimeAgo(item.created_at)}
              </time>
            </header>

            <section className={styles.contentBody}>
              {item.title && <h2 className={styles.contentTitle}>{item.title}</h2>}
              {item.description && (
                <div>
                  <p className={styles.contentDescription}>
                    {item.isDescriptionExpanded || item.description.length <= 150
                      ? item.description
                      : `${item.description.substring(0, 150)}...`}
                  </p>
                  {item.description.length > 150 && (
                    <button
                      onClick={() => handleToggleDescription(item.id)}
                      className={styles.seeMoreButton}
                      style={{ background: 'none', border: 'none', color: 'var(--cInfo)', cursor: 'pointer', padding: '5px 0px', display: 'block' }}
                    >
                      {item.isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </div>
              )}
              {renderMedia(item)}
            </section>

            <footer className={styles.contentFooter}>
              <div className={styles.contentStats}>
                <button
                  className={`${styles.statItem} ${item.liked ? styles.liked : ''}`}
                  onClick={() => handleLike(item.id)}
                  aria-pressed={!!item.liked}
                  aria-label={`Me gusta esta publicación, actualmente tiene ${item.likes} me gusta`}
                >
                  <IconLike color={item.liked ? 'var(--cInfo)' : 'var(--cWhiteV1)'} />
                  <span>{item.likes}</span>
                </button>
                <button
                  className={styles.statItem}
                  onClick={() => handleOpenComments(item.id)}
                  aria-label={`Comentar esta publicación, actualmente tiene ${item.comments_count} comentarios`}
                >
                  <IconComment color={'var(--cWhiteV1)'} />
                  <span>{item.comments_count}</span>
                </button>
              </div>
            </footer>
          </article>
        ))
      ) : (
        !initialLoadingState && <div className={styles.noContentState}>Aún no hay publicaciones para mostrar.</div>
      )}

      {loadingMoreState && <div className={styles.loadingMoreState}>Cargando más publicaciones...</div>}
      {!loadingMoreState && !initialLoadingState && hasMore && contents.length > 0 && contents.length < totalDBItems && (
        <div ref={loadMoreRef} style={{ height: '20px', margin: '20px 0' }} />
      )}
      {!initialLoadingState && !hasMore && contents.length > 0 && (
         <div className={styles.noMoreContentState}>Has llegado al final.</div>
      )}
       {!initialLoadingState && contents.length === 0 && totalDBItems === 0 && (
         <div className={styles.noContentState}>Aún no hay publicaciones para mostrar.</div>
      )}


      {isCommentModalOpen && selectedContentIdForComments && (
        <div className={styles.commentModalOverlay} onClick={handleCloseComments}>
          <div className={styles.commentModalContent} onClick={(e) => e.stopPropagation()}>
            <header className={styles.commentModalHeader}>
              <h3 className={styles.commentModalTitle}>Comentarios</h3>
              <button onClick={handleCloseComments} className={styles.commentModalCloseButton} aria-label="Cerrar modal de comentarios">
                <IconX size={24} />
              </button>
            </header>
            <section className={styles.commentModalBody}>
              {loadingComments ? (
                <div className={styles.loadingComments}>Cargando comentarios...</div>
              ) : commentsError ? (
                <div className={styles.commentsError}>Error al cargar comentarios. Intenta de nuevo.</div>
              ) : comments.length > 0 ? (
                <ul className={styles.commentList}>
                  {comments.map((comment: Comment) => (
                    <li key={`comment-${comment.id}`} className={styles.commentItem}>
                      <Avatar
                        name={getFullName(comment.user)}
                        src={getUrlImages(`/ADM-${comment.user?.id}.webp?d=${comment.user?.updated_at}`)}
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
               {postCommentError && <p className={styles.commentPostError}>Error al publicar. Intenta de nuevo.</p>}
            </footer>
          </div>
        </div>
      )}

      {selectedImageForModal && (
        <div className={styles.imageModalOverlay} onClick={handleCloseImageModal}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseImageModal} className={styles.imageModalCloseButton} aria-label="Cerrar imagen ampliada">
              <IconX size={32} />
            </button>
            <img src={selectedImageForModal} alt="Imagen ampliada" className={styles.imageModalImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reel;