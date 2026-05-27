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
  const [isVisible, setIsVisible] = useState(false);
  const hasEnteredRef = useRef(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      hasEnteredRef.current = true;
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if ((toast.time || 0) <= 0) return;

    const timeout = window.setTimeout(() => {
      setIsVisible(false);
    }, toast.time);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast.id, toast.time]);

  useEffect(() => {
    if (!hasEnteredRef.current || isVisible) return;

    const timeout = window.setTimeout(() => {
      onDismissRef.current(toast.id);
    }, 180);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isVisible, toast.id]);

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
