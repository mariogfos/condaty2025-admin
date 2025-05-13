import React from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import {
  IconArrowRight,
  IconArrowLeft,
  IconVehicle,
  IconFoot,
  IconOwner,
} from "@/components/layout/icons/IconsBiblioteca";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import useAxios from "@/mk/hooks/useAxios";

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
  const { data } = useAxios(
    "/accesses",
    "GET",
    {
      searchBy: item.id,
      fullType: "DET",
    },
    true
  );
  console.log(data, "data det", item);
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
  // const getAccessType = () => {
  //   const typeMap: Record<string, string> = {
  //     C: "Control",
  //     G: "Grupo",
  //     I: "Individual",
  //     P: "Pedido",
  //     O: "Llave Virtual QR"
  //   };

  //   return typeMap[item?.type] || "Acceso";
  // };
  const getTypeAccess = (type: string, order: any) => {
    if (type === "P") {
      return "Pedido:" + order?.other?.other_type?.name;
    }
    return typeMap[type];
  };
  const typeMap: Record<string, string> = {
    C: "Control",
    G: "Qr Grupal",
    I: "Qr Individual",
    P: "Pedido",
    O: "Llave QR",
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
        <section>
          <Avatar
            name={getFullName(data?.item?.visit)}
            src={getUrlImages(
              "/VISIT-" +
                data?.item?.visit.id +
                ".webp?" +
                data?.item?.visit?.updated_at
            )}
          />
          <div>{getFullName(item?.visit)}</div>
          <div>
            C.I. : {item?.visit?.ci}{" "}
            {item?.plate ? `- Placa: ${item?.plate}` : ""}{" "}
          </div>
          <div className="bottomLine" />
        </section>

        <section>
          <div>
            <div className={styles.textsDiv}>
              <div>Tipo de acceso</div>
              {/* <div>{item?.    } </div> */}
            </div>
            <div className={styles.textsDiv}>
              <div>Fecha y hora de ingreso</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Acompañante</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Visitó a</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Guardia de ingreso</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Observación de entrada</div>
              <div>s</div>
            </div>
          </div>

          <div>
            <div className={styles.textsDiv}>
              <div>Estado</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Fecha y hora de salida</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Carnet de identidad</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Unidad</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Guardia de salida</div>
              <div>s</div>
            </div>
            <div className={styles.textsDiv}>
              <div>Observación de salida</div>
              <div>s</div>
            </div>
          </div>
        </section>
      </div>
    </DataModal>
  );
};

export default RenderView;

{
  /* <div className={styles.container}>
        <div className={styles.iconHeader}>
          <div className={styles.iconCircle}>
            {getAccessIcon()}
          </div>
        </div>

        <div className={styles.accessTitle}>
          {getAccessType()}
        </div>

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
        )}
        </div> */
}
