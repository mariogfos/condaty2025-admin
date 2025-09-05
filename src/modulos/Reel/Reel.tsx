"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import styles from "./Reel.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeAgo } from "@/mk/utils/date";
import {
  IconComment,
  IconLike,
  IconArrowLeft,
  IconArrowRight,
  IconShare,
  IconAdress,
  IconX,
  IconDocs,
  IconPublicacion,
  IconPdfPro,
} from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import EmptyData from "@/components/NoData/EmptyData";
import RenderView from "@/modulos/Contents/RenderView/RenderView";
import AddContent from "@/modulos/Contents/AddContent/AddContent";

type User = {
  has_image?: any;
  id: string;
  name: string;
  middle_name?: string;
  last_name: string;
  mother_last_name?: string;
  updated_at: string;
  role1: Role[]
};
type Role = {
  id: number;
  name: string;
  description:string,
  laravel_through_key: string
}


type Image = {
  id: number;
  content_id: number;
  ext: string;
};

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

export type ContentItem = {
  id: number;
  destiny: string;
  client_id: string;
  user_id: string;
  title: string | null;
  description: string;
  url: string | null;
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


// Nueva función para renderizar mosaico de imágenes
const renderImageMosaic = (
  item: ContentItem,
  modoCompacto = false,
  onImageClick?: () => void
) => {
  const images = item.images;
  const imageCount = images.length;

  if (imageCount <= 1) return null;

  const getImageUrl = (image: Image) =>
    getUrlImages(`/CONT-${item.id}-${image.id}.${image.ext}?d=${item.updated_at}`);

  const getMosaicClass = () => {
    if (imageCount === 2) return styles.twoImages;
    if (imageCount === 3) return styles.threeImages;
    return styles.fourOrMoreImages;
  };

  // Para modo compacto, mostrar máximo 4 imágenes
  // Para modo normal, mostrar máximo 4 imágenes también
  const imagesToShow = imageCount > 4 ? images.slice(0, 4) : images;
  const remainingCount = imageCount > 4 ? imageCount - 4 : 0;

  return (
    <div
      className={`${styles.imageMosaicContainer} ${getMosaicClass()}`}
      onClick={onImageClick}
    >
      {imagesToShow.map((image, index) => {
        const isFirst = index === 0;
        const isLast = index === imagesToShow.length - 1;
        const showOverlay = remainingCount > 0 && isLast;

        return (
          <div
            key={image.id}
            className={`${
              isFirst ? styles.mosaicImageFirst : ''
            } ${showOverlay ? styles.mosaicImageLast : ''}`}
            style={{
              position: 'relative'
            }}
          >
            <img
              src={getImageUrl(image)}
              alt={`Imagen ${index + 1} de ${imageCount}`}
              className={styles.mosaicImage}
              loading="lazy"
            />
            {showOverlay && (
              <div className={styles.mosaicOverlay}>
                +{remainingCount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const renderMedia = (
  item: ContentItem,
  modoCompacto = false,
  onImageClick?: () => void,
  onNavigateImage?: (direction: "prev" | "next") => void
) => {
  const currentImageIndex = item.currentImageIndex || 0;

  if (item.type === "I" && item.images && item.images.length > 0) {
    // Si hay múltiples imágenes, mostrar mosaico
    if (item.images.length > 1) {
      return renderImageMosaic(item, modoCompacto, onImageClick);
    }

    // Si hay solo una imagen, mostrar como antes
    const currentImageObject = item.images[currentImageIndex];
    if (!currentImageObject) return null;
    const imageUrl = getUrlImages(
      `/CONT-${item.id}-${currentImageObject.id}.${currentImageObject.ext}?d=${item.updated_at}`
    );
    return (
      <div
        className={styles.contentMediaContainer}
        style={
          modoCompacto
            ? {
                marginTop: 8,
                borderRadius: 8,
                maxHeight: 120,
                minHeight: 80,
                background: "var(--cBlackV1)",
              }
            : {}
        }
        onClick={onImageClick}
      >
        <img
          src={imageUrl}
          alt={
            item.title || `Imagen ${currentImageIndex + 1} de la publicación`
          }
          className={styles.imageCard}
          loading="lazy"
          style={
            modoCompacto
              ? { maxHeight: 120, borderRadius: 8, objectFit: "cover" }
              : {}
          }
        />
      </div>
    );
  } else if (item.type === "V") {
    let embedUrl = "";
    let isInstagram = false;

    if (
      item.url?.includes("youtube.com/watch?v=") ||
      item.url?.includes("youtu.be/")
    ) {
      let videoId = "";
      if (item.url?.includes("watch?v=")) {
        const urlParams =
          typeof URL !== "undefined"
            ? new URLSearchParams(new URL(item.url).search)
            : null;
        videoId = urlParams?.get("v") || "";
      } else if (item.url.includes("youtu.be/")) {
        videoId = item.url
          .substring(item.url.lastIndexOf("/") + 1)
          .split("?")[0];
      }
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (item.url?.includes("youtube.com/shorts/")) {
      const videoId = item.url.split("shorts/")[1]?.split("?")[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (item.url?.includes("vimeo.com/")) {
      const videoId = item.url.split("/").pop()?.split("?")[0];
      if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
    } else if (item.url?.includes("instagram.com/reel/")) {
      const reelId = item.url.split("reel/")[1]?.split("/")[0];
      if (reelId) {
        isInstagram = true;
      }
    } else if (item.url?.includes("instagram.com/p/")) {
      const postId = item.url.split("p/")[1]?.split("/")[0];
      if (postId) {
        isInstagram = true;
      }
    }

    if (embedUrl) {
      return (
        <div
          className={`${styles.contentMediaContainer} ${
            isInstagram
              ? styles.instagramEmbedContainer
              : styles.videoEmbedContainer
          }`}
          style={
            modoCompacto
              ? {
                  minHeight: 80,
                  maxHeight: 120,
                  height: 120,
                  borderRadius: 8,
                  marginTop: 8,
                }
              : {}
          }
        >
          <iframe
            src={embedUrl}
            title={item.title || "Video content"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen={!isInstagram}
            className={`${styles.videoFrame} ${
              isInstagram ? styles.instagramFrame : ""
            }`}
            loading="lazy"
            scrolling={isInstagram ? "no" : "auto"}
            style={
              modoCompacto
                ? {
                    minHeight: 80,
                    maxHeight: 120,
                    height: 120,
                    borderRadius: 8,
                  }
                : {}
            }
          ></iframe>
        </div>
      );
    } else if (item.url) {
      return (
        <div
          className={`${styles.contentMediaContainer} ${styles.externalMediaLink}`}
          style={
            modoCompacto ? { padding: 12, fontSize: 13, marginTop: 8 } : {}
          }
        >
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            Ver contenido multimedia
          </a>
          <p className={styles.externalMediaUrl}>{item.url}</p>
        </div>
      );
    }
  } else if (item.type === "D") {
    // Verificar que item.url existe antes de usarlo
    if (!item.url) {
      return (
        <div className={styles.contentMediaContainer}>
          {/* <p>Documento no disponible</p> */}
        </div>
      );
    }

    const docUrlIsPlaceholder =
      item.url === "pdf" ||
      (item.url.endsWith && item.url.endsWith(".pdf") &&
        !item.url.startsWith("http") &&
        !item.url.startsWith("/"));
    let docUrl = item.url;
    let effectiveDocUrl = docUrl;

    if (typeof window !== "undefined") {
      if (docUrlIsPlaceholder) {
        docUrl = getUrlImages(`/CONT-${item.id}.pdf?d=${item.updated_at}`);
      } else if (item.url && !item.url.startsWith("http") && !item.url.startsWith("/")) {
        docUrl = getUrlImages(
          item.url.startsWith("/") ? item.url : `/${item.url}`
        );
      }
      effectiveDocUrl = docUrl.startsWith("http")
        ? docUrl
        : `${window.location.origin}${docUrl}`;
    }

    return (
      <div
        className={`${styles.contentMediaContainer} ${styles.documentPreviewContainer}`}
        style={
          modoCompacto
            ? {
                padding: 16,
                minHeight: 60,
                gap: 8,
                borderRadius: 8,
                marginTop: 8,
              }
            : {}
        }
      >
        <IconPdfPro size={42} color="var(--cWhiteV2)" />
        <h4
          className={styles.documentTitlePreview}
          style={modoCompacto ? { fontSize: 14, margin: 0 } : {}}
        >
          {item.title || "Documento"}
        </h4>
        <p
          className={styles.documentInfoPreview}
          style={modoCompacto ? { fontSize: 12 } : {}}
        >
          {item.description
            ? item.description.substring(0, 50) +
              (item.description.length > 50 ? "..." : "")
            : "Haga clic para ver el documento"}
        </p>
        <a
          href={effectiveDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.documentLinkButton}
          style={modoCompacto ? { fontSize: 12, padding: "4px 10px" } : {}}
        >
          Abrir Documento <IconDocs size={12} />
        </a>
      </div>
    );
  }
  return null;
};
// --- FIN FUNCIÓN REUTILIZABLE ---

const Reel = () => {
  const { user, showToast } = useAuth();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [initialLoadingState, setInitialLoadingState] = useState(true);
  const [loadingMoreState, setLoadingMoreState] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImageForModal, setSelectedImageForModal] = useState<
    string | null
  >(null);
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
      extraData:true,
    },
    false
  );

  const { execute: fetchMoreContents } = useAxios();

  const { execute: executeLike } = useAxios();
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedContentIdForComments, setSelectedContentIdForComments] =
    useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { execute: executeFetchComments, error: commentsError } = useAxios();
  const [newCommentText, setNewCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const { execute: executePostComment, error: postCommentError } = useAxios();
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // Hooks adicionales para edición
  const { execute: executeEdit } = useAxios();
  const { execute: executeGetExtraData } = useAxios();

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

  // Función para cargar extraData cuando sea necesario
  const loadExtraData = async () => {
    if (!extraData) {
      try {
        const response = await executeGetExtraData('/contents', 'GET', {
          fullType: 'EXTRA'
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
                prevContents.map((content) => content.id)
              );
              const uniqueNewItems = incomingItems.filter(
                (item: any) => !existingIds.has(item.id)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    [initialLoadingState, loadingMoreState, hasMore]
  );

  // Función handleLike con patrón optimista
  const handleLike = async (contentId: number) => {
    // 1. Actualización optimista inmediata
    const updateContent = (prevContents: ContentItem[]) =>
      prevContents.map((content) => {
        if (content.id === contentId) {
          const wasLiked = content.liked === 1;
          return {
            ...content,
            liked: wasLiked ? 0 : 1,
            likes: wasLiked
              ? Math.max(0, content.likes - 1)
              : content.likes + 1,
          };
        }
        return content;
      });

    // Aplicar cambio optimista
setContents((prevContents) =>
  prevContents.map((content) => {
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

    // 2. Llamada al backend
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
        likes: wasLiked ? Math.max(0, content.likes - 1) : content.likes + 1,
      } as ContentItem;
    }
    return content;
  })
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
      // Si response.data existe, el cambio optimista ya está aplicado correctamente
    } catch (err) {
      // En caso de error, revertir el cambio optimista
setContents((prevContents) =>
  prevContents.map((content) => {
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
    setNewCommentText("");
    setPostingComment(false);
  };

  const handleImageNavigation = (
    contentId: number,
    direction: "prev" | "next"
  ) => {
    let updatedItemForModal: any | null = null;

    // Primero, preparamos la nueva lista de contenidos
    const newContents = contents.map((content) => {
      // Buscamos el item que queremos modificar
      if (
        content.id === contentId &&
        content.images &&
        content.images.length > 1
      ) {
        // Calculamos el nuevo índice de la imagen
        const newIndex =
          direction === "next"
            ? ((content.currentImageIndex || 0) + 1) % content.images.length
            : ((content.currentImageIndex || 0) - 1 + content.images.length) %
              content.images.length;

        // Creamos el item actualizado
        const updatedContent = { ...content, currentImageIndex: newIndex };

        // Guardamos este item actualizado para usarlo en el modal después
        updatedItemForModal = updatedContent;

        return updatedContent;
      }
      return content;
    });

    // Actualizamos el estado de la lista principal
    setContents(newContents);

    // Si el item que se actualizó es el que está visible en el modal,
    // actualizamos también el estado del modal.
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
      // Asegurar que todos los campos necesarios estén presentes
      title: item.title || '',
      description: item.description || '',
      type: item.type,
      url: item.url || '',
      images: item.images || [],
      user_id: item.user_id,
      destiny: item.destiny || 'T', // Valor por defecto
      client_id: item.client_id,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      // Campos adicionales para edición
      cdestinies: item.cdestinies || [],
      lDestiny: item.lDestiny || [],
    };

    console.log('Item preparado para edición:', editItem);

    setEditingContent(editItem);
    setEditErrors({}); // Limpiar errores
    setIsEditModalOpen(true);
    handleCloseContentModal(); // Cerrar el modal de detalle
  };

  // Función para cerrar el modal de edición
  const handleCloseEditModal = () => {
    console.log('Cerrando modal de edición');
    setIsEditModalOpen(false);
    setEditingContent(null);
    setEditErrors({});
  };

  // Función para manejar el guardado de la edición
  const handleSaveEdit = () => {
    console.log('Guardando edición');
    // Recargar el reel después de la edición
    handleReloadReel();
    handleCloseEditModal();
  };

  // Nueva función para manejar la eliminación
  const handleDeleteContent = (item: any) => {
    console.log('Contenido eliminado:', item);
    // Actualizar la lista local removiendo el item eliminado
    setContents(prevContents =>
      prevContents.filter(content => content.id !== item.id)
    );
    // Actualizar el total de items
    setTotalDBItems(prev => Math.max(0, prev - 1));
    handleCloseContentModal(); // Cerrar el modal de detalle
  };

  // Nueva función para recargar completamente el reel
  const handleReloadReel = () => {
    setPage(1);
    setHasMore(true);
    reLoadInitial();
  };

  // Agregar este useEffect para debug
  useEffect(() => {
    console.log('Estados de edición:', {
      isEditModalOpen,
      editingContent: !!editingContent,
      extraData: !!extraData
    });
  }, [isEditModalOpen, editingContent, extraData]);

  useEffect(() => {
    if (isCommentModalOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isCommentModalOpen]);

  if (initialLoadingState && page === 1 && contents.length === 0) {
    return <div className={styles.loadingState}>Cargando publicaciones...</div>;
  }

  return (
    <div className={styles.reelContainer}>
      {contents.length > 0
        ? contents.map((item: ContentItem) => (
            <article key={`content-${item.id}`} className={styles.contentCard}>
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
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--cInfo)',
                          cursor: 'pointer',
                          padding: '5px 0px',
                          display: 'block',
                        }}
                      >
                        {item.isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </div>
                )}
                {renderMedia(
                  item,
                  false,
                  () => handleOpenContentModal(item),
                  direction => handleImageNavigation(item.id, direction)
                )}
              </section>

              <footer className={styles.contentFooter}>
                {/* Sección de estadísticas (solo visualización) */}
                <div className={styles.contentStats}>
                  <div className={`${styles.statDisplay} ${item.liked ? styles.liked : ''}`}>
                    <IconLike color={item.liked ? 'var(--cAccent)' : 'var(--cWhiteV1)'} size={20} />
                    <span>{item.likes}</span>
                  </div>
                  <div className={styles.statDisplay}>
                    <IconComment color={'var(--cWhiteV1)'} size={20} />
                    <span>{item.comments_count}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className={styles.contentDivider}></div>

                {/* Sección de acciones (botones interactivos) */}

                <div className={styles.contentActions}>
                  <button
                    className={`${styles.actionButton} ${item.liked ? styles.liked : ''}`}
                    onClick={() => handleLike(item.id)}
                    aria-pressed={!!item.liked}
                    aria-label={`Me gusta esta publicación`}
                  >
                    <IconLike color={item.liked ? 'var(--cAccent)' : 'var(--cWhiteV1)'} size={20} />
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
          ))
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

      {isCommentModalOpen && selectedContentIdForComments && (
        <div className={styles.commentModalOverlay} onClick={handleCloseComments}>
          <div className={styles.commentModalContent} onClick={e => e.stopPropagation()}>
            <header className={styles.commentModalHeader}>
              <h3 className={styles.commentModalTitle}>Comentarios</h3>
              <button
                onClick={handleCloseComments}
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
                onClick={handlePostComment}
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
      )}

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

      {/* Modal de edición - WRAPPER MODAL PARA ADDCONTENT */}
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

export const ReelCompactList = ({
  items,
  onLike,
  onOpenComments,
  modoCompacto = false,
  onImageClick,
}: {
  items: ContentItem[];
  onLike?: (id: number) => void;
  onOpenComments?: (id: number) => void;
  modoCompacto?: boolean;
  onImageClick?: (id: number) => void;
}) => {
  if (!items || items.length === 0) {
    return (
      <div
        style={{
          padding: "32px 0",
          color: "var(--cWhiteV1)",
          textAlign: "center",
          fontSize: "16px",
        }}
      >
        Aún no hay publicaciones para mostrar.
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: modoCompacto ? 12 : 'var(--spXxl)',
      }}
    >
      {items.map((item: ContentItem) => (
        <article
          key={`content-${item.id}`}
          className={modoCompacto ? styles.contentCardCompact : styles.contentCard}
          style={
            modoCompacto ? { boxShadow: 'none', padding: 12, borderRadius: 12, margin: 0 } : {}
          }
        >
          <header
            className={styles.contentHeader}
            style={modoCompacto ? { paddingBottom: 8, marginBottom: 8 } : {}}
          >
            <div className={styles.userInfo}>
              <Avatar
                hasImage={1}
                name={getFullName(item.user)}
                src={getUrlImages(`/ADM-${item.user?.id}.webp?d=${item.user?.updated_at}`)}
                w={modoCompacto ? 32 : 44}
                h={modoCompacto ? 32 : 44}
              />
              <div className={styles.userDetails}>
                <span className={styles.userName} style={modoCompacto ? { fontSize: 14 } : {}}>
                  {getFullName(item.user) || 'Usuario Desconocido'}
                </span>
                <span className={styles.userRole} style={modoCompacto ? { fontSize: 11 } : {}}>
                  Administrador
                </span>
              </div>
            </div>
            <time
              dateTime={item.created_at}
              className={styles.postDate}
              style={modoCompacto ? { fontSize: 11, marginLeft: 8 } : {}}
            >
              {getDateTimeAgo(item.created_at)}
            </time>
          </header>

          <section className={styles.contentBody} style={modoCompacto ? { gap: 4 } : {}}>
            {item.title && (
              <h2
                className={styles.contentTitle}
                style={modoCompacto ? { fontSize: 15, margin: 0, maxHeight: '2.2em' } : {}}
              >
                {item.title}
              </h2>
            )}
            {item.description && (
              <p
                className={styles.contentDescription}
                style={modoCompacto ? { fontSize: 13, WebkitLineClamp: 2, maxHeight: '2.6em' } : {}}
              >
                {item.description.length > 80
                  ? `${item.description.substring(0, 80)}...`
                  : item.description}
              </p>
            )}
            {renderMedia(
              item,
              modoCompacto,
              onImageClick ? () => onImageClick(item.id) : undefined
            )}
          </section>

          <footer
            className={styles.contentFooter}
            style={modoCompacto ? { marginTop: 8, paddingTop: 8 } : {}}
          >
            {/* Sección de estadísticas (solo visualización) */}
            <div className={styles.contentStats}>
              <div className={`${styles.statDisplay} ${item.liked ? styles.liked : ''}`}>
                <IconLike
                  color={item.liked ? 'var(--cAccent)' : 'var(--cWhiteV1)'}
                  size={modoCompacto ? 16 : 20}
                />
                <span style={modoCompacto ? { fontSize: 13 } : {}}>{item.likes}</span>
              </div>
              <div className={styles.statDisplay}>
                <IconComment color={'var(--cWhiteV1)'} size={modoCompacto ? 16 : 20} />
                <span style={modoCompacto ? { fontSize: 13 } : {}}>{item.comments_count}</span>
              </div>
            </div>

            {/* Divider */}
            <div className={styles.contentDivider}></div>

            {/* Sección de acciones (botones interactivos) */}
            <div className={styles.contentActions}>
              <button
                className={`${styles.actionButton} ${item.liked ? styles.liked : ''}`}
                onClick={() => onLike && onLike(item.id)}
                aria-pressed={!!item.liked}
                aria-label={`Me gusta esta publicación`}
              >
                <IconLike
                  color={item.liked ? 'var(--cAccent)' : 'var(--cWhiteV1)'}
                  size={modoCompacto ? 16 : 20}
                />
                <span style={modoCompacto ? { fontSize: 13 } : {}}>Apoyar</span>
              </button>
              <button
                className={styles.actionButton}
                onClick={() => onOpenComments && onOpenComments(item.id)}
                aria-label={`Comentar esta publicación`}
              >
                <IconComment color={'var(--cWhiteV1)'} size={modoCompacto ? 16 : 20} />
                <span style={modoCompacto ? { fontSize: 13 } : {}}>Comentar</span>
              </button>
            </div>
          </footer>
        </article>
      ))}
    </div>
  );
};

export default Reel;
