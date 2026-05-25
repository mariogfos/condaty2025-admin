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
      const isMandatory =
        payload?.is_mandatory === "Y" || payload?.is_mandatory === true;
      const term = payload?.type === "assembly" ? "Votación" : "Encuesta";
      const title = payload?.title ?? "Nueva " + term + " disponible";
      showToast(`📋 ${title}`, "info");
      // Dispatch a scoped event — MisEncuestas.tsx and Layout.tsx listen to this
      dispatch("survey:new", { ...payload, is_mandatory: isMandatory });
    },
    "survey-status-change": ({ payload, showToast, dispatch }) => {
      const term = payload?.type === "assembly" ? "Votación" : "Encuesta";
      if (["A", "P", "C"].includes(payload?.status)) {
        let sub = `${term} actualizada`;
        if (payload.status === "P") sub = `${term} pausada`;
        if (payload.status === "C") sub = `${term} cerrada`;
        if (payload.status === "A") sub = `${term} reanudada`; // Siempre reanudada; el inicio usa new-survey
        showToast(
          term === "Votación"
            ? `📢 ${sub}`
            : `📢 ${sub}: ${payload.title || ""}`,
          "info",
        );
      }
      // Dispatch a scoped event — MisEncuestas.tsx and Layout.tsx listen to this
      dispatch("survey:status", payload);
    },
  },
};
