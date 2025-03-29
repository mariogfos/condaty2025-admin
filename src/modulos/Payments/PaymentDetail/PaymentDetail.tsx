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
import TextArea from "@/mk/components/forms/TextArea/TextArea";

// Define explícitamente la interfaz para las props
interface DetailPaymentProps {
  open: boolean;
  onClose: () => void;
  item: any;
  extraData?: any;
  reLoad?: () => void;
}

// eslint-disable-next-line react/display-name
const DetailPayment: React.FC<DetailPaymentProps> = memo((props) => {
  const { open, onClose, item, extraData, reLoad } = props;
  const [formState, setFormState] = useState<{confirm_obs?: string}>({});
  const [onRechazar, setOnRechazar] = useState(false);
  const [errors, setErrors] = useState<{confirm_obs?: string}>({});
  const { execute } = useAxios();
  const { showToast } = useAuth();

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if ((e.target as HTMLInputElement).type === "checkbox") {
      value = (e.target as HTMLInputElement).checked ? "P" : "N";
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
      confirm: rechazado ? "P" : "R",
      confirm_obs: formState.confirm_obs,
    });

    if (payment?.success === true) {
      showToast(payment?.message, "success");
      if (reLoad) reLoad();
      setFormState({ confirm_obs: "" });
      onClose();
      setOnRechazar(false);
    } else {
      showToast(error?.data?.message || error?.message, "error");
    }
  };

  // Función para mapear el tipo de pago
  const getPaymentType = (type: string) => {
    const typeMap: Record<string, string> = {
      "T": "Transferencia bancaria",
      "E": "Efectivo",
      "C": "Cheque",
      "Q": "QR",
      "O": "Pago en oficina"
    };
    return typeMap[type] || type;
  };

  // Función para mapear el estado
  const getStatus = (status: string) => {
    const statusMap: Record<string, string> = {
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
    if (item?.category) return item.category.name;
    if (!extraData || !extraData.categories) return `Categoría ID: ${item?.category_id}`;
    const category = extraData.categories.find((c: any) => c.id === item?.category_id);
    return category ? category.name : `Categoría ID: ${item?.category_id}`;
  };

  // Busca la unidad en extraData
  const getDptoName = () => {
    if (!extraData || !extraData.dptos) return (item?.dptos || "No especificada").replace(/,/g, "");
    
    const dpto = extraData.dptos.find((d: any) => d.id === item?.dpto_id || d.id === item?.dptos);
    
    if (dpto) {
      const nroSinComa = dpto.nro ? dpto.nro.replace(/,/g, "") : "";
      const descSinComa = dpto.description ? dpto.description.replace(/,/g, "") : "";
      return `${nroSinComa} - ${descSinComa}`;
    } else {
      return (item?.dptos || "No especificada").replace(/,/g, "");
    }
  };

  if (!item) {
    return (
      <DataModal
        open={open}
        onClose={onClose}
        title="Detalle de Ingreso"
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.container}>
          <p>No se encontró información del pago</p>
        </div>
      </DataModal>
    );
  }

  return (
    <>
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
            {item?.details?.map((periodo: any) => (
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
            className="btn btn-primary"
            onClick={() => {
              window.open(
                getUrlImages(
                  //marcelo fixed
                  "/PAYMENT-" +
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
            className="btn-cancel"
            onClick={() => {
              setOnRechazar(true);
            }}
            style={{ marginRight: "10px" }}
          >
            Rechazar pago
          </Button>
          <Button
            className="btn btn-primary"
            onClick={() => onConfirm(true)}
          >
            Confirmar pago
          </Button>
        </div>
      )}
        </div>
      </DataModal>

      <DataModal
        title="Rechazar pago"
        buttonText="Rechazar"
        buttonCancel="Cancelar"
        onSave={() => onConfirm(false)}
        open={onRechazar}
        onClose={() => setOnRechazar(false)}
      >
        <TextArea
          label="Observaciones"
          required
          errors={errors}
          name="confirm_obs"
          onChange={handleChangeInput}
          value={formState?.confirm_obs || ""}
        />
      </DataModal>
    </>
  );
});

export default DetailPayment;