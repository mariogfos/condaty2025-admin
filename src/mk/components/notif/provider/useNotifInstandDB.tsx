import { useCallback, useEffect, useMemo, useState } from "react";
import { id } from "@instantdb/react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEvent } from "@/mk/hooks/useEvents";
import { initSocket } from "../../chat/provider/useInstandDB";

let last: any = 0;
try {
  last = localStorage.getItem("lastNotifInstantDB");
} catch (error) {
  last = 0;
}

const db: any = initSocket();
export type NotifType = {
  user: Record<string, any>;
  notifs: Record<string, any>[];
  showToast: Function;
  sendNotif: (channel: string, event: string, payload: any) => any;
  lastNotif: number | null;
};
const channelGral: string = process.env
  .NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX as string;

const useNotifInstandDB = (
  channels: { channel: string }[] | undefined = []
): NotifType => {
  const { user, showToast } = useAuth();

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
            {
              channel: chiam,
            },
            { channel: channelGral + "-fosadmin" },
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
  const { data } = db.useQuery(query);

  const [lastNotif, setLastNotif] = useState(null);
  const { dispatch } = useEvent("onNotif");
  useEffect(() => {
    if (data?.notif?.length > 0) {
      if (lastNotif && lastNotif < data?.notif[0].created_at) {
        dispatch(data?.notif[0]);
        last = data?.notif[0].created_at;
        localStorage.setItem("lastNotifInstantDB", last);
      }
      setLastNotif(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.notif]);

  useEffect(() => {
    setLastNotif(last);
  }, []);

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
        showToast,
        sendNotif,
        lastNotif,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.notif, user, lastNotif]
  );

  return result;
};

export default useNotifInstandDB;
