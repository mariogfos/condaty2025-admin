"use client";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import DetailModal from "../DetailModal/DetailModal";
import Button from "../../forms/Button/Button";
import { useScreenSize } from "@/mk/hooks/useScreenSize";
import styles from "./dataModal.module.css";
import HeadTitle from "@/components/HeadTitle/HeadTitle";

type PropsType = {
  children: any;
  onClose: (a: any) => void;
  open: boolean;
  onSave?: (e: any) => void;
  title?: string;
  titleClassName?: string;
  headerCenter?: ReactNode;
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
  headerDivider?: boolean;
  zIndex?: number;
  minWidth?: string | number | null;
  maxWidth?: string | number | null;
  ignoreTranslation?: boolean;
};

const DataModal = ({
  children,
  onClose,
  open,
  onSave = () => {},
  title = "",
  titleClassName = "",
  headerCenter = null,
  className = "",
  buttonText = "Guardar",
  buttonCancel = "Cancelar",
  buttonExtra = null,
  style = {},
  duration = 300,
  fullScreen = false,
  iconClose = true,
  disabled = false,
  variant = null,
  zIndex = 200,
  minWidth = null,
  maxWidth = null,
  ignoreTranslation = false,
}: PropsType) => {
  const [openModal, setOpenModal] = useState(false);
  const { isMobile, width } = useScreenSize();

  /**
   * 🔴 El temporizador se limpia al desmontar (CDT-95).
   *
   * Sin esto, el `setOpenModal(true)` de los 100 ms corre igual después de que
   * el modal ya no existe. En el navegador eso es un `setState` sobre un
   * componente desmontado; en la suite, el entorno de jsdom ya se desarmó y
   * React explota con `ReferenceError: window is not defined`, que vitest
   * cuenta como error no manejado: la suite sale con código 1 CON TODOS LOS
   * TESTS EN VERDE, y se lo cuelga a un archivo al azar —el que esté corriendo
   * cuando el temporizador vence—, así que manda a buscar el bug al módulo
   * equivocado.
   */
  useEffect(() => {
    if (!open) {
      setOpenModal(false);
      return;
    }
    const t = setTimeout(() => {
      setOpenModal(true);
    }, 100);
    return () => clearTimeout(t);
  }, [open]);

  const _close = (a: any = false) => {
    setOpenModal(false);
    setTimeout(() => {
      onClose(a);
    }, duration);
  };

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

  if (minWidth && !shouldCollapseMinWidth) customStyle.minWidth = minWidth as any;
  if (maxWidth)
    customStyle.maxWidth = isMobile ? "calc(100vw - 24px)" : (maxWidth as any);
  if (shouldCollapseMinWidth) {
    customStyle.minWidth = 0;
    customStyle.width = "100%";
  }
  if (variant === "mini" && !customStyle.maxWidth)
    customStyle.maxWidth = isMobile ? "calc(100vw - 24px)" : 560;

  if (fullScreen) {
    customStyle.width = "100vw";
    customStyle.maxWidth = "100vw";
    customStyle.height = "100vh";
    customStyle.maxHeight = "100vh";
    customStyle.borderRadius = 0;
  }

  if (fullScreen) {
    return (
      <div
        style={{ visibility: open ? "visible" : "hidden", zIndex }}
        className={styles.dataModal}
        data-i18n-ignore={ignoreTranslation ? "true" : undefined}
      >
        <main
          className={
            (openModal ? styles.open : "") +
            " " +
            (fullScreen ? styles.full : "") +
            " " +
            (variant ? styles[variant] : "")
          }
          style={customStyle}
        >
          <HeadTitle
            style={{ padding: "0px" }}
            title={title}
            left={iconClose ? null : false}
            onBack={() => _close(false)}
            colorBack="var(--cAccent)"
            colorTitle="var(--cAccent)"
          />
          <section className={className}>{children}</section>
          {(buttonText !== "" || buttonCancel !== "" || buttonExtra) && (
            <footer>
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
  }

  return (
    <div data-i18n-ignore={ignoreTranslation ? "true" : undefined}>
      <DetailModal
        open={open}
        onClose={onClose}
        onSave={onSave}
        title={title}
        titleClassName={titleClassName}
        headerCenter={headerCenter}
        className={className}
        buttonText={buttonText}
        buttonCancel={buttonCancel}
        buttonExtra={buttonExtra}
        duration={duration}
        disabled={disabled}
        style={customStyle}
        zIndex={zIndex}
        iconClose={iconClose}
        maxWidth={maxWidth}
        minWidth={minWidth}
        fullScreen={fullScreen}
      >
        {children}
      </DetailModal>
    </div>
  );
};

export default DataModal;
