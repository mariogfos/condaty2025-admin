import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { lStatusActive } from "@/mk/utils/utils";
import { getDateStrMes, MONTHS_S } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import { useState } from "react";
import { Card } from "@/mk/components/ui/Card/Card";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
  const [payDetails, setPayDetails] = useState(false);

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

  // const getStatusClass = (status: any) => {
  //   if (status == "A") return styles.statusPorCobrar;
  //   if (status == "M") return styles.statusEnMora;
  //   if (status == "S") return styles.statusRevisarPago;
  //   if (status == "P") return styles.statusCobrado;
  //   return styles.value;
  // };
  const colorStatus: any = {
    A: "var(--cInfo)",
    M: "var(--cError)",
    S: "var(--cWarning)",
    P: "var(--cSuccess)",
  };
  console.log(props?.item);
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
      {/* <div className={styles.container}> */}
      <Card>
        {/* Sección para mostrar el monto total y la fecha */}
        <div className={styles.totalAmountSection}>
          <div className={styles.totalAmount}>Bs {props?.item?.amount}</div>
          <div className={styles.paymentDate}>
            {getDateStrMes(props?.item?.paid_at) || "Sin fecha"}
          </div>
        </div>

        {/* Separador horizontal */}
        <div className={styles.divider}></div>

        {/* Contenedor para la información detallada */}
        <div className={styles.detailsContainer}>
          {/* <div className={styles.detailRow}>
            <div className={styles.label}>Unidad</div>
            <div className={styles.value}>{props?.item?.dpto?.nro}</div>
          </div> */}
          <LabelValue
            label="Unidad"
            value={props?.item?.dpto?.nro || "Sin unidad"}
          />

          {/* <div className={styles.detailRow}>
            <div className={styles.label}>Estado</div>
            <div className={getStatusClass(props?.item?.status)}>
              {getStatus(props?.item?.status)}
            </div>
          </div> */}

          <LabelValue
            label="Estado"
            value={getStatus(props?.item?.status)}
            colorValue={colorStatus[props?.item?.status]}
          />

          {/* <div className={styles.detailRow}>
            <div className={styles.label}>Periodo</div>
            <div className={styles.value}>
              {MONTHS_S[props?.item?.debt?.month] +
                "/" +
                props?.item?.debt?.year}
            </div>
          </div> */}
          <LabelValue
            label="Periodo"
            value={
              MONTHS_S[props?.item?.debt?.month] + "/" + props?.item?.debt?.year
            }
          />

          {/* <div className={styles.detailRow}>
            <div className={styles.label}>Fecha de pago</div>
            <div className={styles.value}>
              {getDateStrMes(props?.item?.paid_at) || "Sin fecha"}
            </div>
          </div> */}
          <LabelValue
            label="Fecha de pago"
            value={getDateStrMes(props?.item?.paid_at) || "Sin fecha"}
          />

          {/* <div className={styles.detailRow}>
            <div className={styles.label}>Fecha de plazo</div>
            <div className={styles.value}>
              {getDateStrMes(props?.item?.debt?.due_at)}
            </div>
          </div> */}
          <LabelValue
            label="Fecha de plazo"
            value={getDateStrMes(props?.item?.debt?.due_at)}
          />

          {/* <div className={styles.detailRow}>
            <div className={styles.label}>Descripción</div>
            <div className={styles.value}>{props?.item?.dpto?.description}</div>
          </div> */}
          <LabelValue
            label="Descripción"
            value={props?.item?.dpto?.description || "-/-"}
          />

          {/* <div className={styles.detailRow}>
            <div className={styles.label}>Titular</div>
            <div className={styles.value}>
              {getFullName(props?.item?.dpto?.owners[0])}
            </div>
          </div> */}
          <LabelValue
            label="Titular"
            value={getFullName(props?.item?.dpto?.titular?.owner) || "-/-"}
          />

          {/* {props?.item?.dpto?.owners &&
            props?.item?.dpto?.owners.length > 1 && (
              <div className={styles.detailRow}>
                <div className={styles.label}>Propietario</div>
                <div className={styles.value}>
                  {getFullName(props?.item?.dpto?.owners[1])}
                </div>
              </div>
            )} */}
          {props?.item?.dpto?.homeowner && (
            <LabelValue
              label="Propietario"
              value={getFullName(props?.item?.dpto?.homeowner) || "-/-"}
            />
          )}
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
        {/* {props?.item?.status == "P" && (
          <div className={styles.buttonContainer}>
            <Button
              className={styles.paymentButton}
              onClick={() => {
                setPayDetails(true);
                props?.onClose();
              }}
            >
              Ver detalles de pago
            </Button>
          </div>
        )} */}
      </Card>
      {/* </div> */}
    </DataModal>
  );
};

export default RenderView;
