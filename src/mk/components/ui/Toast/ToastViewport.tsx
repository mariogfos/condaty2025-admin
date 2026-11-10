"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_TOAST_TIME,
  type ToastItem,
  type ToastKind,
} from "@/mk/hooks/useToast";
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
  const [hasEntered, setHasEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isVisible = hasEntered && !isClosing;
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasEntered(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const duration =
      typeof toast.time === "number" && Number.isFinite(toast.time) && toast.time > 0
        ? toast.time
        : DEFAULT_TOAST_TIME;
    const elapsed = Math.max(0, Date.now() - toast.createdAt);

    const timeout = window.setTimeout(() => {
      setIsClosing(true);
    }, Math.max(0, duration - elapsed));

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast.createdAt, toast.time]);

  useEffect(() => {
    if (!isClosing) return;

    const timeout = window.setTimeout(() => {
      onDismissRef.current(toast.id);
    }, 180);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isClosing, toast.id]);

  return (
    <div
      className={`${styles.toastCard} ${styles[`toast-${toast.type || "info"}`]}`}
      style={{
        transform: `translate3d(0, ${isVisible ? 0 : -18}px, 0) scale(${1 - depth * 0.01})`,
        opacity: isVisible ? `${1 - depth * 0.12}` : "0",
        zIndex: 12000 - depth,
      }}
    >
      <div className={styles.toastIcon}>
        <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
      </div>
      <div
        className={styles.toastMessage}
        role="status"
        aria-label={TOAST_TITLE[toast.type || "info"]}
      >
        {toast.msg}
      </div>
      <button
        type="button"
        className={styles.toastClose}
        aria-label="Cerrar notificación"
        disabled={!isVisible}
        onClick={() => onDismiss(toast.id)}
      >
        <X size={18} aria-hidden="true" />
      </button>
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
