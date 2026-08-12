import React from "react";
import { format, parse } from "date-fns";
import type { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import { getActorName } from "../utils/reservationFormat";
import CreateReserva from "@/modulos/CreateReserva/CreateReserva";
import ReservationDetailModal from "../RenderView/RenderView";
import ReservationStatusBadge from "../ReservationStatusBadge/ReservationStatusBadge";
import { reservationsApi } from "../api";
import { ReservationStatus } from "../Type/ReservaType";
import type { ReservationListItem } from "../Type/ReservaType";
import {
  RESERVATION_PERIOD_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  RESERVATIONS_COPY,
} from "./reservas.constants";

/**
 * Qué columnas tiene la lista de Reservas, qué se puede filtrar y con qué
 * permiso.
 *
 * Espeja a `ReservationsListConfig` del API: los nombres de los filtros
 * declarados acá tienen que existir allá. Ver `RESERVATIONS_API_CONTRACT` en
 * `reservas.constants.ts` y el test que los compara.
 */

/** La hora de inicio, o vacío si no vino o no tiene la forma HH:mm:ss. */
const formatStartTime = (startTime?: string | null) => {
  if (typeof startTime !== "string" || !/^\d{2}:\d{2}:\d{2}$/.test(startTime)) {
    // ⚠️ Sin esta guarda, `parse(null, …)` devuelve Invalid Date y `format`
    // TIRA — la lista entera queda en blanco por una fila sin hora. La
    // pestaña de pendientes ya se guardaba; la lista principal, no.
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
      <p style={{ color: "var(--cWhite)", fontWeight: 500, fontSize: 14 }}>
        {area?.title || RESERVATIONS_COPY.areaUnavailable}
      </p>
    </div>
  );
};

const renderOwner = ({ item }: { item: ReservationListItem }) => {
  const owner = item?.owner;
  const dpto = item?.dpto;
  const ownerName = getActorName(
    owner,
    Number(item?.status) === ReservationStatus.MAINTENANCE
      ? RESERVATIONS_COPY.administration
      : RESERVATIONS_COPY.residentUnavailable,
  );
  const dptoNro = dpto?.nro ? dpto.nro : RESERVATIONS_COPY.noUnit;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Avatar src={owner?.url_avatar || undefined} name={ownerName} />
      <div>
        <p style={{ color: "var(--cWhite)", fontWeight: 500, fontSize: 14 }}>
          {ownerName}
        </p>
        {dpto ? (
          <p style={{ fontSize: 14, color: "var(--cWhiteV1)" }}>{dptoNro}</p>
        ) : null}
      </div>
    </div>
  );
};

export const getReservationsConfig = (): {
  mod: ModCrudType;
  fields: Record<string, any>;
} => {
  const mod: ModCrudType = {
    modulo: reservationsApi.modulo,
    singular: "reserva",
    plural: "reservas",
    permiso: "reservations",
    extraData: true,
    hideActions: { edit: true, del: true },
    renderForm: (props: any) => <CreateReserva {...props} />,
    renderView: (props: any) => <ReservationDetailModal {...props} />,
    filter: true,
    export: false,
    exportAsync: {
      type: "reservations",
      format: "pdf",
      label: RESERVATIONS_COPY.exportLabel,
      // 🔴 `supportedFormats` y `endpoint` son UNA sola cosa: el interruptor de
      // la migración al motor declarativo. Van juntos o no va ninguno.
      //
      // `useCrud` elige el botón mirando SÓLO `supportedFormats`: con el array
      // renderea el `DownloadButton` (ícono + menú PDF/XLSX/CSV) y le pasa el
      // `endpoint`; sin el array cae al `AsyncExportButton` legacy, que **no
      // recibe `endpoint` como prop**, así que el endpoint no llega nunca.
      supportedFormats: ["pdf", "xlsx", "csv"],
      endpoint: reservationsApi.base,
    },
    titleAdd: RESERVATIONS_COPY.titleAdd,
  };

  const fields = {
    id: { rules: [], api: "e" },
    area: {
      rules: ["required"],
      api: "ae",
      label: "Área Social",
      form: { type: "text" },
      list: { onRender: renderArea },
    },
    owner: {
      rules: ["required"],
      api: "ae",
      label: "Residente",
      form: { type: "text" },
      list: { onRender: renderOwner },
    },
    created_at: {
      label: "Fecha de solicitud",
      form: false,
      list: {
        onRender: (props: any) => getDateTimeStrMes(props?.value),
      },
    },
    date_at: {
      rules: ["required"],
      api: "ae",
      label: "Fecha del evento",
      form: { type: "date" },
      list: {
        onRender: (props: any) => (
          <div>
            {getDateStrMes(props?.item?.date_at)}{" "}
            {formatStartTime(props?.item?.start_time)}
          </div>
        ),
      },
      // `date_at` es un filtro de PERÍODO en el API (`PeriodFilter::onDate`).
      filter: {
        label: "Fecha del evento",
        width: "246px",
        options: () => [...RESERVATION_PERIOD_OPTIONS],
      },
    },
    status_reservation: {
      rules: ["required"],
      api: "ae",
      label: (
        <span style={{ display: "block", width: "100%", textAlign: "center" }}>
          Estado
        </span>
      ),
      // 🔴 Acá había un `form: { type: "select", options: [...] }` con los ids
      // `"A"` / `"X"` / `"M"` y las etiquetas "Disponible" / "No disponible" /
      // "En mantenimiento". Eran chars, y encima del dominio ÁREA, no reserva:
      // ningún estado de reserva se llama "Disponible". Nunca se vieron —el
      // alta la renderea `CreateReserva`, que arma su propio payload y ni pasa
      // por el form genérico de `useCrud`—, así que se sacan en vez de
      // inventarles una traducción numérica que nadie midió.
      list: {
        onRender: (props: any) => (
          <ReservationStatusBadge item={props?.item} />
        ),
      },
      // `status_reservation` es el estado que se VE: el API lo resuelve con un
      // CallbackFilter que mira el reloj, no sólo la columna.
      filter: {
        label: "Estado",
        width: "180px",
        options: () => RESERVATION_STATUS_OPTIONS,
      },
    },
  };

  return { mod, fields };
};

/**
 * Los parámetros con los que arranca el listado.
 *
 * ⚠️ `perPage` no puede pasar de `RESERVATIONS_API_CONTRACT.maxPerPage`: el
 * ListConfig del API recorta en silencio.
 */
export const RESERVATIONS_INITIAL_PARAMS = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
