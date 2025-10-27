// Function: EmptyData
import styles from "./EmptyData.module.css";
import { IconTableEmpty } from "../layout/icons/IconsBiblioteca";
import { FC, ReactNode, useEffect, useRef } from "react";

interface EmptyDataProps {
  icon?: ReactNode;
  message?: string;
  line2?: string;
  className?: string;
  h?: number | string;
  centered?: boolean;
  size?: number | string;
  fontSize?: number | string;
  // Nuevo: forzar una sola línea y auto-shrink
  singleLine?: boolean;
  minFontSize?: number; // px mínimo al reducir la fuente (por defecto 12px)
}

const EmptyData: FC<EmptyDataProps> = ({
  message,
  line2,
  className = "",
  h = "100%",
  centered = true,
  icon,
  size = "52",
  fontSize,
  singleLine = false,
  minFontSize = 12,
}) => {
  const containerStyle = {
    height: h,
  };
  const containerClass = `${styles.container} ${
    centered ? styles.centered : ""
  } ${className}`;

  const msgRef = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!singleLine) return;

    const fitElement = (el: HTMLElement | null) => {
      if (!el) return;
      // Asegurar no wrap y ocultar overflow
      el.style.whiteSpace = "nowrap";
      el.style.overflow = "hidden";

      // font-size inicial: el computado del CSS, o el provisto por prop
      let current =
        parseFloat(window.getComputedStyle(el).fontSize) ||
        (typeof fontSize === "number" ? Number(fontSize) : 16);

      // Ajustar hasta que quepa en una sola línea o llegue al mínimo
      const safety = 100; // evita loops largos
      let i = 0;
      // Reset font-size para recalcular correctamente en cada corrida
      el.style.fontSize = `${current}px`;
      while (el.scrollWidth > el.clientWidth && current > minFontSize && i < safety) {
        current -= 0.5;
        el.style.fontSize = `${current}px`;
        i++;
      }
    };

    // Ajuste inicial
    fitElement(msgRef.current);
    fitElement(line2Ref.current);

    // Reajustar al redimensionar la ventana
    const onResize = () => {
      if (msgRef.current) msgRef.current.style.fontSize = "";
      if (line2Ref.current) line2Ref.current.style.fontSize = "";
      fitElement(msgRef.current);
      fitElement(line2Ref.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [message, line2, singleLine, minFontSize, fontSize]);

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={styles.icon}>
        {icon ?? <IconTableEmpty className={styles.icon} size={size} />}
      </div>
      <div
        ref={msgRef}
        className={`${styles.message} ${singleLine ? styles.singleLine : ""}`}
        style={!singleLine && fontSize ? { fontSize } : undefined}
      >
        {message ?? "No Hay elementos"}
      </div>
      <div
        ref={line2Ref}
        className={`${styles.line2} ${singleLine ? styles.singleLine : ""}`}
        style={!singleLine && fontSize ? { fontSize } : undefined}
      >
        {line2 ?? null}
      </div>
    </div>
  );
};

export default EmptyData;
