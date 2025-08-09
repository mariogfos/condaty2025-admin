"use client";
import { CSSProperties } from "react";
import styles from "./icon.module.css";
import Tooltip, { TooltipPosition } from "@/mk/components/ui/Tooltip/Tooltip";

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
  position?: TooltipPosition;
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
  position = "top-right",
  title = "",
}: IconWrapType) => {
  return (
    <Tooltip title={title} position={position}>
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
        style={{
          overflow: "visible",
          ...style,
          ...(circle ? { minWidth: size + "px" } : {})
        }}
        fill={reverse ? fillStroke : color}
        stroke={reverse ? color : fillStroke}
        onClick={onClick}
        width={size}
        height={size}
      >
        {children}
      </svg>
    </Tooltip>
  );
};
