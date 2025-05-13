import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Card } from "@/mk/components/ui/Card/Card";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./InvitationsDetail.module.css";

interface Props {
  item?: any;
  open: boolean;
  onClose: () => void;
}

const InvitationsDetail = ({ item, open, onClose }: Props) => {
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
        <Avatar name="Nando peña" h={60} w={60} />
        <p
          style={{ textAlign: "center", color: "var(--cWhite)", fontSize: 16 }}
        >
          Jimena Pedraza Maldonado
        </p>
        <p style={{ textAlign: "center", fontSize: 16, fontWeight: "300" }}>
          C.I. 8475627 - Unidad: 12-A
        </p>
        <Br />
        <div className={styles.containerDetail}>
          <LabelValue value="12-A" label="Tipo de invitación" />
          <LabelValue label="Estado" value="Completado" />
          <LabelValue label="Invitado" value="Daniel Carrillo Pedraza" />
          <LabelValue value="04/05/2023" label="Fecha de invitación" />
          <LabelValue
            value="Ingresará con sus mascotas, por favor dejarlo ingresar sin problemas"
            label="Detalle"
          />
        </div>
        <Br />
      </Card>
    </DataModal>
  );
};

export default InvitationsDetail;
