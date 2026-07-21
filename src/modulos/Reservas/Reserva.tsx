"use client";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrudUtils from "../shared/useCrudUtils";
import { useContext, useEffect, useMemo, useState } from "react";
import { getFullName } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import styles from "./Reserva.module.css";
import { format, parse } from "date-fns";
import ReservationDetailModal from "./RenderView/RenderView";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import CreateReserva from "../CreateReserva/CreateReserva";
import ReservationQuickCreateModal from "./components/ReservationQuickCreateModal";
import { IconCalendar } from "@/components/layout/icons/IconsBiblioteca";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  RESERVATION_STATUS_CONFIG,
  RESERVATION_STATUS_OPTIONS,
} from "./constants/reservationConstants";
import { resolveReservationDisplayStatus } from "./utils/reservationStatus";
import {
  fetchResolvedPaymentForReservation,
  getReservationDisplayStatusInput,
  shouldFetchReservationResolvedPayment,
  type ResolvedReservationPayment,
} from "./utils/reservationPayment";
import { getReservationUnitDisplayLabel } from "./utils/reservationUnits";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";

const mod = {
  modulo: "reservations",
  singular: "reserva",
  plural: "reservas",
  permiso: "reservations",
  extraData: true,
  hideActions: { edit: true, del: true },
  renderForm: (props: any) => <CreateReserva {...props} />,
  renderView: (props: any) => <ReservationDetailModal {...props} />,
  //loadView: { fullType: "DET" },
  filter: true,
  export: true,
  titleAdd: "Nueva",
};

const periodOptions = [
  { id: "ALL", name: "Todos" },
  { id: "d", name: "Hoy" },
  { id: "ld", name: "Ayer" },
  { id: "w", name: "Esta semana" },
  { id: "lw", name: "Semana anterior" },
  { id: "m", name: "Este mes" },
  { id: "lm", name: "Mes anterior" },
  { id: "y", name: "Este año" },
  { id: "ly", name: "Año anterior" },
  { id: "custom", name: "Personalizado" },
];

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const ReservationStatusBadge = ({ item }: { item: any }) => {
  const { contextInstance }: any = useContext(AxiosContext);
  const [resolvedPayment, setResolvedPayment] =
    useState<ResolvedReservationPayment | null>(null);

  useEffect(() => {
    setResolvedPayment(null);

    if (!contextInstance || !shouldFetchReservationResolvedPayment(item)) return;

    let cancelled = false;

    const loadResolvedPayment = async () => {
      const payment = await fetchResolvedPaymentForReservation(contextInstance, item);

      if (!cancelled) {
        setResolvedPayment(payment);
      }
    };

    void loadResolvedPayment();

    return () => {
      cancelled = true;
    };
  }, [contextInstance, item]);

  const status = resolveReservationDisplayStatus(
    getReservationDisplayStatusInput(item, resolvedPayment),
  );
  const currentStatus = status
    ? RESERVATION_STATUS_CONFIG[status as keyof typeof RESERVATION_STATUS_CONFIG]
    : null;

  return (
    <StatusBadge
      backgroundColor={
        currentStatus ? currentStatus.backgroundColor : "var(--cHoverLight)"
      }
      color={currentStatus ? currentStatus.color : "var(--cLightDark)"}
    >
      {currentStatus ? currentStatus.label : "Estado desconocido"}
    </StatusBadge>
  );
};

