import React from "react";
import Image from "next/image";
import styles from "./ImageMosaic.module.css";

interface ImageMosaicProps {
  item: {
    files?: string[]; // ← nuevo formato esperado
    id?: string | number;
    title?: any;
    updated_at?: string;
    [key: string]: any;
  };
  modoCompacto?: boolean;
  onImageClick?: () => void;
}

const ImageMosaic: React.FC<ImageMosaicProps> = ({
  item,
  modoCompacto = false,
  onImageClick,
}) => {
  // Usamos files en lugar de images
  const images = item?.files || [];

  if (images.length <= 1) {
    return null;
  }

  const imageCount = images.length;
  let containerClass = styles.imageMosaicContainer;

  if (imageCount === 2) {
    containerClass += ` ${styles.twoImages}`;
  } else if (imageCount === 3) {
    containerClass += ` ${styles.threeImages}`;
  } else {
    containerClass += ` ${styles.fourOrMoreImages}`;
  }

  const renderImage = (imageUrl: string, index: number, isLast = false) => {
    // Ya no necesitamos construir URL ni getUrlImages, porque llegan URLs completas
    const key = `mosaic-${index}-${imageUrl.substring(0, 20)}`; // clave única simple

    const imageClass =
      index === 0
        ? `${styles.mosaicImage} ${styles.mosaicImageFirst}`
        : styles.mosaicImage;

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
          unoptimized // ← mantengo porque usas Cloudinary y Next/Image con ?w o similar no siempre es necesario
        />
        {isLast && imageCount > 4 && (
          <div className={styles.mosaicOverlay}>+{imageCount - 3}</div>
        )}
      </div>
    );
  };

  // Mostramos máximo 4 imágenes (como el original)
  const imagesToShow = imageCount > 4 ? images.slice(0, 4) : images;

  return (
    <div className={containerClass}>
      {imagesToShow.map((imageUrl: string, index: number) => {
        const isLast = index === imagesToShow.length - 1 && imageCount > 4;
        return renderImage(imageUrl, index, isLast);
      })}
    </div>
  );
};

export default ImageMosaic;
