import { ModuleNotifConfig } from "./types";
import { surveyNotifications } from "@/modulos/Surveys/notifications";

/**
 * Global Module Notification Registry — condaty-admin
 *
 * Add one entry here when a new module needs to handle its own notifications.
 * The module's notification logic lives entirely in its own folder.
 *
 * Do NOT add notification handling logic here — this is only a registration list.
 */
export const MODULE_REGISTRY: ModuleNotifConfig[] = [
  surveyNotifications,
  // reservasNotifications,   ← future modules: add one line here
  // alertasNotifications,
];
