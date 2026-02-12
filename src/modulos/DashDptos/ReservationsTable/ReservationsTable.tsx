"use client";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Table from "@/mk/components/ui/Table/Table";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import EmptyData from "@/components/NoData/EmptyData";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { IconReservedAreas } from "@/components/layout/icons/IconsBiblioteca";
import styles from "./ReservationsTable.module.css";
import { formatToDayDDMMYYYY } from "@/mk/utils/date";

interface ReservationsTableProps {
  reservations: any[];
}
const getReservationStatus = (status: string) => {
  switch (status) {
    case "W":
      return {
        label: "Esperando confirmación",
        backgroundColor: "#E9B01E33",
        color: "#E9B01E",
      };
    case "A":
      return {
        label: "Pago pendiente",
        backgroundColor: "#E9B01E33",
        color: "#E9B01E",
      };
    case "Q":
      return {
        label: "Pago por confirmar",
        backgroundColor: "#E9B01E33",
        color: "#E9B01E",
      };
    case "N":
      return {
        label: "Reservado (sin pago)",
        backgroundColor: "#00E38C33",
        color: "#00E38C",
      };
    case "L":
      return {
        label: "Reservado (pagado)",
        backgroundColor: "#00E38C33",
        color: "#00E38C",
      };
    case "R":
      return {
        label: "Reserva rechazada",
        backgroundColor: "#E4605533",
        color: "#E46055",
      };
    case "C":
      return {
        label: "Cancelada manualmente",
        backgroundColor: "#E4605533",
        color: "#E46055",
      };
    case "T":
      return {
        label: "Cancelada automática",
        backgroundColor: "#E4605533",
        color: "#E46055",
      };
    case "F":
      return {
        label: "Finalizada",
        backgroundColor: "#00E38C33",
        color: "#00E38C",
      };
    case "X":
      return {
        label: "Rechazada",
        backgroundColor: "#E4605533",
        color: "#E46055",
      };
    default:
      return {
        label: "Desconocido",
        backgroundColor: "var(--cHoverLight)",
        color: "var(--cLightDark)",
      };
  }
};
const areaInfoCell = ({ item }: { item: any }) => (
  <div className={styles.areaInfo}>
    <Avatar
      name={item?.area?.title}
      src={getUrlImages(
        "/AREA-" +
          item?.area?.id +
          "-" +
          item?.area?.images?.[0]?.id +
          ".webp" +
          "?" +
          item?.area?.updated_at,
        item?.area?.images?.[0],
      )}
      w={32}
      h={32}
    />
    <div>
      <p className={styles.areaTitle}>{item?.area?.title}</p>
      <p className={styles.areaDescription}>{item?.area?.description}</p>
    </div>
  </div>
);
const dateReserveCell = ({ item }: { item: any }) => (
  <div>
    <p className={styles.reservationDate}>
      {formatToDayDDMMYYYY(item.date_at) || "Sin fecha"}
    </p>
  </div>
);
const statusCell = ({ item }: { item: any }) => {
  const statusInfo = getReservationStatus(item.status);
  return (
    <StatusBadge
      backgroundColor={statusInfo.backgroundColor}
      color={statusInfo.color}
    >
      {statusInfo.label}
    </StatusBadge>
  );
};

const ReservationsTable = ({ reservations }: ReservationsTableProps) => {
  const reservationsHeader = [
    {
      key: "area",
      label: "Área social",
      responsive: "desktop",
      onRender: areaInfoCell,
    },

    {
      key: "reservation_date",
      label: "Fecha de reserva",
      responsive: "desktop",
      onRender: dateReserveCell,
    },
    {
      key: "status",
      label: "Estado",
      responsive: "desktop",
      style: { textAlign: "center", justifyContent: "center" },
      onRender: statusCell,
    },
  ];

  if (!reservations || reservations.length === 0) {
    return (
      <EmptyData
        message="No hay solicitudes de reserva. Una vez los residentes"
        line2="comiencen a reservar áreas sociales se mostrarán aquí."
        icon={<IconReservedAreas size={80} color="var(--cWhiteV1)" />}
        h={120}
        centered={true}
      />
    );
  }

  return (
    <Table
      header={reservationsHeader}
      data={reservations.slice(0, 5)}
      className="striped"
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default ReservationsTable;
