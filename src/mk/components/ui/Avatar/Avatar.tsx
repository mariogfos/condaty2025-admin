"use client";
import { CSSProperties, useEffect, useState } from "react";
import { initialsName } from "../../../utils/string";
import styles from "./avatar.module.css";
import { useImageModal } from "@/contexts/ImageModalContext";

type PropsType = {
  src?: string;
  name?: string;
  hasImage?: string | number;
  pin?: boolean;
  children?: any;
  w?: number;
  h?: number;
  className?: string;
  onClick?: (e: any) => void;
  style?: CSSProperties;
  styleText?: CSSProperties;
  square?: boolean;
  onError?: () => void;
  expandable?: boolean;
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
  className,
  styleText,
  style,
  square,
  hasImage,
  expandable = false,
}: PropsType) => {
  const { openModal } = useImageModal();
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setImageError(false);
  }, [src]);

  if (!src || src.indexOf("undefined") > -1) {
    return null;
  }

  const handleImageClick = (e: React.MouseEvent) => {
    if (expandable && src && !imageError) {
      e.stopPropagation();
      openModal(src, name);
    }
    onClick?.(e);
  };

  return (
    <div 
      className={styles.avatar + " " + className}
      onClick={expandable ? handleImageClick : onClick}
      onKeyDown={expandable ? (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleImageClick(e as any);
        }
      } : undefined}
      role={expandable ? "button" : undefined}
      tabIndex={expandable ? 0 : undefined}
      aria-label={expandable ? `View ${name}'s profile picture` : undefined}
    >
      <div
        style={{
          width: w,
          height: h,
          borderRadius: square ? "var(--bRadiusS)" : "100%",
          ...style,
        }}
      >
        {src && !imageError && hasImage != 0 ? (
          <img
            src={src}
            alt={name}
            onError={() => {
              setImageError(true);
              onError?.();
            }}
          />
        ) : (
          <div style={{ ...styleText, fontSize: w / 3 }}>
            {initialsName(name)}
          </div>
        )}
      </div>
      {pin && <span className="spin"></span>}
      {children}
    </div>
  );
};
