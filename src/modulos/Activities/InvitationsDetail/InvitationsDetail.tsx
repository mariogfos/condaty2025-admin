import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Card } from "@/mk/components/ui/Card/Card";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./InvitationsDetail.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateStrMes } from "@/mk/utils/date";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { getDateTimeStrMes } from "../../../mk/utils/date";
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
  console.log(item);
  const Br = () => {
    return (
      <div
        style={{
          height: 0.5,
          backgroundColor: "var(--cWhiteV1)",
          margin: "16px 0px",
        }}
      />
    );
  };
  type LabelValueProps = {
    value: string;
    label: string;
    colorValue?: string;
  };
  const LabelValue = ({ value, label, colorValue }: LabelValueProps) => {
    return (
      <div className={styles.LabelValue}>
        <p>{label}</p>
        <p
          style={{
            color: colorValue ? colorValue : "var(--cWhite)",
          }}
        >
          {value}
        </p>
      </div>
    );
  };

  const getStatus = () => {
    let status = "";
    if (item?.out_at) {
      status = "Completado";
    } else if (item?.in_at) {
      status = "Por Salir";
    } else if (!item?.confirm_at) {
      status = "Por confirmar";
    } else if (item?.confirm == "Y") {
      status = "Por entrar";
    } else {
      status = "Denegado";
    }
    return status;
  };
  const getAccess = () => {
    return invitation?.guests?.filter((a: any) => a.status != "A");
  };
  const getPending = () => {
    return invitation?.guests?.filter((a: any) => a.status == "A");
  };
  function parseWeekDays(binaryNumber: number): string[] {
    const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const result: string[] = [];

    for (let i = 0; i < 7; i++) {
      if (binaryNumber & (1 << i)) {
        result.push(diasSemana[i]);
      }
    }
    return result;
  }

  type AccessTextProps = {
    text: string;
    textV2: string;
  };
  const AccessText = ({ text, textV2 }: AccessTextProps) => {
    return (
      <p style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--cWhite)" }}>{text}</span>/{textV2}
      </p>
    );
  };
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de la invitación"
      buttonCancel=""
      buttonText=""
      className={styles.InvitationsDetail}
    >
      <Card>
        <Avatar
          name="Nando peña"
          h={60}
          w={60}
          src={getUrlImages(
            "/OWNER-" + owner?.id + ".webp?d=" + owner?.updated_at
          )}
        />
        <p style={{ textAlign: "center", color: "var(--cWhite)" }}>
          {getFullName(owner)}
        </p>
        <p style={{ textAlign: "center", fontWeight: "300" }}>
          C.I. {owner?.ci} - Unidad: {owner?.dpto?.[0]?.nro}
        </p>
        <Br />
        <div className={styles.containerDetail}>
          <div>
          <LabelValue
            value={
              typeInvitation[
                item?.type == "I" && invitation?.is_frequent == "Y"
                  ? "F"
                  : item?.type
              ]
            }
            label="Tipo de invitación"
          />
          {item?.type == "G" && (
            <LabelValue value={invitation?.title || "-/-"} label="Evento" />
          )}
          {item?.type == "I" && <LabelValue label="Invitado" value={getFullName(visit)} />}
          <LabelValue value={invitation?.obs || "-/-"} label="Indicaciones" />
          </div>

          <div>
          <LabelValue label="Estado" value={getStatus()} />
          {item?.type != "C" && (
            <LabelValue
              value={
                invitation?.is_frequent == "Y"
                  ? getDateStrMes(invitation?.start_date) +
                    "  " +
                    getDateStrMes(invitation?.end_date)
                  : getDateStrMes(invitation?.date_event)
              }
              label={
                invitation?.is_frequent == "Y"
                  ? "Periodo de validez"
                  : "Fecha de invitación"
              }
            />
          )}
          </div>
        </div>
        <Br />
        {invitation?.is_frequent == "Y" && invitation?.weekday && (
          <>
            <p
              style={{
                color: "var(--cWhite)",
                marginBottom: 12,
                fontWeight: "bold",
              }}
            >
              Configuración avanzada
            </p>
            <div className={styles.containerDetail}>
              <LabelValue
                value={parseWeekDays(invitation?.weekday).toString()}
                label="Días de acceso"
              />
              <LabelValue
                value={
                  invitation?.start_time.slice(0, 5) +
                  " - " +
                  invitation?.end_time.slice(0, 5)
                }
                label="Horario permitido"
              />
              <LabelValue
                value={invitation?.max_entries || "-/-"}
                label="Cantidad"
              />
            </div>
            <Br />
          </>
        )}
        {invitation?.is_frequent == "Y" && (
          <>
            <AccessText
              text={"Accessos " + invitation?.access.length}
              textV2={invitation?.max_entries}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              {invitation?.access?.map((acc: any) => {
                return (
                  <ItemList
                    variant="V3"
                    key={acc.id}
                    title={getFullName(visit)}
                    left={<Avatar name={getFullName(visit)} />}
                  >
                    <div
                      style={{ display: "flex", fontSize: 12, marginTop: 8 }}
                    >
                      <IconArrowRight color="var(--cSuccess)" size={12} />
                      {getDateTimeStrMes(acc?.in_at)}
                    </div>
                    {acc?.out_at && (
                      <div style={{ display: "flex", fontSize: 12 }}>
                        <IconArrowLeft color="var(--cError)" size={12} />
                        {getDateTimeStrMes(acc?.out_at)}
                      </div>
                    )}
                  </ItemList>
                );
              })}
            </div>
            <Br />
          </>
        )}

        {item?.type == "G" && (
          <>
            <AccessText
              text={"Asistieron " + getAccess().length}
              textV2={invitation?.guests?.length}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              {getAccess()?.map((acc: any) => {
                return (
                  <ItemList
                    variant="V3"
                    key={acc.id}
                    title={getFullName(acc.visit)}
                    left={<Avatar name={getFullName(acc.visit)} />}
                  >
                    <div
                      style={{ display: "flex", fontSize: 12, marginTop: 8 }}
                    >
                      <IconArrowRight color="var(--cSuccess)" size={12} />
                      {getDateTimeStrMes(acc?.access?.in_at)}
                    </div>
                    {acc?.access?.out_at && (
                      <div style={{ display: "flex", fontSize: 12 }}>
                        <IconArrowLeft color="var(--cError)" size={12} />

                        {getDateTimeStrMes(acc?.access?.out_at)}
                      </div>
                    )}
                  </ItemList>
                );
              })}
            </div>
            <Br />
          </>
        )}
        {getPending().length > 0 && (
          <>
            <AccessText
              text={"No asistieron " + getPending().length}
              textV2={invitation?.guests?.length}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              {getPending()?.map((acc: any) => {
                return (
                  <ItemList
                    variant="V3"
                    key={acc.id}
                    title={getFullName(acc.visit)}
                    left={<Avatar name={getFullName(acc.visit)} />}
                  />
                );
              })}
            </div>
            <Br />
          </>
        )}
      </Card>
    </DataModal>
  );
};

export default InvitationsDetail;
