"use client";
import { CSSProperties, useState } from "react";
import { initialsName } from "../../../utils/string";
import styles from "./avatar.module.css";
import { Image, ImageBaseProps } from "../Image";

type AvatarProps = Omit<ImageBaseProps, "alt" | "borderRadius"> & {
  name?: string;
  pin?: boolean;
  styleText?: CSSProperties;
};

export const Avatar = ({
  src = undefined,
  name = "",
  pin = false,
  children,
  w = 38,
  h = 38,
  onError,
  onClick,
  className = "",
  styleText,
  style,
  square,
  expandable = false,
  expandableZIndex,
  expandableIcon = true,
}: AvatarProps) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  const hasValidSrc =
    typeof src === "string" && src.trim().length > 0 && src !== "undefined";

  const shouldShowImage = hasValidSrc && !imageLoadError;
  const shouldShowInitials = !shouldShowImage;

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
        <div
          className={styles.avatarInitials}
          style={{ ...styleText, fontSize: w / 3 }}
        >
          {initialsName(name)}
        </div>
      )}
      {pin && <span className="spin"></span>}
      {children}
    </Image>
  );
};
