/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Notifications.module.css";
import { useMemo } from "react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateStrMes } from "@/mk/utils/date";
import { useRouter } from "next/navigation";
import {
  IconAlertNotification,
  IconPreRegister,
  IconPaymentCommitment,
} from "@/components/layout/icons/IconsBiblioteca";
import useCrudUtils from "../shared/useCrudUtils";
import RenderItem from "../shared/RenderItem";
import ItemList from "@/mk/components/ui/ItemList/ItemList";

const paramsInitial = {
  fullType: "L",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const Notifications = () => {
  const router = useRouter();
  const { user } = useAuth();

  const mod: ModCrudType = {
    modulo: "notifications",
    singular: "Notificación",
    plural: "Notificaciones",
    filter: false,
    permiso: "",
    extraData: false,
    hideActions: {
      view: true,
      add: true,
      edit: true,
      del: true,
    },
    search: false,
  };

  const renderNotificationIcon = (info: any) => {
    if (!info) return null;

    if (info.act === "alerts") {
      return <IconAlertNotification className={styles.alertIcon} />;
    }
    if (info.act === "newPreregister") {
      return <IconPreRegister className={styles.preregisterIcon} />;
    }
    if (info.act === "newVoucher" || info.act === "newPayment") {
      return <IconPaymentCommitment className={styles.paymentIcon} />;
    }
    return null;
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      message: {
        rules: [""],
        api: "",
        label: "Notificación",
        list: {
          width: "100%",
          onRender: (props: any) => {
            try {
              // Mejor manejo de caracteres especiales
              let x = props.item.message
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'");
              const parsedMessage = JSON.parse(x);

              // Verificar si la notificación está en localStorage
              const notificationsView = JSON.parse(
                localStorage.getItem("notificationsView") || "[]"
              );
              const isRead = notificationsView.includes(props.item.id);

              return (
                <div
                  className={
                    isRead ? styles.notificationRead : styles.notificationUnread
                  }
                >
                  <div className={styles.notificationIcon}>
                    {parsedMessage.info &&
                      renderNotificationIcon(parsedMessage.info)}
                  </div>
                  <div className={styles.notificationContent}>
                    <p className={styles.notificationTitle}>
                      {parsedMessage.msg?.title || "Sin título"}
                    </p>
                    <p className={styles.notificationBody}>
                      {parsedMessage.msg?.body || "Sin contenido"}
                    </p>
                    <p className={styles.notificationDate}>
                      {getDateStrMes(props.item.created_at)}
                    </p>
                  </div>
                </div>
              );
            } catch (error) {
              console.error("Error rendering notification:", error);
              return <div>Error en formato de notificación</div>;
            }
          },
        },
      },
    };
  }, []);

  const { userCan, List, setStore, onSearch, searchs } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const { onLongPress, selItem, searchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit: () => {},
    onDel: () => {},
  });

  const handleRowClick = (item: any) => {
    try {
      // Agregar a localStorage para marcar como leída
      const notificationsView = JSON.parse(
        localStorage.getItem("notificationsView") || "[]"
      );
      if (!notificationsView.includes(item.id)) {
        notificationsView.push(item.id);
        localStorage.setItem(
          "notificationsView",
          JSON.stringify(notificationsView)
        );
      }

      // Resetear contador de notificaciones
      setStore((old: any) => ({
        ...old,
        notif: 0,
      }));

      // Parse message con mejor manejo de caracteres especiales
      let x = item.message.replace(/\\"/g, '"').replace(/\\'/g, "'");
      const parsedMessage = JSON.parse(x);

      // Navegar según el tipo de notificación
      if (
        parsedMessage?.info?.act === "newVoucher" ||
        parsedMessage?.info?.act === "newPayment"
      ) {
        if (parsedMessage.info?.id) {
          router.push(`/payments/${parsedMessage.info.id}`);
        }
      } else if (parsedMessage?.info?.act === "alerts") {
        if (parsedMessage.info?.id) {
          router.push(`/alerts/${parsedMessage.info.id}`);
        }
      } else if (parsedMessage?.info?.act === "newPreregister") {
        router.push("/");
      }
    } catch (error) {
      console.error("Error processing notification:", error);
    }
  };

  // Siguiendo el patrón de Dptos para renderItem
  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function
  ) => {
    try {
      let parsedMessage = { msg: { title: "", body: "" } };
      try {
        // Mejor manejo de caracteres especiales
        let x = item.message.replace(/\\"/g, '"').replace(/\\'/g, "'");
        parsedMessage = JSON.parse(x);
      } catch (error) {
        console.error("Error parsing message:", error);
      }

      return (
        <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
          <ItemList
            title={parsedMessage.msg?.title || "Sin título"}
            subtitle={parsedMessage.msg?.body || "Sin contenido"}
            variant="V1"
            active={selItem && selItem.id === item.id}
          />
        </RenderItem>
      );
    } catch (error) {
      console.error("Error in renderItem:", error);
      return null;
    }
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.notificationsContainer}>
      <h1 className={styles.title}>Notificaciones</h1>
      <List onTabletRow={renderItem} onRowClick={handleRowClick} />
    </div>
  );
};

export default Notifications;
