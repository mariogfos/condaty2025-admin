"use client";
import { CSSProperties, useEffect, useState } from "react";
import { initialsName } from "../../../utils/string";
import styles from "./avatar.module.css";
import { useImageModal } from "@/contexts/ImageModalContext";
import { IconExpand } from "@/components/layout/icons/IconsBiblioteca";

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
  expandableZIndex?: number;
  expandableIcon?: boolean;
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
  expandableZIndex,
  expandableIcon = true,
}: PropsType) => {
  const { openModal } = useImageModal();
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setImageError(false);
  }, [src]);

  if (!src || src.indexOf("undefined") > -1) {
    return null;
  }

    const handleInteraction = (e: React.MouseEvent | React.KeyboardEvent | React.TouchEvent) => {
    if (expandable && src && !imageError) {
      e.stopPropagation();
      e.preventDefault();
      openModal(src, name, expandableZIndex);
    }
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (expandable && (e.key === 'Enter' || e.key === ' ')) {
      handleInteraction(e);
    }
  };

  const content = (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: square ? "var(--bRadiusS)" : "100%",
        ...style,
      }}
    >
      {src && !imageError && hasImage != 0 ? (
        <>
          <img
            src={src}
            alt={name}
            onError={() => {
              setImageError(true);
              onError?.();
            }}
          />
          {expandable && expandableIcon && <IconExpand color="var(--cWhite)" />}
        </>
      ) : (
        <div style={{ ...styleText, fontSize: w / 3 }}>
          {initialsName(name)}
        </div>
      )}
    </div>
  );

  if (expandable) {
    return (
      <button 
        className={`${styles.avatar} ${styles.avatarButton} ${className}`}
        onClick={handleInteraction}
        onKeyDown={handleKeyDown}
        onTouchEnd={handleInteraction}
        aria-label={`View ${name}'s profile picture`}
        aria-expanded="false"
        aria-haspopup="dialog"
        type="button"
      >
          {content}
          {pin && <span className="spin"></span>}
          {children}
      </button>
    );
  }

  return onClick ? (
    <button 
      className={`${styles.avatar} ${styles.avatarButton} ${className}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      }}
      onTouchEnd={onClick}
      type="button"
      aria-label={name ? `${name}'s avatar` : 'Avatar'}
    >
      {content}
      {pin && <span className="spin"></span>}
      {children}
    </button>
  ) : (
    <div className={styles.avatar + " " + className}>
      {content}
      {pin && <span className="spin"></span>}
      {children}
    </div>
  );
};
