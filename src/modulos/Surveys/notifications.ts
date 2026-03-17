import { ModuleNotifConfig } from "@/mk/notif/types";

/**
 * Surveys Module — Notification Config
 *
 * Self-contained handler for all InstantDB events related to the Surveys module.
 * This is the ONLY place that needs to change when the survey notification
 * behavior changes — no touching Layout.tsx or any shared infrastructure.
 *
 * Events handled:
 * - "new-survey": Shows a toast and dispatches "survey:new" for list refresh.
 */
export const surveyNotifications: ModuleNotifConfig = {
  moduleId: "surveys",
  events: {
    "new-survey": ({ payload, showToast, dispatch }) => {
      const title = payload?.title ?? "Nueva encuesta disponible";
      showToast(`📋 ${title}`, "info");
      // Dispatch a scoped event — MisEncuestas.tsx listens to this
      dispatch("survey:new", payload);
    },
  },
};
