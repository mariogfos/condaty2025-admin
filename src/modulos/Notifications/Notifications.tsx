/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Notifications.module.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateStrMes, getDateTimeAgo } from "@/mk/utils/date";
import { useRouter } from "next/navigation";
import {
  IconAlertNotification,
  IconPreRegister,
  IconPaymentCommitment,
  IconNewReserve,
  IconUser,
  IconNotification,
  IconNewPublication,
  IconAmbulance,
  IconBalance,
  IconCancelReservation,
} from "@/components/layout/icons/IconsBiblioteca";
import useCrudUtils from "../shared/useCrudUtils";
import RenderItem from "../shared/RenderItem";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import PaymentRender from "@/modulos/Payments/RenderView/RenderView";
import { useEvent } from "@/mk/hooks/useEvents";

const paramsInitial = {
  fullType: "L",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const Notifications = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [openPayment, setOpenPayment] = useState({ open: false, id: null });

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

  const fields = useMemo(() => {
    const renderNotificationIcon = (messageData: any) => {
      if (!messageData) return null;

      const actValue = messageData.act || messageData.info?.act;
      const level = messageData.level || messageData.info?.level;

      if (actValue === "newContent") {
        return (
          <div
            style={{
              borderRadius: 50,
              padding: 8,
              backgroundColor: "var(--cWhite)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconNewPublication color="var(--cWhite)" />
          </div>
        );
      }

      if (actValue === "alerts") {
        switch (level) {
          default:
            return (
              <div
                style={{
                  borderRadius: 50,
                  padding: 8,
                  backgroundColor: "var(--cError)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconAmbulance color="var(--cWhite)" />
              </div>
            );
          case 3:
            return (
              <div
                style={{
                  borderRadius: 50,
                  padding: 8,
                  backgroundColor: "var(--cError)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconAlertNotification color="var(--cWhite)" />
              </div>
            );
          case 2:
            return (
              <div
                style={{
                  borderRadius: 50,
                  padding: 8,
                  backgroundColor: "var(--cWarning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconAlertNotification color="var(--cWhite)" />
              </div>
            );
          case 1:
            return (
              <div
                style={{
                  borderRadius: 50,
                  padding: 8,
                  backgroundColor: "var(--cInfo)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconAlertNotification color="var(--cWhite)" />
              </div>
            );
        }
      }

      if (actValue === "newPreregister") {
        return (
          <div
            style={{
              borderRadius: 50,
              padding: 8,
              backgroundColor: "var(--cInfo)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPreRegister color="var(--cWhite)" />
          </div>
        );
      }

      //if (actValue === "newVoucher" || actValue === "newPayment") {
      if (actValue === "admins") {
        return (
          <div
            style={{
              borderRadius: 50,
              padding: 8,
              backgroundColor: "var(--cSuccess)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPaymentCommitment color="var(--cWhite)" />
          </div>
        );
      }

      if (actValue === "change-budget") {
        return (
          <div
            style={{
              borderRadius: 50,
              padding: 8,
              backgroundColor:
                messageData.info.status === "A"
                  ? "var(--cSuccess)"
                  : "var(--cError)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBalance color="var(--cWhite)" />
          </div>
        );
      }

      if (actValue === "newReservationAdm") {
        return (
          <div
            style={{
              borderRadius: 50,
              padding: 8,
              backgroundColor: "var(--cAccent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconNewReserve color="var(--cWhite)" />
          </div>
        );
      }

      if (actValue === "newAdmin") {
        return (
          <div
            style={{
              borderRadius: 50,
              padding: 8,
              backgroundColor: "var(--cAccent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconUser color="var(--cWhite)" />
          </div>
        );
      }
      if (actValue === "cancelReservationAdm") {
        return (
          <div
            style={{
              borderRadius: 50,
              padding: 8,
              backgroundColor: "var(--cError)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCancelReservation color="var(--cWhite)" />
          </div>
        );
      }

      return null;
    };

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
              let x = props.item.message
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'");
              const parsedMessage = JSON.parse(x);

              const notificationsView = JSON.parse(
                localStorage.getItem("notificationsView") || "[]"
              );
              const isRead = notificationsView.includes(props.item.id);

              return (
                <div
                  className={
                    isRead ? styles.notificationRead : styles.notificationUnread
                  }
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div className={styles.notificationIcon}>
                    {renderNotificationIcon(parsedMessage)}
                  </div>
                  <div className={styles.notificationContent}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <p className={styles.notificationTitle}>
                        {parsedMessage.msg?.title || "Sin título"}
                      </p>
                      <p className={styles.notificationDate}>
                        {getDateTimeAgo(props.item.created_at)}
                      </p>
                    </div>
                    <p className={styles.notificationBody}>
                      {parsedMessage.msg?.body || "Sin contenido"}
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
  }, [user?.id]);

  // Usar useCrud normalmente SIN filtrar datos aquí
  const { userCan, List, setStore, onSearch, searchs, data } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // ELIMINAR filteredData - no es necesario
  // const filteredData = useMemo(() => { ... });

  const { onLongPress, selItem, searchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit: () => {},
    onDel: () => {},
  });

  useEffect(() => {
    if (data?.data?.length > 0) {
      localStorage.setItem("notifId", data.data[0].id);
    }
  }, [data]);

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
      if (parsedMessage?.info?.act === "newPreregister") {
        router.push("/");
      }
      if (parsedMessage?.info?.act === "alerts") {
        router.push(`/alerts`);
      }
      if (parsedMessage?.info?.act === "newVoucher") {
        setOpenPayment({ open: true, id: parsedMessage.info.id });
      }
      if (parsedMessage?.info?.act === "newAdmin") {
        router.push("/users");
      }
      if (parsedMessage?.info?.act === "newReservationAdm") {
        router.push("/reservas");
      }
      if (parsedMessage?.info?.act === "newContent") {
        router.push("/contents");
      }
    } catch (error) {
      console.error("Error processing notification:", error);
    }
  };

  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function
  ) => {
    try {
      let parsedMessage: { msg: { title: string; body: string }; info?: any } =
        {
          msg: { title: "", body: "" },
          info: null,
        };
      try {
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

  const { dispatch } = useEvent("onReset");

  useEffect(() => {
    dispatch("Notif");
  }, []);

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.notificationsContainer}>
      <List
        height={"calc(100vh - 300px)"}
        onTabletRow={renderItem}
        onRowClick={handleRowClick}
        emptyMsg="Lista vacía. Una vez comiencen las interacciones"
        emptyLine2="con el sistema, verás las notificaciones aquí."
        emptyIcon={<IconNotification size={80} color="var(--cWhiteV1)" />}
        // QUITAR data={filteredData} - usar los datos internos de useCrud
      />
      {openPayment.open && (
        <PaymentRender
          open={openPayment.open}
          onClose={() => setOpenPayment({ open: false, id: null })}
          payment_id={openPayment.id || ""}
        />
      )}
    </div>
  );
};

export default Notifications;
