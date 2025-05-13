import React from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import {
  IconArrowRight,
  IconArrowLeft,
  IconVehicle,
  IconFoot,
  IconOwner,
} from "@/components/layout/icons/IconsBiblioteca";

interface AccessRenderViewProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}

const RenderView: React.FC<AccessRenderViewProps> = ({
  open,
  onClose,
  item,
  onConfirm,
  extraData,
}) => {
  // Manejar la entrada de un visitante
  const handleEntrada = () => {
    if (onConfirm) {
      onConfirm(item, "entrada");
    }
  };

  // Manejar la salida de un visitante
  const handleSalida = () => {
    if (onConfirm) {
      onConfirm(item, "salida");
    }
  };

  // Determinar el icono a mostrar según el tipo de acceso
  const getAccessIcon = () => {
    if (item?.type === "O") {
      return <IconOwner className={styles.accessIcon} />;
    } else if (item?.plate) {
      return <IconVehicle className={styles.accessIcon} />;
    } else {
      return <IconFoot className={styles.accessIcon} />;
    }
  };

  // Determinar el tipo de acceso como texto
  const getAccessType = () => {
    const typeMap: Record<string, string> = {
      C: "Control",
      G: "Grupo",
      I: "Individual",
      P: "Pedido",
      O: "Llave Virtual QR",
    };

    return typeMap[item?.type] || "Acceso";
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
          <div className={styles.iconCircle}>{getAccessIcon()}</div>
        </div>

        <div className={styles.accessTitle}>{getAccessType()}</div>

        <div className={styles.divider}></div>

        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.label}>Visitante:</div>
            <div className={styles.value}>
              {item?.type === "O"
                ? "Uso Llave Virtual QR"
                : getFullName(item?.visit) || "No especificado"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Documento:</div>
            <div className={styles.value}>
              {item?.type === "O"
                ? item?.owner?.ci
                : item?.visit?.ci || "No especificado"}
            </div>
          </div>

          {item?.plate && (
            <div className={styles.detailRow}>
              <div className={styles.label}>Placa:</div>
              <div className={styles.value}>{item.plate}</div>
            </div>
          )}

          <div className={styles.detailRow}>
            <div className={styles.label}>Residente:</div>
            <div className={styles.value}>
              {getFullName(item?.owner) || "No especificado"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Guardia:</div>
            <div className={styles.value}>
              {getFullName(item?.guardia) || "No especificado"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Fecha:</div>
            <div className={styles.value}>
              {getDateStrMes(item?.begin_at) || "No especificada"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Entrada:</div>
            {item?.in_at ? (
              <div className={styles.valueAccent}>
                <IconArrowRight size={16} className={styles.ingressIcon} />
                {getDateTimeStrMes(item.in_at, item.begin_at)}
              </div>
            ) : item?.confirm_at ? (
              <div className={styles.value}>
                {item.confirm === "Y" ? (
                  <span className={styles.statusWaiting}>
                    Esperando entrada
                  </span>
                ) : (
                  <span className={styles.statusRejected}>No autorizado</span>
                )}
              </div>
            ) : (
              <div className={styles.statusWaiting}>Esperando confirmación</div>
            )}
          </div>

          {item?.type !== "O" && (
            <div className={styles.detailRow}>
              <div className={styles.label}>Salida:</div>
              {item?.out_at ? (
                <div className={styles.valueError}>
                  <IconArrowLeft size={16} className={styles.egressIcon} />
                  {getDateTimeStrMes(item.out_at, item.begin_at)}
                </div>
              ) : (
                <div className={styles.value}>
                  {item?.in_at ? "No registrada" : "Pendiente"}
                </div>
              )}
            </div>
          )}

          {item?.obs_in && (
            <div className={styles.detailRow}>
              <div className={styles.label}>Observación de entrada:</div>
              <div className={styles.value}>{item.obs_in}</div>
            </div>
          )}

          {item?.obs_out && (
            <div className={styles.detailRow}>
              <div className={styles.label}>Observación de salida:</div>
              <div className={styles.value}>{item.obs_out}</div>
            </div>
          )}
        </div>

        {/*         Botones de acción según el estado del acceso 
        {item?.type !== "O" && (
          <div className={styles.actionContainer}>
            {!item?.in_at && item?.confirm === "Y" && (
              <Button 
                className={styles.entryButton} 
                onClick={handleEntrada}
              >
                Dejar Entrar
              </Button>
            )}

            {item?.in_at && !item?.out_at && (
              <Button 
                className={styles.exitButton} 
                onClick={handleSalida}
              >
                Dejar Salir
              </Button>
            )}
          </div>
        )} */}
      </div>
    </DataModal>
  );
};

export default RenderView;
