"use client";
import { CSSProperties } from "react";
import DetailModal from "../DetailModal/DetailModal";

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
  const customStyle = { ...style } as CSSProperties;
  if (minWidth) customStyle.minWidth = minWidth as any;
  if (maxWidth) customStyle.maxWidth = maxWidth as any;
  if (variant === "mini" && !customStyle.maxWidth) customStyle.maxWidth = 560;
  if (fullScreen) {
    customStyle.width = "100vw";
    customStyle.maxWidth = "100vw";
    customStyle.height = "100vh";
    customStyle.maxHeight = "100vh";
    customStyle.borderRadius = 0;
  }

  return (
    <div data-i18n-ignore={ignoreTranslation ? "true" : undefined}>
      <DetailModal
        open={open}
        onClose={onClose}
        onSave={onSave}
        title={title}
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
      >
        {children}
      </DetailModal>
    </div>
  );
};

export default DataModal;
