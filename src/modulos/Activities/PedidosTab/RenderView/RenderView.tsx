import React from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import {
  IconDelivery,
  IconEmail,
  IconFoot,
  IconOther,
  IconTaxi,
  IconVehicle,
  IconArrowLeft,
  IconArrowRight
} from "@/components/layout/icons/IconsBiblioteca";

interface RenderViewProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}

const RenderView: React.FC<RenderViewProps> = ({
  open,
  onClose,
  item,
  onConfirm,
  extraData
}) => {
  // Función para manejar la entrada de un pedido
  const handleEntrada = () => {
    if (onConfirm) {
      onConfirm(item, "entrada");
    }
  };

  // Función para manejar la salida de un pedido
  const handleSalida = () => {
    if (onConfirm) {
      onConfirm(item, "salida");
    }
  };

  // Determinar qué icono mostrar según el tipo de pedido
  const getPedidoIcon = () => {
    const typeName = item?.other_type?.name;
    
    switch (typeName) {
      case "Mensajeria":
        return <IconEmail className={styles.pedidoIcon} />;
      case "Taxi":
        return <IconTaxi className={styles.pedidoIcon} />;
      case "Pie":
        return <IconFoot className={styles.pedidoIcon} />;
      case "Auto":
        return <IconVehicle className={styles.pedidoIcon} />;
      case "Delivery":
        return <IconDelivery className={styles.pedidoIcon} />;
      default:
        return <IconOther className={styles.pedidoIcon} />;
    }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title=""
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.container}>
        <div className={styles.iconHeader}>
          <div className={styles.iconCircle}>
            {getPedidoIcon()}
          </div>
        </div>

        <div className={styles.pedidoTitle}>
          {item?.other_type?.name || "Pedido"}
        </div>

        <div className={styles.divider}></div>

        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.label}>Residente:</div>
            <div className={styles.value}>
              {getFullName(item?.owner) || "No especificado"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Descripción:</div>
            <div className={styles.value}>
              {item?.descrip || "Sin descripción"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Fecha:</div>
            <div className={styles.value}>
              {getDateStrMes(item?.created_at) || "Fecha no disponible"}
            </div>
          </div>

          {item?.status === "X" && (
            <div className={styles.detailRow}>
              <div className={styles.label}>Estado:</div>
              <div className={styles.valueError}>Anulado</div>
            </div>
          )}

          {item?.status === "A" && !item?.access && (
            <div className={styles.detailRow}>
              <div className={styles.label}>Estado:</div>
              <div className={styles.valueError}>Vencido</div>
            </div>
          )}

          {item?.access?.in_at && (
            <>
              <div className={styles.detailRow}>
                <div className={styles.label}>Conductor:</div>
                <div className={styles.value}>
                  {getFullName(item.access?.visit) || "No especificado"}
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.label}>Carnet:</div>
                <div className={styles.value}>
                  {item.access?.visit?.ci || "No especificado"}
                </div>
              </div>

              {item.access?.taxi === "Y" && item.access?.plate && (
                <div className={styles.detailRow}>
                  <div className={styles.label}>Placa:</div>
                  <div className={styles.value}>{item.access?.plate}</div>
                </div>
              )}

              {item.access?.taxi === "Y" && !item.access?.plate && (
                <div className={styles.detailRow}>
                  <div className={styles.label}>Placa:</div>
                  <div className={styles.value}>Bicicleta (sin placa)</div>
                </div>
              )}

              <div className={styles.detailRow}>
                <div className={styles.label}>Ingreso:</div>
                <div className={styles.valueAccent}>
                  <IconArrowRight size={16} className={styles.ingressIcon} />
                  {getDateTimeStrMes(item.access?.in_at) || "No registrado"}
                </div>
              </div>

              {item.access?.out_at && (
                <div className={styles.detailRow}>
                  <div className={styles.label}>Salida:</div>
                  <div className={styles.valueError}>
                    <IconArrowLeft size={16} className={styles.egressIcon} />
                    {getDateTimeStrMes(item.access?.out_at) || "No registrado"}
                  </div>
                </div>
              )}

              {item.access?.obs_in && (
                <div className={styles.detailRow}>
                  <div className={styles.label}>Observación de entrada:</div>
                  <div className={styles.value}>{item.access?.obs_in}</div>
                </div>
              )}

              {item.access?.obs_out && (
                <div className={styles.detailRow}>
                  <div className={styles.label}>Observación de salida:</div>
                  <div className={styles.value}>{item.access?.obs_out}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones de acción según el estado del pedido */}
        <div className={styles.actionContainer}>
          {!item?.access?.in_at && item?.status !== "X" && (
            <Button 
              className={styles.entryButton} 
              onClick={handleEntrada}
            >
              Registrar Entrada
            </Button>
          )}

          {item?.access?.in_at && !item?.access?.out_at && (
            <Button 
              className={styles.exitButton} 
              onClick={handleSalida}
            >
              Registrar Salida
            </Button>
          )}
        </div>
      </div>
    </DataModal>
  );
};

export default RenderView;