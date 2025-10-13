// esto? revisar todo las funciones que estan como props para sacar a fuera
import React, { useEffect, useMemo, useState } from "react";
import styles from "../Activities.module.css";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { IconExitHome } from "@/components/layout/icons/IconsBiblioteca";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import RenderView from "./RenderView/RenderView";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";

interface AccessesTabProps {
  paramsInitial: any;
  onRowClick?: (item: any) => void;
  unitParam?: string | null;
}

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
                  <Avatar
                    hasImage={user?.has_image}
                    name={getFullName(user)}
                    src={getUrlImages(
                      prefix +
                        user?.id +
                        ".webp?" +
                        (user?.updated_at || new Date().toISOString())
                    )}
                  />
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
                    hasImage={props.item.owner.has_image}
                    name={getFullName(props.item.owner)}
                    src={getUrlImages(
                      "/OWNER-" +
                        props.item.owner.id +
                        ".webp?" +
                        props.item.owner.updated_at
                    )}
                  />
                </div>
                <div className={styles.avatarText}>
                  <div>{getFullName(props.item.owner)}</div>
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
            return <div>{getDateTimeStrMesShort(props?.item?.in_at)}</div>;
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
        height={"calc(100vh - 350px)"}
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
