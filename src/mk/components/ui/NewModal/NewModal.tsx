"use client";
import { CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../forms/Button/Button";
import { IconX } from "../../../../components/layout/icons/IconsBiblioteca";
import styles from "./newModal.module.css";
import HeadTitle from "@/components/HeadTitle/HeadTitle";

type PropsType = {
  children: any;
  onClose: (a: any) => void;
  open: boolean;
  onSave?: (e: any) => void;
  title?: string;
  subtitle?: string;
  icon?: any;
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
};

const NewModal = ({
  children,
  onClose,
  open,
  onSave = (e: any) => {},
  title = "",
  subtitle = "",
  icon = null,
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
  //colorTitle = 'var(--cAccent)',
  colorTitle = "var(--cWhite)",
  variant = null,
  zIndex = 200,
  headerDivider = true,
  minWidth = null,
  maxWidth = null,
}: PropsType) => {
  const [openModal, setOpenModal] = useState(false);
  // S141 (HALLAZGO-NEW-51, binding cross-project): SSR safety. `document`
  // no existe en el server, así que pineamos el portal solo después del
  // primer effect (client mount). En SSR retornamos `null` (el modal
  // se renderea client-side only gracias a `"use client"`).
  const [mounted, setMounted] = useState(false);

  const _close = (a: any = false) => {
    setOpenModal(false);
    setTimeout(() => {
      onClose(a);
    }, duration);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setOpenModal(open);
      }, 100);
    } else {
      setOpenModal(open);
    }
  }, [open]);

  if (minWidth) {
    style.minWidth = minWidth;
  }
  if (maxWidth) {
    style.maxWidth = maxWidth;
  }

  const headerContent = (
    <div className={styles.headerContainer}>
      {icon && <div className={styles.iconContainer}>{icon}</div>}
      <div className={styles.titleContainer}>
        {title && <p className={styles.modalTitle}>{title}</p>}
        {subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );

  // S141 (HALLAZGO-NEW-51, binding cross-project): pineamos
  // `createPortal(..., document.body)` para que el modal NO quede
  // atrapado en un stacking context ancestro. El bug clásico: un padre
  // con `transform`, `filter`, `perspective`, `will-change`,
  // `contain: paint` o `backdrop-filter` rompe `position: fixed` y el
  // modal se renderea dentro del card / columna / modal padre en vez
  // de cubrir el viewport. El portal al body escapa cualquier
  // stacking context y pinea el modal SIEMPRE encima de todo.
  //
  // UX: pineamos `pointer-events: none` cuando `open=false` para que el
  // wrapper invisible (que sigue montado para preservar la animación
  // de cierre con `transition: all 0.3s`) NO intercepte clicks. La
  // animación de cierre se sigue viendo porque el componente sigue en
  // el DOM hasta que `onClose` se ejecute vía el setTimeout de `_close`.
  //
  // S127 (HALLAZGO-NEW-37) sigue vigente: `{open && children}` mata
  // los useEffect zombie (polling de DownloadHistory, useAsyncExport)
  // cuando el modal está cerrado.
  const modalContent = (
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
        style={style}
      >
        <HeadTitle
          style={{ padding: "0px" }}
          title={""}
          customTitle={headerContent}
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
        {/* {!fullScreen && headerDivider && (
          <div className={styles.headerDivider} />
        )} */}
        {/* S127 (HALLAZGO-NEW-37, binding cross-project): pinear
         * `{open && children}` en vez de `{children}` directo.
         *
         * Por qué: el patrón anterior siempre renderizaba los
         * children, cambiando solo `visibility: hidden/visible` del
         * wrapper. Eso significaba que los `useEffect` de los children
         * (e.g. polling de `DownloadHistory`, setInterval de
         * `useAsyncExport`) seguían activos cuando el modal estaba
         * "cerrado" — el user navegaba a otro menú y los polls
         * seguían disparando `GET /v3/reports` y `GET /v3/reports/{id}/status`
         * para siempre. Resultado: network flood al cambiar de menú.
         *
         * El fix de raíz: desmontar los children cuando `open=false`
         * → React ejecuta los cleanup de los useEffect → polls mueren.
         * Es el patrón de las headless modal libs modernas (Headless UI,
         * Radix, Chakra).
         *
         * Trade-off documentado: cualquier state interno de los
         * children (useState) se resetea al cerrar/reabrir. Eso es
         * exactamente lo que queremos para modales de "progress" y
         * "history" (cleanup completo al cerrar). Si un modal futuro
         * necesita preservar state entre aperturas, debe subir el
         * state al parent y pasarlo como props, NO depender del
         * children-montado-aunque-cerrado.
         */}
        <section className={className}>{open && children}</section>
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

  // S141: SSR safety. Antes del primer mount client, `document` no
  // existe → no pineamos portal. Después del mount, pineamos portal
  // al body. Si `mounted=false` (SSR o primer render antes del
  // effect), retornamos `null`.
  if (!mounted) return null;
  return createPortal(modalContent, document.body);
};

export default NewModal;
