import { useCallback, useEffect, useMemo, useState } from "react";
import { id, init } from "@instantdb/react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEvent } from "@/mk/hooks/useEvents";

let last: any = 0;
try {
  last = localStorage.getItem("lastNotifInstantDB") ?? 0;
} catch (error) {
  last = 0;
}

let db: any = null;
export const initSocket = async () => {
  if (!db) {
    db = init({
      appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID as string,
      devtool: false,
    });
    console.log("iniciando conexion a InstantDB");
  } else {
    console.log("recuperando conexion a InstantDB");
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
    console.log("notif", del.length);
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

const useNotifInstandDB = (
  channels: { channel: string }[] | undefined = []
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
    [user?.client_id, chiam, channels]
  );

  const { data } = db.useQuery(user?.id ? query : null);

  const { dispatch } = useEvent("onNotif");

  // Get the admin's role code for granular filtering
  const userRoleCode: string = user?.role?.code ?? "";

  const processNotif = useCallback(
    (notifData: any) => {
      if (!notifData?.notif?.length) return;
      const latest = notifData.notif[0];

      if (latest.created_at === -1) {
        localStorage.setItem("lastNotifInstantDB", "0");
        setLastNotif(0);
        return;
      }

      if (lastNotif !== null && lastNotif < latest.created_at) {
        // Granular role-based filter for admin
        if (!isNotifForAdmin(latest, userRoleCode)) {
          last = latest.created_at;
          localStorage.setItem("lastNotifInstantDB", last);
          setLastNotif(last);
          return;
        }
        console.log("notif enviada (admin)");
        dispatch(latest);
        last = latest.created_at;
        localStorage.setItem("lastNotifInstantDB", last);
      }
      setLastNotif(last);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastNotif, userRoleCode]
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
