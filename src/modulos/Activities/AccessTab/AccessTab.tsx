/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState, useEffect } from "react";
import styles from "../Activities.module.css";
import { getDateStrMes, getDateTimeStrMesShort } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import {
  IconVehicle,
  IconFoot,
  IconOwner,
  IconKey,
} from "@/components/layout/icons/IconsBiblioteca";

import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import RenderView from "./RenderView/RenderView";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";

interface AccessesTabProps {
  paramsInitial: any;
  onRowClick?: (item: any) => void;
}

// Función actualizada para obtener las opciones de período
const getPeriodOptions = () => [
  { id: "ALL", name: "Todos" },

  { id: "w", name: "Esta semana" },
  { id: "lw", name: "Semana pasada" },
  { id: "m", name: "Este mes" },
  { id: "lm", name: "Mes anterior" },
  { id: "y", name: "Este año" },
  { id: "ly", name: "Año anterior" },
  { id: "custom", name: "Personalizado" },
];

const AccessesTab: React.FC<AccessesTabProps> = ({ paramsInitial }) => {
  const { showToast } = useAuth();
  const { execute } = useAxios("", "GET", {});
  const [formStateFilter, setFormStateFilter] = useState<{
    filter_date?: string;
  }>({});
  const [openCustomFilterModal, setOpenCustomFilterModal] = useState(false); // Para el modal
  const [customDateRange, setCustomDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  // Función para convertir el filtro de fecha al formato esperado por la API
  const convertFilterDate = () => {
    let periodo = "m"; // valor por defecto

    if (formStateFilter.filter_date === "w") periodo = "w";
    if (formStateFilter.filter_date === "lw") periodo = "lw";
    if (formStateFilter.filter_date === "m") periodo = "m";
    if (formStateFilter.filter_date === "lm") periodo = "lm";
    if (formStateFilter.filter_date === "y") periodo = "y";
    if (formStateFilter.filter_date === "ly") periodo = "ly";

    return periodo;
  };

  const handleGetFilterForAccesses = (
    opt: string,
    value: string,
    oldFilterState: any
  ) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    // 'in_at' es el campo que tiene el filtro de período en AccessesTab
    if (opt === "in_at" && value === "custom") {
      setCustomDateRange({}); // Limpiar fechas anteriores
      setCustomDateErrors({}); // Limpiar errores anteriores
      setOpenCustomFilterModal(true); // Abrir el modal
      // No aplicar 'custom' como filtro directo, el modal lo hará
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    // Lógica para otros filtros o valores no personalizados
    if (
      value === "" ||
      value === null ||
      value === undefined ||
      value === "t" /* si 't' es 'Todos' */
    ) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };
  const onSaveCustomDateFilterForAccesses = () => {
    let err: { startDate?: string; endDate?: string } = {};
    if (!customDateRange.startDate) {
      err.startDate = "La fecha de inicio es obligatoria";
    }
    if (!customDateRange.endDate) {
      err.endDate = "La fecha de fin es obligatoria";
    }
    if (
      customDateRange.startDate &&
      customDateRange.endDate &&
      customDateRange.startDate > customDateRange.endDate
    ) {
      err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
    }

    if (Object.keys(err).length > 0) {
      setCustomDateErrors(err);
      return;
    }

    const customDateFilterString = `c:<span class="math-inline">\{customDateRange\.startDate\},</span>{customDateRange.endDate}`;

    // Asumiendo que 'params' y 'setParams' vienen de tu hook useCrud
    setParams((currentParams: any) => ({
      ...currentParams,
      filterBy: {
        ...(currentParams.filterBy || {}),
        in_at: customDateFilterString, // Aplicar al campo 'in_at'
      },
      page: 1, // Resetear a la página 1
    }));

    setOpenCustomFilterModal(false);
    setCustomDateErrors({});
  };

  // Función para manejar las acciones del RenderView
  const handleAccessAction = async (access: any, action: string) => {
    if (action === "entrada" && access?.confirm === "Y" && !access?.in_at) {
      try {
        const { data } = await execute("/accesses/enter", "POST", access.id);

        if (data?.success === true) {
          reLoad();
          showToast("Visitante ingresó exitosamente", "success");
        } else {
          showToast(data?.message || "Error al registrar entrada", "error");
        }
      } catch (error) {
        console.error("Error al registrar entrada:", error);
        showToast("Error al registrar entrada", "error");
      }
    } else if (action === "salida" && access?.in_at && !access?.out_at) {
      try {
        const { data } = await execute("/accesses/exit", "POST", {
          id: access.id,
          obs_out: "", // Puedes añadir un campo para esto si lo necesitas
        });

        if (data?.success === true) {
          reLoad();
          showToast("Visitante salió exitosamente", "success");
        } else {
          showToast(data?.message || "Error al registrar salida", "error");
        }
      } catch (error) {
        console.error("Error al registrar salida:", error);
        showToast("Error al registrar salida", "error");
      }
    }
  };

  // const typeOrder:any ={
  //   T:'Taxi',
  //   D:'Delivery',
  //   O:'Otro tipo'
  // }

  const getTypeAccess = (type: string, param: any) => {
    if (type === "P") {
      return "Pedido:" + param?.other?.other_type?.name;
    }
    if (type === "F") {
      return "Qr Frecuente";
    }
    return typeMap[type];
  };
  const typeMap: Record<string, string> = {
    C: "Sin Qr",
    G: "Qr Grupal",
    I: "Qr Individual",
    P: "Pedido",
    O: "Llave Qr",
  };
  // Definición del módulo Accesos
  const modAccess: ModCrudType = useMemo(() => {
    return {
      modulo: "accesses",
      singular: "Acceso",
      plural: "Accesos",
      filter: true,
      permiso: "",
      export: true,
      extraData: false,
      hideActions: {
        add: true,
        edit: true,
        del: true,
      },
      search: true,
      renderView: (props: any) => (
        <RenderView {...props} onConfirm={handleAccessAction} />
      ),
    };
  }, []);

  // Definición de campos para los accesos
  const fieldsAccess = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      visit_id: {
        rules: [""],
        api: "",
        label: "Visitante",
        list: {
          onRender: (props: any) => {
            if (props.item.type === "O") {
              return (
                <div style={{ display: "flex", gap: 8 }}>
                  {/* <div className={styles.iconCircle}> */}
                  <IconKey
                    size={46}
                    circle
                    style={{ backgroundColor: "var(--cWhiteV1)" }}
                  />
                  {/* </div> */}
                  <div className={styles.avatarText}>
                    <div className={styles.typeName}>Llave Virtual QR</div>
                  </div>
                </div>
              );
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* <div className={styles.iconCircle}> */}
                {/* {props.item.plate ? (
                    <IconVehicle className={styles.typeIcon} />
                  ) : (
                    <IconFoot className={styles.typeIcon} />
                  )} */}

                <div style={{ display: "flex", gap: 8 }}>
                  <Avatar
                    name={getFullName(props.item.visit)}
                    src={getUrlImages(
                      "/VISIT-" +
                        props.item.visit.id +
                        ".webp?" +
                        props.item.visit.updated_at
                    )}
                  />
                  {/* </div> */}
                  <div className={styles.avatarText}>
                    <div style={{ color: "var(--cWhite)" }}>
                      {getFullName(props.item.visit)}
                    </div>
                    <div>{getTypeAccess(props?.item?.type, props?.item)}</div>
                  </div>
                </div>
                {/* <div className={styles.companionsText}>
                  {props?.item?.accesses.length > 0 &&
                    `+${props?.item?.accesses?.length} acompañante${
                      props?.item?.accesses?.length > 1 ? "s" : ""
                    }`}
                </div> */}
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
                  <div>
                    Unidad: {props?.item?.owner?.dpto[0]?.nro || "Sin unidad"}
                  </div>
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
            return <div>{getDateTimeStrMesShort(props.item.in_at || "")}</div>;
          },
        },
        filter: {
          label: "Periodo",
          width: "180px",
          options: getPeriodOptions,
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
                  : "No registrada"}
              </div>
            );
          },
        },
      },

      // NUEVO DISEÑO SIN ESTOS CAMPOS
      // plate: {
      //   rules: [""],
      //   api: "",
      //   label: "Placa",
      //   list: {
      //     width: "100px",
      //     onRender: (props: any) => {
      //       return <div>{props.item.plate || "Sin placa"}</div>;
      //     },
      //   },
      // },

      // guard_id: {
      //   rules: [""],
      //   api: "",
      //   label: "Guardia",
      //   list: {
      //     onRender: (props: any) => {
      //       return getFullName(props.item.guardia);
      //     },
      //   },
      // },

      type: {
        rules: [],
        api: "",
        label: "Tipo de Acceso",
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
            { id: "C", name: "Sin Qr" },
            { id: "G", name: "Qr Grupal" },
            { id: "I", name: "Qr Individual" },
            { id: "P", name: "Pedido" },
            { id: "O", name: "Llave Qr" },
            { id: "F", name: "Qr frecuente" },
          ],
        },
      },
    };
  }, []);

  // Instancia de useCrud para Accesos
  const { userCan, List, data, reLoad, params, setParams } = useCrud({
    paramsInitial,
    mod: modAccess,
    fields: fieldsAccess,
    getFilter: handleGetFilterForAccesses,
  });

  // Efecto para manejar cambios en el filtro después de que setParams está disponible
  useEffect(() => {
    if (formStateFilter.filter_date !== undefined && setParams) {
      const periodo = formStateFilter.filter_date ? convertFilterDate() : "";
      setParams((currentParams: any) => ({
        ...currentParams,
        filter_date: periodo,
        page: 1,
      }));
    }
  }, [formStateFilter, setParams]);

  // Función para manejar cambios en el filtro (se adjunta después de que se define setParams)
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setFormStateFilter((prev) => ({ ...prev, filter_date: newValue }));
  };

  // Después de que se ha inicializado useCrud, adjuntar el manejador al campo de filtro
  useEffect(() => {
    if (setParams) {
      const updatedField = {
        ...fieldsAccess.in_at,
        filter: {
          ...fieldsAccess.in_at.filter,
          onChange: handleFilterChange,
        },
      };

      // Nota: Aquí idealmente actualizarías fieldsAccess con el nuevo valor,
      // pero como es un useMemo, no podemos mutarlo directamente.
      // En una implementación real, esto se manejaría de otra forma.
    }
  }, [setParams, fieldsAccess]);

  // Validación de permisos
  const canAccess = userCan(modAccess.permiso, "R");

  if (!canAccess) return <NotAccess />;

  return (
    <>
      {" "}
      {/* O un div principal */}
      <List height={"calc(100vh - 280px)"} />
      <DataModal
        open={openCustomFilterModal}
        title="Seleccionar Rango de Fechas Personalizado"
        onSave={onSaveCustomDateFilterForAccesses} // <--- Usar la nueva función de guardado
        onClose={() => {
          setCustomDateRange({});
          setOpenCustomFilterModal(false);
          setCustomDateErrors({});
        }}
        buttonText="Aplicar Filtro"
        buttonCancel="Cancelar"
      >
        <Input
          type="date"
          label="Fecha de inicio"
          name="startDate"
          error={customDateErrors.startDate}
          value={customDateRange.startDate || ""}
          onChange={(e) => {
            setCustomDateRange({
              ...customDateRange,
              startDate: e.target.value,
            });
            if (customDateErrors.startDate)
              setCustomDateErrors((prev) => ({
                ...prev,
                startDate: undefined,
              }));
          }}
          required
        />
        <Input
          type="date"
          label="Fecha de fin"
          name="endDate"
          error={customDateErrors.endDate}
          value={customDateRange.endDate || ""}
          onChange={(e) => {
            setCustomDateRange({
              ...customDateRange,
              endDate: e.target.value,
            });
            if (customDateErrors.endDate)
              setCustomDateErrors((prev) => ({ ...prev, endDate: undefined }));
          }}
          required
        />
      </DataModal>
    </>
  );
};

export default AccessesTab;
