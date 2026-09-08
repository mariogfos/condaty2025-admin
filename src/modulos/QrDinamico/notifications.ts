import { ModuleNotifConfig } from "@/mk/notif/types";

/**
 * QrDinamico — Notification Config (DES-29/30)
 *
 * El backend notifica a los administradores por el canal "-admins" con
 * event = "admins" y el acto real dentro del payload (payload.act).
 * El pago QR confirmado llega como act = "confirmPayment" con el id del
 * ingreso. El backend emite SOLO la primera acreditación (idempotencia
 * DES-11) y la infraestructura de notifs deduplica por registro, así que
 * un mismo pago no produce toasts repetidos.
 */
export const paymentNotifications: ModuleNotifConfig = {
  moduleId: "payments",
  events: {
    admins: ({ payload, showToast, dispatch }) => {
      const act = payload?.act || payload?.info?.act;
      if (act !== "confirmPayment") return; // otros avisos de admins siguen su curso

      showToast("Se confirmó un pago por QR dinámico.", "success");

      // Pantallas abiertas (detalle de deuda, listados) se actualizan solas
      dispatch("payment:confirmed", {
        paymentId: payload?.id,
        ownerId: payload?.user_id,
      });
    },
  },
};
