import React from "react";
import Image from "next/image";
import { getUrlImages } from "@/mk/utils/string";
import { ContentItem } from "../types";
import ImageMosaic from "../ImageMosaic/ImageMosaic";
import { IconPdfPro } from "@/components/layout/icons/IconsBiblioteca";
import styles from "./MediaRenderer.module.css";

interface MediaRendererProps {
  item: ContentItem;
  modoCompacto?: boolean;
  onImageClick?: () => void;
  onNavigateImage?: (direction: "prev" | "next") => void;
}

const MediaRenderer: React.FC<MediaRendererProps> = ({
  item,
  modoCompacto = false,
  onImageClick,
}) => {
  // Normalizamos las imágenes (files > images)
  const normalizedImages = React.useMemo(() => {
    if (item.files && Array.isArray(item.files) && item.files.length > 0) {
      return item?.files.filter(
        (url): url is string => typeof url === "string" && url.trim() !== "",
      );
    }

    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      return item.images; // pasamos los objetos originales
    }

    return [];
  }, [item.files, item.images]);

  const hasImages = normalizedImages.length > 0;

  // ── YouTube ──
  const isYouTubeUrl = (url: string) =>
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(
      url,
    );

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  // ── Instagram ──
  const isInstagramUrl = (url: string) =>
    /instagram\.com\/(p|reel)\//.test(url);
  const getInstagramEmbedUrl = (url: string) => `${url}embed/`;

  // Render
  if (item.type === "I" && hasImages) {
    if (normalizedImages.length === 1) {
      const imageSrc =
        typeof normalizedImages[0] === "string"
          ? normalizedImages[0]
          : getUrlImages(
              `/CONT-${item.id}-${normalizedImages[0].id}.webp?d=${item.updated_at || ""}`,
            );

      return (
        <div className={styles.contentMediaContainer}>
          <Image
            src={imageSrc}
            alt={item.title || "Imagen de contenido"}
            width={600}
            height={400}
            className={styles.imageCard}
            onClick={onImageClick}
            unoptimized
          />
        </div>
      );
    }

    // Múltiples imágenes → pasamos el array tal cual (ya sea strings o objetos)

    return (
      <ImageMosaic
        item={item}
        modoCompacto={modoCompacto}
        onImageClick={onImageClick}
      />
    );
  }

  // Video
  if (item.type === "V" && item.url) {
    if (isYouTubeUrl(item.url)) {
      const embedUrl = getYouTubeEmbedUrl(item.url);
      if (embedUrl) {
        return (
          <div className={styles.contentMediaContainer}>
            <div className={styles.videoEmbedContainer}>
              <iframe
                src={embedUrl}
                title={item.title || "Video de YouTube"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.videoFrame}
              />
            </div>
          </div>
        );
      }
    }

    if (isInstagramUrl(item.url)) {
      const embedUrl = getInstagramEmbedUrl(item.url);
      return (
        <div className={styles.contentMediaContainer}>
          <div className={styles.instagramEmbedContainer}>
            <iframe
              src={embedUrl}
              title={item.title || "Post de Instagram"}
              allowTransparency
              className={styles.instagramFrame}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={styles.contentMediaContainer}>
        <div className={styles.externalMediaLink}>
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            Ver contenido externo
          </a>
          <div className={styles.externalMediaUrl}>{item.url}</div>
        </div>
      </div>
    );
  }

  // Documento
  if (item.type === "D" && item.url) {
    const documentUrl = getUrlImages(
      `/CONT-${item.id}.${item.url}?${item.updated_at || ""}`,
    );

    return (
      <div className={styles.contentMediaContainer}>
        <div className={styles.documentPreviewContainer}>
          <IconPdfPro size={48} color="var(--cAccent)" />
          <h3 className={styles.documentTitlePreview}>
            {item.title || "Documento"}
          </h3>
          <p className={styles.documentInfoPreview}>
            Haz clic para ver o descargar el documento
          </p>
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.documentLinkButton}
          >
            <IconPdfPro size={20} />
            Ver documento
          </a>
        </div>
      </div>
    );
  }

  return null;
};

export default MediaRenderer;
