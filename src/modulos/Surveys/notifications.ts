import { ModuleNotifConfig } from "@/mk/notif/types";
import { subtituloDelCambioDeEstado } from "./estadoDeLaEncuesta";

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
      const term = payload?.source === "assembly" ? "Votación" : "Encuesta";
      const title = payload?.title ?? "Nueva " + term + " disponible";
      showToast(`📋 ${title}`, "info");
      // Dispatch a scoped event — MisEncuestas.tsx and Layout.tsx listen to this
      dispatch("survey:new", { ...payload, is_mandatory: isMandatory });
    },
    "survey-status-change": ({ payload, showToast, dispatch }) => {
      const term = payload?.source === "assembly" ? "Votación" : "Encuesta";
      // 🔴 `payload.status` es un `SurveyStatus` NUMÉRICO: lo pone el propio
      // admin al emitir. Comparar contra las letras no entraba nunca. Ver el
      // docblock de `subtituloDelCambioDeEstado`.
      const sub = subtituloDelCambioDeEstado(term, payload?.status);

      if (sub) {
        showToast(
          payload?.source === "assembly"
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
