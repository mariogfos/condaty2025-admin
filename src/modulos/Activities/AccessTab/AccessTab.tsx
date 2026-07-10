// esto? revisar todo las funciones que estan como props para sacar a fuera
import React, { useEffect, useMemo, useState } from "react";
import styles from "../Activities.module.css";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { IconExitHome } from "@/components/layout/icons/IconsBiblioteca";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import RenderView from "./RenderView";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { getAccessStatusInfo } from "./shared/accessDetailUtils";

interface AccessesTabProps {
  paramsInitial: any;
  onRowClick?: (item: any) => void;
  unitParam?: string | null;
}

const periodOptions = [
  // { id: "ALL", name: "Todos" },
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

const ACCESS_REPORT_MAX_RANGE_DAYS = 60;
const accessReportBlockedPeriods = new Set(["y", "ly"]);

const parseFilterByString = (filterBy: string) => {
  const parsed: Record<string, string> = {};

  filterBy
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) return;

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (key) parsed[key] = value;
    });

  return parsed;
};

const parseIsoDateToUtc = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
};

const validateAccessReportExport = ({ params }: { params?: any }) => {
  const filters = parseFilterByString(String(params?.filterBy || ""));
  const period = filters.in_at;

  if (!period || period === "ALL") {
    return "Debe elegir un periodo para poder generar el reporte.";
  }

  if (accessReportBlockedPeriods.has(period)) {
    return "Para exportar el reporte seleccione un periodo menor a 60 días. Este año y Año anterior no están permitidos.";
  }

  if (!period.includes(",")) return null;

  const [startDate = "", endDate = ""] = period
    .split(",")
    .map((value) => value.trim());
  const startTime = parseIsoDateToUtc(startDate);
  const endTime = parseIsoDateToUtc(endDate);

  if (startTime === null || endTime === null || endTime < startTime) {
    return "El rango de fechas seleccionado no es válido para exportar.";
  }

  const diffDays = Math.floor((endTime - startTime) / 86400000);
  if (diffDays > ACCESS_REPORT_MAX_RANGE_DAYS) {
    return "El rango personalizado no puede superar 60 días para exportar el reporte.";
  }

  return null;
};

const accessStatusTonePalette = {
  success: {
    color: "var(--cStatusSuccess)",
    backgroundColor: "var(--cStatusSuccessSoft)",
  },
  info: {
    color: "var(--cStatusInfo)",
    backgroundColor: "var(--cStatusInfoSoft)",
  },
  warning: {
    color: "var(--cStatusWarning)",
    backgroundColor: "var(--cStatusWarningSoft)",
  },
  danger: {
    color: "var(--cStatusDanger)",
    backgroundColor: "var(--cStatusDangerSoft)",
  },
  accent: {
    color: "var(--cStatusProgress)",
    backgroundColor: "var(--cStatusProgressSoft)",
  },
} as const;

