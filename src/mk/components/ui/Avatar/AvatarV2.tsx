import { CSSProperties, useEffect, useState } from "react";
import styles from "./avatarv2.module.css";
import { IconUser } from "@/components/layout/icons/IconsBiblioteca";

type PropsType = {
  src?: string;
  name?: string;
  pin?: boolean;
  percentageLevelBar?: number;
  children?: any;
  w?: number;
  h?: number;
  className?: string;
  onClick?: (e: any) => void;
  style?: CSSProperties;
};

export const AvatarV2 = ({
  src = undefined,
  name = "",
  pin = false,
  percentageLevelBar = 0,
  children,
  w = 48,
  h = 48,
  onClick,
  className = "",
  style,
}: PropsType) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const strokeWidth = 5; // Grosor de la barra de progreso
  const radius = (Math.min(w, h) / 2) + strokeWidth / 2; // Radio del círculo
  const circumference = 2 * Math.PI * radius; // Longitud total del círculo
  const progressOffset = circumference - (percentageLevelBar / 100) * circumference;

  const svgSize = Math.max(w, h) + strokeWidth * 2; // Tamaño del SVG

  return (
    <div
      className={`${styles.avatar} ${className}`}
      onClick={onClick}
      style={{ width: svgSize, height: svgSize, ...style }}
    >
      <div className={styles.avatarImageWrapper} style={{ width: w, height: h }}>
        {src && !imageError ? (
          <img src={src} alt={name} onError={() => setImageError(true)} />
        ) : (
          <IconUser size={w - 8} color={"var(--cBlackV2)"} reverse={false} />
        )}
      </div>
      {/* SVG para la barra de progreso circular */}
      <svg
        className={styles.progressBar}
        width={svgSize}
        height={svgSize}
      >
        <circle
          className={styles.backgroundCircle}
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={styles.foregroundCircle}
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference || 0}
          strokeDashoffset={progressOffset || 0}
        />
      </svg>
      {pin && <span className="spin"></span>}
      {children}
    </div>
  );
};
