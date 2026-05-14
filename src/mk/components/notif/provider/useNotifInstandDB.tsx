"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { id, init } from "@instantdb/react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEvent } from "@/mk/hooks/useEvents";
import { MODULE_REGISTRY } from "@/mk/notif/notifRegistry";

const readStoredLastNotif = () => {
  if (typeof window === "undefined") return 0;

  try {
    const storedValue = Number(localStorage.getItem("lastNotifInstantDB") ?? 0);
    return Number.isFinite(storedValue) ? storedValue : 0;
  } catch {
    return 0;
  }
};

const persistLastNotif = (value: number) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("lastNotifInstantDB", String(value));
  } catch {
    // Ignore localStorage errors in private mode or blocked contexts.
  }
};

const PROCESSED_NOTIF_TTL_MS = 2 * 60 * 1000;
const processedNotifKeys = new Map<string, number>();

const buildNotifKey = (notif: any) =>
  String(
    notif?.id ??
      `${notif?.channel ?? "unknown"}:${notif?.event ?? "unknown"}:${notif?.created_at ?? 0}`,
  );

const pruneProcessedNotifKeys = (now = Date.now()) => {
  processedNotifKeys.forEach((processedAt, key) => {
    if (now - processedAt > PROCESSED_NOTIF_TTL_MS) {
      processedNotifKeys.delete(key);
    }
  });
};

const hasProcessedNotif = (notifKey: string) => {
  pruneProcessedNotifKeys();
  return processedNotifKeys.has(notifKey);
};

const markNotifProcessed = (notifKey: string) => {
  pruneProcessedNotifKeys();
  processedNotifKeys.set(notifKey, Date.now());
};

let last = readStoredLastNotif();

let db: any = null;
export const initSocket = async () => {
  if (!db) {
    db = init({
      appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID as string,
      devtool: false,
    });
  }

  if (typeof window !== "undefined") {
    const unDiaAtras = Date.now() - 24 * 60 * 60 * 1000;
    const del: any[] = [];
    const query = {
      notif: {
        $: {
          where: {
            created_at: { $lt: unDiaAtras },
          },
          limit: 1000,
        },
      },
    };
    const { data: _notif } = await db.queryOnce(query);
    _notif.notif.forEach((e: any) => {
      del.push(db.tx.notif[e.id].delete());
    });
    if (del.length > 0) db.transact(del);
  }

  return db;
};

initSocket();

export type NotifType = {
  user: Record<string, any>;
  notifs: Record<string, any>[];
  lastNotif: number | null;
};

const channelGral: string = process.env
  .NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX as string;

// Admin role codes used throughout the platform
const ADMIN_ROLE_CODES = ["adm", "admi", "admin", "admins"];

/**
 * Returns true if this notification is relevant for an admin user.
 * Checks target_roles / target_criteria fields for admin segmentation.
 * If there is no segmentation, the message is considered a broadcast for everyone.
 */
const isNotifForAdmin = (notif: any, userRoleCode: string): boolean => {
  // No segmentation → broadcast to all
  if (!notif.target_roles && !notif.target_criteria) return true;

  // Check target_roles array (set by useInstantMsg when criteria.roles is present)
  if (notif.target_roles) {
    const roles: string[] = Array.isArray(notif.target_roles)
      ? notif.target_roles
      : JSON.parse(notif.target_roles);
    const isAdminRole = ADMIN_ROLE_CODES.includes(userRoleCode?.toLowerCase());
    const targetsAdmins = roles.some((r) =>
      ADMIN_ROLE_CODES.includes(r?.toLowerCase())
    );
    if (targetsAdmins && isAdminRole) return true;
    if (!targetsAdmins) return false;
  }

  // Check target_criteria for admin flag
  if (notif.target_criteria) {
    try {
      const criteria =
        typeof notif.target_criteria === "string"
          ? JSON.parse(notif.target_criteria)
          : notif.target_criteria;
      if (criteria?.roles) {
        const adminKeys = Object.keys(criteria.roles).filter((k) =>
          ADMIN_ROLE_CODES.includes(k?.toLowerCase())
        );
        const isTargeted = adminKeys.some(
          (k) =>
            criteria.roles[k] === true ||
            criteria.roles[k] === 1 ||
            criteria.roles[k] === "1"
        );
        if (!isTargeted) return false;
        return ADMIN_ROLE_CODES.includes(userRoleCode?.toLowerCase());
      }
    } catch {
      // If we can't parse, allow it through
    }
  }

  return true;
};

