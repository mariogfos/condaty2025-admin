import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Card } from "@/mk/components/ui/Card/Card";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./InvitationsDetail.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateStrMes } from "@/mk/utils/date";
import ItemList from "@/mk/components/ui/ItemList/ItemList";

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
          <LabelValue
            value={typeInvitation[item?.type]}
            label="Tipo de invitación"
          />
          <LabelValue label="Estado" value={getStatus()} />
          {item?.type == "G" && (
            <LabelValue value={invitation?.title || "-/-"} label="Evento" />
          )}
          <LabelValue label="Invitado" value={getFullName(visit)} />
          {item?.type != "C" && (
            <LabelValue
              value={getDateStrMes(invitation?.date_event)}
              label="Fecha de invitación"
            />
          )}
          <LabelValue value={invitation?.obs || "-/-"} label="Detalle" />
        </div>
        <Br />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          {invitation?.guests.map((acc: any) => {
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
      </Card>
    </DataModal>
  );
};

export default InvitationsDetail;
