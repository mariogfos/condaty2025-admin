import React, { useState, useRef, useEffect } from "react";
import styles from "./coloredCircle.module.css";
import Tooltip from "../Tooltip/Tooltip";

interface ColoredCircleProps {
  color: string;
  tooltipText: string;
  delayShow?: number;
  delayHide?: number;
}

const ColoredCircle: React.FC<ColoredCircleProps> = ({
  color,
  tooltipText,
  delayShow = 300,
  delayHide = 300,
}) => {
  const [hovered, setHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  }>({
    top: 0,
    left: 0,
  });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  // Función para calcular la posición del tooltip
  const updateTooltipPosition = () => {
    if (circleRef.current) {
      const rect = circleRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + window.scrollY - 10, // Ajustar según sea necesario
        left: rect.left + rect.width / 2,
      });
    }
  };

  const handleMouseEnter = () => {
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }

    hoverTimeout.current = setTimeout(() => {
      updateTooltipPosition();
      setHovered(true);
    }, delayShow);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }

    leaveTimeout.current = setTimeout(() => {
      setHovered(false);
    }, delayHide);
  };

  // Recalcular la posición del tooltip si cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (hovered) {
        updateTooltipPosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
      if (leaveTimeout.current) {
        clearTimeout(leaveTimeout.current);
      }
    };
  }, [hovered]);

  return (
    <div
      className={styles.circle}
      style={{ backgroundColor: color }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={circleRef}
    >
      {hovered && <Tooltip position={tooltipPosition}>{tooltipText}</Tooltip>}
    </div>
  );
};

export default ColoredCircle;
