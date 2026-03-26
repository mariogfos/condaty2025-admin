"use client";
import { CSSProperties, useEffect, useState, ReactNode } from "react";
import styles from "./image.module.css";
import { useImageModal } from "@/contexts/ImageModalContext";
import { IconExpand } from "@/components/layout/icons/IconsBiblioteca";

export type ImageBaseProps = {
  src?: string;                    // URL de la imagen
  alt?: string;                    // Texto alternativo
  w?: number;                      // Ancho (por defecto: 48)
  h?: number;                      // Alto (por defecto: 48)
  className?: string;              // Clases CSS adicionales
  onClick?: (e: any) => void;      // Manejador de click
  style?: CSSProperties;           // Estilos inline
  square?: boolean;                // Si es cuadrada o redonda
  onError?: () => void;            // Callback cuando falla la carga
  expandable?: boolean;            // Habilitar modal expandible
  expandableZIndex?: number;       // z-index del modal
  expandableIcon?: boolean;        // Mostrar icono de expandir
  children?: ReactNode;            // Contenido adicional
  borderRadius?: string;           // Border radius personalizado
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  allowRenderWithoutSrc?: boolean; // Permite renderizar sin src (útil para mostrar solo children)
};

export const Image = ({
  src = undefined,
  alt = "",
  w = 48,
  h = 48,
  onError,
  onClick,
  className = "",
  style,
  square = false,
  expandable = false,
  expandableZIndex,
  expandableIcon = true,
  children,
  borderRadius,
  objectFit = "cover",
  allowRenderWithoutSrc = false,
}: ImageBaseProps) => {
  const { openModal } = useImageModal();
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setImageError(false);
  }, [src]);

  // Solo retornar null si no hay src Y no se permite renderizar sin src Y no hay children
  const hasValidSrc = src && src.indexOf("undefined") === -1;
  if (!hasValidSrc && !allowRenderWithoutSrc && !children) {
    return null;
  }
  
  const handleInteraction = (e: React.MouseEvent | React.KeyboardEvent | React.TouchEvent) => {
    if (expandable && hasValidSrc && !imageError) {
      e.stopPropagation();
      e.preventDefault();
      openModal(src, alt, expandableZIndex);
    }
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (expandable && (e.key === 'Enter' || e.key === ' ')) {
      handleInteraction(e);
    }
  };

  const computedBorderRadius = borderRadius || (square ? "var(--bRadiusS)" : "100%");

  const content = (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: computedBorderRadius,
        ...style,
      }}
      className={styles.imageContainer}
    >
      {hasValidSrc && !imageError ? (
        <>
          <img
            src={src}
            alt={alt}
            onError={() => {
              setImageError(true);
              onError?.();
            }}
            style={{ objectFit }}
          />
          {expandable && expandableIcon && <IconExpand color="var(--cWhite)" />}
        </>
      ) : null}
      {children}
    </div>
  );

  if (expandable || onClick) {
    return (
      <button 
        className={`${styles.image} ${styles.imageButton} ${className}`}
        onClick={handleInteraction}
        onKeyDown={handleKeyDown}
        onTouchEnd={handleInteraction}
        aria-label={alt || 'Image'}
        aria-expanded={expandable ? "false" : undefined}
        aria-haspopup={expandable ? "dialog" : undefined}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${styles.image} ${className}`}>
      {content}
    </div>
  );
};
