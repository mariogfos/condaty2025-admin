import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateStrMes, MONTHS_S } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import { useState } from "react";
import { Card } from "@/mk/components/ui/Card/Card";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import PaymentRenderView from "../../../Payments/RenderView/RenderView";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
  const [payDetails, setPayDetails] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [openPayment, setOpenPayment] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const getStatus = (status: any) => {
    let _status: string = "";
    if (status == "A") _status = "Por cobrar";
    if (status == "E") _status = "En espera";
    if (status == "P") _status = "Cobrado";
    if (status == "S") _status = "Por confirmar";
    if (status == "M") _status = "En Mora";
    if (status == "R") _status = "Rechazado";
    return _status;
  };

  const colorStatus: any = {
    A: "var(--cInfo)",
    M: "var(--cError)",
    S: "var(--cWarning)",
    P: "var(--cSuccess)",
  };
  console.log("ExpensesDetails props?.item:", props?.item);
  console.log("PayDetails:", payDetails);
  type LabelValueProps = {
    value: string;
    label: string;
    colorValue?: string;
    className?: string;
  };

  const LabelValue = ({
    value,
    label,
    colorValue,
    className,
  }: LabelValueProps) => {
    return (
      <div className={`${styles.LabelValue} ${className}`}>
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
      open={props.open}
      onClose={props?.onClose}
      title="Detalle de expensa"
      buttonText=""
      buttonCancel=""
      style={{ width: "883px" }}
    >
      <Card>
        <div className={styles.totalAmountSection}>
          <div className={styles.totalAmount}>Bs {props?.item?.amount}</div>
          <div className={styles.paymentDate}>
            {getDateStrMes(props?.item?.paid_at) || "-/-"}
          </div>
          <div className={styles.divider}></div>
          <div className={styles.detailsContainer}>
            <LabelValue
              label="Unidad"
              value={props?.item?.dpto?.nro || "Sin unidad"}
            />

            <LabelValue
              label="Estado"
              value={getStatus(props?.item?.status)}
              colorValue={colorStatus[props?.item?.status]}
            />

            <LabelValue
              label="Periodo"
              value={
                MONTHS_S[props?.item?.debt?.month] +
                "/" +
                props?.item?.debt?.year
              }
            />
            <LabelValue
              label="Fecha de pago"
              value={getDateStrMes(props?.item?.paid_at) || "-/-"}
            />

            <LabelValue
              label="Fecha de plazo"
              value={getDateStrMes(props?.item?.debt?.due_at)}
            />

            <LabelValue
              label="Descripción"
              value={props?.item?.dpto?.description || "-/-"}
            />

            <LabelValue
              label="Titular"
              value={getFullName(props?.item?.dpto?.titular?.owner) || "-/-"}
            />

            <LabelValue
              label="Propietario"
              value={getFullName(props?.item?.dpto?.homeowner) || "-/-"}
            />
          </div>

          {/* Sección de periodos por pagar si existen */}
          {props?.item?.pendingPeriods &&
            props?.item?.pendingPeriods.length > 0 && (
              <div className={styles.periodsSection}>
                <div className={styles.periodsTitle}>Periodos por pagar</div>

                <div className={styles.tableContainer}>
                  <div className={styles.tableHeader}>
                    <div
                      className={`${styles.headerCell} ${styles.headerCellLeft}`}
                    >
                      Periodo
                    </div>
                    <div className={styles.headerCell}>Monto</div>
                    <div className={styles.headerCell}>Multa</div>
                    <div
                      className={`${styles.headerCell} ${styles.headerCellRight}`}
                    >
                      Subtotal
                    </div>
                  </div>

                  <div className={styles.tableBody}>
                    {props?.item?.pendingPeriods.map(
                      (periodo: any, index: number) => {
                        const isLastRow =
                          index === props?.item?.pendingPeriods.length - 1;

                        return (
                          <div
                            key={index}
                            className={`${styles.tableRow} ${
                              isLastRow ? styles.tableLastRow : ""
                            }`}
                          >
                            <div
                              className={`${styles.tableCell} ${
                                isLastRow ? styles.tableCellLeft : ""
                              }`}
                            >
                              {MONTHS_S[periodo.month]}/{periodo.year}
                            </div>
                            <div className={styles.tableCell}>
                              Bs {periodo.amount}
                            </div>
                            <div className={styles.tableCell}>
                              Bs {periodo.penalty || 0}
                            </div>
                            <div
                              className={`${styles.tableCell} ${
                                isLastRow ? styles.tableCellRight : ""
                              }`}
                            >
                              Bs{" "}
                              {parseFloat(periodo.amount) +
                                parseFloat(periodo.penalty || 0)}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className={styles.totalPaid}>
                  Total pagado: Bs {props?.item?.amount}
                </div>
              </div>
            )}

          {/* Botón para ver detalles de pago si está pagado */}
          {props?.item?.status == "P" && props?.item?.payment_id && (
            <div className={styles.buttonContainer}>
              <Button
                className={styles.paymentButton}
                onClick={() => setOpenPayment(true)}
                disabled={loadingPayment}
              >
                {loadingPayment ? "Cargando..." : "Ver pago"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de detalles de pago */}
      {openPayment && (
        <PaymentRenderView
          open={openPayment}
          onClose={() => {
            setOpenPayment(false);
          }}
          payment_id={props.item.payment_id}
          style={{ width: "100%" }}
        />
      )}
    </DataModal>
  );
};

export default RenderView;
