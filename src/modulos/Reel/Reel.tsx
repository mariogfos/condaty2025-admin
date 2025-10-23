'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import styles from './Reel.module.css';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { getDateTimeAgo } from '@/mk/utils/date';
import {
  IconComment,
  IconLike,
  IconX,
  IconPublicacion,
} from '@/components/layout/icons/IconsBiblioteca';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';
import EmptyData from '@/components/NoData/EmptyData';
import RenderView from '@/modulos/Contents/RenderView/RenderView';
import AddContent from '@/modulos/Contents/AddContent/AddContent';

// Importar componentes extraídos
import MediaRenderer from './MediaRenderer/MediaRenderer';
import ReelCompactList from './ReelCompactList/ReelCompactList';
import CommentModal from './CommentModal/CommentModal';
import { ContentItem, Comment } from './types';

const Reel = () => {
  const { user, showToast } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [initialLoadingState, setInitialLoadingState] = useState(true);
  const [loadingMoreState, setLoadingMoreState] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalDBItems, setTotalDBItems] = useState(0);
  const itemsPerPage = 20;
  const [selectedContentForModal, setSelectedContentForModal] = useState<ContentItem | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  // Estados para manejar la edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editErrors, setEditErrors] = useState<any>({});
  const [extraData, setExtraData] = useState<any>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  // Estados para comentarios
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedContentIdForComments, setSelectedContentIdForComments] = useState<number | null>(
    null
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const {
    data: initialData,
    loaded: initialHookLoaded,
    error: initialError,
    reLoad: reLoadInitial,
  } = useAxios(
    '/contents',
    'GET',
    {
      perPage: itemsPerPage,
      page: 1,
      fullType: 'L',
      searchBy: '',
      extraData: true,
    },
    false
  );

  const { execute: fetchMoreContents } = useAxios();
  const { execute: executeLike } = useAxios();
  const { execute: executeFetchComments, error: commentsError } = useAxios();
  const { execute: executePostComment, error: postCommentError } = useAxios();
  const { execute: executeEdit } = useAxios();
  const { execute: executeGetExtraData } = useAxios();

  useEffect(() => {
    reLoadInitial();
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
  }, [initialData, initialHookLoaded, initialError]);

  // Función para cargar extraData cuando sea necesario
  const loadExtraData = async () => {
    if (!extraData) {
      try {
        const response = await executeGetExtraData('/contents', 'GET', {
          fullType: 'EXTRA',
        });
        if (response?.data) {
          setExtraData(response.data);
        }
      } catch (error) {
        console.error('Error loading extra data:', error);
      }
    }
  };

  useEffect(() => {
    const loadMoreItems = async () => {
      if (page > 1 && hasMore && !initialLoadingState && !loadingMoreState) {
        setLoadingMoreState(true);

        const result = await fetchMoreContents('/contents', 'GET', {
          perPage: itemsPerPage,
          page: page,
          fullType: 'L',
          searchBy: '',
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
  }, [page, hasMore, initialLoadingState, loadingMoreState, fetchMoreContents, totalDBItems]);

  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (initialLoadingState || loadingMoreState) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMoreState) {
          setPage(prevPage => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [initialLoadingState, loadingMoreState, hasMore]
  );

  // Función handleLike con patrón optimista
  const handleLike = async (contentId: number) => {
    // Actualización optimista inmediata
    setContents(prevContents =>
      prevContents.map(content => {
        if (content.id === contentId) {
          const wasLiked = content.liked === 1;
          return {
            ...content,
            liked: wasLiked ? 0 : 1,
            likes: wasLiked ? Math.max(0, content.likes - 1) : content.likes + 1,
          } as ContentItem;
        }
        return content;
      })
    );

    // También actualizar el modal si está abierto
    setSelectedContentForModal(prevModalContent => {
      if (prevModalContent && prevModalContent.id === contentId) {
        const wasLiked = prevModalContent.liked === 1;
        return {
          ...prevModalContent,
          liked: wasLiked ? 0 : 1,
          likes: wasLiked ? Math.max(0, prevModalContent.likes - 1) : prevModalContent.likes + 1,
        };
      }
      return prevModalContent;
    });

    // Llamada al backend
    try {
      const response = await executeLike('/content-like', 'POST', {
        id: contentId,
      });

      // Si el backend devuelve error, revertir el cambio optimista
      if (!response?.data) {
        // Revertir cambios
        setContents(prevContents =>
          prevContents.map(content => {
            if (content.id === contentId) {
              const wasLiked = content.liked === 1;
              return {
                ...content,
                liked: wasLiked ? 0 : 1,
                likes: wasLiked ? Math.max(0, content.likes - 1) : content.likes + 1,
              } as ContentItem;
            }
            return content;
          })
        );
        setSelectedContentForModal(prevModalContent => {
          if (prevModalContent && prevModalContent.id === contentId) {
            const wasLiked = prevModalContent.liked === 1;
            return {
              ...prevModalContent,
              liked: wasLiked ? 0 : 1,
              likes: wasLiked
                ? Math.max(0, prevModalContent.likes - 1)
                : prevModalContent.likes + 1,
            };
          }
          return prevModalContent;
        });
      }
    } catch (err) {
      // En caso de error, revertir el cambio optimista
      setContents(prevContents =>
        prevContents.map(content => {
          if (content.id === contentId) {
            const wasLiked = content.liked === 1;
            return {
              ...content,
              liked: wasLiked ? 0 : 1,
              likes: wasLiked ? Math.max(0, content.likes - 1) : content.likes + 1,
            } as ContentItem;
          }
          return content;
        })
      );
      setSelectedContentForModal(prevModalContent => {
        if (prevModalContent && prevModalContent.id === contentId) {
          const wasLiked = prevModalContent.liked === 1;
          return {
            ...prevModalContent,
            liked: wasLiked ? 0 : 1,
            likes: wasLiked ? Math.max(0, prevModalContent.likes - 1) : prevModalContent.likes + 1,
          };
        }
        return prevModalContent;
      });
    }
  };

  const handleToggleDescription = (contentId: number) => {
    setContents(prevContents =>
      prevContents.map(content =>
        content.id === contentId
          ? {
              ...content,
              isDescriptionExpanded: !content.isDescriptionExpanded,
            }
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
              ? {
                  ...content,
                  comments_count: (content.comments_count || 0) + 1,
                }
              : content
          )
        );
        fetchComments(selectedContentIdForComments);
      }
    } catch (err) {
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
    setNewCommentText('');
    setPostingComment(false);
  };

  const handleImageNavigation = (contentId: number, direction: 'prev' | 'next') => {
    let updatedItemForModal: any | null = null;

    const newContents = contents.map(content => {
      if (content.id === contentId && content.images && content.images.length > 1) {
        const newIndex =
          direction === 'next'
            ? ((content.currentImageIndex || 0) + 1) % content.images.length
            : ((content.currentImageIndex || 0) - 1 + content.images.length) %
              content.images.length;

        const updatedContent = { ...content, currentImageIndex: newIndex };
        updatedItemForModal = updatedContent;
        return updatedContent;
      }
      return content;
    });

    setContents(newContents);

    if (
      selectedContentForModal &&
      updatedItemForModal &&
      selectedContentForModal.id === updatedItemForModal.id
    ) {
      setSelectedContentForModal(updatedItemForModal);
    }
  };

  const handleOpenContentModal = (contentItem: ContentItem) => {
    setSelectedContentForModal(contentItem);
    setIsContentModalOpen(true);
  };

  const handleCloseContentModal = () => {
    setSelectedContentForModal(null);
    setIsContentModalOpen(false);
  };

  // Función mejorada para manejar la edición
  const handleEditContent = async (item: any) => {
    console.log('Editando contenido:', item);

    // Cargar extraData si no está disponible
    await loadExtraData();

    // Preparar el item para edición con todos los campos necesarios
    const editItem = {
      ...item,
      title: item.title || '',
      description: item.description || '',
      type: item.type,
      url: item.url || '',
      images: item.images || [],
      user_id: item.user_id,
      destiny: item.destiny || 'T',
      client_id: item.client_id,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      cdestinies: item.cdestinies || [],
      lDestiny: item.lDestiny || [],
    };

    console.log('Item preparado para edición:', editItem);

    setEditingContent(editItem);
    setEditErrors({});
    setIsEditModalOpen(true);
    handleCloseContentModal();
  };

  const handleCloseEditModal = () => {
    console.log('Cerrando modal de edición');
    setIsEditModalOpen(false);
    setEditingContent(null);
    setEditErrors({});
  };

  const handleSaveEdit = () => {
    console.log('Guardando edición');
    handleReloadReel();
    handleCloseEditModal();
  };

  const handleDeleteContent = (item: any) => {
    console.log('Contenido eliminado:', item);
    setContents(prevContents =>
      prevContents.filter(content => content.id !== item.id)
    );
    setTotalDBItems(prev => Math.max(0, prev - 1));
    handleCloseContentModal();
  };

  const handleReloadReel = () => {
    setPage(1);
    setHasMore(true);
    reLoadInitial();
  };

  // Función para determinar si es una noticia y su posición
  const getNewsIndex = (items: ContentItem[], currentIndex: number) => {
    const newsItems = items.filter(item => item.title && item.title.trim() !== '');
    const currentItem = items[currentIndex];
    if (!currentItem.title || currentItem.title.trim() === '') return -1;
    return newsItems.findIndex(newsItem => newsItem.id === currentItem.id);
  };

  if (initialLoadingState && page === 1 && contents.length === 0) {
    return <div className={styles.loadingState}>Cargando publicaciones...</div>;
  }

  return (
    <div className={styles.reelContainer}>
      {contents.length > 0
        ? contents.map((item: ContentItem, index: number) => {
            const isNews = item.title && item.title.trim() !== '';
            const newsIndex = getNewsIndex(contents, index);
            const isImageRight = newsIndex % 2 === 0; // Par = imagen derecha, Impar = imagen izquierda

            return (
              <article
                key={`content-${item.id}`}
                className={`${styles.contentCard} ${isNews ? styles.newsCard : ''} ${isNews && isImageRight ? styles.newsImageRight : ''} ${isNews && !isImageRight ? styles.newsImageLeft : ''}`}
              >
                <header className={styles.contentHeader}>
                  <div className={styles.userInfo}>
                    <Avatar
                      hasImage={1}
                      name={getFullName(item.user)}
                      src={getUrlImages(`/ADM-${item.user?.id}.webp?d=${item.user?.updated_at}`)}
                      w={44}
                      h={44}
                    />
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>
                        {getFullName(item.user) || 'Usuario Desconocido'}
                      </span>
                      <span className={styles.userRole}>{item.user?.role1?.[0].name}</span>
                    </div>
                  </div>
                  <time dateTime={item.created_at} className={styles.postDate}>
                    {getDateTimeAgo(item.created_at)}
                  </time>
                </header>

                {isNews ? (
                  // Layout para noticias (texto e imagen lado a lado)
                  <section className={styles.newsContentBody}>
                    <div className={styles.newsTextContent}>
                      <h2 className={styles.newsTitle}>{item?.title}</h2>
                      <div>
                        {
                          item.description
                            ? <p className={styles.newsDescription}>
                                {item?.isDescriptionExpanded || item?.description?.length <= 200
                                  ? item?.description
                                  : `${item?.description?.substring(0, 200)}...`}
                              </p>
                            : <p className={styles.newsDescription}>Sin descripción</p>
                        }
                        {item?.description?.length > 200 && (
                          <button
                            onClick={() => handleToggleDescription(item.id)}
                            className={styles.seeMoreButton}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--cInfo)',
                              cursor: 'pointer',
                              padding: '5px 0px',
                              display: 'block',
                            }}
                          >
                            {item?.isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={styles.newsMediaContent}>
                      {item.images && item.images.length > 0 && (
                        <div className={styles.newsImageContainer}>
                          {/* Contador de imágenes - solo si hay más de una */}
                          {item.images.length > 1 && (
                            <div className={styles.newsImageCounter}>
                              +{item.images.length}
                            </div>
                          )}

                          {/* Imagen principal - siempre la primera */}
                          <div
                            className={styles.newsImageWrapper}
                            onClick={() => handleOpenContentModal(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenContentModal(item);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Ver imagen completa de ${item.title || 'noticia'}`}
                          >
                            <img
                              src={getUrlImages(`/CONT-${item.id}-${item.images[0].id}.webp?d=${item.updated_at}`)}
                              alt={item.title || 'Imagen de noticia'}
                              className={styles.newsImage}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                ) : (
                  // Layout normal para posts
                  <section className={styles.contentBody}>
                    {item?.description && (
                      <div>
                        <p className={styles.contentDescription}>
                          {item?.isDescriptionExpanded || item?.description?.length <= 150
                            ? item?.description
                            : `${item?.description?.substring(0, 150)}...`}
                        </p>
                        {item?.description?.length > 150 && (
                          <button
                            onClick={() => handleToggleDescription(item.id)}
                            className={styles.seeMoreButton}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--cInfo)',
                              cursor: 'pointer',
                              padding: '5px 0px',
                              display: 'block',
                            }}
                          >
                            {item?.isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                          </button>
                        )}
                      </div>
                    )}
                    <MediaRenderer
                      item={item}
                      modoCompacto={false}
                      onImageClick={() => handleOpenContentModal(item)}
                      onNavigateImage={direction => handleImageNavigation(item.id, direction)}
                    />
                  </section>
                )}

                <footer className={styles.contentFooter}>
                  <div className={styles.contentStats}>
                    <div className={`${styles.statDisplay} ${item?.liked ? styles.liked : ''}`}>
                      <IconLike color={item?.liked ? 'var(--cAccent)' : 'var(--cWhiteV1)'} size={20} />
                      <span>{item?.likes}</span>
                    </div>
                    <div className={styles.statDisplay}>
                      <IconComment color={'var(--cWhiteV1)'} size={20} />
                      <span>{item.comments_count}</span>
                    </div>
                  </div>

                  <div className={styles.contentDivider}></div>

                  <div className={styles.contentActions}>
                    <button
                      className={`${styles.actionButton} ${item?.liked ? styles.liked : ''}`}
                      onClick={() => handleLike(item.id)}
                      aria-pressed={!!item?.liked}
                      aria-label={`Me gusta esta publicación`}
                    >
                      <IconLike color={item?.liked ? 'var(--cAccent)' : 'var(--cWhiteV1)'} size={20} />
                      <span>Apoyar</span>
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleOpenComments(item.id)}
                      aria-label={`Comentar esta publicación`}
                    >
                      <IconComment color={'var(--cWhiteV1)'} size={20} />
                      <span>Comentar</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })
        : !initialLoadingState && (
            <EmptyData
              message="Aún no hay publicaciones para mostrar."
              line2="Cuando se publiquen contenidos los verás aquí."
              icon={<IconPublicacion size={80} color="var(--cWhiteV1)" />}
              h={220}
              centered={true}
            />
          )}

      {loadingMoreState && (
        <div className={styles.loadingMoreState}>Cargando más publicaciones...</div>
      )}
      {!loadingMoreState &&
        !initialLoadingState &&
        hasMore &&
        contents.length > 0 &&
        contents.length < totalDBItems && (
          <div ref={loadMoreRef} style={{ height: '20px', margin: '20px 0' }} />
        )}
      {!initialLoadingState && !hasMore && contents.length > 0 && (
        <div className={styles.noMoreContentState}>Has llegado al final.</div>
      )}

      {/* Modal de comentarios usando el componente extraído */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={handleCloseComments}
        contentId={selectedContentIdForComments}
        comments={comments}
        loadingComments={loadingComments}
        commentsError={commentsError}
        newCommentText={newCommentText}
        setNewCommentText={setNewCommentText}
        postingComment={postingComment}
        postCommentError={postCommentError}
        onPostComment={handlePostComment}
      />

      {/* Modal de contenido */}
      {selectedContentForModal && (
        <RenderView
          open={isContentModalOpen}
          onClose={handleCloseContentModal}
          item={{ data: selectedContentForModal }}
          selectedContentData={selectedContentForModal}
          reLoad={handleReloadReel}
          onEdit={handleEditContent}
          onDelete={handleDeleteContent}
          onOpenComments={(contentId, contentData) => {
            handleCloseContentModal();
            handleOpenComments(contentId);
          }}
        />
      )}

      {/* Modal de edición */}
      {isEditModalOpen && editingContent && extraData && (
        <div className={styles.editModalOverlay}>
          <div className={styles.editModalContent}>
            <AddContent
              open={true}
              onClose={handleCloseEditModal}
              item={editingContent}
              setItem={setEditingContent}
              errors={editErrors}
              extraData={extraData}
              user={user}
              execute={executeEdit}
              setErrors={setEditErrors}
              reLoad={handleSaveEdit}
              action="edit"
              openList={false}
              setOpenList={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reel;
export { ReelCompactList };
