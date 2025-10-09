import React from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import {
  IconGroupsQr,
  IconSingleQr,
  IconArrowRight,
  IconArrowLeft,
  IconGenericQr} from "@/components/layout/icons/IconsBiblioteca";

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



  // Determinar el estado de la invitación
  const getStatusInfo = () => {
    if (item?.status === "X") {
      return {
        label: "Anulada",
        className: styles.statusCancelled
      };
    } else if (item?.access && item?.access.length === 0) {
      return {
        label: "Expirada",
        className: styles.statusExpired
      };
    } else {
      return {
        label: "Activa",
        className: styles.statusActive
      };
    }
  };

  const statusInfo = getStatusInfo();

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
            {item?.type === "G" ? (
              <IconGroupsQr className={styles.qrIcon} />
            ) : (
              <IconSingleQr className={styles.qrIcon} />
            )}
          </div>
        </div>

        <div className={styles.invitationTitle}>
          {item?.title || "Invitación QR"}
        </div>

        <div className={`${styles.invitationStatus} ${statusInfo.className}`}>
          {statusInfo.label}
        </div>

        <div className={styles.divider}></div>

        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.label}>Tipo:</div>
            <div className={styles.value}>
              {item?.type === "G" ? "Grupal" : "Individual"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Fecha del evento:</div>
            <div className={styles.value}>
              {getDateStrMes(item?.date_event) || "No especificada"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Residente:</div>
            <div className={styles.value}>
              {getFullName(item?.owner) || "No especificado"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Creado:</div>
            <div className={styles.value}>
              {getDateTimeStrMes(item?.created_at) || "No especificado"}
            </div>
          </div>

          {item?.note && (
            <div className={styles.detailRow}>
              <div className={styles.label}>Nota:</div>
              <div className={styles.value}>{item.note}</div>
            </div>
          )}

          {/* Mostrar invitados si es una invitación grupal */}
          {item?.type === "G" && item?.guests && item?.guests.length > 0 && (
            <>
              <div className={styles.guestsHeader}>
                <div className={styles.guestsTitle}>Invitados ({item.guests.length})</div>
              </div>

              <div className={styles.guestsList}>
                {item.guests.map((guest: any, index: number) => (
                  <div key={guest.id || index} className={styles.guestItem}>
                    <div className={styles.guestName}>
                      {getFullName(guest.visit) || `Invitado ${index + 1}`}
                    </div>
                    <div className={styles.guestStatus}>
                      {guest.access ? (
                        <div className={styles.guestAccessed}>
                          <IconArrowRight size={12} className={styles.accessIcon} />
                          {getDateTimeStrMes(guest.access?.in_at)}
                          {guest.access?.out_at && (
                            <>
                              <IconArrowLeft size={12} className={styles.exitIcon} />
                              {getDateTimeStrMes(guest.access?.out_at)}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className={styles.guestNotAccessed}>Sin acceso</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Para invitaciones individuales, mostrar el acceso */}
          {item?.type === "I" && item?.access && (
            <div className={styles.detailRow}>
              <div className={styles.label}>Acceso:</div>
              <div className={styles.value}>
                {item.access.length > 0 ? (
                  <div className={styles.accessInfo}>
                    <div className={styles.accessEntry}>
                      <IconArrowRight size={12} className={styles.accessIcon} />
                      {getDateTimeStrMes(item.access[0]?.in_at) || "No registrada"}
                    </div>
                    {item.access[0]?.out_at && (
                      <div className={styles.accessExit}>
                        <IconArrowLeft size={12} className={styles.exitIcon} />
                        {getDateTimeStrMes(item.access[0]?.out_at) || "No registrada"}
                      </div>
                    )}
                  </div>
                ) : (
                  "Sin accesos registrados"
                )}
              </div>
            </div>
          )}
        </div>

     
      </div>
    </DataModal>
  );
};

export default RenderView;