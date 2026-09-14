"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import styles from "./Reel.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "@/mk/utils/string";
import { getDateTimeAgo } from "@/mk/utils/date";
import {
  IconComment,
  IconLike,
  IconPublicacion,
} from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import EmptyData from "@/components/NoData/EmptyData";
import RenderView from "@/modulos/Contents/RenderView/RenderView";
import AddContent from "@/modulos/Contents/AddContent/AddContent";

// Importar componentes extraídos
import MediaRenderer from "./MediaRenderer/MediaRenderer";
import ReelCompactList from "./ReelCompactList/ReelCompactList";
import { ContentItem } from "./types";
import LinkifyDescription from "@/mk/components/ui/LinkifyDescription/LinkifyDescription";
import CommentsModal from "@/components/CommentsModal/CommentsModal";
import PublicationLikesModal from "@/components/PublicationLikesModal/PublicationLikesModal";

const Reel = () => {
  const { user, showToast } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [initialLoadingState, setInitialLoadingState] = useState(true);
  const [loadingMoreState, setLoadingMoreState] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalDBItems, setTotalDBItems] = useState(0);
  const itemsPerPage = 20;
  const [selectedContentForModal, setSelectedContentForModal] =
    useState<ContentItem | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  // Estados para manejar la edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editErrors, setEditErrors] = useState<any>({});
  const [extraData, setExtraData] = useState<any>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedContentIdForComments, setSelectedContentIdForComments] =
    useState<number | null>(null);
  const [likesModal, setLikesModal] = useState<{
    contentId: number;
    totalLikes: number;
  } | null>(null);
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(
    () => new Set(),
  );

  const {
    data: initialData,
    loaded: initialHookLoaded,
    error: initialError,
    reLoad: reLoadInitial,
  } = useAxios(
    "/contents",
    "GET",
    {
      perPage: itemsPerPage,
      page: 1,
      fullType: "L",
      searchBy: "",
      extraData: true,
    },
    false,
  );

  const { execute: fetchMoreContents } = useAxios();
  const { execute: executeLike } = useAxios();
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
        const response = await executeGetExtraData("/contents", "GET", {
          fullType: "EXTRA",
        });
        if (response?.data) {
          setExtraData(response.data);
        }
      } catch (error) {
        console.error("Error loading extra data:", error);
      }
    }
  };

  useEffect(() => {
    const loadMoreItems = async () => {
      if (page > 1 && hasMore && !initialLoadingState && !loadingMoreState) {
        setLoadingMoreState(true);

        const result = await fetchMoreContents("/contents", "GET", {
          perPage: itemsPerPage,
          page: page,
          fullType: "L",
          searchBy: "",
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

            setContents((prevContents) => {
              const existingIds = new Set(
                prevContents.map((content) => content.id),
              );
              const uniqueNewItems = incomingItems.filter(
                (item: any) => !existingIds.has(item.id),
              );
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
  }, [
    page,
    hasMore,
    initialLoadingState,
    loadingMoreState,
    fetchMoreContents,
    totalDBItems,
  ]);

  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (initialLoadingState || loadingMoreState) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMoreState) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [initialLoadingState, loadingMoreState, hasMore],
  );

  const handleLike = async (contentId: number) => {
    if (pendingLikeIds.has(contentId)) return;

    const currentContent = contents.find((content) => content.id === contentId);
    if (!currentContent) return;

    const previousLiked = currentContent.liked;
    const previousLikes = currentContent.likes;
    const nextLiked = previousLiked === 1 ? 0 : 1;
    const nextLikes =
      nextLiked === 1 ? previousLikes + 1 : Math.max(0, previousLikes - 1);

    const updateLikeState = (liked: 0 | 1, likes: number) => {
      setContents((current) =>
        current.map((content) =>
          content.id === contentId ? { ...content, liked, likes } : content,
        ),
      );
      setSelectedContentForModal((current) =>
        current?.id === contentId ? { ...current, liked, likes } : current,
      );
    };

    setPendingLikeIds((current) => new Set(current).add(contentId));
    updateLikeState(nextLiked, nextLikes);

    try {
      const response = await executeLike("/content-like", "POST", {
        id: contentId,
      });

      if (response?.error || !response?.data?.success) {
        throw new Error(
          response?.data?.message || "No se pudo actualizar el apoyo",
        );
      }
    } catch (error) {
      updateLikeState(previousLiked, previousLikes);
      showToast?.(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el apoyo",
        "error",
      );
    } finally {
      setPendingLikeIds((current) => {
        const next = new Set(current);
        next.delete(contentId);
        return next;
      });
    }
  };

  const handleToggleDescription = (contentId: number) => {
    setContents((prevContents) =>
      prevContents.map((content) =>
        content.id === contentId
          ? {
              ...content,
              isDescriptionExpanded: !content.isDescriptionExpanded,
            }
          : content,
      ),
    );
  };

  const handleOpenComments = (contentId: number) => {
    setSelectedContentIdForComments(contentId);
    setIsCommentModalOpen(true);
  };

  const handleCloseComments = () => {
    setIsCommentModalOpen(false);
    setSelectedContentIdForComments(null);
  };

  const handleCommentAdded = () => {
    if (!selectedContentIdForComments) return;

    setContents((current) =>
      current.map((content) =>
        content.id === selectedContentIdForComments
          ? {
              ...content,
              comments_count: (content.comments_count || 0) + 1,
            }
          : content,
      ),
    );
    setSelectedContentForModal((current) =>
      current?.id === selectedContentIdForComments
        ? {
            ...current,
            comments_count: (current.comments_count || 0) + 1,
          }
        : current,
    );
  };

  const handleOpenLikes = (contentId: number, totalLikes: number) => {
    setLikesModal({ contentId, totalLikes });
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
    console.log("Editando contenido:", item);

    // Cargar extraData si no está disponible
    await loadExtraData();

    // Preparar el item para edición con todos los campos necesarios
    const editItem = {
      ...item,
      title: item.title || "",
      description: item.description || "",
      type: item.type,
      url: item.url || "",
      images: item.images || [],
      user_id: item.user_id,
      destiny: item.destiny || "T",
      client_id: item.client_id,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      cdestinies: item.cdestinies || [],
      lDestiny: item.lDestiny || [],
    };

    console.log("Item preparado para edición:", editItem);

    setEditingContent(editItem);
    setEditErrors({});
    setIsEditModalOpen(true);
    handleCloseContentModal();
  };

  const handleCloseEditModal = () => {
    console.log("Cerrando modal de edición");
    setIsEditModalOpen(false);
    setEditingContent(null);
    setEditErrors({});
  };

  const handleSaveEdit = () => {
    console.log("Guardando edición");
    handleReloadReel();
    handleCloseEditModal();
  };

  const handleDeleteContent = (item: any) => {
    console.log("Contenido eliminado:", item);
    setContents((prevContents) =>
      prevContents.filter((content) => content.id !== item.id),
    );
    setTotalDBItems((prev) => Math.max(0, prev - 1));
    handleCloseContentModal();
  };

  const handleReloadReel = () => {
    setPage(1);
    setHasMore(true);
    reLoadInitial();
  };

  const urlAvatar = (item: ContentItem) => {
    return item.user ? item.user?.url_avatar : item.owner?.url_avatar;
  };

  return (
    <div className={styles.reelContainer}>
      <header className={styles.feedHeader}>
        <div>
          <span className={styles.feedEyebrow}>Comunidad</span>
          <h1>Muro de publicaciones</h1>
          <p>Noticias y novedades compartidas con tu condominio.</p>
        </div>
        {!initialLoadingState ? (
          <span className={styles.feedCount}>
            {totalDBItems} {totalDBItems === 1 ? "publicación" : "publicaciones"}
          </span>
        ) : null}
      </header>

      {initialLoadingState && page === 1 && contents.length === 0 ? (
        <div className={styles.loadingList} aria-label="Cargando publicaciones">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={styles.loadingCard}>
              <span className={styles.loadingAvatar} />
              <span className={styles.loadingLineShort} />
              <span className={styles.loadingLine} />
              <span className={styles.loadingMedia} />
            </div>
          ))}
        </div>
      ) : contents.length > 0 ? (
        contents.map((item: ContentItem) => {
            const isNews = item.title && item.title.trim() !== "";

            return (
              <article
                key={`content-${item.id}`}
                className={`${styles.contentCard} ${
                  isNews ? styles.newsCard : styles.postCard
                }`}
              >
                <header className={styles.contentHeader}>
                  <div className={styles.userInfo}>
                    <Avatar
                      name={getFullName(item.user)}
                      src={urlAvatar(item)}
                      w={44}
                      h={44}
                    />
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>
                        {getFullName(item.user || item.owner) ||
                          "Usuario Desconocido"}
                      </span>
                      <span className={styles.userMeta}>
                        {item.user?.role1?.[0]?.name ? (
                          <span className={styles.userRole}>
                            {item.user.role1[0].name}
                          </span>
                        ) : null}
                        {item.user?.role1?.[0]?.name ? (
                          <span className={styles.metaDot} aria-hidden="true" />
                        ) : null}
                        <time dateTime={item.created_at}>
                          {getDateTimeAgo(item.created_at)}
                        </time>
                      </span>
                    </div>
                  </div>
                  <span
                    className={`${styles.publicationBadge} ${
                      isNews ? styles.newsBadge : styles.postBadge
                    }`}
                  >
                    {isNews ? "Noticia" : "Post"}
                  </span>
                </header>

                {isNews ? (
                  <section className={styles.newsContentBody}>
                    <div className={styles.newsTextContent}>
                      <h2 className={styles.newsTitle}>{item.title}</h2>
                      <div>
                        {item.description ? (
                          <p className={styles.newsDescription}>
                            {item.isDescriptionExpanded ||
                            item.description.length <= 280 ? (
                              <LinkifyDescription text={item.description} />
                            ) : (
                              <>
                                <LinkifyDescription
                                  text={item.description.substring(0, 280)}
                                />
                                ...
                              </>
                            )}
                          </p>
                        ) : (
                          <p className={styles.newsDescription}>
                            Sin descripción
                          </p>
                        )}
                        {item.description?.length > 280 && (
                          <button
                            type="button"
                            onClick={() => handleToggleDescription(item.id)}
                            className={styles.seeMoreButton}
                          >
                            {item.isDescriptionExpanded ? "Ver menos" : "Ver más"}
                          </button>
                        )}
                      </div>
                    </div>
                    <MediaRenderer
                      item={item}
                      modoCompacto={false}
                      onImageClick={() => handleOpenContentModal(item)}
                    />
                  </section>
                ) : (
                  <section className={styles.contentBody}>
                    {item.description && (
                      <div>
                        <p className={styles.contentDescription}>
                          {item.isDescriptionExpanded ||
                          item.description.length <= 320 ? (
                            <LinkifyDescription text={item.description} />
                          ) : (
                            <>
                              <LinkifyDescription
                                text={item.description.substring(0, 320)}
                              />
                              ...
                            </>
                          )}
                        </p>
                        {item.description.length > 320 && (
                          <button
                            type="button"
                            onClick={() => handleToggleDescription(item.id)}
                            className={styles.seeMoreButton}
                          >
                            {item.isDescriptionExpanded ? "Ver menos" : "Ver más"}
                          </button>
                        )}
                      </div>
                    )}
                    <MediaRenderer
                      item={item}
                      modoCompacto={false}
                      onImageClick={() => handleOpenContentModal(item)}
                    />
                  </section>
                )}

                <footer className={styles.contentFooter}>
                  <div
                    className={styles.contentStats}
                    aria-label="Interacciones de la publicación"
                  >
                    <button
                      type="button"
                      className={`${styles.statButton} ${
                        item.liked ? styles.liked : ""
                      }`}
                      onClick={() => handleOpenLikes(item.id, item.likes)}
                      aria-label={`Ver las ${item.likes} personas que apoyaron esta publicación`}
                    >
                      <IconLike
                        color={
                          item.liked ? "var(--cAccent)" : "var(--cWhiteV1)"
                        }
                        size={18}
                      />
                      <span>
                        <strong>{item.likes}</strong>{" "}
                        {item.likes === 1 ? "apoyo" : "apoyos"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.statButton}
                      onClick={() => handleOpenComments(item.id)}
                      aria-label={`Ver los ${item.comments_count} comentarios de esta publicación`}
                    >
                      <IconComment color="var(--cWhiteV1)" size={18} />
                      <span>
                        <strong>{item.comments_count}</strong>{" "}
                        {item.comments_count === 1 ? "comentario" : "comentarios"}
                      </span>
                    </button>
                  </div>

                  <div className={styles.contentActions}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${
                        item.liked ? styles.liked : ""
                      }`}
                      onClick={() => handleLike(item.id)}
                      disabled={pendingLikeIds.has(item.id)}
                      aria-pressed={!!item.liked}
                      aria-label={
                        item.liked
                          ? "Quitar apoyo de esta publicación"
                          : "Apoyar esta publicación"
                      }
                    >
                      <IconLike
                        color={
                          item.liked ? "var(--cAccent)" : "var(--cWhiteV1)"
                        }
                        size={20}
                      />
                      <span>{item.liked ? "Apoyado" : "Apoyar"}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => handleOpenComments(item.id)}
                      aria-label="Comentar esta publicación"
                    >
                      <IconComment color="var(--cWhiteV1)" size={20} />
                      <span>Comentar</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })
      ) : (
        <EmptyData
          message="Aún no hay publicaciones para mostrar."
          line2="Cuando se publiquen contenidos los verás aquí."
          icon={<IconPublicacion size={80} color="var(--cWhiteV1)" />}
          h={220}
          centered={true}
        />
      )}

      {loadingMoreState && (
        <div className={styles.loadingMoreState}>
          Cargando más publicaciones...
        </div>
      )}
      {!loadingMoreState &&
        !initialLoadingState &&
        hasMore &&
        contents.length > 0 &&
        contents.length < totalDBItems && (
          <div ref={loadMoreRef} style={{ height: "20px", margin: "20px 0" }} />
        )}
      {!initialLoadingState && !hasMore && contents.length > 0 && (
        <div className={styles.noMoreContentState}>Has llegado al final.</div>
      )}

      <CommentsModal
        isOpen={isCommentModalOpen}
        onClose={handleCloseComments}
        contentId={selectedContentIdForComments}
        onCommentAdded={handleCommentAdded}
      />

      <PublicationLikesModal
        isOpen={!!likesModal}
        onClose={() => setLikesModal(null)}
        contentId={likesModal?.contentId || null}
        totalLikes={likesModal?.totalLikes || 0}
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
          onOpenComments={(contentId) => handleOpenComments(contentId)}
          onOpenLikes={(contentId, totalLikes) =>
            handleOpenLikes(contentId, totalLikes)
          }
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
