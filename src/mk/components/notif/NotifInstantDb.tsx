"use client";
import { useEffect } from "react";
import useNotifInstandDB from "./provider/useNotifInstandDB";
import { useEvent } from "@/mk/hooks/useEvents";

export default function NotifInstantDb() {
  const { showToast, notifs, lastNotif } = useNotifInstandDB();

  // const { dispatch } = useEvent("onNewNotif", (e: any) => {
  //   console.log("onNewNotif received", e);
  //   showToast(e, "info");
  // });
  useEffect(() => {
    if (lastNotif && notifs) {
      showToast(notifs[lastNotif - 1]?.payload?.title, "info");
      console.log("showtoast", notifs[lastNotif - 1]);
    }
    console.log("useeffect last notif", lastNotif);
  }, [lastNotif, notifs]);
  return null;
  return (
    <div style={{ color: "white" }}>
      Notificaciones: <br />
      {lastNotif}
      {JSON.stringify(notifs)}
    </div>
  );
}
