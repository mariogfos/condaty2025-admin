import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Alerts.module.css";
import { useEffect, useMemo } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";

const mod = {
  modulo: "alerts",
  singular: "alerta",
  plural: "alertas",
  permiso: "",
  extraData: false,
  hideActions: { edit: true, del: true, add: true },
  export: true,
  filter: true
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const lLevels = [
  { id: 3, name: "Nivel alto" },
  { id: 2, name: "Nivel medio" },
  { id: 1, name: "Nivel bajo" },
];

const Alerts = () => {
  const { setStore } = useAuth();
  useEffect(() => {
    setStore({ title: mod.plural.toUpperCase() });
  }, []);

  // Función personalizada para el manejo de filtros
  const getFilter = (opt:any, value:any, oldFilter:any) => {
    // Para depuración si es necesario
    console.log("Filtrando por:", opt, "con valor:", value);
    
    // Si el campo es level
    if (opt === 'level') {
      // Si no hay valor (opción "Todos"), no aplicamos filtro
      if (value === '') {
        return { filterBy: {} };
      }
      
      // Si hay un valor, aplicamos el filtro directamente sin el formato opt:value
      return { 
        filterBy: { 
          [opt]: value 
        } 
      };
    }
    
    // Para otros campos, mantener el comportamiento por defecto
    return { 
      filterBy: { 
        ...oldFilter.filterBy, 
        [opt]: value 
      } 
    };
  };

  // Función para determinar la clase de estilo según el nivel de alerta
  const getAlertLevelClass = (level:any) => {
    switch (level) {
      case 3:
        return styles.nivelAlto;
      case 2:
        return styles.nivelMedio;
      case 1:
        return styles.nivelBajo;
      default:
        return styles.nivelMedio;
    }
  };

  // Función para obtener el texto del nivel de alerta
  const getAlertLevelText = (level:any) => {
    switch (level) {
      case 3:
        return "Nivel alto";
      case 2:
        return "Nivel medio";
      case 1:
        return "Nivel bajo";
      default:
        return "Nivel medio";
    }
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      created_at: {
        rules: [""],
        api: "",
        label: "Fecha",
        list: { width: "160px" },
        onRender: (props:any) => {
          return getDateTimeStrMesShort(props.item.created_at);
        },
      },
      guard_id: {
        rules: ["required"],
        api: "ae",
        label: "Guardia",
        list: {
          onRender: (props: any) => {
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar
                    src={getUrlImages(
                      "/GUARD-" +
                        props?.item?.guardia.id +
                                  ".webp?d=" +
                                  props?.item?.guardia.updated_at
                              )}
                              name={getFullName(props?.item.guardia)}
                              square
                            />
                            <div>
                              <p>{getFullName(props?.item.guardia)} </p>
                            </div>
                          </div>
            );
          }
        },
        form: { type: "text" },
        onRenderView: (props: any) => {
          return (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{  }}>Guardia:</span>
              <span style={{ color: "var(--cWhite)" }}>{getFullName(props.item.guardia)}</span>
            </div>
          );
        }
      },
      descrip: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        list: true,
        form: { type: "text" },
      },
      level: {
        rules: ["required"],
        api: "ae",
        label: "Nivel de alerta",
        list: {
          onRender: (props:any) => {
            const alertLevel = props?.item?.level || 2;
            const levelClass = `${styles.statusBadge} ${getAlertLevelClass(alertLevel)}`;
            
            return (
              <div className={levelClass}>
                {getAlertLevelText(alertLevel)}
              </div>
            );
          }
        },
        form: { type: "select", options: lLevels },
        filter: {
          label: "Nivel",
          width: "200px",
          options: () => [
            { id: "", name: "Todos" },
            ...lLevels
          ],
          optionLabel: "name",
          optionValue: "id"
        },
        
      },
    }),
    []
  );

  const { userCan, List } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter // Pasamos la función personalizada al hook useCrud
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.style}>
      <List />
    </div>
  );
};

export default Alerts;