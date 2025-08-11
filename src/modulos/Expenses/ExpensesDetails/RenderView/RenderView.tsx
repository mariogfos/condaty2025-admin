import DataModal from '@/mk/components/ui/DataModal/DataModal';
import styles from './RenderView.module.css';
import { getFullName } from '@/mk/utils/string';
import { getDateStrMes, MONTHS_S } from '@/mk/utils/date';
import { useState } from 'react';

import PaymentRenderView from '../../../Payments/RenderView/RenderView';
import { formatBs } from '@/mk/utils/numbers';

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  execute: Function;
}) => {
  const [openPayment, setOpenPayment] = useState(false);
  const [item, setItem] = useState(props.item);

  const reloadItem = async () => {
    const { data } = await props.execute(
      '/debt-dptos',
      'GET',
      {
        fullType: 'DET',
        searchBy: item.id,
        page: 1,
        perPage: 1,
      },
      false,
      true
    );
    if (data.success) {
      setItem({ ...data.data });
    }
  };
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
    E: 'var(--cInfo)',
  };

  type InfoBlockProps = {
    value: string;
    label: string;
    colorValue?: string;
    className?: string;
  };

  const InfoBlock = ({ value, label, colorValue, className }: InfoBlockProps) => {
    return (
      <div className={`${styles.infoBlock} ${className}`}>
        <span className={styles.infoLabel}>{label}</span>
        <span
          className={styles.infoValue}
          style={{
            color: colorValue || 'var(--cWhite)',
          }}
        >
          {value}
        </span>
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
          (item?.status == 'P' || item?.status == 'S') && item?.payment_id ? 'Ver pago' : ''
        }
        onSave={
          (item?.status == 'P' || item?.status == 'S') && item?.payment_id
            ? () => setOpenPayment(true)
            : undefined
        }
        buttonCancel=""
      >
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <div className={styles.totalAmount}>{formatBs(item?.amount)}</div>
            <div className={styles.paymentDate}>{getDateStrMes(item?.paid_at) || '-/-'}</div>
          </div>

          <hr className={styles.sectionDivider} />

          <section className={styles.detailsSection}>
            <div className={styles.detailsColumn}>
              <InfoBlock label="Unidad" value={item?.dpto?.nro || 'Sin unidad'} />

              <InfoBlock
                label="Periodo"
                value={MONTHS_S[item?.debt?.month] + '/' + item?.debt?.year}
              />

              <InfoBlock label="Fecha de plazo" value={getDateStrMes(item?.debt?.due_at)} />

              <InfoBlock label="Titular" value={getFullName(item?.dpto?.titular?.owner) || '-/-'} />
            </div>

            <div className={styles.detailsColumn}>
              <InfoBlock
                label="Estado"
                value={getStatus(item).text}
                colorValue={colorStatus[getStatus(item).code]}
              />

              <InfoBlock label="Fecha de pago" value={getDateStrMes(item?.paid_at) || '-/-'} />

              <InfoBlock label="Descripción" value={item?.dpto?.description || '-/-'} />

              <InfoBlock label="Propietario" value={getFullName(item?.dpto?.homeowner) || '-/-'} />
            </div>
          </section>

          {/* Sección de periodos por pagar si existen */}
          {item?.pendingPeriods && item?.pendingPeriods.length > 0 && (
            <>
              <hr className={styles.sectionDivider} />

              <div className={styles.periodsSection}>
                <div className={styles.periodsTitle}>Periodos por pagar</div>

                <div className={styles.tableContainer}>
                  <div className={styles.tableHeader}>
                    <div className={styles.headerCell}>Periodo</div>
                    <div className={styles.headerCell}>Monto</div>
                    <div className={styles.headerCell}>Multa</div>
                    <div className={styles.headerCell}>Subtotal</div>
                  </div>

                  <div className={styles.tableBody}>
                    {item?.pendingPeriods.map((periodo: any, index: number) => (
                      <div key={`${periodo.month}-${periodo.year}`} className={styles.tableRow}>
                        <div className={styles.tableCell} data-label="Periodo">
                          {MONTHS_S[periodo.month]}/{periodo.year}
                        </div>
                        <div className={styles.tableCell} data-label="Monto">
                          {formatBs(periodo.amount)}
                        </div>
                        <div className={styles.tableCell} data-label="Multa">
                          {formatBs(periodo.penalty || 0)}
                        </div>
                        <div className={styles.tableCell} data-label="Subtotal">
                          {formatBs(parseFloat(periodo.amount) + parseFloat(periodo.penalty || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.totalPaid}>
                  Total pagado:{' '}
                  <span className={styles.totalAmountValue}>{formatBs(item?.amount)}</span>
                </div>
              </div>
            </>
          )}

       
        </div>
      </DataModal>
      {/* Modal de detalles de pago */}
      {openPayment && (
        <PaymentRenderView
          open={openPayment}
          onClose={() => {
            reloadItem();
            setOpenPayment(false);
          }}
          payment_id={item.payment_id}
          noWaiting={true}
        />
      )}
    </>
  );
};

export default RenderView;
