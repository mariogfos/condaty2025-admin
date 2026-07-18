"use client";
import { useState } from "react";
import { getDateStrMes } from "@/mk/utils/date";
import EmptyData from "@/components/NoData/EmptyData";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import styles from "./HistoryPayments.module.css";
import { IconPagos } from "@/components/layout/icons/IconsBiblioteca";
import { DebtStatus } from "@/types/PaymentType";
import { PaymentMethod } from "@/modulos/Payments/Type/PaymentType";


interface HistoryPaymentsProps {
  paymentsData: any[];
  open: boolean;
  close: () => void;
}

const getStatus = (status: number) => {
  const statusMap: Record<number, string> = {
    [DebtStatus.PENDING]: "Por Pagar",
    [DebtStatus.PAID]: "Pagado",
    [DebtStatus.SUBMITTED]: "Por confirmar",
    [DebtStatus.OVERDUE]: "Moroso",
    [DebtStatus.REJECTED]: "Rechazado",
  };
  return statusMap[status] || `Status ${status}`;
};

const HistoryPayments = ({
  paymentsData,
  open,
  close,
}: HistoryPaymentsProps) => {
  const [typeSearch, setTypeSearch] = useState<number>(DebtStatus.PAID);
  const [openPagar, setOpenPagar] = useState(false);
  const [openComprobante, setOpenComprobante] = useState(false);
  const [idPago, setIdPago] = useState<string | null>(null);

  // Filtra los datos según el tab seleccionado
  const filteredData = paymentsData.filter(
    (pago) =>
      (typeSearch === DebtStatus.PAID && pago?.status === DebtStatus.PAID) ||
      (typeSearch === DebtStatus.REJECTED && pago?.status !== DebtStatus.PAID)
      );

  return (
    <DataModal
      title="Estado de cuenta"
      open={open}
      onClose={close}
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.wrapper}>
        <TabsButtons
          tabs={[
            { value: DebtStatus.PAID, text: "Confirmados" },
            { value: DebtStatus.REJECTED, text: "Pendientes" },
          ]}
          sel={typeSearch}
          setSel={setTypeSearch}
        />

        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <div className={styles.gridHeader}>
              <div>Fecha</div>
              <div>Categoría</div>
              <div>Monto</div>
              <div>Medio de pago</div>
              <div>Estado</div>
            </div>

            <div className={styles.gridBody}>
              {filteredData.map((pago, index) => (
                <div
                  key={index}
                  className={styles.gridRow}
                  onClick={() => {
                    if (pago.status === DebtStatus.PENDING) {
                      setOpenPagar(true);
                    } else {
                      setOpenComprobante(true);
                      setIdPago(pago?.payment_id);
                    }
                  }}
                >
                  <div className={styles.cell}>
                    {getDateStrMes(pago?.paid_at) || "-"}
                  </div>
                  <div className={styles.cell}>{"Expensa"}</div>
                  {pago?.amount && pago?.penalty_amount ? (
                    <div className={styles.cell}>
                      Bs{" "}
                      {parseFloat(pago?.amount) +
                        parseFloat(pago?.penalty_amount)}
                    </div>
                  ) : (
                    <EmptyData className={styles.emptyCell} message="-" />
                  )}
                  <div className={styles.cell}>
                    {pago?.payment?.type === PaymentMethod.QR
                      ? "QR"
                      : pago?.payment?.type === PaymentMethod.TRANSFER
                      ? "Transferencia"
                      : pago?.payment?.type === PaymentMethod.OFFICE
                      ? "Pago en oficina"
                      : "Sin pago"}
                  </div>
                  <div className={styles.cell}>
                    <span
                      className={`${styles.status} ${
                        styles[`status${pago?.status}`]
                      }`}
                    >
                      {getStatus(pago?.status)}
                    </span>
                  </div>
                </div>
              ))}

              {filteredData.length === 0 && (
                <div className={styles.emptyState}>
                  <EmptyData message="No hay registros de pagos" icon={<IconPagos size={40} color="var(--cWhiteV1)" />} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DataModal>
  );
};

export default HistoryPayments;
