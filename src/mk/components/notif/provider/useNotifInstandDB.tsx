import { useEffect, useMemo, useState } from "react";
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
export const initSocket = () => {
  if (!db) {
    db = init({
      appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID as string,
      devtool: false,
    });
    console.log("iniciando conexion a InstantDB");
  } else {
    console.log("recuperando conexion a InstantDB");
  }
  return db;
};

initSocket();

export type NotifType = {
  user: Record<string, any>;
  notifs: Record<string, any>[];
  // sendNotif: (channel: string, event: string, payload: any) => any;
  lastNotif: number | null;
};
const channelGral: string = process.env
  .NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX as string;

const useNotifInstandDB = (
  channels: { channel: string }[] | undefined = []
): NotifType => {
  const { user } = useAuth();
  const [lastNotif, setLastNotif] = useState<number | null>(null);

  useEffect(() => {
    // console.log("useeffect last", last);
    setLastNotif(last);
  }, []);
  const chiam =
    channelGral +
    "-" +
    (process.env.NEXT_PUBLIC_AUTH_IAM as string).replace("/", "") +
    user.id;
  const query = {
    notif: {
      $: {
        where: {
          // created_at: { $gte: new Date(last).toISOString() },
          or: [
            { channel: channelGral },
            { channel: channelGral + user?.client_id },
            { channel: chiam },
            { channel: channelGral + user?.client_id + "-admins" },
            { channel: channelGral + user?.client_id + "-alert-2" },
            { channel: channelGral + user?.client_id + "-alert-3" },
            ...channels,
          ],
        },
        limit: 2,
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
  };
  const { data } = db.useQuery(user?.id ? query : null);

  const { dispatch } = useEvent("onNotif");
  useEffect(() => {
    if (data?.notif?.length > 0) {
      console.log(
        "notif",
        data?.notif[0],
        lastNotif,
        data?.notif[0].created_at
      );
      if (data?.notif[0].created_at == -1) {
        localStorage.setItem("lastNotifInstantDB", "0");
        setLastNotif(0);
        console.log("notif reseteada");
      }

      if (lastNotif !== null && lastNotif < data?.notif[0].created_at) {
        console.log("notif enviada");
        dispatch(data?.notif[0]);
        last = data?.notif[0].created_at;
        localStorage.setItem("lastNotifInstantDB", last);
      }
      setLastNotif(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.notif]);

  const sendNotif = async (channel: string, event: string, payload: any) => {
    await db.transact(
      db.tx.notif[id()].update({
        from: user.id,
        payload,
        channel,
        event,
        created_at: Date.now(),
      })
    );
  };

  const result = useMemo(
    () => {
      return {
        user,
        notifs: data?.notif,
        sendNotif,
        lastNotif,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.notif, user, lastNotif]
  );

  return result;
  // return;
};

export default useNotifInstandDB;
