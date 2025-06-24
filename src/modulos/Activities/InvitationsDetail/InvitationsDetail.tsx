import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./InvitationsDetail.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateStrMes, getDateTimeStrMes, formatDateRange } from "@/mk/utils/date";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import {
  IconArrowLeft,
  IconArrowRight,
} from "@/components/layout/icons/IconsBiblioteca";

interface Props {
  item?: any;
  open: boolean;
  onClose: () => void;
}

const typeInvitation: any = {
  C: "Sin QR",
  I: "QR individual",
  G: "QR grupal",
  F: "QR frecuente",
};

const InvitationsDetail = ({ item, open, onClose }: Props) => {
  const owner = item?.owner;
  const visit = item?.visit;
  const invitation = item?.invitation;

  const getStatusInfo = () => {
    let statusText = "Desconocido";
    let statusClass = "";

    if (item?.out_at) {
      statusText = "Completado";
      statusClass = styles.statusActive;
    } else if (item?.in_at) {
      statusText = "Por Salir";
      statusClass = styles.statusActive;
    } else if (item?.confirm == "Y") {
      statusText = "Activo";
      statusClass = styles.statusActive;
    } else if (item?.confirm == "N") {
        statusText = "Denegado";
        statusClass = styles.statusDenied;
    } else if (!item?.confirm_at) {
      statusText = "Por confirmar";
      statusClass = styles.statusPending;
    }
    return { text: statusText, className: statusClass };
  };

  const getAccess = () => {
    return invitation?.guests?.filter((a: any) => a.status !== "A") || [];
  };

  const getPending = () => {
    return invitation?.guests?.filter((a: any) => a.status === "A") || [];
  };

  function parseWeekDays(binaryNumber: number): string[] {
    const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const result: string[] = [];
    if (!binaryNumber) return result;
    for (let i = 0; i < 7; i++) {
      if (binaryNumber & (1 << i)) {
        result.push(diasSemana[i]);
      }
    }
    return result;
  }

  const statusInfo = getStatusInfo();

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de la invitación"
      buttonCancel=""
      buttonText=""
    >
      <div className={styles.container}>
        <section className={styles.headerSection}>
          <Avatar
            name={getFullName(owner)}
            h={60}
            w={60}
            src={getUrlImages(
              "/OWNER-" + owner?.id + ".webp?d=" + owner?.updated_at
            )}
            style={{ marginBottom: "var(--spS)" }}
          />
          <div className={styles.headerName}>{getFullName(owner)}</div>
          <div className={styles.headerInfo}>
            C.I. {owner?.ci} - Unidad: {owner?.dpto?.[0]?.nro}
          </div>
        </section>

        <section className={styles.detailsSection}>
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Tipo de invitación</span>
              <span className={styles.infoValue}>
                {typeInvitation[item?.type]}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Invitado</span>
              <span className={styles.infoValue}>{getFullName(visit) || invitation?.title || '-/-'}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Indicaciones</span>
              <span className={styles.infoValue}>{invitation?.obs || "-/-"}</span>
            </div>
          </div>
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Estado</span>
              <span className={`${styles.infoValue} ${statusInfo.className}`}>
                {statusInfo.text}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Teléfono</span>
              <span className={styles.infoValue}>{visit?.phone || "-/-"}</span>
            </div>
            {item?.type !== "C" && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>
                  {item?.type === "F"
                    ? "Periodo de validez"
                    : "Fecha de invitación"}
                </span>
                <span className={styles.infoValue}>
                  {item?.type === "F"
                    ? (invitation?.start_date && invitation?.end_date
                        ? formatDateRange(invitation?.start_date, invitation?.end_date)
                        : "Indefinido")
                    : (getDateStrMes(invitation?.date_event) || "Indefinido")}
                </span>
              </div>
            )}
          </div>
        </section>

        {item?.type === "F" && (
          <>
            <p className={styles.sectionTitle}>Configuración avanzada</p>
            <section className={styles.detailsSection}>
              <div className={styles.detailsColumn}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Días de acceso</span>
                  <span className={styles.infoValue}>
                    {parseWeekDays(invitation?.weekday).join(', ') || "No especificado"}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Cantidad de accesos</span>
                  <span className={styles.infoValue}>
                    {invitation?.max_entries || "Ilimitados"}
                  </span>
                </div>
              </div>
              <div className={styles.detailsColumn}>
                
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Horario permitido</span>
                  <span className={styles.infoValue}>
                    {invitation?.start_time?.slice(0, 5)} - {invitation?.end_time?.slice(0, 5)}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {(item?.type === "F" || item?.type === "G") && (
          <>
             <p className={styles.sectionTitle}>
                Accesos {invitation?.access?.length || getAccess().length}/{item?.type === 'F' ? (invitation?.max_entries || 'ilimitados') : invitation?.guests?.length}
            </p>
            <div className={styles.listContainer}>
              {(invitation?.access || getAccess())?.map((acc: any) => (
                <ItemList
                  variant="V3"
                  key={acc.id}
                  title={getFullName(acc.visit || visit)}
                  left={<Avatar name={getFullName(acc.visit || visit)} />}
                >
                  <div className={styles.accessTime}>
                    <IconArrowRight className={styles.accessInIcon} size={12} />
                    {getDateTimeStrMes(acc?.in_at || acc?.access?.in_at)}
                  </div>
                  {(acc?.out_at || acc?.access?.out_at) && (
                    <div className={styles.accessTime}>
                      <IconArrowLeft className={styles.accessOutIcon} size={12} />
                      {getDateTimeStrMes(acc?.out_at || acc?.access?.out_at)}
                    </div>
                  )}
                </ItemList>
              ))}
            </div>
          </>
        )}
      </div>
    </DataModal>
  );
};

export default InvitationsDetail;