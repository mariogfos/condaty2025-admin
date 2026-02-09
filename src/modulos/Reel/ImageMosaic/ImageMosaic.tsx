import React from "react";
import Image from "next/image";
import { getUrlImages } from "@/mk/utils/string";
import { ContentItem } from "../types";
import styles from "./ImageMosaic.module.css";

interface ImageMosaicProps {
  item: ContentItem;
  modoCompacto?: boolean;
  onImageClick?: () => void;
}

const ImageMosaic: React.FC<ImageMosaicProps> = ({
  item,
  modoCompacto = false,
  onImageClick,
}) => {
  if (!item.images || item.images.length <= 1) {
    return null;
  }

  const imageCount = item.images.length;
  let containerClass = styles.imageMosaicContainer;

  if (imageCount === 2) {
    containerClass += ` ${styles.twoImages}`;
  } else if (imageCount === 3) {
    containerClass += ` ${styles.threeImages}`;
  } else {
    containerClass += ` ${styles.fourOrMoreImages}`;
  }

  const renderImage = (image: any, index: number, isLast = false) => {
    // Soporte para dos formatos:
    // 1. Objeto con id → construimos la URL
    // 2. String → usamos directamente como URL
    let imageUrl: string;

    if (typeof image === "string") {
      imageUrl = image;
    } else if (image && typeof image === "object" && "id" in image) {
      imageUrl = getUrlImages(
        `/CONT-${item.id}-${image.id}.webp?d=${item.updated_at || ""}`,
      );
    } else {
      // Fallback en caso de formato inválido
      imageUrl = "/placeholder-image.jpg"; // o una imagen por defecto
    }

    const imageClass =
      index === 0
        ? `${styles.mosaicImage} ${styles.mosaicImageFirst}`
        : styles.mosaicImage;

    // Usamos un identificador único (id o índice)
    const key =
      typeof image === "string" ? `url-${index}` : `mosaic-${image.id}`;

    return (
      <div
        key={key}
        className={isLast ? styles.mosaicImageLast : undefined}
        onClick={onImageClick}
      >
        <Image
          src={imageUrl}
          alt={`Imagen ${index + 1} de ${item.title || "contenido"}`}
          width={300}
          height={200}
          className={imageClass}
          unoptimized
        />
        {isLast && imageCount > 4 && (
          <div className={styles.mosaicOverlay}>+{imageCount - 3}</div>
        )}
      </div>
    );
  };

  // Mostramos hasta 4 imágenes (como antes)
  const imagesToShow = imageCount > 4 ? item.images.slice(0, 4) : item.images;

  return (
    <div className={containerClass}>
      {imagesToShow.map((image: any, index: any) => {
        const isLast = index === imagesToShow.length - 1 && imageCount > 4;
        return renderImage(image, index, isLast);
      })}
    </div>
  );
};

export default ImageMosaic;
