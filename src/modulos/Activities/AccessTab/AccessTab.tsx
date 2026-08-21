// esto? revisar todo las funciones que estan como props para sacar a fuera
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../Activities.module.css";
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
import {
  formatAccessDateTimeShort,
  getAccessStatusInfo,
  // 🔴 Esta pantalla tenia su PROPIA copia (`getTypeAccess` + `typeMap`) con
  // las letras viejas, que le ganaba a la compartida por estar mas cerca. Con
  // el flip, `typeMap[5]` daba undefined y la columna "Tipo" salia vacia.
  getAccessTypeLabel,
  getAccessUnit,
} from "./shared/accessDetailUtils";
import { ACCESS_TYPE_FILTER_OPTIONS } from "./shared/accessEnums";

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
  const [cerrandoId, setCerrandoId] = useState<string | number | null>(null);

  /**
   * ⚠️ `reLoad` sale de `useCrud`, que se llama DESPUÉS de armar los campos, y
   * los campos se memoizan con `[]`. Un ref es la forma de que el `onRender` de
   * una celda pueda refrescar la lista sin volver a crear las columnas en cada
   * render —que es lo que pasaría metiendo `reLoad` en las dependencias—.
   */
  const reLoadRef = useRef<(() => void) | null>(null);

  /**
   * Cierra a mano un acceso que quedó sin salida.
   *
   * 🔴 No manda ninguna hora: el back pone `out_at = in_at`. Que el front
   * eligiera la hora sería inventar una salida que no ocurrió, y además
   * rompería la igualdad que permite reconocer después el cierre irregular.
   */
  const cerrarAcceso = async (item: any) => {
    if (cerrandoId) return;

    setCerrandoId(item.id);
    try {
      const { data } = await execute(
        "/accesses/close-without-exit",
        "POST",
        { id: item.id },
        false,
      );

      if (data?.success) {
        showToast(data?.message || "Acceso cerrado", "success");
        reLoadRef.current?.();
      } else {
        showToast(data?.message || "No se pudo cerrar el acceso", "error");
      }
    } finally {
      setCerrandoId(null);
    }
  };
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

  // Definición del módulo Accesos
  const modAccess: ModCrudType = useMemo(() => {
    return {
      modulo: "accesses",
      singular: "Acceso",
      plural: "Accesos",
      filter: true,
      permiso: "accesses",
      export: false,
      exportAsync: {
        type: "accesses",
        format: "pdf",
        label: "Exportar",
        // 🔴 `supportedFormats` y `endpoint` son UNA sola cosa: el interruptor
        // de la migración al motor declarativo. `useCrud` elige el botón
        // mirando SÓLO `supportedFormats`, y el botón viejo no recibe
        // `endpoint` como prop.
        //
        // ⚠️ El endpoint es EXACTAMENTE el `modulo` de arriba. Hasta la Fase 6
        // el reporte no pasaba por acá: armaba su propia query en el back, con
        // diez joins, y por eso perdía 5.792 accesos y duplicaba otros 8.205.
        supportedFormats: ["pdf", "xlsx", "csv"],
        endpoint: "/accesses",
      },
      extraData: false,
      hideActions: {
        add: true,
        edit: true,
        del: true,
      },
      search: true,
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
                    <div>{getAccessTypeLabel(props?.item?.type, props?.item)}</div>
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
                  <div>Unidad: {getAccessUnit(props?.item)?.nro || "-/-"}</div>
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
                  ? formatAccessDateTimeShort(props.item.in_at)
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
            if (props.item.out_at) {
              return <div>{formatAccessDateTimeShort(props.item.out_at)}</div>;
            }

            // Sin salida y con entrada: se puede cerrar desde acá.
            //
            // ⚠️ El botón sólo aparece si el acceso ENTRÓ. Un acceso que ni
            // siquiera entró no está "sin salida": está sin usar, y cerrarlo
            // le inventaría una entrada.
            if (!props.item.in_at) {
              return <div>-/-</div>;
            }

            return (
              <div className={styles.salidaPendiente}>
                <span>-/-</span>
                <button
                  type="button"
                  className={styles.botonCerrarAcceso}
                  disabled={cerrandoId === props.item.id}
                  onClick={(e) => {
                    // Sin esto, el clic abre además el detalle de la fila.
                    e.stopPropagation();
                    cerrarAcceso(props.item);
                  }}
                  title="Marca la salida con la misma hora de entrada, para dejar constancia de que en portería no se registró"
                >
                  {cerrandoId === props.item.id ? "Cerrando…" : "Cerrar"}
                </button>
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

      /**
       * Filtro por accesos sin salida.
       *
       * 🔴 Va como campo propio y NO como filtro del campo `status`, porque el
       * Mk usa la clave del campo como nombre del filtro que viaja al back
       * (`salida:pendiente`). Colgarlo de `status` mandaría `status:...`, que
       * además choca con la columna `accesses.status` — un char que, medido,
       * **no lo mira nadie**.
       *
       * ⚠️ NO reusa el estado derivado de `getAccessStatusInfo`: ése calcula
       * seis estados sobre una fila YA traída. Filtrar es preguntárselo a la
       * base, y sólo dos de esos seis se expresan en SQL:
       *
       * - **Pendientes**: entraron y no tienen salida. Son los accionables.
       *   Medido el 2026-08-09: 10.005.
       * - **Cerrados sin salida**: ya cerrados con `out_at = in_at`. Historial
       *   de la irregularidad. Medido: 18.129.
       *
       * La regla en SQL vive en los scopes del modelo del back: ya está escrita
       * dos veces —`AccessDisplayState` y `getAccessStatusInfo`— y una tercera
       * copia suelta sería la que se desincroniza.
       */
      salida: {
        rules: [],
        api: "",
        label: "",
        list: false,
        filter: {
          label: "Salida",
          width: "190px",
          options: () => [
            { id: "ALL", name: "Todos" },
            { id: "pendiente", name: "Sin salida (pendientes)" },
            { id: "cerrado", name: "Cerrados sin salida" },
          ],
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
                <p> {getAccessTypeLabel(props.item.type, props.item)}</p>
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
          // 🔴 Esta lista estaba escrita a mano y CON LAS LETRAS: mandaba
          // `type_access:C` al back, que lo compara contra un TINYINT. MariaDB
          // convierte 'C' a 0 y no matchea nada: después del flip, TODAS las
          // opciones del filtro devolvían la lista vacía, sin error.
          //
          // Es una forma de sobrevivir que no estaba en el catálogo: el char
          // como VALOR QUE VIAJA AL BACKEND dentro de un array de opciones.
          // No es una comparación ni una clave, así que ni el compilador ni el
          // grep de `=== 'C'` lo veían. Ahora sale del enum.
          options: () => [{ id: "ALL", name: "Todos" }, ...ACCESS_TYPE_FILTER_OPTIONS],
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
    // ⚠️ `cerrandoId` SÍ va en las dependencias: sin él, el botón se quedaría
    // con el texto y el `disabled` del primer render y nunca mostraría
    // "Cerrando…". Es el único estado que las celdas necesitan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cerrandoId]);
  const { userCan, List, reLoad, onFilter, setStore, store } = useCrud({
    paramsInitial,
    mod: modAccess,
    fields: fieldsAccess,
    getSearch: getSearchParams,
    getFilter: handleGetFilter,
  });

  // El ref que usan las celdas para refrescar la lista después de cerrar.
  reLoadRef.current = () => reLoad();

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
