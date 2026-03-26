/**
 * Modular Notification Registry — Types
 *
 * Each module can define a ModuleNotifConfig to handle its own notifications
 * independently. The registry in notifRegistry.ts collects all module configs
 * and useNotifInstandDB processes them.
 */

export interface ModuleNotifHandlerArgs {
  /** Raw InstantDB notification record */
  notif: any;
  /** Already JSON-parsed payload (useInstantMsg stores payload as a JSON string) */
  payload: any;
  /**
   * Dispatch a custom window event scoped to this module.
   * Consumers in the module listen with useEvent(eventName).
   * Example: dispatch("survey:new", payload)
   */
  dispatch: (eventName: string, data: any) => void;
  /**
   * Show a toast notification to the user.
   * Mirrors the `showToast` function available in Layout.tsx.
   */
  showToast: (message: string, type?: "info" | "success" | "warning" | "error") => void;
}

export type ModuleNotifHandler = (args: ModuleNotifHandlerArgs) => void;

export interface ModuleNotifConfig {
  /** Unique module identifier. Used for debugging. */
  moduleId: string;
  /**
   * Map of InstantDB event names → handler functions.
   * The key must match the value of `notif.event` in the InstantDB record.
   */
  events: Record<string, ModuleNotifHandler>;
  /**
   * Optional: additional InstantDB query channels this module needs to subscribe to.
   * Most modules won't need this — they rely on the global channels
   * already subscribed by useNotifInstandDB.
   * Format: [{ channel: "prefix-clientId-custom" }]
   */
  extraChannels?: { channel: string }[];
}
