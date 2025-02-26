'use client';
import { useMemo, useEffect, useState } from 'react';
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Notifications.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateStrMes } from "@/mk/utils/date";

import { useRouter } from "next/navigation";
import {
  IconAlertNotification,
  IconPreRegister,
  IconPaymentCommitment,
} from "@/components/layout/icons/IconsBiblioteca";
import { useAuth } from '@/mk/contexts/AuthProvider';

// Definir tipos para ayudar a TypeScript
type NotificationInfo = {
  act?: string;
  id?: number | string;
  level?: number;
  guard_name?: string;
  guard_id?: string;
  user_id?: string;
};

type NotificationMessage = {
  msg?: {
    title?: string;
    body?: string;
  };
  info?: NotificationInfo;
};

type NotificationItem = {
  id: number;
  message: string;
  created_at: string;
};

const mod = {
  modulo: "notifications",
  singular: "Notificación",
  plural: "Notificaciones",
  permiso: "",
  extraData: false,
  hideActions: { edit: true, del: true, add: true, view: false },
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Notifications = () => {
  const { user, setStore, store } = useAuth();
  const router = useRouter();
  const [id, setId] = useState<number | string>(0);
  const [notificationsView, setNotificationsView] = useState<number[]>(
    JSON.parse(localStorage.getItem("notificationsView") || "[]")
  );

  useEffect(() => {
    setStore((old: any) => ({
      ...old,
      notif: 0,
    }));
  }, [setStore]);

  useEffect(() => {
    localStorage.setItem(
      "notificationsView",
      JSON.stringify(notificationsView)
    );
  }, [notificationsView]);

  const renderNotificationIcon = (info: NotificationInfo) => {
    if (info?.act === "alerts") {
      return <IconAlertNotification className={styles.alertIcon} />;
    }
    if (info?.act === "newPreregister") {
      return <IconPreRegister className={styles.preregisterIcon} />;
    }
    if (info?.act === "newVoucher" || info?.act === "newPayment") {
      return <IconPaymentCommitment className={styles.paymentIcon} />;
    }
    return null;
  };

  const handleNotificationClick = (item: NotificationItem) => {
    let x = item.message.replace("\\", "");
    let parsedMessage: NotificationMessage = {};
    
    if (typeof x === "string") {
      try {
        parsedMessage = JSON.parse(x);
      } catch (error) {
        console.error("Error parsing notification message:", error);
      }
    }
    
    setNotificationsView((prev: number[]) => {
      if (!prev.includes(item.id)) {
        return [...prev, item.id];
      }
      return prev;
    });

    if (parsedMessage?.info?.act === "newVoucher" || parsedMessage?.info?.act === "newPayment") {
      if (parsedMessage.info?.id) {
        setId(parsedMessage.info.id);

        router.push(`/payments/${parsedMessage.info.id}`);
      }
    }
    if (parsedMessage?.info?.act === "alerts") {
      if (parsedMessage.info?.id) {
        setId(parsedMessage.info.id);

        router.push(`/alerts/${parsedMessage.info.id}`);
      }
    }
    if (parsedMessage?.info?.act === "newPreregister") {
      router.push("/");
    }
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      created_at: {
        rules: [""],
        api: "",
        label: "Fecha",
        list: { width: "160px" },
        onRender: (props: { item: NotificationItem }) => {
          return getDateStrMes(props.item.created_at);
        },
      },
      message: {
        rules: ["required"],
        api: "e",
        label: "Mensaje",
        list: { width: "auto" },
        onRender: (props: { item: NotificationItem }) => {
          let x = props.item.message.replace("\\", "");
          let parsedMessage: NotificationMessage = {};
          
          try {
            if (typeof x === "string") {
              parsedMessage = JSON.parse(x);
            }
          } catch (error) {
            console.error("Error parsing message:", error);
          }
          
          return (
            <div 
              className={
                notificationsView.includes(props.item.id) 
                  ? styles.notificationRead 
                  : styles.notificationUnread
              }
              onClick={() => handleNotificationClick(props.item)}
            >
              <div className={styles.notificationIcon}>
                {parsedMessage.info && renderNotificationIcon(parsedMessage.info)}
              </div>
              <div className={styles.notificationContent}>
                <p className={styles.notificationTitle}>{parsedMessage.msg?.title}</p>
                <p className={styles.notificationBody}>{parsedMessage.msg?.body}</p>
                <p className={styles.notificationDate}>
                  {getDateStrMes(props.item.created_at)}
                </p>
              </div>
            </div>
          );
        },
      },
    }),
    [notificationsView, router]
  );

  const { userCan, List, data, reLoad } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  useEffect(() => {
    if (store?.socketCount > 0) {
      reLoad();
    }
  }, [store?.socketCount, reLoad]);

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.notificationsContainer}>
      <h1 className={styles.title}>Notificaciones</h1>
      <List />
    </div>
  );
};

export default Notifications;