"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToastItem, ToastKind } from "@/mk/hooks/useToast";
import styles from "./toast.module.css";

const TOAST_TITLE: Record<ToastKind, string> = {
  success: "Éxito",
  error: "Error",
  warning: "Advertencia",
  info: "Información",
};

const TOAST_ICON: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const MAX_VISIBLE_TOASTS = 4;

/**
 * Cuánto dura la animación de salida antes de sacar el toast de la cola.
 *
 * Exportada a propósito: el test la importa en vez de repetir el 180. Medido con
 * el literal duplicado — el fallo era en UNA dirección, que es la que engaña:
 * bajando esta constante a 90 el test seguía VERDE, porque avanzaba 180 y el
 * descarte ya había ocurrido; subiéndola a 500 sí caía en rojo. O sea que sin el
 * vínculo, acortar la animación deja el test pasando sin medirla.
 */
export const EXIT_ANIMATION_MS = 180;

/**
 * Las tres etapas de un toast, en orden y sin volver atrás.
 *
 * 🔴 Son un estado, no dos flags (CDT-68). Antes la entrada se marcaba en un
 * `hasEnteredRef` que se seteaba SÓLO dentro del `requestAnimationFrame`, y el
 * descarte arrancaba con `if (!hasEnteredRef.current || isVisible) return`.
 * `rAF` no corre en una pestaña oculta: los toasts que se emiten después de un
 * `window.open` —el recibo y el de WhatsApp de Pagos, que abren otra pestaña y
 * mandan la actual al fondo— nacían con el frame pendiente. El reloj de vida,
 * que arrancaba en el montaje, igual vencía a los 5 s y ponía `isVisible` en
 * `false`, que YA era `false`: el efecto de descarte salía por el `return` y
 * nunca agendaba el `onDismiss`. Al volver a la pestaña el frame recién corría,
 * el toast APARECÍA y ya no quedaba ningún timer que lo sacara. Quedaba fijo
 * arriba y centrado, tapando el buscador, hasta 4 apilados, y sin poder
 * cerrarlo a mano porque la tarjeta tiene `pointer-events: none`.
 *
 * Con la máquina de estados el reloj de los 5 s no puede correr antes de que el
 * toast se vea: cuelga de `visible`, que es lo que setea el `rAF`. La entrada
 * sigue animada igual en el caso normal, y en la pestaña oculta el toast espera
 * al usuario en vez de descartarse sin que lo lea.
 */
type ToastPhase = "entering" | "visible" | "leaving";

const ToastCard = ({
  toast,
  depth,
  onDismiss,
}: {
  toast: ToastItem;
  depth: number;
  onDismiss: (id: string) => void;
}) => {
  const Icon = TOAST_ICON[toast.type || "info"];
  const [phase, setPhase] = useState<ToastPhase>("entering");
  const isVisible = phase === "visible";
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPhase((prev) => (prev === "entering" ? "visible" : prev));
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (phase !== "visible") return;
    if ((toast.time || 0) <= 0) return;

    const timeout = window.setTimeout(() => {
      setPhase("leaving");
    }, toast.time);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [phase, toast.id, toast.time]);

  useEffect(() => {
    if (phase !== "leaving") return;

    const timeout = window.setTimeout(() => {
      onDismissRef.current(toast.id);
    }, EXIT_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [phase, toast.id]);

  return (
    <div
      className={`${styles.toastCard} ${styles[`toast-${toast.type || "info"}`]}`}
      style={{
        transform: `translate3d(0, ${isVisible ? 0 : -18}px, 0) scale(${1 - depth * 0.01})`,
        opacity: isVisible ? `${1 - depth * 0.12}` : "0",
        zIndex: 12000 - depth,
      }}
      role="status"
      aria-live="polite"
      aria-label={TOAST_TITLE[toast.type || "info"]}
    >
      <div className={styles.toastIcon}>
        <Icon size={18} strokeWidth={2.1} />
      </div>
      <div className={styles.toastMessage}>{toast.msg}</div>
    </div>
  );
};

const ToastViewport = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) => {
  const visibleToasts = toasts.slice(-MAX_VISIBLE_TOASTS).reverse();

  if (!visibleToasts.length) return null;

  return (
    <div className={styles.viewport}>
      {visibleToasts.map((toast, index) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          depth={index}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default ToastViewport;
