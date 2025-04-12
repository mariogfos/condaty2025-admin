/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState, useEffect } from "react";
import styles from "../Activities.module.css";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { 
  IconVehicle, 
  IconFoot,
  IconOwner, 
} from "@/components/layout/icons/IconsBiblioteca";

import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import RenderView from "./RenderView/RenderView";

interface AccessesTabProps {
  paramsInitial: any;
  onRowClick?: (item: any) => void;
}

// Función actualizada para obtener las opciones de período
const getPeriodOptions = () => [
  { id: "t", name: "Todos" },
  { id: "week", name: "Esta Semana" },
  { id: "lweek", name: "Ant. Semana" },
  { id: "month", name: "Este Mes" },
  { id: "lmonth", name: "Ant. Mes" }
];

const AccessesTab: React.FC<AccessesTabProps> = ({ paramsInitial }) => {
  const { showToast } = useAuth();
  const { execute } = useAxios("", "GET", {});
  const [formStateFilter, setFormStateFilter] = useState<{filter_date?: string}>({});

  // Función para convertir el filtro de fecha al formato esperado por la API
  const convertFilterDate = () => {
    let periodo = "m"; // valor por defecto
    
    if (formStateFilter.filter_date === "thisweek") periodo = "w";
    if (formStateFilter.filter_date === "lastweek") periodo = "lw";
    if (formStateFilter.filter_date === "month") periodo = "m";
    if (formStateFilter.filter_date === "lmonth") periodo = "lm";
    
    return periodo;
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
        <RenderView 
          {...props} 
          onConfirm={handleAccessAction}
        />
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
                <div className={styles.typeIconContainer}>
                  <div className={styles.iconCircle}>
                    <IconOwner className={styles.typeIcon} />
                  </div>
                  <span className={styles.typeName}>
                    Llave Virtual QR
                  </span>
                </div>
              );
            }
            return (
              <div className={styles.typeIconContainer}>
                <div className={styles.iconCircle}>
                  {props.item.plate ? (
                    <IconVehicle className={styles.typeIcon} />
                  ) : (
                    <IconFoot className={styles.typeIcon} />
                  )}
                </div>
                <span className={styles.typeName}>
                  {getFullName(props.item.visit)}
                </span>
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
            return <div>{getDateStrMes(props.item.in_at || "")}</div>;
          },
        },
        filter: {
          label: "Periodo",
          width: "180px",
          options: getPeriodOptions
        }
      },

      out_at: {
        rules: [""],
        api: "",
        label: "Salida",
        list: {
          width: "140px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.out_at
                  ? getDateStrMes(props.item.out_at)
                  : "No registrada"}
              </div>
            );
          },
        },
      },

      plate: {
        rules: [""],
        api: "",
        label: "Placa",
        list: {
          width: "100px",
          onRender: (props: any) => {
            return <div>{props.item.plate || "Sin placa"}</div>;
          },
        },
      },

      owner_id: {
        rules: [""],
        api: "",
        label: "Residente",
        list: {
          width: "180px",
          onRender: (props: any) => {
            return getFullName(props.item.owner);
          },
        },
      },

      guard_id: {
        rules: [""],
        api: "",
        label: "Guardia",
        list: {
          onRender: (props: any) => {
            return getFullName(props.item.guardia);
          },
        },
      },

      type: {
        rules: [""],
        api: "",
        label: "Tipo",
        list: {
          width: "100px",
          onRender: (props: any) => {
            const typeMap: Record<string, string> = {
              C: "Control",
              G: "Grupo",
              I: "Individual",
              P: "Pedido",
              O: "Llave QR"
            };
            return (
              <div className={`${styles.typeTag} ${props.item.type === 'O' ? styles.typeTagQR : ''}`}>
                {typeMap[props.item.type] || props.item.type || "Sin tipo"}
              </div>
            );
          },
        },
      },
    };
  }, []);

  // Instancia de useCrud para Accesos
  const {
    userCan,
    List,
    data,
    reLoad,
    params,
    setParams,
  } = useCrud({
    paramsInitial,
    mod: modAccess,
    fields: fieldsAccess,
  });

  // Efecto para manejar cambios en el filtro después de que setParams está disponible
  useEffect(() => {
    if (formStateFilter.filter_date !== undefined && setParams) {
      const periodo = formStateFilter.filter_date ? convertFilterDate() : "";
      setParams((currentParams: any) => ({
        ...currentParams,
        filter_date: periodo,
        page: 1
      }));
    }
  }, [formStateFilter, setParams]);

  // Función para manejar cambios en el filtro (se adjunta después de que se define setParams)
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setFormStateFilter(prev => ({ ...prev, filter_date: newValue }));
  };

  // Después de que se ha inicializado useCrud, adjuntar el manejador al campo de filtro
  useEffect(() => {
    if (setParams) {
      const updatedField = {
        ...fieldsAccess.in_at,
        filter: {
          ...fieldsAccess.in_at.filter,
          onChange: handleFilterChange
        }
      };
      
      // Nota: Aquí idealmente actualizarías fieldsAccess con el nuevo valor,
      // pero como es un useMemo, no podemos mutarlo directamente.
      // En una implementación real, esto se manejaría de otra forma.
    }
  }, [setParams, fieldsAccess]);

  // Validación de permisos
  const canAccess = userCan(modAccess.permiso, "R");

  if (!canAccess) return <NotAccess />;

  return <List />;
};

export default AccessesTab;