"use client";

import { useEffect, useMemo, useState } from "react";
import { createToastItem, ToastItem, ToastType } from "@/mk/hooks/useToast";
import ToastViewport from "./ToastViewport";

const Toast = ({
  toast,
  showToast,
}: {
  toast: ToastType;
  showToast: Function;
}) => {
  const [legacyToasts, setLegacyToasts] = useState<ToastItem[]>([]);

  const normalizedToast = useMemo(() => {
    if (!toast?.msg) return null;
    return createToastItem(
      toast.msg,
      toast.type || "info",
      toast.time || 5000,
    );
  }, [toast?.msg, toast?.time, toast?.type]);

  useEffect(() => {
    if (!normalizedToast) {
      setLegacyToasts([]);
      return;
    }

    setLegacyToasts([normalizedToast]);
  }, [normalizedToast]);

  // El descarte es local: saca ESTE toast de la lista de este componente.
  // Antes llamaba además a `showToast("")`, que vaciaba la cola global entera
  // —se llevaba puestos los avisos de otras pantallas— y desde CDT-60 un
  // mensaje vacío ya no toca la cola. `showToast` sigue en las props porque es
  // parte del contrato con `Payments`/`Outlays`.
  const dismissToast = (id: string) => {
    setLegacyToasts((prev) => prev.filter((item) => item.id !== id));
  };

  return <ToastViewport toasts={legacyToasts} onDismiss={dismissToast} />;
};

export default Toast;
