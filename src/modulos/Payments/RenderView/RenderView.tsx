// @ts-nocheck
 

import React, { memo, useState, useEffect } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import styles from "./RenderView.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import TextArea from "@/mk/components/forms/TextArea/TextArea";

// Define explícitamente la interfaz para las props
interface DetailPaymentProps {
  open: boolean;
  onClose: () => void;
  // item: any;
  extraData?: any;
  reLoad?: () => void;
  payment_id: string | number;

}

// eslint-disable-next-line react/display-name
const RenderView: React.FC<DetailPaymentProps> = memo((props) => {
  const { open, onClose, extraData, reLoad, payment_id } = props;
  const [formState, setFormState] = useState<{confirm_obs?: string}>({});
  const [onRechazar, setOnRechazar] = useState(false);
  const [errors, setErrors] = useState<{confirm_obs?: string}>({});
  const [item, setItem] = useState(null);
  const { execute } = useAxios();
  const { showToast } = useAuth();

  const fetchPaymentData = async () => {
    if (payment_id && open) {
      const { data } = await execute("/payments", "GET", {
        fullType: "DET",
        searchBy: payment_id,
      },false,true);
      setItem(data?.data);
    }
  };
  useEffect(() => {

    fetchPaymentData();
  }, [payment_id]);
  // console.log(item,)


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

  // Calcular monto total de los detalles
  const getTotalAmount = () => {
    if (!item?.details || !item.details.length) return item?.amount || 0;
    return item.details.reduce((sum: number, detail: any) => sum + (parseFloat(detail.amount) || 0), 0);
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
          <div className={styles.notFoundContainer}>
            <p className={styles.notFoundText}>No se encontró información del pago.</p>
            <p className={styles.notFoundSuggestion}>Por favor, verifica el ID del pago o intenta de nuevo más tarde.</p>
          </div>
        </div>
      </DataModal>
    );
  }

  return (
    <>
      <DataModal
        open={open}
        onClose={onClose}
        title="Detalle del ingreso" // Mantén o quita el título del DataModal según tu preferencia global
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <div className={styles.amountDisplay}>Bs {item.amount}</div>
            <div className={styles.dateDisplay}>
              {getDateTimeStrMesShort(item.paid_at)}
            </div>
          </div>

          {/* Divisor antes de la sección de info y botón */}
          <hr className={styles.sectionDivider} />

          <div className={styles.mainInfoGrid}>
            <div className={styles.infoColumn}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Unidad</span>
                <span className={styles.infoValue}>{getDptoName()}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Propietario</span>
                <span className={styles.infoValue}>{getFullName(item.propietario) || getFullName(item.owner) || "Sin propietario"}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Concepto</span>
                <span className={styles.infoValue}>
                  {/* Asumiendo que item.concept es un array o string formateado.
                      La imagen muestra "-Expensas", "-Multas", "-Reservas".
                      Si es un array, podrías hacer item.concept.map(c => <div>-{c}</div>)
                      o si es un string formateado, usarlo directamente.
                      Asegúrate que tus datos 'item.concept' o 'item.description'
                      reflejen el formato de la imagen.
                  */}
                  {item.concept?.map((c: string, i: number) => <div key={i}>-{c}</div>) || item.description || "No especificado"}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Observación</span>
                <span className={styles.infoValue}>{item.obs || "Sin observación"}</span>
              </div>
            </div>

            <div className={styles.infoColumn}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={`${styles.infoValue} ${
                  item.status === 'P' ? styles.statusPaid :
                  item.status === 'S' ? styles.statusPending :
                  item.status === 'R' ? styles.statusRejected : ''
                }`}>
                  {getStatus(item.status)}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Forma de pago</span>
                <span className={styles.infoValue}>{getPaymentType(item.type)}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Titular</span>
                <span className={styles.infoValue}>{getFullName(item.owner) || "Sin titular"}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Número de comprobante</span>
                <span className={styles.infoValue}>{item.voucher || "Sin comprobante"}</span>
              </div>
            </div>
          </div>
          {/* Divisor después de la sección de info y botón */}
          <hr className={styles.sectionDivider} />

          {item.ext && (
            <div className={styles.voucherButtonContainer}>
              <Button
                variant="outline"
                className={styles.voucherButton}
                onClick={() => {
                  window.open(
                    getUrlImages(
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
              >
                Ver comprobante
              </Button>
            </div>
          )}

          

          {item?.details?.length > 0 && (
            <div className={styles.periodsDetailsSection}>
              <div className={styles.periodsDetailsHeader}>
                <h3 className={styles.periodsDetailsTitle}>Periodos pagados</h3>
              </div>

              <div className={styles.periodsTableWrapper}>
                <div className={styles.periodsTable}>
                  <div className={styles.periodsTableHeader}>
                    <div className={styles.periodsTableCell}>Periodo</div>
                    <div className={styles.periodsTableCell}>Concepto</div>
                    <div className={styles.periodsTableCell}>Monto</div>
                    <div className={styles.periodsTableCell}>Multa</div>
                    <div className={styles.periodsTableCell}>Subtotal</div>
                  </div>
                  <div className={styles.periodsTableBody}>
                    {item.details.map((periodo: any, index: number) => (
                      <div className={styles.periodsTableRow} key={periodo.id || index}>
                        <div className={styles.periodsTableCell} data-label="Periodo">
                          {periodo?.debt_dpto?.debt?.month}/{periodo?.debt_dpto?.debt?.year}
                        </div>
                        <div className={styles.periodsTableCell} data-label="Concepto">
                          {periodo?.concepto || periodo?.debt_dpto?.debt?.description || "Gasto Común"}
                        </div>
                        <div className={styles.periodsTableCell} data-label="Monto">
                          Bs {parseFloat(periodo?.debt_dpto?.amount || 0).toFixed(2)}
                        </div>
                        <div className={styles.periodsTableCell} data-label="Multa">
                          Bs {parseFloat(periodo?.debt_dpto?.penalty_amount || 0).toFixed(2)}
                        </div>
                        <div className={styles.periodsTableCell} data-label="Subtotal">
                          Bs {parseFloat(periodo?.amount || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.periodsDetailsFooter}>
                <div className={styles.periodsDetailsTotal}>
                  Total pagado: <span className={styles.totalAmountValue}>Bs {parseFloat(getTotalAmount() || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {item?.status === "S" && (
            <div className={styles.actionButtonsContainer}>
              <Button
                variant="danger"
                className={`${styles.actionButton} ${styles.rejectButton}`}
                onClick={() => {
                  setOnRechazar(true);
                }}
              >
                Rechazar pago
              </Button>
              <Button
                variant="success"
                className={`${styles.actionButton} ${styles.confirmButton}`}
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

export default RenderView;