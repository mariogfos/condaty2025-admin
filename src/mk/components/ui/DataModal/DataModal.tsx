"use client";
import { CSSProperties, useEffect, useState } from "react";
import Button from "../../forms/Button/Button";
import { IconX } from "../../../../components/layout/icons/IconsBiblioteca";
import styles from "./dataModal.module.css";
import HeadTitle from "@/components/HeadTitle/HeadTitle";

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
  iconClose?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  colorTitle?: string;
  variant?: string | null;
};

const DataModal = ({
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
  iconClose = true,
  disabled = false,
  colorTitle = "var(--cWhite)",
  variant = null,
}: PropsType) => {
  const [openModal, setOpenModal] = useState(false);

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
  return (
    <div
      style={{ visibility: open ? "visible" : "hidden" }}
      className={styles.dataModal}
      onClick={(e) => e.stopPropagation()}
    >
      <main
        style={style}
        className={
          (openModal ? styles["open"] : "") +
          "  " +
          (fullScreen ? styles["full"] : "") +
          " " +
          (variant ? styles[variant] : "")
        }
      >
        <HeadTitle
          title={title}
          left={fullScreen && iconClose ? null : false}
          onBack={() => _close(false)}
          right={
            iconClose &&
            !fullScreen && (
              <IconX
                className=""
                size={40}
                onClick={() => _close(false)}
                circle
                style={{ backgroundColor: "transparent", padding: "0px" }}
              />
            )
          }
          colorBack={variant === "V2" ? "var(--cAccent)" : "var(--cWhite)"}
          colorTitle={!fullScreen ? colorTitle : "var(--cAccent)"}
        />
        {!fullScreen && <div className={styles.headerDivider} />}
        <section className={className}>{children}</section>
        {(buttonText != "" || buttonCancel != "") && (
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

export default DataModal;
