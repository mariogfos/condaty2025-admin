import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./InvitationsDetail.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import {
  getDateStrMes,
  formatDateRange,
  getDateTimeStrMesShort,
} from "@/mk/utils/date";
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

    if (invitation?.status == "O") {
      statusText = "Finalizado";
      statusClass = styles.statusCompleted;
    } else if (invitation?.status == "A" || invitation?.status == "I") {
      statusText = "Activo";
      statusClass = styles.statusActive;
    } else if (invitation?.status == "X") {
      statusText = "Anulado";
      statusClass = styles.statusDenied;
    }
    return { text: statusText, className: statusClass };
  };

  const getAccess = () => {
    if (invitation?.type == "G") {
      return invitation?.guests?.filter((a: any) => a?.access) || [];
    }
    if (invitation?.type == "F") {
      return invitation?.access;
    }
    return [];
  };
  const getNotAttend = () => {
    return invitation?.guests?.filter((a: any) => !a.access) || [];
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
        <p>Creador</p>
        <section className={styles.headerSection}>
          <Avatar
            hasImage={owner.has_image}
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
        <hr className={styles.sectionDivider} />
        <section className={styles.detailsSection}>
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Tipo de invitación</span>
              <span className={styles.infoValue}>
                {typeInvitation[item?.type]}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>
                {invitation?.type !== "G" ? "Invitado" : "Evento"}
              </span>
              <span className={styles.infoValue}>
                {invitation?.type !== "G"
                  ? getFullName(visit) || "-/-"
                  : invitation?.title || "-/-"}
              </span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>
                {item?.type == "F" ? "Indicaciones" : "Detalle"}
              </span>
              <span className={styles.infoValue}>
                {invitation?.obs || "-/-"}
              </span>
            </div>
          </div>

          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Estado</span>
              <span className={`${styles.infoValue} ${statusInfo.className}`}>
                {statusInfo.text}
              </span>
            </div>
            {invitation.type == "G" && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Cantidad de invitados</span>
                <span className={styles.infoValue}>
                  {invitation?.guests?.length || "-/-"}
                </span>
              </div>
            )}
            {item?.type !== "C" && (
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>
                  {item?.type === "F"
                    ? "Periodo de validez"
                    : "Fecha de invitación"}
                </span>
                <span className={styles.infoValue}>
                  {item?.type === "F"
                    ? invitation?.start_date && invitation?.end_date
                      ? formatDateRange(
                          invitation?.start_date,
                          invitation?.end_date
                        )
                      : "Indefinido"
                    : getDateStrMes(invitation?.date_event) || "Indefinido"}
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
                    {parseWeekDays(invitation?.weekday).join(", ") ||
                      "No especificado"}
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
                    {invitation?.start_time?.slice(0, 5)} -{" "}
                    {invitation?.end_time?.slice(0, 5)}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {(item?.type === "F" || item?.type === "G") && (
          <>
            <p className={styles.sectionTitle}>
              {item?.type == "F" ? "Accesos" : "Asistieron"}{" "}
              {getAccess().length}
              <span style={{ color: "var(--cWhiteV1)" }}>
                /
                {item?.type === "F"
                  ? invitation?.max_entries || "ilimitados"
                  : invitation?.guests?.length}
              </span>
            </p>
            <div className={styles.listContainer}>
              {getAccess()?.map((acc: any) => (
                <ItemList
                  variant="V3"
                  key={acc.id}
                  title={getFullName(acc.visit || visit)}
                  subtitle={
                    <>
                      <div
                        className={styles.accessTime}
                        style={{ marginTop: 4, marginBottom: 8 }}
                      >
                        <IconArrowRight
                          className={styles.accessInIcon}
                          size={12}
                        />
                        {getDateTimeStrMesShort(
                          acc?.in_at || acc?.access?.in_at
                        )}
                      </div>
                      {(acc?.out_at || acc?.access?.out_at) && (
                        <div className={styles.accessTime}>
                          <IconArrowLeft
                            className={styles.accessOutIcon}
                            size={12}
                          />
                          {getDateTimeStrMesShort(
                            acc?.out_at || acc?.access?.out_at
                          )}
                        </div>
                      )}
                    </>
                  }
                  left={
                    <Avatar
                      hasImage={
                        acc.visit ? acc.visit?.has_image : visit?.has_image
                      }
                      src={getUrlImages(
                        "/VISIT-" +
                          (acc?.visit?.id || visit?.id) +
                          ".webp?" +
                          (acc?.visit?.updated_at || visit?.updated_at)
                      )}
                      name={getFullName(acc.visit || visit)}
                    />
                  }
                ></ItemList>
              ))}
            </div>
            {getNotAttend().length > 0 && (
              <>
                <p className={styles.sectionTitle}>
                  No asistieron {getNotAttend().length}
                  <span style={{ color: "var(--cWhiteV1)" }}>
                    /{invitation?.guests?.length}
                  </span>
                </p>
                <div className={styles.listContainer}>
                  {getNotAttend()?.map((acc: any) => (
                    <ItemList
                      variant="V3"
                      key={acc.id}
                      title={getFullName(acc.visit || visit)}
                      left={
                        <Avatar
                          hasImage={1}
                          name={getFullName(acc.visit || visit)}
                          src={getUrlImages(
                            "/VISIT-" + visit?.id + ".webp?" + visit?.updated_at
                          )}
                        />
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DataModal>
  );
};

export default InvitationsDetail;
