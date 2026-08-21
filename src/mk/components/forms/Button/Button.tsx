import styles from "./button.module.css";
import { CSSProperties } from "react";

type PropsType = {
  variant?:
    | "primary"
    | "secondary"
    | "terciary"
    | "danger"
    | "accent"
    | "small"
    | "cancel";
  children: any;
  onClick?: (e?: any) => void;
  className?: string;
  small?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  /**
   * S141 (HALLAZGO-NEW-51, binding cross-project): HTML title attribute
   * (tooltip on hover). Útil para icon-only buttons (e.g.
   * `AsyncExportButton iconOnly`) donde el label de texto está
   * escondido pero el user necesita saber qué hace el botón.
   * Default: undefined (back-compat con consumers existentes).
   */
  title?: string;
  /**
   * S141: aria-label para screen readers. Mismo use case que `title`
   * — accesibilidad cuando el label visible está escondido. Si NO se
   * pinea, el screen reader lee el contenido del botón (ícono + texto).
   * Para icon-only buttons SIN texto, este atributo es OBLIGATORIO.
   */
  "aria-label"?: string;
  /**
   * S141: data-testid para smoke tests. Patrón S116b + S140-fe-2
   * (`data-testid="async-export-btn-{type}"`).
   */
  "data-testid"?: string;
};

const Button = ({
  variant = "primary",
  children,
  onClick,
  className = "",
  disabled = false,
  small = false,
  style,
  title,
  "aria-label": ariaLabel,
  "data-testid": dataTestid,
}: PropsType) => {
  return (
    <button
      style={style}
      className={
        styles.button +
        " " +
        styles[variant] +
        " " +
        (small ? styles["small"] : "") +
        " " +
        className
      }
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      data-testid={dataTestid}
    >
      {children}
    </button>
  );
};

export default Button;
