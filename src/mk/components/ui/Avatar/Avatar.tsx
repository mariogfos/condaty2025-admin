"use client";
import { CSSProperties, useEffect, useState } from "react";
import { initialsName } from "../../../utils/string";
import styles from "./avatar.module.css";
import { IconUser } from "@/components/layout/icons/IconsBiblioteca";
type PropsType = {
  src?: string;
  name?: string;
  pin?: boolean;
  children?: any;
  w?: number;
  h?: number;
  className?: string;
  onClick?: (e: any) => void;
  style?: CSSProperties;
  styleText?: CSSProperties;
};

export const Avatar = ({
  src = undefined,
  name = "",
  pin = false,
  children,
  w = 48,
  h = 48,
  onClick,
  className,
  styleText,
  style,
}: PropsType) => {
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
  }, [src]);
  return (
    <div className={styles.avatar + " " + className} onClick={onClick}>
      <div style={{ width: w, height: h, ...style }}>
        {src && !imageError ? (
          <img src={src} alt={name} onError={() => setImageError(true)} />
        ) : (
          <div style={{ ...styleText }}>{initialsName(name)}</div>
          // <IconUser size={w - 8} color={"var(--cBlackV2)"} reverse={false} />
        )}
      </div>
      {pin && <span className="spin"></span>}
      {children}
    </div>
  );
};
