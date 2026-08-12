import React from "react";
import { format, parse } from "date-fns";
import type { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateStrMes } from "@/mk/utils/date";
import { getActorName } from "../utils/reservationFormat";
import ReservationDetailModal from "../RenderView/RenderView";
import styles from "../Reserva.module.css";
import { reservationsApi } from "../api";
import { ReservationStatus } from "../Type/ReservaType";
import type { ReservationListItem } from "../Type/ReservaType";
import {
  RESERVATION_STATUS_CONFIG,
  RESERVATIONS_COPY,
} from "./reservas.constants";

/**
 * La pestaña "Reservas pendientes": la misma tabla, filtrada por el estado que
 * espera decisión del administrador.
 *
 * 🔴 `filterBy=status:1` viajaba desde siempre y el back NO conocía el filtro
 * `status`: caía en el `default: break` de la cadena vieja y la pestaña
 * listaba TODAS las reservas. `ReservationsListConfig` lo declara desde la
 * migración a Mk2 (`ColumnFilter::int('status', …)`), así que ahora sí filtra.
 * Es un cambio de comportamiento VISIBLE, no un arreglo invisible.
 */

const formatStartTime = (startTime?: string | null) => {
  if (typeof startTime !== "string" || !/^\d{2}:\d{2}:\d{2}$/.test(startTime)) {
    return "";
  }

  try {
    return format(parse(startTime, "HH:mm:ss", new Date()), "H:mm");
  } catch {
    return "";
  }
};

const renderArea = ({ item }: { item: ReservationListItem }) => {
  const area = item?.area;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Avatar src={area?.images?.[0]} name={area?.title || undefined} />
      <p style={{ margin: 0 }}>
        {area?.title ?? RESERVATIONS_COPY.areaUnavailable}
      </p>
    </div>
  );
};

const renderOwner = ({ item }: { item: ReservationListItem }) => {
  const owner = item?.owner;
  const dpto = item?.dpto;
  const ownerName = getActorName(owner, RESERVATIONS_COPY.residentUnavailable);
  const dptoNro = dpto?.nro ? `Dpto: ${dpto.nro}` : RESERVATIONS_COPY.noUnit;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Avatar src={owner?.url_avatar || undefined} name={ownerName} />
      <div>
        <p style={{ margin: 0, lineHeight: "1.3" }}>{ownerName}</p>
        {dpto ? (
          <p
            style={{
              margin: 0,
              fontSize: "0.85em",
              color: "var(--cWhiteV1)",
              lineHeight: "1.3",
            }}
          >
            {dptoNro}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export const getPendingReservationsConfig = (): {
  mod: ModCrudType;
  fields: Record<string, any>;
} => {
  const mod: ModCrudType = {
    modulo: reservationsApi.modulo,
    singular: "Reserva Pendiente",
    plural: "Reservas Pendientes",
    permiso: "reservations",
    extraData: true,
    hideActions: { edit: true, del: true, add: true },
    renderView: (props: any) => <ReservationDetailModal {...props} />,
    loadView: { fullType: "DET" },
  };

  const fields = {
    id: { rules: [], api: "e" },
    date_at: {
      api: "ae",
      label: "Fecha Evento",
      list: {
        onRender: (props: any) => (
          <div>
            {getDateStrMes(props?.item?.date_at)}{" "}
            {formatStartTime(props?.item?.start_time)}
          </div>
        ),
      },
    },
    area: {
      api: "ae",
      label: "Área Social",
      list: { onRender: renderArea },
    },
    owner: {
      api: "ae",
      label: "Residente",
      list: { onRender: renderOwner },
    },
    status: {
      api: "ae",
      label: "Estado",
      list: {
        onRender: (props: any) => {
          const status = props?.item?.status;
          const config =
            status !== undefined && status !== null
              ? RESERVATION_STATUS_CONFIG[Number(status) as ReservationStatus]
              : undefined;

          // ⚠️ El `?? styles.statusUnknown` no es defensivo de más:
          // `Reserva.module.css` define ocho clases y el catálogo de estados
          // tiene once. `statusQ`, `statusL`, `statusR`, `statusT` y `statusM`
          // no existen, y antes de esto una reserva rechazada salía con
          // `className="undefined"`.
          const className = config
            ? (styles as Record<string, string>)[config.class] ??
              styles.statusUnknown
            : styles.statusUnknown;

          return (
            <div className={`${styles.statusBadge} ${className}`}>
              {config ? config.label : RESERVATIONS_COPY.unknownStatus}
            </div>
          );
        },
      },
    },
  };

  return { mod, fields };
};

/**
 * Los parámetros de arranque de la pestaña de pendientes.
 *
 * `sortBy=created_at` está declarado en `sortableFields()` del API; las más
 * viejas primero, porque son las que llevan más tiempo esperando respuesta.
 */
export const PENDING_RESERVATIONS_INITIAL_PARAMS = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
  filterBy: `status:${ReservationStatus.AWAITING_APPROVAL}`,
  sortBy: "created_at",
  orderBy: "asc",
};
