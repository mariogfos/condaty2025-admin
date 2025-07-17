"use client";
import { CSSProperties } from "react";
import styles from "./icon.module.css";

export interface IconType {
  className?: string | undefined;
  size?: number | string;
  onClick?: any;
  color?: string;
  style?: CSSProperties;
  viewBox?: string;
  circle?: boolean;
  reverse?: boolean;
  square?: boolean;
  title?: string;
}

interface IconWrapType extends IconType {
  children?: any;
  fillStroke?: string;
  responsive?: boolean;
}

export const IconWrap = ({
  className = "",
  onClick = undefined,
  color = "currentColor",
  fillStroke = "transparent",
  size = 24,
  viewBox = "0 0 24 24",
  children,
  style = {},
  reverse = false,
  circle = false,
  responsive = false,
  square = false,
  title = "",
}: IconWrapType) => {
  return (
    <svg
      viewBox={viewBox}
      className={
        styles.icon +
        " " +
        className +
        (circle ? " " + styles["circle"] : "") +
        (responsive ? " " + styles["responsive"] : "") +
        (square ? " " + styles["square"] : "") +
        (onClick ? " " + styles["button"] : "")
      }
      style={style}
      fill={reverse ? fillStroke : color}
      stroke={reverse ? color : fillStroke}
      onClick={onClick}
      width={size}
      height={size}
    >
      {children}
      <title>{title}</title>
    </svg>
  );
};