const AccessesTab: React.FC<AccessesTabProps> = ({
  paramsInitial,
  unitParam,
}) => {
  const { showToast } = useAuth();
  const { execute } = useAxios("", "GET", {});
  const [openCustomFilterModal, setOpenCustomFilterModal] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "in_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilterModal(true);
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
  const getSearchParams = (searchTerm: string) => {
    const resolvedTerm = String(searchTerm || "").trim();
    const normalizedIdCandidate = resolvedTerm.replace(/^#/, "");
    const isAccessIdSearch = /^\d+$/.test(normalizedIdCandidate);

    return {
      searchBy: isAccessIdSearch ? normalizedIdCandidate : resolvedTerm,
      searchById: isAccessIdSearch ? normalizedIdCandidate : "",
      fullType: isAccessIdSearch ? "DET" : "L",
    };
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
    onFilter("in_at", customDateFilterString);
    setOpenCustomFilterModal(false);
    setCustomDateErrors({});
  };

  const getTypeAccess = (type: string, param: any) => {
    if (type === "P") {
      return "Pedido:" + param?.other?.other_type?.name;
    }
    if (type === "F") {
      return "QR Frecuente";
    }
    return typeMap[type];
  };
  const typeMap: Record<string, string> = {
    C: "Sin QR",
    G: "QR Grupal",
    I: "QR Individual",
    P: "Pedido",
    O: "Llave QR",
  };
  // Definición del módulo Accesos
  const modAccess: ModCrudType = useMemo(() => {
    return {
      modulo: "accesses",
      singular: "Acceso",
      plural: "Accesos",
      filter: true,
      permiso: "accesses",
      export: true,
      extraData: false,
      hideActions: {
        add: true,
        edit: true,
        del: true,
      },
      search: true,
      validateExport: validateAccessReportExport,
      getListRows: (response: any, requestParams?: Record<string, any>) => {
        if (requestParams?.fullType !== "DET") {
          return Array.isArray(response?.data) ? response.data : [];
        }

        if (Array.isArray(response?.data)) {
          return response.data;
        }

        if (response?.data?.access) {
          return [response.data.access];
        }

        return response?.data ? [response.data] : [];
      },
      renderView: (props: any) => <RenderView {...props} />,
    };
  }, []);
  const getListUnits = (extraData: any) => {
    const units = extraData?.units?.map((item: any) => {
      return {
        name: item.nro,
        id: item.id,
      };
    });
    if (units?.length) {
      return [
        {
          name: "Todos",
          id: "ALL",
        },
        ...units,
      ];
    }
    return [];
  };
  const fieldsAccess = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      visit_id: {
        rules: [""],
        api: "",
        label: "Visitante",
        list: {
          onRender: (props: any) => {
            let user = props?.item?.visit
              ? props?.item?.visit
              : props?.item?.owner;
            let prefix = props?.item?.visit ? "/VISIT-" : "/OWNER-";

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <Avatar name={getFullName(user)} src={user?.url_avatar} />
                  {/* </div> */}
                  <div className={styles.avatarText}>
                    <div style={{ color: "var(--cWhite)" }}>
                      {getFullName(user)}
                    </div>
                    <div>{getTypeAccess(props?.item?.type, props?.item)}</div>
                  </div>
                </div>
              </div>
            );
          },
        },
      },
      owner_id: {
        rules: [""],
        api: "",
        label: "Residente",
        list: {
          onRender: (props: any) => {
            return (
              <div style={{ display: "flex", gap: 8 }}>
                <div>
                  <Avatar
                    name={getFullName(props.item.owner)}
                    src={props.item?.owner?.url_avatar}
                  />
                </div>
                <div className={styles.avatarText}>
                  <div>{getFullName(props.item?.owner)}</div>
                  <div>Unidad: {props?.item?.owner?.dpto[0]?.nro || "-/-"}</div>
                </div>
              </div>
            );
          },
        },
      },
      in_at: {
        rules: [""],
        api: "",
        label: "Entrada",
        list: {
          onRender: (props: any) => {
            return (
              <div>
                {props?.item?.in_at
                  ? getDateTimeStrMesShort(props.item.in_at)
                  : "-/-"}
              </div>
            );
          },
        },
        filter: {
          label: "Periodo",
          width: "180px",
          options: () => periodOptions,
        },
      },

      out_at: {
        rules: [""],
        api: "",
        label: "Salida",
        list: {
          onRender: (props: any) => {
            return (
              <div>
                {props.item.out_at
                  ? getDateTimeStrMesShort(props.item.out_at)
                  : "-/-"}
              </div>
            );
          },
        },
      },
      status: {
        rules: [],
        api: "",
        label: "Estado",
        list: {
          width: "140px",
          onRender: (props: any) => {
            const statusInfo = getAccessStatusInfo(props.item);
            const toneStyle = accessStatusTonePalette[statusInfo.tone];

            return (
              <StatusBadge
                color={toneStyle.color}
                backgroundColor={toneStyle.backgroundColor}
              >
                {statusInfo.label}
              </StatusBadge>
            );
          },
        },
      },

      type_access: {
        rules: [],
        api: "",
        label: "Tipo de acceso",
        list: {
          onRender: (props: any) => {
            return (
              <div>
                <p> {getTypeAccess(props.item.type, props.item)}</p>
                <div className={styles.companionsText}>
                  {props?.item?.accesses.length > 0 &&
                    `+${props?.item?.accesses?.length} acompañante${
                      props?.item?.accesses?.length > 1 ? "s" : ""
                    }`}
                </div>
              </div>
            );
          },
        },
        filter: {
          label: "Tipo de Acceso",
          width: "180px",
          options: () => [
            { id: "ALL", name: "Todos" },
            { id: "C", name: "Sin QR" },
            { id: "I", name: "QR Individual" },
            { id: "G", name: "QR Grupal" },
            { id: "F", name: "QR frecuente" },
            { id: "P", name: "Pedido" },
            { id: "O", name: "Llave QR" },
          ],
        },
      },
      dpto_id: {
        rules: [],
        api: "",
        label: "",
        list: false,
        filter: {
          label: "Unidad",
          width: "180px",
          options: getListUnits,
          // extraData: "units",
          // optionLabel: "nro",
        },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { userCan, List, reLoad, onFilter, setStore, store } = useCrud({
    paramsInitial,
    mod: modAccess,
    fields: fieldsAccess,
    getSearch: getSearchParams,
    getFilter: handleGetFilter,
  });

  useEffect(() => {
    setStore({ ...store, title: "Accesos" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAccess = userCan(modAccess.permiso, "R");

  if (!canAccess) return <NotAccess />;

  return (
    <>
      <List
        height={"100%"}
        emptyMsg="No existen accesos registrados. El historial de visitantes se mostrará"
        emptyLine2="aquí una vez el guardia registre un acceso."
        emptyIcon={<IconExitHome size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1700}
      />
      <DateRangeFilterModal
        open={openCustomFilterModal}
        onClose={() => {
          setOpenCustomFilterModal(false);
          setCustomDateErrors({});
        }}
        onSave={onSaveFilterModal}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </>
  );
};

export default AccessesTab;
