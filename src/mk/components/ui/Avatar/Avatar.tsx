"use client";
import { CSSProperties, useState } from "react";
import { initialsName } from "../../../utils/string";
import styles from "./avatar.module.css";
import { Image, ImageBaseProps } from "../Image";

type AvatarProps = Omit<ImageBaseProps, 'alt' | 'borderRadius'> & {
  name?: string;
  hasImage?: string | number;
  pin?: boolean;
  styleText?: CSSProperties;
};

export const Avatar = ({
  src = undefined,
  name = "",
  pin = false,
  children,
  w = 48,
  h = 48,
  onError,
  onClick,
  className = "",
  styleText,
  style,
  square,
  hasImage,
  expandable = false,
  expandableZIndex,
  expandableIcon = true,
}: AvatarProps) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Determinar si mostrar la imagen o las iniciales
  const hasValidSrc = src && src.indexOf("undefined") === -1;
  
  // Mostrar iniciales si:
  // 1. No hay src válido, O
  // 2. hasImage es explícitamente 0, O
  // 3. La imagen falló al cargar
  const shouldShowInitials = !hasValidSrc || hasImage === 0 || imageLoadError;
  const shouldShowImage = !shouldShowInitials;
  
  // Handler para cuando la imagen falla al cargar
  const handleImageError = () => {
    setImageLoadError(true);
    onError?.();
  };

  return (
    <Image
      src={shouldShowImage ? src : undefined}
      alt={name}
      w={w}
      h={h}
      onError={handleImageError}
      onClick={onClick}
      className={`${styles.avatar} ${className}`}
      style={style}
      square={square}
      expandable={shouldShowImage ? expandable : false} // Solo expandible si hay imagen
      expandableZIndex={expandableZIndex}
      expandableIcon={expandableIcon}
      borderRadius={square ? "var(--bRadiusS)" : "100%"}
      allowRenderWithoutSrc={true} // Permitir renderizar sin src para mostrar iniciales
    >
      {shouldShowInitials && (
        <div className={styles.avatarInitials} style={{ ...styleText, fontSize: w / 3 }}>
          {initialsName(name)}
        </div>
      )}
      {pin && <span className="spin"></span>}
      {children}
    </Image>
  );
};