export type ShowToastFn = (message: string, type?: "info" | "success" | "warning" | "error") => void;

const useNotifInstandDB = (
  channels: { channel: string }[] | undefined = [],
  showToast?: ShowToastFn
): NotifType => {
  const { user } = useAuth();
  const [lastNotif, setLastNotif] = useState<number | null>(null);

  useEffect(() => {
    setLastNotif(last);
  }, []);

  const chiam = useMemo(
    () =>
      channelGral +
      "-" +
      (process.env.NEXT_PUBLIC_AUTH_IAM as string).replace("/", "") +
      user?.id,
    [user?.id]
  );

  // Derive extra channels declared by registered modules
  const registryChannels = useMemo(
    () =>
      MODULE_REGISTRY.flatMap((m) => m.extraChannels ?? []),
    []
  );

  const query = useMemo(
    () => ({
      notif: {
        $: {
          where: {
            and: [
              { client_id: user?.client_id },
              {
                or: [
                  { channel: channelGral },
                  { channel: channelGral + user?.client_id },
                  { channel: channelGral + user?.client_id + "-all" },
                  { channel: chiam },
                  { channel: channelGral + user?.client_id + "-admins" },
                  { channel: channelGral + user?.client_id + "-alerts-2" },
                  { channel: channelGral + user?.client_id + "-alerts-3" },
                  ...channels,
                  ...registryChannels,
                ],
              },
            ],
          },
          limit: 1,
          order: {
            serverCreatedAt: "desc",
          },
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.client_id, chiam, channels, registryChannels]
  );

  const { data } = db.useQuery(user?.id ? query : null);

  const { dispatch } = useEvent("onNotif");

  // Get the admin's role code for granular filtering
  const userRoleCode: string = user?.role?.code ?? "";

  const processNotif = useCallback(
    (notifData: any) => {
      if (!notifData?.notif?.length) return;
      const latest = notifData.notif[0];
      const latestCreatedAt = Number(latest?.created_at ?? 0);
      const latestKey = buildNotifKey(latest);

      if (latestCreatedAt === -1) {
        last = 0;
        persistLastNotif(0);
        processedNotifKeys.clear();
        setLastNotif(0);
        return;
      }

      if (!latestCreatedAt) return;

      if (latestCreatedAt <= last || hasProcessedNotif(latestKey)) {
        if (latestCreatedAt > last) {
          last = latestCreatedAt;
          persistLastNotif(last);
        }
        setLastNotif(last);
        return;
      }

      // Reserve the notification before dispatching side effects so
      // duplicated subscribers/re-renders do not replay the same toast.
      last = latestCreatedAt;
      markNotifProcessed(latestKey);
      persistLastNotif(last);

      // Granular role-based filter for admin
      if (!isNotifForAdmin(latest, userRoleCode)) {
        setLastNotif(last);
        return;
      }

      // Parse payload once — it is a JSON string stored by useInstantMsg
      const parsedPayload = (() => {
        try {
          return typeof latest.payload === "string"
            ? JSON.parse(latest.payload)
            : latest.payload;
        } catch {
          return latest.payload;
        }
      })();

      // Helper that modules use to dispatch scoped window events
      const dispatchModuleEvent = (eventName: string, data: any) => {
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
      };

      // Run all matching module registry handlers
      MODULE_REGISTRY.forEach((moduleConfig) => {
        const handler = moduleConfig.events[latest.event];
        if (handler) {
          handler({
            notif: latest,
            payload: parsedPayload,
            dispatch: dispatchModuleEvent,
            showToast: showToast || (() => {}),
          });
        }
      });

      // Still dispatch the global onNotif event so legacy handlers work
      dispatch(latest);
      setLastNotif(last);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userRoleCode, showToast]
  );

  useEffect(() => {
    processNotif(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.notif, processNotif]);

  const sendNotif = async (channel: string, event: string, payload: any) => {
    await db.transact(
      db.tx.notif[id()].update({
        from: user.id,
        payload,
        channel,
        event,
        created_at: Date.now(),
        client_id: user?.client_id,
      })
    );
  };

  const result = useMemo(
    () => ({
      user,
      notifs: data?.notif,
      sendNotif,
      lastNotif,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.notif, user, lastNotif]
  );

  return result;
};

export default useNotifInstandDB;
