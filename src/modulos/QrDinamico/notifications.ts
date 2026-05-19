import { ModuleNotifConfig } from "@/mk/notif/types";

/**
 * Payments Module (QrDinamico) — Notification Config (condaty-admin)
 */
export const paymentNotifications: ModuleNotifConfig = {
  moduleId: "payments",
  events: {
    /** Evento disparado cuando se confirma un pago QR dinámico */
    "confirmPayment": ({ payload, showToast, dispatch }) => {
      const title = payload?.title || "Pago QR recibido";
      const body = payload?.body || "Se ha recibido y confirmado un pago por QR con éxito.";

      // Mostrar el toast en el panel de administración
      showToast(`🎉 ${title}: ${body}`, "success");

      // Despachar el evento interno para que las pantallas activas se actualicen en tiempo real
      dispatch("payment:confirmed", {
        paymentId: payload?.id,
        qrOrderId: payload?.qr_order_id,
        amount: payload?.amount,
      });
    },
  },
};
