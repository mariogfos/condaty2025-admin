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
  IconAlertCircle,
} from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
// ⚠️ Esta pantalla RENDERIZA texto escrito por el servidor. Antes de CDT-47 no
// lo hacía: el mensaje de un sobre no-5xx llega tal cual a la vista. El riesgo
// residual de eso —para los 4xx el único guardián es la lista de patrones
// técnicos— está medido y explicado en el docblock del helper.
import { leerElErrorDelApi } from "@/mk/hooks/useCrud/leerElErrorDelApi";
import { useAuth } from "@/mk/contexts/AuthProvider";
import EmptyData from "@/components/NoData/EmptyData";
import RenderView from "@/modulos/Contents/RenderView/RenderView";
import AddContent from "@/modulos/Contents/AddContent/AddContent";
import { ContentDestiny } from "@/modulos/Contents/contentEnums";

// Importar componentes extraídos
import MediaRenderer from "./MediaRenderer/MediaRenderer";
import ReelCompactList from "./ReelCompactList/ReelCompactList";
// El hilo es el mismo de Publicaciones: va por `/v3/comments` y filtra el
// texto de un rechazo con `leerElErrorDelApi`.
import CommentsModal from "@/components/CommentsModal/CommentsModal";
import PublicationLikesModal from "@/components/PublicationLikesModal/PublicationLikesModal";
import { ContentItem } from "./types";
import LinkifyDescription from "@/mk/components/ui/LinkifyDescription/LinkifyDescription";

