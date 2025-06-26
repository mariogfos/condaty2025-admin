"use client";
import { CSSProperties, useEffect, useState } from "react";
import { initialsName } from "../../../utils/string";
import styles from "./avatar.module.css";
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
}: PropsType) => {
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
  }, [src]);
  if (!src || src.indexOf("undefined") > -1) {
    console.error("se envio una imagen undefined");
    return null;
  }
  return (
    <div className={styles.avatar + " " + className} onClick={onClick}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: square ? "var(--bRadiusS)" : "100%",
          ...style,
        }}
      >
        {src && !imageError && hasImage != 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            onError={() => {
              setImageError(true);
              onError && onError();
            }}
          />
        ) : (
          <div style={{ ...styleText, fontSize: w / 3 }}>
            {initialsName(name)}
          </div>
          // <IconUser size={w - 8} color={"var(--cBlackV2)"} reverse={false} />
        )}
      </div>
      {pin && <span className="spin"></span>}
      {children}
    </div>
  );
};
