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
  onImageClick
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
    const imageUrl = getUrlImages(
      `/CONT-${item.id}-${image.id}.webp?d=${item.updated_at}`
    );

    const imageClass = index === 0 ?
      `${styles.mosaicImage} ${styles.mosaicImageFirst}` :
      styles.mosaicImage;

    return (
      <div
        key={`mosaic-${image.id}`}
        className={isLast ? styles.mosaicImageLast : undefined}
        onClick={onImageClick}
      >
        <Image
          src={imageUrl}
          alt={`Imagen ${index + 1} de ${item.title || 'contenido'}`}
          width={300}
          height={200}
          className={imageClass}
          unoptimized
        />
        {isLast && imageCount > 4 && (
          <div className={styles.mosaicOverlay}>
            +{imageCount - 3}
          </div>
        )}
      </div>
    );
  };

  const imagesToShow = imageCount > 4 ? item.images.slice(0, 4) : item.images;

  return (
    <div className={containerClass}>
      {imagesToShow.map((image, index) => {
        const isLast = index === imagesToShow.length - 1 && imageCount > 4;
        return renderImage(image, index, isLast);
      })}
    </div>
  );
};

export default ImageMosaic;
