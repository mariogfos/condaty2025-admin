import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Card } from "@/mk/components/ui/Card/Card";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./PedidosDetail.module.css";

interface Props {
  item?: any;
  open: boolean;
  onClose: () => void;
}

const PedidosDetail = ({ item, open, onClose }: Props) => {
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
      title="Detalle del pedido"
      buttonCancel=""
      buttonText=""
      className={styles.PedidosDetail}
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
          <LabelValue value="Delivery" label="Tipo de pedido" />
          <LabelValue label="Estado" value="Completado" />
          <LabelValue
            label="Fecha y hora de notificación"
            value="Lun, 12/04/2025 - 09:15"
          />

          <LabelValue
            value="Es un Uber, por favor dejarlo ingresar sin problemas, estoy apurado."
            label="Observación"
          />
        </div>
        <Br />
      </Card>
    </DataModal>
  );
};

export default PedidosDetail;
