import React from "react";
import Image from "next/image";
import { getUrlImages } from "@/mk/utils/string";
import { ContentItem } from "../types";
import ImageMosaic from "../ImageMosaic/ImageMosaic";
import {
  IconArrowLeft,
  IconArrowRight,
  IconPdfPro,
} from "@/components/layout/icons/IconsBiblioteca";
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
  onNavigateImage
}) => {
  const isYouTubeUrl = (url: string) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return youtubeRegex.test(url);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const isInstagramUrl = (url: string) => {
    return /instagram\.com\/(p|reel)\//.test(url);
  };

  const getInstagramEmbedUrl = (url: string) => {
    return `${url}embed/`;
  };

  if (item.type === "I" && item.images && item.images.length > 0) {
    if (item.images.length === 1) {
      const currentIndex = item.currentImageIndex || 0;
      const currentImage = item.images[currentIndex];
      const imageUrl = getUrlImages(
        `/CONT-${item.id}-${currentImage.id}.webp?d=${item.updated_at}`
      );

      return (
        <div className={styles.contentMediaContainer}>
          <Image
            src={imageUrl}
            alt={item.title || "Imagen de contenido"}
            width={600}
            height={400}
            className={styles.imageCard}
            onClick={onImageClick}
            unoptimized
          />
        </div>
      );
    } else {
      return (
        <ImageMosaic
          item={item}
          modoCompacto={modoCompacto}
          onImageClick={onImageClick}
        />
      );
    }
  }

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
    } else if (isInstagramUrl(item.url)) {
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
    } else {
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
  }

  if (item.type === "D" && item.url) {
    const documentUrl = getUrlImages(
      `/CONT-${item.id}.${item.url}?${item.updated_at}`
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
