// @ts-nocheck
/* eslint-disable react-hooks/exhaustive-deps */

import React, { memo, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import styles from "./PaymentDetail.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";


// eslint-disable-next-line react/display-name
const DetailPayment = memo((props) => {
  // Aquí, useCrud ya ha cargado los datos detallados con fullType=DET
  const { open, onClose, item, extraData } = props;
  const [formState, setFormState] = useState({});
  const [onRechazar, setOnRechazar] = useState(false);
  const [errors, setErrors] = useState({});
  const { execute } = useAxios();
  const { showToast } = useAuth();


const handleChangeInput = (e) => {
  let value = e.target.value;
  if (e.target.type == "checkbox") {
    value = e.target.checked ? "Y" : "N";
  }
  setFormState({ ...formState, [e.target.name]: value });
};

const onConfirm = async (rechazado = true) => {
  setErrors({});
  if (!rechazado) {
    if (!formState.confirm_obs) {
      setErrors({ confirm_obs: "La observación es requerida" });
      return;
    }
  }
  const { data: payment, error } = await execute("/payment-confirm", "POST", {
    id: item?.id,
    confirm: rechazado ? "Y" : "R",
    confirm_obs: formState.confirm_obs,
  });

  if (payment?.success == true) {
    showToast(payment?.message, "success");
    if (props.reLoad) props.reLoad();
    setFormState({ confirm_obs: "" });
    onClose();
    setOnRechazar(false);
  } else {
    showToast(error?.data?.message || error?.message, "error");
  }
};

  // Función para mapear el tipo de pago
  const getPaymentType = (type) => {
    const typeMap = {
      "T": "Transferencia bancaria",
      "E": "Efectivo",
      "C": "Cheque",
      "Q": "QR",
      "O": "Pago en oficina"
    };
    return typeMap[type] || type;
  };

  // Función para mapear el estado
  const getStatus = (status) => {
    const statusMap = {
      "P": "Cobrado",
      "S": "Por confirmar",
      "R": "Rechazado",
      "E": "Por subir comprobante",
      "A": "Por pagar",
      "M": "Moroso"
    };
    return statusMap[status] || status;
  };

  // Busca la categoría en extraData
  const getCategoryName = () => {
    if (item.category) return item.category.name;
    if (!extraData || !extraData.categories) return `Categoría ID: ${item.category_id}`;
    const category = extraData.categories.find(c => c.id === item.category_id);
    return category ? category.name : `Categoría ID: ${item.category_id}`;
  };

  // Busca la unidad en extraData
  const getDptoName = () => {
    if (!extraData || !extraData.dptos) return item.dptos || "No especificada";
    const dpto = extraData.dptos.find(d => d.id === item.dptos);
    return dpto ? `${dpto.nro} - ${dpto.description}` : item.dptos || "No especificada";
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de Ingreso"
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.container}>
        <div className={styles.detailRow}>
          <div className={styles.label}>Estado</div>
          <div className={styles.value} style={{ color: "var(--cSuccess)" }}>
            {getStatus(item.status)}
          </div>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.label}>Fecha de pago</div>
          <div className={styles.value}>
            {getDateTimeStrMesShort(item.paid_at)}
          </div>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.label}>Titular</div>
          <div className={styles.value}>
            {getFullName(item.owner) || "Sin titular"}
          </div>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.label}>Tipo de pago</div>
          <div className={styles.value}>
            {getPaymentType(item.type)}
          </div>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.label}>Monto total del pago</div>
          <div className={styles.value}>
            Bs {item.amount}
          </div>
        </div>

       

        <div className={styles.detailRow}>
          <div className={styles.label}>Unidad</div>
          <div className={styles.value}>
            {getDptoName()}
          </div>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.label}>Observación</div>
          <div className={styles.value}>
            {item.obs || "Sin observaciones"}
          </div>
        </div>

        <div className={styles.detailRow}>
          <div className={styles.label}>Comprobante</div>
          <div className={styles.value}>
            {item.voucher || "Sin comprobante"}
          </div>
        </div>
        {item?.details?.length > 0 && (
  <>
    <div className={styles.tableHeader}>
      <div className={styles.headerCell}>Periodo</div>
      <div className={styles.headerCell}>Unidad</div>
      <div className={styles.headerCell}>Monto</div>
      <div className={styles.headerCell}>Multa</div>
      <div className={styles.headerCell}>SubTotal</div>
    </div>
    <div className={styles.tableBody}>
      {item?.details?.map((periodo) => (
        <div key={periodo.id} className={styles.tableRow}>
          <div className={styles.tableCell}>
            {periodo?.debt_dpto?.debt?.month}/{periodo?.debt_dpto?.debt?.year}
          </div>
          <div className={styles.tableCell}>
            {periodo?.debt_dpto?.dpto?.nro}
          </div>
          <div className={styles.tableCell}>
            Bs {periodo?.debt_dpto?.amount}
          </div>
          <div className={styles.tableCell}>
            Bs {periodo?.debt_dpto?.penalty_amount}
          </div>
          <div className={styles.tableCell}>
            Bs {periodo?.amount}
          </div>
        </div>
      ))}
    </div>
  </>
)}
        {item.ext && (
  <div className={styles.buttonContainer}>
    <Button 
      variant="primary" 
      onClick={() => {
        window.open(
          getUrlImages(
            "/DOC-" +
              item.id +
              "." +
              item.ext +
              "?d=" +
              item.updated_at
          ),
          "_blank"
        );
      }}
      style={{ width: "100%" }}
    >
      Descargar comprobante
    </Button>
  </div>
)}

{item?.status == "S" && (
  <div className={styles.buttonContainer}>
    <Button
      variant="secondary"
      onClick={() => {
        setOnRechazar(true);
      }}
      style={{ marginRight: "10px" }}
    >
      Rechazar pago
    </Button>
    <Button
      variant="primary"
      onClick={() => onConfirm(true)}
    >
      Confirmar pago
    </Button>
  </div>
)}
      </div>
    </DataModal>
  );
});

export default DetailPayment;