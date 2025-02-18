import React, { ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./tooltip.module.css";

interface TooltipProps {
  children: ReactNode;
  position: { top: number; left: number };
}

const Tooltip: React.FC<TooltipProps> = ({ children, position }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div
      className={styles.tooltip}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {children}
    </div>,
    document.getElementById("tooltip-root") as HTMLElement
  );
};

export default Tooltip;
