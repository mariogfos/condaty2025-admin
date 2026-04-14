"use client";

import { CSSProperties, ReactNode, useEffect, useState } from "react";
import Button from "../../forms/Button/Button";
import { IconX } from "../../../../components/layout/icons/IconsBiblioteca";
import { useScreenSize } from "@/mk/hooks/useScreenSize";
import styles from "./detailModal.module.css";

type PropsType = {
  children: ReactNode;
  onClose: (a: any) => void;
  open: boolean;
  onSave?: (e: any) => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  buttonText?: string;
  buttonCancel?: string;
  buttonExtra?: ReactNode;
  duration?: number;
  disabled?: boolean;
  style?: CSSProperties;
  zIndex?: number;
  minWidth?: string | number | null;
  maxWidth?: string | number | null;
  iconClose?: boolean;
  fullScreen?: boolean;
};

const DetailModal = ({
  children,
  onClose,
  open,
  onSave = () => {},
  title = "",
  subtitle = "",
  className = "",
  buttonText = "",
  buttonCancel = "",
  buttonExtra = null,
  duration = 300,
  disabled = false,
  style = {},
  zIndex = 220,
  minWidth = null,
  maxWidth = null,
  iconClose = true,
  fullScreen = false,
}: PropsType) => {
  const [openModal, setOpenModal] = useState(false);
  const { isMobile } = useScreenSize();

  const _close = (a: any = false) => {
    setOpenModal(false);
    setTimeout(() => {
      onClose(a);
    }, duration);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => setOpenModal(true), 80);
    } else {
      setOpenModal(false);
    }
  }, [open]);

  const customStyle = { ...style } as CSSProperties;
  if (minWidth && !isMobile) customStyle.minWidth = minWidth as any;
  if (maxWidth) customStyle.maxWidth = isMobile ? "calc(100vw - 24px)" : (maxWidth as any);
  if (isMobile) {
    customStyle.minWidth = 0;
  }

  return (
    <div
      style={{ visibility: open ? "visible" : "hidden", zIndex }}
      className={`${styles.detailModal} ${fullScreen ? styles.fullScreenOverlay : ""}`}
    >
      <main
        className={`${openModal ? styles.open : ""} ${fullScreen ? styles.fullScreenMain : ""}`}
        style={customStyle}
      >
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            {title ? <div className={styles.title}>{title}</div> : null}
            {subtitle ? (
              <div className={styles.subtitle}>{subtitle}</div>
            ) : null}
          </div>
          {iconClose ? (
            <button
              className={styles.closeButton}
              onClick={() => _close(false)}
            >
              <IconX size={20} color="var(--cWhite)" />
            </button>
          ) : null}
        </header>
        <section className={className}>{children}</section>
        {(buttonText !== "" || buttonCancel !== "" || buttonExtra) && (
          <footer className={styles.footer}>
            {buttonText !== "" && (
              <Button
                variant="primary"
                disabled={disabled}
                onClick={() => onSave("save")}
                style={{ height: 44, fontSize: 15, fontWeight: 600 }}
              >
                {buttonText}
              </Button>
            )}
            {buttonCancel !== "" && (
              <Button
                variant="secondary"
                onClick={() => _close("cancel")}
                style={{ height: 44, fontSize: 15, fontWeight: 600 }}
              >
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

export default DetailModal;
