"use client";
import { CSSProperties, useEffect, useState } from "react";
import Button from "../../forms/Button/Button";
import styles from "./dataModalV2.module.css";
import Br from "@/components/Detail/Br";
import { useScreenSize } from "@/mk/hooks/useScreenSize";

type PropsType = {
  children: any;
  onClose: (a: any) => void;
  open: boolean;
  onSave?: (e: any) => void;
  title?: string;
  className?: string;
  buttonText?: string;
  buttonCancel?: string;
  buttonExtra?: any;
  id?: string;
  duration?: number;
  fullScreen?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  variant?: string | null;
  zIndex?: number;
  minWidth?: string | number | null;
  maxWidth?: string | number | null;
  icon?: any;
  subtitle?: string;
};

const DataModalV2 = ({
  children,
  onClose,
  open,
  onSave = (e: any) => {},
  title = "",
  className = "",
  buttonText = "Guardar",
  buttonCancel = "Cancelar",
  buttonExtra = null,
  id = "",
  style = {},
  duration = 300,
  fullScreen = false,
  disabled = false,
  variant = null,
  zIndex = 200,
  minWidth = null,
  maxWidth = null,
  icon = null,
  subtitle = "",
}: PropsType) => {
  const [openModal, setOpenModal] = useState(false);
  const { isMobile, width } = useScreenSize();

  const _close = (a: any = false) => {
    setOpenModal(false);
    setTimeout(() => {
      onClose(a);
    }, duration);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setOpenModal(open);
      }, 100);
    } else {
      setOpenModal(open);
    }
  }, [open]);

  const customStyle = { ...style } as CSSProperties;
  const numericMinWidth =
    typeof minWidth === "number"
      ? minWidth
      : typeof minWidth === "string" && /^\d+(\.\d+)?(px)?$/.test(minWidth.trim())
        ? Number(minWidth.replace("px", "").trim())
        : null;
  const shouldCollapseMinWidth =
    isMobile ||
    (numericMinWidth !== null && width <= numericMinWidth + 72);

  if (minWidth && !shouldCollapseMinWidth) {
    customStyle.minWidth = minWidth as any;
  }
  if (maxWidth) {
    customStyle.maxWidth = isMobile ? "calc(100vw - 24px)" : (maxWidth as any);
  }
  if (shouldCollapseMinWidth) {
    customStyle.minWidth = 0;
    customStyle.width = "100%";
  }
  return (
    <div
      style={{
        visibility: open ? "visible" : "hidden",
        pointerEvents: open ? "auto" : "none",
        zIndex,
      }}
      className={styles.dataModal}
      onClick={(e) => e.stopPropagation()}
    >
      <main
        className={
          (openModal ? styles["open"] : "") +
          "  " +
          (fullScreen ? styles["full"] : "") +
          " " +
          (variant ? styles[variant] : "")
        }
        style={customStyle}
      >
        <div className={styles.header}>
          {icon && <div className={styles.headerIcon}>{icon}</div>}
          <div>
            <p className={styles.headerTitle}>{title}</p>
            <p className={styles.headerSubtitle}>{subtitle}</p>
          </div>
        </div>
        <Br
          style={{
            margin: "8px 0px",
            backgroundColor: "var(--cModalDivider)",
            height: 1,
          }}
        />
        <section className={className}>{children}</section>
        {(buttonText != "" || buttonCancel != "" || buttonExtra) && (
          <footer>
            {buttonText != "" && (
              <Button
                variant="primary"
                disabled={disabled}
                onClick={() => onSave("save")}
              >
                {buttonText}
              </Button>
            )}
            {buttonCancel != "" && (
              <Button variant="secondary" onClick={() => _close("cancel")}>
                {buttonCancel}
              </Button>
            )}
            {buttonExtra}
          </footer>
        )}
      </main>
    </div>
  );
};

export default DataModalV2;
