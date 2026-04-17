import { ModuleNotifConfig } from "@/mk/notif/types";
import { AssemblyStatus } from "./types/assemblies.types";

/**
 * Assemblies Module — Notification Config (condaty-admin)
 *
 * Handles InstantDB events related to assembly state changes.
 * Events arriving here were emitted from another admin viewing
 * the same assembly detail, or from a status-change socket.
 *
 * Events handled:
 * - "assembly-status-change": dispatches "assembly:status" so any admin
 *   on the detail or list screen can reload without manual refresh.
 * - "survey-status-change" from source=assembly: also refreshes assembly detail.
 */
export const assemblyNotifications: ModuleNotifConfig = {
  moduleId: "assemblies",
  events: {
    /** Fired when an assembly itself changes status (e.g. Finalizar). */
    "assembly-status-change": ({ payload, showToast, dispatch }) => {
      const subject = payload?.subject || "Asamblea";
      let msg = `📋 ${subject} actualizada`;
      if (payload?.status === AssemblyStatus.Completed)
        msg = `✅ ${subject} finalizada`;
      if (payload?.status === AssemblyStatus.InProgress)
        msg = `▶️ ${subject} en progreso`;

      showToast(msg, "info");

      // Dispatch for list + detail screens to reload
      dispatch("assembly:status", payload);
    },

    /**
     * survey-status-change from assembly context (source === "assembly").
     * Re-dispatches assembly:status so the detail screen reloads the surveys list
     * when another admin changes a vote status.
     */
    "survey-status-change": ({ payload, dispatch }) => {
      if (payload?.source === "assembly") {
        dispatch("assembly:status", payload);
      }
    },
    /** Fired from mobile app when a resident confirms participation. */
    "attendance-registered": ({ payload, showToast, dispatch }) => {
      showToast("Nueva asistencia registrada", "info");
      dispatch("attendance-registered", payload);
    },
    /** Fired when a vote is cast in an assembly survey. */
    "survey-stats": ({ payload, dispatch }) => {
      dispatch("survey-stats", payload);
    },
  },
};
