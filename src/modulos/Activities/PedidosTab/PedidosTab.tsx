/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState } from "react";
import styles from "../Activities.module.css";
import { getDateStrMes, getUTCNow } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import {
  IconDelivery,
  IconEmail,
  IconFoot,
  IconOther,
  IconTaxi,
  IconVehicle,
} from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderView from "./RenderView/RenderView";


interface PedidosTabProps {
  paramsInitial: any;
  onRowClick?: (item: any) => void;
}

const PedidosTab: React.FC<PedidosTabProps> = ({ paramsInitial }) => {
  const { showToast } = useAuth();
  const { execute } = useAxios("", "GET", {});
  
  // Función para manejar las acciones del renderView
  const handlePedidoAction = async (pedido: any, action: string) => {
    const url = "/accesses";
    
    if (action === "salida" && pedido.access?.in_at && !pedido.access?.out_at) {
      try {
        const { data } = await execute(url + "/exit", "POST", {
          id: pedido.access_id,
          obs_out: "", // Puedes implementar un campo para esto si es necesario
        });
        
        if (data?.success === true) {
          reLoad();
          showToast("Pedido salió exitosamente", "success");
        } else {
          showToast(data?.message || "Error al registrar salida", "error");
        }
      } catch (error) {
        console.error("Error al registrar salida:", error);
        showToast("Error al registrar salida", "error");
      }
    } else if (action === "entrada") {
      try {
        const { data } = await execute(url, "POST", {
          pedido_id: pedido.id,
          begin_at: getUTCNow(),
          type: "P",
          plate: "", // Estos campos podrían venir del formulario
          name: "",
          last_name: "",
          middle_name: "",
          mother_last_name: "",
          ci: "",
          obs_in: "",
        });
        
        if (data?.success === true) {
          reLoad();
          showToast("Pedido ingresó exitosamente", "success");
        } else {
          showToast(data?.message || "Error al registrar entrada", "error");
        }
      } catch (error) {
        console.error("Error al registrar entrada:", error);
        showToast("Error al registrar entrada", "error");
      }
    }
  };

  // Definición del módulo Pedidos
  const modPedidos: ModCrudType = useMemo(() => {
    return {
      modulo: "others",
      singular: "Pedido",
      plural: "Pedidos",
      filter: true,
      permiso: "",
      extraData: false,
      export: true,
      hideActions: {
        add: true,
        edit: true,
        del: true,
      },
      search: true,
      renderView: (props: any) => (
        <RenderView 
          {...props} 
          onConfirm={handlePedidoAction}
        />
      ),
    };
  }, []);

  // Definición de campos para los pedidos
  const fieldsPedidos = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      otherType: {
        rules: [""],
        api: "",
        label: "Tipo",
        list: {
          width: "120px",
          onRender: (props: any) => {
            return (
              <div className={styles.typeIconContainer}>
                <div className={styles.iconCircle}>
                  {props.item.other_type?.name === "Mensajeria" && (
                    <IconEmail className={styles.typeIcon} />
                  )}
                  {props.item.other_type?.name === "Taxi" && (
                    <IconTaxi className={styles.typeIcon} />
                  )}
                  {props.item.other_type?.name === "Pie" && (
                    <IconFoot className={styles.typeIcon} />
                  )}
                  {props.item.other_type?.name === "Auto" && (
                    <IconVehicle className={styles.typeIcon}/>
                  )}
                  {props.item.other_type?.name === "Otro" && (
                    <IconOther className={styles.typeIcon}/>
                  )}
                  {props.item.other_type?.name === "Delivery" && (
                    <IconDelivery className={styles.typeIcon}/>
                  )}
                </div>
                <span className={styles.typeName}>
                  {props.item.other_type ? props.item.other_type.name : "Sin tipo"}
                </span>
              </div>
            );
          },
        },
      },
      descrip: {
        rules: [""],
        api: "",
        label: "Descripción",
        list: {
          onRender: (props: any) => {
            return (
              <div className={styles.pedidoDescripcion}>
                {props.item.descrip || "Sin descripción"}
              </div>
            );
          },
        },
      },

      owner: {
        rules: [""],
        api: "",
        label: "Residente",
        list: {
          width: "180px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.owner
                  ? getFullName(props.item.owner)
                  : "Sin residente"}
              </div>
            );
          },
        },
      },

      access: {
        rules: [""],
        api: "",
        label: "Entrada",
        list: {
          
          onRender: (props: any) => {
            return (
              <div>
                {props.item.access?.in_at
                  ? getDateStrMes(props.item.access.in_at)
                  : "No registrada"}
              </div>
            );
          },
        },
      },

      access_out: {
        rules: [""],
        api: "",
        label: "Salida",
        list: {
          onRender: (props: any) => {
            return (
              <div>
                {props.item.access?.out_at
                  ? getDateStrMes(props.item.access.out_at)
                  : "No registrada"}
              </div>
            );
          },
        },
      },
    };
  }, []);

  // Instancia de useCrud para Pedidos
  const {
    userCan,
    List,
    data,
    reLoad,
    params,
    setParams,
  } = useCrud({
    paramsInitial,
    mod: modPedidos,
    fields: fieldsPedidos,
  });

  // Validación de permisos
  const canPedidos = userCan(modPedidos.permiso, "R");

  if (!canPedidos) return <NotAccess />;

  return <List />;
};

export default PedidosTab;