const LIKE_ERROR = "No se pudo actualizar el apoyo";

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
  /**
   * La CARGA INICIAL no dejó un muro utilizable (CDT-47).
   *
   * 🔴 No es `!!initialError`. El efecto de abajo tiene TRES ramas y la tercera
   * —el `else`— también vacía la lista, pero sin ningún error de transporte:
   * ahí caen el **HTTP 200 rechazado en el cuerpo** (`success:false`, que es
   * como el API responde los rechazos de negocio) y el **200 sin
   * `message.total`**. Con el render mirando sólo `initialError`, esas dos
   * formas seguían pintando el `EmptyData` que afirma que el condominio no
   * publicó nada.
   *
   * La paginación ya distingue «no se pudo traer» de «se acabó» para esa misma
   * forma; esta bandera cierra la asimetría del lado de la página 1.
   */
  const [initialLoadFailed, setInitialLoadFailed] = useState(false);
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
  // Un segundo click mientras el primero viaja invertía el apoyo dos veces.
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
      setInitialLoadFailed(true);
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
      setInitialLoadFailed(false);
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
      // Sin `error` de transporte pero sin sobre utilizable: un 200 rechazado
      // en el cuerpo o un listado sin `total`. Vaciar la lista sin marcarlo
      // dejaba al `EmptyData` afirmando que no hay publicaciones.
      setInitialLoadFailed(true);
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

  /**
   * Apoyo optimista: se pinta al toque y se revierte si el API no lo confirma.
   *
   * 🔴 Lo que confirma es `success`, no que haya sobre: un rechazo de negocio
   * llega como HTTP 200 con `success:false`, y con mirar sólo `data` el apoyo
   * quedaba pintado sin haberse guardado. El texto del rechazo pasa por
   * `leerElErrorDelApi`: un 5xx o un mensaje técnico no llegan al toast.
   */
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
          leerElErrorDelApi(response?.data, response?.error, LIKE_ERROR)
            .mensaje,
        );
      }
    } catch (error) {
      updateLikeState(previousLiked, previousLikes);
      showToast?.(
        error instanceof Error && error.message ? error.message : LIKE_ERROR,
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

  /**
   * 🔴 Cerrar el hilo NO suma un comentario: el contador sube sólo en
   * `handleCommentAdded`, que `CommentsModal` llama después de que el API
   * confirmó el alta. Es el defecto que cerró el corte 2 en `Contents.tsx`.
   */
  const handleCloseComments = () => {
    setIsCommentModalOpen(false);
    setSelectedContentIdForComments(null);
  };

  /**
   * Suma uno en la tarjeta y, si el hilo se abrió desde el detalle, también en
   * el detalle, que sigue abierto debajo. La copia del detalle es la de ESTA
   * publicación: se suelta al cerrarlo (`handleCloseContentModal`), así que el
   * próximo detalle nunca muestra la anterior.
   */
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
      // `destiny` es el enum numérico `ContentDestiny` (api#461), no la letra.
      destiny: item.destiny || ContentDestiny.TODOS,
      client_id: item.client_id,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
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

  const urlAvatar = (item: ContentItem) => {
    return item.user ? item.user?.url_avatar : item.owner?.url_avatar;
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
    // ⚠️ El sobre del 200 rechazado (`success:false`) NO viaja en el error
    // —axios no rechaza un 200—, viaja en `initialData`. `leerElErrorDelApi`
    // mira los dos justamente por eso.
    initialData,
    initialError,
    "Revisa tu conexión e intenta de nuevo.",
  );

  return (
    <div className={styles.reelContainer}>
      <header className={styles.feedHeader}>
        <div>
          <span className={styles.feedEyebrow}>Comunidad</span>
          <h1>Muro de publicaciones</h1>
          <p>Noticias y novedades compartidas con tu condominio.</p>
        </div>
        {/*
         * 🔴 Con la carga fallida el total es el 0 del estado inicial: decir
         * «0 publicaciones» es la misma afirmación falsa que el `EmptyData`
         * que cerró CDT-47, sólo que en el encabezado.
         */}
        {!initialLoadingState && !initialLoadFailed ? (
          <span className={styles.feedCount}>
            {totalDBItems} {totalDBItems === 1 ? "publicación" : "publicaciones"}
          </span>
        ) : null}
      </header>

      {initialLoadingState && page === 1 && contents.length === 0 ? (
        <div
          className={styles.loadingList}
          role="status"
          aria-label="Cargando publicaciones"
        >
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
                        <>
                          <span className={styles.userRole}>
                            {item.user.role1[0].name}
                          </span>
                          <span className={styles.metaDot} aria-hidden="true" />
                        </>
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
                  {/* «Quién dio like» (admin#893). */}
                  <button
                    type="button"
                    className={`${styles.statButton} ${
                      item.liked ? styles.liked : ""
                    }`}
                    onClick={() => handleOpenLikes(item.id, item.likes)}
                    aria-label={`Ver las ${item.likes} personas que apoyaron esta publicación`}
                  >
                    <IconLike
                      color={item.liked ? "var(--cAccent)" : "var(--cWhiteV1)"}
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
                      color={item.liked ? "var(--cAccent)" : "var(--cWhiteV1)"}
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
      ) : initialLoadFailed ? (
        /*
         * 🔴 CDT-47: «falló el request» y «el condominio no publicó nada»
         * NO se ven iguales.
         *
         * Antes el efecto de arriba hacía `setContents([])` ante cualquier
         * error y el render caía al `EmptyData`, afirmando algo sobre el estado
         * del condominio que era falso: lo que se cayó fue la red.
         */
        /* ⚠️ ANOTADO: estos textos van hardcodeados en castellano, como TODO
         * el resto de `Reel.tsx` (que nunca usó `useScopedI18n`). Traducir el
         * muro entero es su propio cambio. */
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

      <CommentsModal
        isOpen={isCommentModalOpen}
        onClose={handleCloseComments}
        contentId={selectedContentIdForComments}
        onCommentAdded={handleCommentAdded}
      />

      <PublicationLikesModal
        isOpen={likesModal !== null}
        onClose={() => setLikesModal(null)}
        contentId={likesModal?.contentId ?? null}
        totalLikes={likesModal?.totalLikes}
      />

      {/*
       * El detalle queda abierto debajo del hilo: `handleCommentAdded` le suma
       * el comentario nuevo sin cerrarlo. «Quién dio like» lo abre el propio
       * detalle (admin#893), por eso no se le pasa nada para eso.
       */}
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
