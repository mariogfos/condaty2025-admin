"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, ImageOff, PlayCircle } from "lucide-react";
import ReactPlayer from "react-player";
import {
  IconArrowLeft,
  IconArrowRight,
  IconComment,
  IconEdit,
  IconLike,
  IconTrash,
} from "@/components/layout/icons/IconsBiblioteca";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Image } from "@/mk/components/ui/Image/Image";
import LinkifyDescription from "@/mk/components/ui/LinkifyDescription/LinkifyDescription";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import styles from "./RenderView.module.css";

type RenderViewProps = {
  open: boolean;
  onClose: (result?: unknown) => void;
  item: Record<string, any>;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  reLoad?: () => void;
  onOpenComments?: (contentId: number, contentData?: any) => void;
  onOpenLikes?: (contentId: number, totalLikes: number) => void;
  selectedContentData?: any;
  contentId?: number;
  showActions?: boolean;
};

const RenderView = (props: RenderViewProps) => {
  const { data } = props.item || {};
  const { showToast } = useAuth();
  const { execute } = useAxios();
  const [isExpanded, setIsExpanded] = useState(false);
  const [indexVisible, setIndexVisible] = useState(0);
  const [contentData, setContentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const currentData = props.selectedContentData || contentData || data;
  const isNews = Boolean(currentData?.title?.trim());
  const publicationKind = isNews ? "Noticia" : "Post";
  const author = currentData?.user || currentData?.owner;
  const authorName = getFullName(author) || "Usuario no disponible";
  const authorRole =
    currentData?.user?.role1?.[0]?.name ||
    currentData?.owner?.role1?.[0]?.name ||
    "Comunidad";

  const normalizedImages = useMemo(() => {
    const files = Array.isArray(currentData?.files)
      ? currentData.files.filter(
          (file: unknown) => typeof file === "string" && file.trim(),
        )
      : [];
    const raw = files.length > 0 ? files : currentData?.images || [];

    return raw
      .map((item: any, index: number) => {
        if (typeof item === "string" && item.trim()) {
          return { url: item, index };
        }

        if (item && typeof item === "object" && "id" in item) {
          return {
            url: getUrlImages(
              `/CONT-${currentData.id}-${item.id}.webp?${
                currentData?.updated_at || ""
              }`,
            ),
            index,
          };
        }

        return null;
      })
      .filter((image: { url: string; index: number } | null): image is {
        url: string;
        index: number;
      } => Boolean(image));
  }, [currentData]);

  useEffect(() => {
    let active = true;

    const fetchContentDetails = async () => {
      if (
        !props.open ||
        !props.contentId ||
        props.selectedContentData ||
        data
      ) {
        return;
      }

      setLoading(true);
      try {
        const response = await execute(
          "/contents",
          "GET",
          {
            fullType: "DET",
            searchBy: props.contentId,
            page: 1,
            perPage: 1,
          },
          false,
          true,
        );

        if (!active) return;

        if (response?.error || !response?.data?.data) {
          throw new Error("No se encontraron los detalles de la publicación");
        }

        setContentData(response.data.data);
      } catch (error) {
        if (!active) return;
        showToast?.(
          error instanceof Error
            ? error.message
            : "Error al cargar los detalles de la publicación",
          "error",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchContentDetails();
    return () => {
      active = false;
    };
  }, [
    data,
    execute,
    props.contentId,
    props.open,
    props.selectedContentData,
    showToast,
  ]);

  useEffect(() => {
    if (!props.open) {
      setContentData(null);
      setIndexVisible(0);
      setIsExpanded(false);
    }
  }, [props.open]);

  useEffect(() => {
    if (indexVisible >= normalizedImages.length) setIndexVisible(0);
  }, [indexVisible, normalizedImages.length]);

  const commentsCount = Number(
    currentData?.comments_count ?? currentData?.comments?.length ?? 0,
  );
  const likesCount = Number(currentData?.likes || 0);
  const description = currentData?.description?.trim() || "Sin descripción.";

  const nextIndex = useCallback(() => {
    setIndexVisible((current) => (current + 1) % normalizedImages.length);
  }, [normalizedImages.length]);

  const previousIndex = useCallback(() => {
    setIndexVisible((current) =>
      current === 0 ? normalizedImages.length - 1 : current - 1,
    );
  }, [normalizedImages.length]);

  const handleEdit = useCallback(() => {
    if (!currentData) return;

    props.onClose();
    props.onEdit?.({
      ...currentData,
      title: currentData.title || "",
      description: currentData.description || "",
      url: currentData.url || "",
      images: currentData.images || [],
      files: currentData.files || [],
      destiny: currentData.destiny || 0,
      cdestinies: currentData.cdestinies || [],
      lDestiny: currentData.lDestiny || [],
    });
  }, [currentData, props]);

  const handleDelete = useCallback(() => {
    if (currentData) props.onDelete?.(currentData);
  }, [currentData, props]);

  const getDocumentUrl = () => {
    const file = currentData?.files?.find(
      (entry: unknown) => typeof entry === "string" && entry.trim(),
    );
    if (file) return file;

    if (currentData?.type === "D" && currentData?.id && currentData?.url) {
      return getUrlImages(
        `/CONT-${currentData.id}.pdf?d=${currentData.updated_at || ""}`,
      );
    }

    return null;
  };

  const documentUrl = getDocumentUrl();
  const videoUrl =
    currentData?.files?.find(
      (entry: unknown) => typeof entry === "string" && entry.trim(),
    ) || currentData?.url;

  const renderMedia = () => {
    if (currentData?.type === "I") {
      if (normalizedImages.length === 0) {
        return (
          <div className={styles.mediaEmpty}>
            <ImageOff size={30} aria-hidden="true" />
            <strong>Imagen no disponible</strong>
            <span>No se encontró un archivo válido para esta publicación.</span>
          </div>
        );
      }

      return (
        <div className={styles.gallery}>
          <div className={styles.imageWrapper}>
            <Image
              alt={`Imagen ${indexVisible + 1} de la publicación`}
              src={normalizedImages[indexVisible]?.url || ""}
              expandable
              expandableIcon={false}
              objectFit="contain"
              borderRadius="0"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          {normalizedImages.length > 1 ? (
            <div className={styles.galleryControls}>
              <button
                type="button"
                onClick={previousIndex}
                aria-label="Ver imagen anterior"
              >
                <IconArrowLeft size={17} />
              </button>
              <span>
                {indexVisible + 1} de {normalizedImages.length}
              </span>
              <button
                type="button"
                onClick={nextIndex}
                aria-label="Ver imagen siguiente"
              >
                <IconArrowRight size={17} />
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    if (currentData?.type === "V") {
      return videoUrl ? (
        <div className={styles.videoWrapper}>
          <ReactPlayer url={videoUrl} width="100%" height="100%" controls />
        </div>
      ) : (
        <div className={styles.mediaEmpty}>
          <PlayCircle size={30} aria-hidden="true" />
          <strong>Video no disponible</strong>
          <span>El enlace ya no está disponible.</span>
        </div>
      );
    }

    if (currentData?.type === "D") {
      return (
        <div className={styles.documentCard}>
          <span className={styles.documentIcon} aria-hidden="true">
            <FileText size={30} />
          </span>
          <div>
            <span className={styles.mediaEyebrow}>Documento adjunto</span>
            <strong>{currentData?.title || "Documento de la publicación"}</strong>
            <p>
              {documentUrl
                ? "Abre el archivo en una pestaña nueva para revisarlo."
                : "El archivo ya no se encuentra disponible."}
            </p>
          </div>
          {documentUrl ? (
            <a href={documentUrl} target="_blank" rel="noopener noreferrer">
              Abrir documento
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      );
    }

    return (
      <div className={styles.mediaEmpty}>
        <ImageOff size={30} aria-hidden="true" />
        <strong>Contenido no disponible</strong>
        <span>No hay un archivo asociado a esta publicación.</span>
      </div>
    );
  };

  return (
    <DataModal
      open={props.open}
      onClose={props.onClose}
      title={
        currentData
          ? `Detalle de ${publicationKind.toLowerCase()}`
          : "Detalle de la publicación"
      }
      buttonText=""
      buttonCancel=""
      className={styles.modalBody}
      maxWidth={980}
      style={{
        width: "min(980px, calc(100vw - 24px))",
        maxHeight: "min(860px, calc(100vh - 24px))",
      }}
      ignoreTranslation
    >
      {loading || !currentData ? (
        <div className={styles.loadingState} aria-live="polite">
          <span className={styles.loadingAvatar} />
          <span className={styles.loadingLineShort} />
          <span className={styles.loadingLine} />
          <span className={styles.loadingMedia} />
        </div>
      ) : (
        <article className={styles.publication}>
          <header className={styles.publicationHeader}>
            <div className={styles.author}>
              <Avatar
                name={authorName}
                src={author?.url_avatar}
                w={48}
                h={48}
              />
              <div className={styles.authorInfo}>
                <strong data-i18n-ignore="true">{authorName}</strong>
                <span>
                  {authorRole}
                  <i aria-hidden="true" />
                  <time dateTime={currentData.created_at}>
                    {getDateTimeStrMesShort(currentData.created_at)}
                  </time>
                </span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <span
                className={`${styles.typeBadge} ${
                  isNews ? styles.newsBadge : styles.postBadge
                }`}
              >
                {publicationKind}
              </span>
              {(props.showActions ?? true) && props.onEdit ? (
                <button
                  type="button"
                  className={styles.iconAction}
                  onClick={handleEdit}
                  aria-label="Editar publicación"
                  title="Editar publicación"
                >
                  <IconEdit size={18} />
                </button>
              ) : null}
              {(props.showActions ?? true) && props.onDelete ? (
                <button
                  type="button"
                  className={`${styles.iconAction} ${styles.deleteAction}`}
                  onClick={handleDelete}
                  aria-label="Eliminar publicación"
                  title="Eliminar publicación"
                >
                  <IconTrash size={18} />
                </button>
              ) : null}
            </div>
          </header>

          <div className={styles.audienceRow}>
            <span>Publicado para</span>
            <strong>
              {currentData?.destiny === "T" || !currentData?.destiny
                ? "Toda la comunidad"
                : "Audiencia seleccionada"}
            </strong>
          </div>

          <div className={styles.publicationContent}>
            <section className={styles.copy}>
              {isNews ? <h2>{currentData.title}</h2> : null}
              <div className={styles.descriptionContainer}>
                <p
                  className={`${styles.description} ${
                    !isExpanded ? styles.descriptionTruncated : ""
                  }`}
                >
                  <LinkifyDescription text={description} />
                </p>
                {description.length > 320 ? (
                  <button
                    type="button"
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                    className={styles.expandButton}
                  >
                    {isExpanded ? "Ver menos" : "Ver más"}
                  </button>
                ) : null}
              </div>
            </section>

            <section className={styles.media}>{renderMedia()}</section>
          </div>

          <footer className={styles.publicationFooter}>
            <div className={styles.stats}>
              <button
                type="button"
                onClick={() =>
                  props.onOpenLikes?.(currentData.id, likesCount)
                }
                disabled={!props.onOpenLikes}
                aria-label={`Ver las ${likesCount} personas que apoyaron esta publicación`}
              >
                <IconLike size={18} color="var(--cAccent)" />
                <span>
                  <strong>{likesCount}</strong>{" "}
                  {likesCount === 1 ? "apoyo" : "apoyos"}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  props.onOpenComments?.(currentData.id, currentData)
                }
                disabled={!props.onOpenComments}
                aria-label={`Ver los ${commentsCount} comentarios de esta publicación`}
              >
                <IconComment size={18} />
                <span>
                  <strong>{commentsCount}</strong>{" "}
                  {commentsCount === 1 ? "comentario" : "comentarios"}
                </span>
              </button>
            </div>
          </footer>
        </article>
      )}
    </DataModal>
  );
};

export default RenderView;
