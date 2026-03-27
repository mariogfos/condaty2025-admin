import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Card } from "@/mk/components/ui/Card/Card";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./PedidosDetail.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateTimeStrMes } from "@/mk/utils/date";
import Br from "@/components/Detail/Br";
import { shouldIgnoreValueTranslationContext } from "@/i18n/translationGuards";

interface Props {
  item?: any;
  open: boolean;
  onClose: () => void;
}

type LabelValueProps = {
  value: string;
  label: string;
  colorValue?: string;
};

const getStatusText = (status?: string) => {
  switch (status) {
    case "I":
      return "Ingresado";
    case "O":
      return "Completado";
    default:
      return "";
  }
};

const LabelValue = ({ value, label, colorValue }: LabelValueProps) => {
  const ignoreValueTranslation = shouldIgnoreValueTranslationContext({ label });

  return (
    <div className={styles.LabelValue}>
      <p>{label}</p>
      <p
        data-i18n-ignore={ignoreValueTranslation ? "true" : undefined}
        style={{
          color: colorValue || "var(--cWhite)",
        }}
      >
        {value}
      </p>
    </div>
  );
};
const PedidosDetail = ({ item, open, onClose }: Props) => {
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
        <Avatar
          name={getFullName(item?.owner)}
          src={item?.owner?.url_avatar}
          h={60}
          w={60}
          style={{ marginBottom: 16 }}
        />
        <p
          data-i18n-ignore="true"
          style={{ textAlign: "center", color: "var(--cWhite)", fontSize: 16 }}
        >
          {getFullName(item?.owner)}
        </p>
        <p
          data-i18n-ignore="true"
          style={{ textAlign: "center", fontSize: 16, fontWeight: "300" }}
        >
          C.I. {item?.owner?.ci} - Unidad: {item?.owner?.dpto[0]?.nro}
        </p>

        <Br />
        <div className={styles.containerDetail}>
          <div>
            <LabelValue
              value={item?.other?.other_type?.name}
              label="Tipo de pedido"
            />
            <LabelValue
              label="Estado"
              value={getStatusText(item?.other?.status)}
              colorValue="var(--cAccent)"
            />
          </div>
          <div>
            <LabelValue
              label="Fecha y hora de notificación"
              value={getDateTimeStrMes(item?.updated_at)}
            />
            <LabelValue value={item?.other?.descrip} label="Observación" />
          </div>
        </div>
        <Br />
      </Card>
    </DataModal>
  );
};

export default PedidosDetail;
