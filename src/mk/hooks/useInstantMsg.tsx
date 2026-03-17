import { id } from "@instantdb/react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { initSocket } from "../components/notif/provider/useNotifInstandDB";

// ─── Channel mapping ────────────────────────────────────────────────────────
// Maps known role-key prefixes to their corresponding platform channels.
const ROLE_TO_CHANNEL: Record<string, string> = {
  // Admin roles
  adm: "admins",
  admi: "admins",
  admin: "admins",
  admins: "admins",
  // Owner roles
  owner: "owners",
  owner_homeowner: "owners",
  owner_tenant: "owners",
  owner_titular: "owners",
  homeowner: "owners",
  tenant: "owners",
  titular: "owners",
  // Guard roles
  guard: "guards",
  guardia: "guards",
  guards: "guards",
};

/**
 * Analyzes the criteria object and resolves the optimal InstantDB channel.
 *
 * Rules:
 *  - No criteria / no roles → "all" (true broadcast)
 *  - Only one app-group targeted → that group's specific channel (e.g., "admins")
 *  - Multiple app-groups → "all" (one write, each client filters by role)
 */
export const resolveChannel = (criteria: any): string => {
  if (!criteria?.roles) return "all";

  const activeRoles = Object.entries(criteria.roles)
    .filter(([, v]) => v === true || v === 1 || v === "1")
    .map(([k]) => k.toLowerCase());

  if (activeRoles.length === 0) return "all";

  // Determine which app-channels are involved
  const channels = new Set(
    activeRoles.map((r) => ROLE_TO_CHANNEL[r] ?? "all")
  );

  // If any role mapped to "all" (unknown), or multiple channels → use "all"
  if (channels.size > 1 || channels.has("all")) return "all";

  // Single channel group
  return channels.values().next().value as string;
};

/**
 * Hook to send real-time messages via InstantDB.
 * Bypasses the backend for instant UI updates (toasts, etc.)
 */
export const useInstantMsg = () => {
  const { user } = useAuth();

  /**
   * Sends a message to a specific channel with optional criteria.
   * @param channel Target channel (e.g., 'owners', 'guards', 'admins', 'all', or a specific IAM channel)
   * @param event Event name (e.g., 'new-survey', 'alerts')
   * @param payload Data to send
   * @param criteria Optional criteria for granular segmentation
   */
  const sendMsg = async (channel: string, event: string, payload: any, criteria: any = null) => {
    try {
      const db = await initSocket();
      if (!db) {
        console.error("InstantDB not initialized");
        return;
      }

      const prefix = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX || "";
      const clientId = user?.client_id || "";

      // Build the full channel name: {prefix}{client_id}-{channel}
      let fullChannel = channel;
      if (!channel.startsWith(prefix)) {
        fullChannel = `${prefix}${clientId}-${channel}`;
      }

      console.log(`Broadcasting to ${fullChannel}:`, { event, payload, criteria });

      const updateData: any = {
        from: `ADM-${user?.id || "system"}`,
        payload: typeof payload === "string" ? payload : JSON.stringify(payload),
        channel: fullChannel,
        event,
        created_at: Date.now(),
        client_id: clientId,
      };

      if (criteria) {
        updateData.target_criteria = JSON.stringify(criteria);
        if (criteria.roles) {
          const activeRoles = Object.entries(criteria.roles)
            .filter(([, v]) => v === true || v === "1" || v === 1)
            .map(([k]) => k);
          if (activeRoles.length > 0) {
            updateData.target_roles = activeRoles;
          }
        }
      }

      await db.transact(db.tx.notif[id()].update(updateData));
    } catch (error) {
      console.error("Error sending instant message:", error);
    }
  };

  /**
   * Smart multi-group notify: resolves the optimal channel from criteria automatically.
   * - Single group targeted  → sends to that group's channel (e.g., "admins", "owners")
   * - Multiple groups or all → sends to "all" channel (1 DB write, clients filter by role)
   *
   * @example
   * notifySegmented("new-survey", payload, survey.target_criteria)
   */
  const notifySegmented = (event: string, payload: any, criteria: any = null) => {
    const channel = resolveChannel(criteria);
    return sendMsg(channel, event, payload, criteria);
  };

  /** Notify all owners explicitly (ignores smart routing). */
  const notifyOwners = (event: string, payload: any, criteria: any = null) =>
    sendMsg("owners", event, payload, criteria);

  /** Notify all guards explicitly. */
  const notifyGuards = (event: string, payload: any, criteria: any = null) =>
    sendMsg("guards", event, payload, criteria);

  /** Notify all admins explicitly. */
  const notifyAdmins = (event: string, payload: any, criteria: any = null) =>
    sendMsg("admins", event, payload, criteria);

  /** Notify all users (broadcast to 'all' channel). */
  const notifyAll = (event: string, payload: any, criteria: any = null) =>
    sendMsg("all", event, payload, criteria);

  return {
    sendMsg,
    notifySegmented,
    notifyOwners,
    notifyGuards,
    notifyAdmins,
    notifyAll,
  };
};

export default useInstantMsg;