const Reserva = () => {
  const { showToast } = useAuth();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [openQuickCreate, setOpenQuickCreate] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const onRenderAreaList = ({ item }: any) => {
    const area = item?.area;
    const areaName = area?.title;
    const imageUrl = area?.images?.[0];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar src={imageUrl} name={areaName} />
        <p
          style={{
            color: "var(--cWhite)",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {areaName || "Área no disponible"}
        </p>
      </div>
    );
  };

  const onRenderOwnerList = ({ item }: any) => {
    const owner = item?.owner;
    const dpto = item?.dpto;
    const ownerName = owner
      ? getFullName(owner)
      : item.status == "M"
        ? "Administración"
        : "Residente no disponible";
    const dptoNro = dpto ? getReservationUnitDisplayLabel(dpto) : "Sin Dpto.";

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar src={owner?.url_avatar} name={ownerName} />
        <div>
          <p
            style={{
              color: "var(--cWhite)",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {ownerName}
          </p>
          {dpto && (
            <p
              style={{
                fontSize: 14,
                color: "var(--cWhiteV1)",
              }}
            >
              {dptoNro}
            </p>
          )}
          {!owner && dpto && (
            <p
              style={{
                fontSize: 14,
                color: "var(--cWhiteV1)",
              }}
            >
              {dptoNro}
            </p>
          )}
        </div>
      </div>
    );
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      area: {
        rules: ["required"],
        api: "ae",
        label: "Área Social",
        form: { type: "text" },
        list: {
          onRender: onRenderAreaList,
        },
      },
      owner: {
        rules: ["required"],
        api: "ae",
        label: "Residente",
        form: { type: "text" },
        list: {
          // width: 470,
          onRender: onRenderOwnerList,
        },
      },
      created_at: {
        label: "Fecha de solicitud",
        form: false,
        list: {
          // width: 246,
          onRender: (props: any) => {
            return getDateTimeStrMes(props?.value);
          },
        },
      },
      date_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha del evento",
        form: { type: "date" },
        list: {
          // width: 246,
          onRender: (props: any) => {
            return (
              <div>
                {getDateStrMes(props?.item?.date_at)}{" "}
                {format(
                  parse(props?.item?.start_time, "HH:mm:ss", new Date()),
                  "H:mm",
                )}
              </div>
            );
          },
        },
        filter: {
          label: "Fecha del evento",
          width: "246px",
          options: () => periodOptions,
        },
      },

      status_reservation: {
        rules: ["required"],
        api: "ae",
        label: (
          <span
            style={{ display: "block", width: "100%", textAlign: "center" }}
          >
            Estado
          </span>
        ),
        form: {
          type: "select",
          options: [
            { id: "A", name: "Disponible" },
            { id: "X", name: "No disponible" },
            { id: "M", name: "En mantenimiento" },
          ],
        },
        list: {
          // width: 180,
          onRender: (props: any) => {
            return <ReservationStatusBadge item={props?.item} />;
          },
        },
        filter: {
          label: "Estado",
          width: "180px",
          options: () => RESERVATION_STATUS_OPTIONS,
        },
      },
    }),
    [],
  );
  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "date_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === "" || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const onSaveFilterModal = ({ startDate, endDate }: any) => {
    let err: { startDate?: string; endDate?: string } = {};
    if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
    if (!endDate) err.endDate = "La fecha de fin es obligatoria";
    if (startDate && endDate && startDate > endDate)
      err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
    if (startDate && endDate && startDate.slice(0, 4) !== endDate.slice(0, 4)) {
      err.startDate =
        "El periodo personalizado debe estar dentro del mismo año";
      err.endDate = "El periodo personalizado debe estar dentro del mismo año";
    }
    if (Object.keys(err).length > 0) {
      setCustomDateErrors(err);
      return;
    }
    const customDateFilterString = `${startDate},${endDate}`;
    onFilter("date_at", customDateFilterString);
    setOpenCustomFilter(false);
    setCustomDateErrors({});
  };

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    onFilter,
    reLoad,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });
  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <>
      <List
        height={"100%"}
        onAddClick={() => {
          if (!userCan(mod.permiso, "C")) {
            showToast("No tiene permisos para crear reservas", "error");
            return;
          }
          setOpenQuickCreate(true);
        }}
        emptyMsg="Sin reservas pendientes. cuando los residentes comiencen"
        emptyLine2="a solicitar reservas de áreas sociales lo verás reflejado aquí."
        emptyIcon={<IconCalendar size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1130}
      />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={onSaveFilterModal}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
      <ReservationQuickCreateModal
        open={openQuickCreate}
        onClose={() => setOpenQuickCreate(false)}
        onCreated={() => reLoad()}
      />
    </>
  );
};

export default Reserva;
