"use client";
import { CSSProperties } from "react";
import { LucideIcon } from "lucide-react";
import styles from "./icon.module.css";
import Tooltip, { TooltipPosition } from "@/mk/components/ui/Tooltip/Tooltip";

export interface IconType {
  className?: string | undefined;
  size?: number | string;
  onClick?: any;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
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

interface LucideWrapType extends IconType {
  icon: LucideIcon;
  strokeWidth?: number;
  position?: TooltipPosition;
  responsive?: boolean;
  absoluteStrokeWidth?: boolean;
}

const getIconClassName = ({
  className = "",
  circle = false,
  responsive = false,
  square = false,
  onClick,
}: Pick<
  IconWrapType,
  "className" | "circle" | "responsive" | "square" | "onClick"
>) =>
  [
    styles.icon,
    className,
    circle ? styles.circle : "",
    responsive ? styles.responsive : "",
    square ? styles.square : "",
    onClick ? styles.button : "",
  ]
    .filter(Boolean)
    .join(" ");

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
        className={getIconClassName({
          className,
          circle,
          responsive,
          square,
          onClick,
        })}
        style={{
          overflow: "visible",
          ...style,
          ...(circle ? { minWidth: size + "px" } : {}),
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

export const LucideWrap = ({
  icon: Icon,
  className = "",
  onClick = undefined,
  color = "currentColor",
  size = 24,
  style = {},
  circle = false,
  responsive = false,
  square = false,
  position = "top-right",
  title = "",
  strokeWidth = 1.25,
  absoluteStrokeWidth = false,
}: LucideWrapType) => {
  return (
    <Tooltip title={title} position={position}>
      <Icon
        className={getIconClassName({
          className,
          circle,
          responsive,
          square,
          onClick,
        })}
        style={{
          overflow: "visible",
          ...style,
          ...(circle ? { minWidth: size + "px" } : {}),
        }}
        color={color}
        size={size}
        strokeWidth={strokeWidth}
        absoluteStrokeWidth={absoluteStrokeWidth}
        onClick={onClick}
      />
    </Tooltip>
  );
};
