import DataModal from '@/mk/components/ui/DataModal/DataModal';
import styles from './RenderView.module.css';
import { getFullName } from '@/mk/utils/string';
import { getDateStrMes, MONTHS_S } from '@/mk/utils/date';
import { useState } from 'react';
import { Card } from '@/mk/components/ui/Card/Card';
import PaymentRenderView from '../../../Payments/RenderView/RenderView';

import { formatBs } from '@/mk/utils/numbers';

const RenderView = (props: { open: boolean; onClose: any; item: Record<string, any> }) => {
  const [payDetails, setPayDetails] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { execute } = useAxios();
  const { showToast } = useAuth();

  const getStatus = (item: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (item.status === 'A' && item.debt?.due_at) {
      const dueDate = new Date(item.debt.due_at);
      if (today > dueDate) {
        return { text: 'En mora', code: 'M' };
      }
    }

    switch (item.status) {
      case 'A':
        return { text: 'Por cobrar', code: 'A' };
      case 'E':
        return { text: 'Subir comprobante', code: 'E' };
      case 'P':
        return { text: 'Cobrado', code: 'P' };
      case 'S':
        return { text: 'Por confirmar', code: 'S' };
      case 'M':
        return { text: 'En mora', code: 'M' };
      default:
        return { text: item.status || 'Desconocido', code: item.status || '' };
    }
  };

  const colorStatus: any = {
    A: 'var(--cInfo)',
    M: 'var(--cError)',
    S: 'var(--cWarning)',
    P: 'var(--cSuccess)',
  };
  console.log('ExpensesDetails props?.item:', props?.item);
  console.log('PayDetails:', payDetails);
  type LabelValueProps = {
    value: string;
    label: string;
    colorValue?: string;
    className?: string;
  };

  const LabelValue = ({ value, label, colorValue, className }: LabelValueProps) => {
    return (
      <div className={`${styles.LabelValue} ${className}`}>
        <p>{label}</p>
        <p
          style={{
            color: colorValue ? colorValue : 'var(--cWhite)',
          }}
        >
          {value}
        </p>
      </div>
    );
  };

  return (
    <>
      <DataModal
        open={props.open}
        onClose={props?.onClose}
        title="Detalle de expensa"
        buttonText={
          (props?.item?.status == 'P' || props?.item?.status == 'S') && props?.item?.payment_id
            ? 'Ver pago'
            : ''
        }
        onSave={
          (props?.item?.status == 'P' || props?.item?.status == 'S') && props?.item?.payment_id
            ? () => setOpenPayment(true)
            : undefined
        }
        buttonCancel=""
      >
        <Card>
          <div className={styles.totalAmountSection}>
            <div className={styles.totalAmount}>
              {formatBs(props?.item?.amount)}
            </div>
            <div className={styles.paymentDate}>{getDateStrMes(props?.item?.paid_at) || '-/-'}</div>
            <div className={styles.divider}></div>
            <div className={styles.detailsContainer}>
              <LabelValue label="Unidad" value={props?.item?.dpto?.nro || 'Sin unidad'} />

            <LabelValue
              label="Estado"
              value={getStatus(props?.item).text}
              colorValue={colorStatus[getStatus(props?.item).code]}
            />

              <LabelValue
                label="Periodo"
                value={MONTHS_S[props?.item?.debt?.month] + '/' + props?.item?.debt?.year}
              />
              <LabelValue
                label="Fecha de pago"
                value={getDateStrMes(props?.item?.paid_at) || '-/-'}
              />

              <LabelValue label="Fecha de plazo" value={getDateStrMes(props?.item?.debt?.due_at)} />

              <LabelValue label="Descripción" value={props?.item?.dpto?.description || '-/-'} />

              <LabelValue
                label="Titular"
                value={getFullName(props?.item?.dpto?.titular?.owner) || '-/-'}
              />

              <LabelValue
                label="Propietario"
                value={getFullName(props?.item?.dpto?.homeowner) || '-/-'}
              />
            </div>

            {/* Sección de periodos por pagar si existen */}
            {props?.item?.pendingPeriods && props?.item?.pendingPeriods.length > 0 && (
              <div className={styles.periodsSection}>
                <div className={styles.periodsTitle}>Periodos por pagar</div>

                <div className={styles.tableContainer}>
                  <div className={styles.tableHeader}>
                    <div className={`${styles.headerCell} ${styles.headerCellLeft}`}>Periodo</div>
                    <div className={styles.headerCell}>Monto</div>
                    <div className={styles.headerCell}>Multa</div>
                    <div className={`${styles.headerCell} ${styles.headerCellRight}`}>Subtotal</div>
                  </div>

                  <div className={styles.tableBody}>
                    {props?.item?.pendingPeriods.map((periodo: any, index: number) => {
                      const isLastRow = index === props?.item?.pendingPeriods.length - 1;

                      return (
                        <div
                          key={index}
                          className={`${styles.tableRow} ${isLastRow ? styles.tableLastRow : ''}`}
                        >
                          <div
                            className={`${styles.tableCell} ${
                              isLastRow ? styles.tableCellLeft : ''
                            }`}
                          >
                            {MONTHS_S[periodo.month]}/{periodo.year}
                          </div>
                          <div className={styles.tableCell}>
                            {formatBs(periodo.amount)}
                          </div>
                          <div className={styles.tableCell}>
                             {formatBs(periodo.penalty || 0)}
                          </div>
                          <div
                            className={`${styles.tableCell} ${
                              isLastRow ? styles.tableCellRight : ''
                            }`}
                          >

                            {formatBs(parseFloat(periodo.amount) + parseFloat(periodo.penalty || 0))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.totalPaid}>
                  Total pagado: {formatBs(props?.item?.amount)}
                </div>
              </div>
            )}
          </div>
        </Card>
      </DataModal>
      {/* Modal de detalles de pago */}
      {openPayment && (
        <PaymentRenderView
          open={openPayment}
          onClose={() => {
            setOpenPayment(false);
          }}
          payment_id={props.item.payment_id}
        />
      )}
    </>
  );
};

export default RenderView;
