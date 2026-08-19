"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import styles from "./Reel.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "@/mk/utils/string";
import { getDateTimeAgo } from "@/mk/utils/date";
import {
  IconComment,
  IconLike,
  IconX,
  IconPublicacion,
  IconAlertCircle,
} from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import { leerElErrorDelApi } from "@/mk/hooks/useCrud/leerElErrorDelApi";
import { useAuth } from "@/mk/contexts/AuthProvider";
import EmptyData from "@/components/NoData/EmptyData";
import RenderView from "@/modulos/Contents/RenderView/RenderView";
import AddContent from "@/modulos/Contents/AddContent/AddContent";

// Importar componentes extraídos
import MediaRenderer from "./MediaRenderer/MediaRenderer";
import ReelCompactList from "./ReelCompactList/ReelCompactList";
import CommentModal from "./CommentModal/CommentModal";
import { ContentItem, Comment } from "./types";
import LinkifyDescription from "@/mk/components/ui/LinkifyDescription/LinkifyDescription";

const Reel = () => {
  const { user, showToast } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [initialLoadingState, setInitialLoadingState] = useState(true);
  const [loadingMoreState, setLoadingMoreState] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  /**
   * La página siguiente del muro FALLÓ (CDT-47, segunda puerta).
   *
   * 🔴 No alcanza con `hasMore = false`: esa bandera es la que pinta «Has
   * llegado al final», así que un fallo de red en la página 2 le afirmaba al
   * usuario que ya había visto todo el muro. Es la misma mentira que la del
   * ticket, sólo que del otro lado del scroll. Esta bandera separa «no hay
   * más» de «no se pudo traer más», y habilita el reintento.
   */
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
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

  // Estados para comentarios
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedContentIdForComments, setSelectedContentIdForComments] =
    useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

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
        setLoadMoreFailed(false);

        const result = await fetchMoreContents("/contents", "GET", {
          perPage: itemsPerPage,
          page: page,
          fullType: "L",
          searchBy: "",
        });

        setLoadingMoreState(false);

        if (result.error) {
          // Se corta el scroll, pero MARCADO: sin esto el render de más abajo
          // dice «Has llegado al final» y el usuario cree que vio todo.
          setLoadMoreFailed(true);
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
          // Sin `error` de transporte pero tampoco un sobre con `data`: es un
          // rechazo del API (HTTP 200 con `success:false`) o una respuesta
          // deforme. Tampoco es «se acabó el muro», así que se marca igual.
          setLoadMoreFailed(true);
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
      // ⚠️ ANOTADO, NO ARREGLADO acá (review de CDT-47): con `node` en `null`
      // —el desmontaje del centinela— este `return` temprano se va SIN llamar
      // `observer.current.disconnect()` cuando `loadingMoreState` es true. El
      // observador viejo queda vivo apuntando a un nodo desmontado. Es
      // preexistente y ajeno al vacío mentiroso que arregla este ticket; tocarlo
      // acá mezcla dos cambios en el mismo diff.
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

  // Función handleLike con patrón optimista
  const handleLike = async (contentId: number) => {
    // Actualización optimista inmediata
    setContents((prevContents) =>
      prevContents.map((content) => {
        if (content.id === contentId) {
          const wasLiked = content.liked === 1;
          return {
            ...content,
            liked: wasLiked ? 0 : 1,
            likes: wasLiked
              ? Math.max(0, content.likes - 1)
              : content.likes + 1,
          } as ContentItem;
        }
        return content;
      }),
    );

    // También actualizar el modal si está abierto
    setSelectedContentForModal((prevModalContent) => {
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

    // Llamada al backend
    try {
      const response = await executeLike("/content-like", "POST", {
        id: contentId,
      });

      // Si el backend devuelve error, revertir el cambio optimista
      if (!response?.data) {
        // Revertir cambios
        setContents((prevContents) =>
          prevContents.map((content) => {
            if (content.id === contentId) {
              const wasLiked = content.liked === 1;
              return {
                ...content,
                liked: wasLiked ? 0 : 1,
                likes: wasLiked
                  ? Math.max(0, content.likes - 1)
                  : content.likes + 1,
              } as ContentItem;
            }
            return content;
          }),
        );
        setSelectedContentForModal((prevModalContent) => {
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
      setContents((prevContents) =>
        prevContents.map((content) => {
          if (content.id === contentId) {
            const wasLiked = content.liked === 1;
            return {
              ...content,
              liked: wasLiked ? 0 : 1,
              likes: wasLiked
                ? Math.max(0, content.likes - 1)
                : content.likes + 1,
            } as ContentItem;
          }
          return content;
        }),
      );
      setSelectedContentForModal((prevModalContent) => {
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

  const fetchComments = async (contentId: number) => {
    if (!contentId) return;
    setLoadingComments(true);
    setComments([]);
    try {
      const response = await executeFetchComments(
        `/comments?fullType=L&id=${contentId}&type=C&perPage=-1&page=1`,
        "GET",
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
    if (
      !newCommentText.trim() ||
      !selectedContentIdForComments ||
      postingComment
    ) {
      return;
    }
    setPostingComment(true);
    try {
      const response = await executePostComment("/comments", "POST", {
        id: selectedContentIdForComments,
        comment: newCommentText,
        type: "C",
      });
      if (response?.data) {
        setNewCommentText("");
        setContents((prevContents) =>
          prevContents.map((content) =>
            content.id === selectedContentIdForComments
              ? {
                  ...content,
                  comments_count: (content.comments_count || 0) + 1,
                }
              : content,
          ),
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
    setNewCommentText("");
    setPostingComment(false);
  };

  const handleImageNavigation = (
    contentId: number,
    direction: "prev" | "next",
  ) => {
    let updatedItemForModal: any | null = null;

    const newContents = contents.map((content) => {
      if (
        content.id === contentId &&
        content.images &&
        content.images.length > 1
      ) {
        const newIndex =
          direction === "next"
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

  /**
   * ⚠️ ANOTADO, NO ARREGLADO (review de CDT-47): este es el camino
   * post-publicación (`reLoad` de `RenderView`). Si el refresco FALLA, el
   * efecto de arriba hace `setContents([])` y le BORRA al usuario el muro que
   * estaba leyendo, para reemplazarlo por el estado de error.
   *
   * `useAxios` ya expone `isStale`, hecho exactamente para «hay dato viejo y
   * el refresco falló» — es el tratamiento de CDT-42, y acá sí habría dato
   * viejo que marcar. Cuál de los dos corresponde en el muro es una decisión
   * de producto, no del arreglo de este ticket.
   */
  const handleReloadReel = () => {
    setPage(1);
    setHasMore(true);
    setLoadMoreFailed(false);
    reLoadInitial();
  };

  /**
   * Reintento de la CARGA INICIAL fallida (CDT-47).
   *
   * ⚠️ El `setInitialLoadingState(true)` no es decorativo: `useAxios` limpia su
   * `error` al ARRANCAR cada petición (`useAxios.tsx:187`). Sin volver al
   * estado de carga, el render del reintento cae un instante con `initialError`
   * en `""` y `contents` en `[]` — o sea, con el `EmptyData` mentiroso otra vez
   * en pantalla mientras el request está en vuelo.
   */
  const handleRetryInitialLoad = () => {
    setInitialLoadingState(true);
    handleReloadReel();
  };

  /**
   * Reintento de la PÁGINA que falló. No mueve `page`: devolver `hasMore` a
   * `true` con la página actual vuelve a disparar el efecto de paginación para
   * la misma página, que es exactamente la que quedó sin traer.
   */
  const handleRetryLoadMore = () => {
    setLoadMoreFailed(false);
    setHasMore(true);
  };

  // Función para determinar si es una noticia y su posición
  const getNewsIndex = (items: ContentItem[], currentIndex: number) => {
    const newsItems = items.filter(
      (item) => item.title && item.title.trim() !== "",
    );
    const currentItem = items[currentIndex];
    if (!currentItem.title || currentItem.title.trim() === "") return -1;
    return newsItems.findIndex((newsItem) => newsItem.id === currentItem.id);
  };

  if (initialLoadingState && page === 1 && contents.length === 0) {
    return <div className={styles.loadingState}>Cargando publicaciones...</div>;
  }

  const urlAvatar = (item: ContentItem) => {
    let img = item.user ? item.user?.url_avatar : item.owner?.url_avatar;
    return img;
  };

  /**
   * Qué se le dice al usuario cuando la carga inicial falló.
   *
   * 🔴 Manda el código HTTP, igual que en CDT-94, y por el mismo motivo:
   *
   * - **5xx** — reventó el motor. `leerElErrorDelApi` descarta su `message`
   *   (con `app.debug` prendido viaja el usuario de base y la IP del server) y
   *   devuelve el genérico.
   * - **0** — no hubo respuesta (red caída, timeout, CORS). Tampoco hay sobre,
   *   así que cae al mismo genérico. Es el caso que nombra el ticket.
   * - **4xx** — rechazo de negocio, y acá el muro SÍ necesita el texto del API:
   *   un 403 de `/contents` es «no tiene permisos», no «revisa tu conexión».
   *   Con el genérico el usuario reintentaría para siempre contra un permiso.
   *
   * El botón de reintentar se ofrece igual en los tres: un 4xx puede ser un
   * token vencido, y un reintento no cuesta nada.
   */
  const { mensaje: mensajeDeCargaFallida } = leerElErrorDelApi(
    null,
    initialError,
    "Revisa tu conexión e intenta de nuevo.",
  );

  return (
    <div className={styles.reelContainer}>
      {contents.length > 0
        ? contents.map((item: ContentItem, index: number) => {
            const isNews = item.title && item.title.trim() !== "";
            const newsIndex = getNewsIndex(contents, index);
            const isImageRight = newsIndex % 2 === 0; // Par = imagen derecha, Impar = imagen izquierda

            return (
              <article
                key={`content-${item.id}`}
                className={`${styles.contentCard} ${isNews ? styles.newsCard : ""} ${isNews && isImageRight ? styles.newsImageRight : ""} ${isNews && !isImageRight ? styles.newsImageLeft : ""}`}
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
                      <span className={styles.userRole}>
                        {item.user?.role1?.[0]?.name}
                      </span>
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
                        {item.description ? (
                          <p className={styles.newsDescription}>
                            {item?.isDescriptionExpanded ||
                            item?.description?.length <= 200 ? (
                              <LinkifyDescription text={item?.description} />
                            ) : (
                              <>
                                <LinkifyDescription
                                  text={item?.description?.substring(0, 200)}
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
                        {item?.description?.length > 200 && (
                          <button
                            onClick={() => handleToggleDescription(item.id)}
                            className={styles.seeMoreButton}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--cInfo)",
                              cursor: "pointer",
                              padding: "5px 0px",
                              display: "block",
                            }}
                          >
                            {item?.isDescriptionExpanded
                              ? "Ver menos"
                              : "Ver más"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={styles.newsMediaContent}>
                      {(item.images.length > 0 || item?.files?.length > 0) && (
                        <div className={styles.newsImageContainer}>
                          {/* Contador de imágenes - solo si hay más de una */}
                          {(item.images.length > 1 ||
                            item?.files?.length > 1) && (
                            <div className={styles.newsImageCounter}>
                              +{item?.files?.length || item.images.length}
                            </div>
                          )}

                          {/* Imagen principal - siempre la primera */}
                          <div
                            className={styles.newsImageWrapper}
                            onClick={() => handleOpenContentModal(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleOpenContentModal(item);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Ver imagen completa de ${item.title || "noticia"}`}
                          >
                            <img
                              src={item?.files?.[0]}
                              alt={item.title || "Imagen de noticia"}
                              className={styles.newsImage}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
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
                          {item?.isDescriptionExpanded ||
                          item?.description?.length <= 150 ? (
                            <LinkifyDescription text={item?.description} />
                          ) : (
                            <>
                              <LinkifyDescription
                                text={item?.description?.substring(0, 150)}
                              />
                              ...
                            </>
                          )}
                        </p>
                        {item?.description?.length > 150 && (
                          <button
                            onClick={() => handleToggleDescription(item.id)}
                            className={styles.seeMoreButton}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--cInfo)",
                              cursor: "pointer",
                              padding: "5px 0px",
                              display: "block",
                            }}
                          >
                            {item?.isDescriptionExpanded
                              ? "Ver menos"
                              : "Ver más"}
                          </button>
                        )}
                      </div>
                    )}
                    <MediaRenderer
                      item={item}
                      modoCompacto={false}
                      onImageClick={() => handleOpenContentModal(item)}
                      onNavigateImage={(direction) =>
                        handleImageNavigation(item.id, direction)
                      }
                    />
                  </section>
                )}

                <footer className={styles.contentFooter}>
                  <div className={styles.contentStats}>
                    <div
                      className={`${styles.statDisplay} ${item?.liked ? styles.liked : ""}`}
                    >
                      <IconLike
                        color={
                          item?.liked ? "var(--cAccent)" : "var(--cWhiteV1)"
                        }
                        size={20}
                      />
                      <span>{item?.likes}</span>
                    </div>
                    <div className={styles.statDisplay}>
                      <IconComment color={"var(--cWhiteV1)"} size={20} />
                      <span>{item.comments_count}</span>
                    </div>
                  </div>

                  <div className={styles.contentDivider}></div>

                  <div className={styles.contentActions}>
                    <button
                      className={`${styles.actionButton} ${item?.liked ? styles.liked : ""}`}
                      onClick={() => handleLike(item.id)}
                      aria-pressed={!!item?.liked}
                      aria-label={`Me gusta esta publicación`}
                    >
                      <IconLike
                        color={
                          item?.liked ? "var(--cAccent)" : "var(--cWhiteV1)"
                        }
                        size={20}
                      />
                      <span>Apoyar</span>
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleOpenComments(item.id)}
                      aria-label={`Comentar esta publicación`}
                    >
                      <IconComment color={"var(--cWhiteV1)"} size={20} />
                      <span>Comentar</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })
        : !initialLoadingState &&
          (initialError ? (
            /*
             * 🔴 CDT-47: «falló el request» y «el condominio no publicó nada»
             * NO se ven iguales.
             *
             * Antes el efecto de arriba hacía `setContents([])` ante cualquier
             * error y el render caía acá, al `EmptyData`, afirmando algo sobre
             * el estado del condominio que era falso: lo que se cayó fue la
             * red. El error ya estaba en la mano (`initialError`) y se usaba
             * sólo para vaciar la lista.
             */
            /* ⚠️ ANOTADO: estos textos van hardcodeados en castellano, como
             * TODO el resto de `Reel.tsx` (que nunca usó `useScopedI18n`),
             * mientras que el widget hermano del mismo commit los resuelve por
             * `translate`. Es inconsistencia introducida por este PR, no una
             * regresión: traducir el muro entero es su propio cambio. */
            <div className={styles.loadErrorState} role="alert">
              <IconAlertCircle size={56} color="var(--cWarning)" />
              <p>No se pudo cargar el muro.</p>
              <span>{mensajeDeCargaFallida}</span>
              <button
                type="button"
                className={styles.retryButton}
                onClick={handleRetryInitialLoad}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <EmptyData
              message="Aún no hay publicaciones para mostrar."
              line2="Cuando se publiquen contenidos los verás aquí."
              icon={<IconPublicacion size={80} color="var(--cWhiteV1)" />}
              h={220}
              centered={true}
            />
          ))}

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
      {/*
       * La SEGUNDA puerta al mismo vacío mentiroso (CDT-47): si falla la página
       * 2 en adelante, el muro no queda vacío pero se corta el scroll y el
       * renglón de abajo afirmaba «Has llegado al final». Acá se dice qué pasó
       * y se ofrece traer de nuevo esa misma página.
       */}
      {!loadingMoreState && loadMoreFailed && (
        <div className={styles.loadMoreErrorRow} role="alert">
          <span>
            No se pudieron cargar más publicaciones. Revisa tu conexión.
          </span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleRetryLoadMore}
          >
            Reintentar
          </button>
        </div>
      )}
      {!initialLoadingState &&
        !hasMore &&
        !loadMoreFailed &&
        contents.length > 0 && (
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
