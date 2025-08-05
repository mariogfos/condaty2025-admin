import DataModal from '@/mk/components/ui/DataModal/DataModal';
import styles from './RenderView.module.css';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { lStatusActive } from '@/mk/utils/utils';
import { getDateStrMes, MONTHS_S } from '@/mk/utils/date';
import Button from '@/mk/components/forms/Button/Button';
import { useState } from 'react';
import { Card } from '@/mk/components/ui/Card/Card';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';
import PaymentRenderView from '../../../Payments/RenderView/RenderView';

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
  const [payDetails, setPayDetails] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { execute } = useAxios();
  const { showToast } = useAuth();

  const getStatus = (status: any) => {
    let _status: string = '';
    if (status == 'A') _status = 'Por cobrar';
    if (status == 'E') _status = 'En espera';
    if (status == 'P') _status = 'Cobrado';
    if (status == 'S') _status = 'Por confirmar';
    if (status == 'M') _status = 'En Mora';
    if (status == 'R') _status = 'Rechazado';
    return _status;
  };

  const handleViewPaymentDetails = async () => {
    if (!props?.item?.payment_id) {
      showToast('No se encontró el ID del pago', 'error');
      return;
    }

    try {
      showToast('Cargando detalles del pago...', 'info');

      const { data, error } = await execute('/payments', 'GET', {
        page: 1,
        perPage: 1,
        fullType: 'DET',
        searchBy: props.item.payment_id,
      });

      if (data?.success && data?.data) {
        const paymentData = {
          id: data.data.payment?.id || props.item.payment_id,
          amount: props.item.amount,
          paid_at: props.item.paid_at,
          status: props.item.status,
          type: data.data.payment?.type || 'Q',
          dptos: data.data.dpto?.nro || props.item.dpto?.nro,
          owner: data.data.dpto?.titular?.owner || data.data.dpto?.homeowner,
          details: [
            {
              id: data.data.id,
              amount: data.data.amount,
              debt_dpto: {
                amount: data.data.amount,
                penalty_amount: data.data.penalty_amount || '0.00',
                debt: data.data.debt,
                dpto: data.data.dpto,
              },
            },
          ],
          concept: [data.data.debt?.description || 'Expensa mensual'],
          obs: data.data.obs,
          voucher: null,
          ext: null,
          updated_at: data.data.updated_at,
        };

        console.log('Setting payment data:', paymentData);
        setPaymentData(paymentData);
        setPayDetails(true);
        console.log('Payment modal should open now');
        // No cerrar el modal principal inmediatamente, dejar que el usuario vea el modal de pago
      } else {
        showToast(error?.data?.message || 'No se pudieron cargar los detalles del pago', 'error');
      }
    } catch (err) {
      showToast('Error al cargar los detalles del pago', 'error');
    }
  };

  // const getStatusClass = (status: any) => {
  //   if (status == "A") return styles.statusPorCobrar;
  //   if (status == "M") return styles.statusEnMora;
  //   if (status == "S") return styles.statusRevisarPago;
  //   if (status == "P") return styles.statusCobrado;
  //   return styles.value;
  // };
  const colorStatus: any = {
    A: 'var(--cInfo)',
    M: 'var(--cError)',
    S: 'var(--cWarning)',
    P: 'var(--cSuccess)',
  };
  console.log('ExpensesDetails props?.item:', props?.item);
  console.log('PaymentData:', paymentData, 'PayDetails:', payDetails);
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
<<<<<<< HEAD
    <>
      <DataModal
        open={props.open && !payDetails}
        onClose={props?.onClose}
        title="Detalle de expensa"
        buttonText=""
        buttonCancel=""
        style={{ width: '883px' }}
      >
        {/* <div className={styles.container}> */}
        <Card>
          {/* Sección para mostrar el monto total y la fecha */}
          <div className={styles.totalAmountSection}>
            <div className={styles.totalAmount}>Bs {props?.item?.amount}</div>
            <div className={styles.paymentDate}>
              {getDateStrMes(props?.item?.paid_at) || 'Sin fecha'}
            </div>
=======
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
            {getDateStrMes(props?.item?.paid_at) || "-/-"}
>>>>>>> 50d45346801f12c57dc1d1612e46b78e803cdc64
          </div>

          {/* Separador horizontal */}
          <div className={styles.divider}></div>

          {/* Contenedor para la información detallada */}
          <div className={styles.detailsContainer}>
            {/* <div className={styles.detailRow}>
            <div className={styles.label}>Unidad</div>
            <div className={styles.value}>{props?.item?.dpto?.nro}</div>
          </div> */}
            <LabelValue label="Unidad" value={props?.item?.dpto?.nro || 'Sin unidad'} />

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
              value={MONTHS_S[props?.item?.debt?.month] + '/' + props?.item?.debt?.year}
            />

            {/* <div className={styles.detailRow}>
            <div className={styles.label}>Fecha de pago</div>
            <div className={styles.value}>
              {getDateStrMes(props?.item?.paid_at) || "Sin fecha"}
            </div>
          </div> */}
<<<<<<< HEAD
            <LabelValue
              label="Fecha de pago"
              value={getDateStrMes(props?.item?.paid_at) || 'Sin fecha'}
            />
=======
          <LabelValue
            label="Fecha de pago"
            value={getDateStrMes(props?.item?.paid_at) || "-/-"}
          />
>>>>>>> 50d45346801f12c57dc1d1612e46b78e803cdc64

            {/* <div className={styles.detailRow}>
            <div className={styles.label}>Fecha de plazo</div>
            <div className={styles.value}>
              {getDateStrMes(props?.item?.debt?.due_at)}
            </div>
          </div> */}
            <LabelValue label="Fecha de plazo" value={getDateStrMes(props?.item?.debt?.due_at)} />

            {/* <div className={styles.detailRow}>
            <div className={styles.label}>Descripción</div>
            <div className={styles.value}>{props?.item?.dpto?.description}</div>
          </div> */}
            <LabelValue label="Descripción" value={props?.item?.dpto?.description || '-/-'} />

            {/* <div className={styles.detailRow}>
            <div className={styles.label}>Titular</div>
            <div className={styles.value}>
              {getFullName(props?.item?.dpto?.owners[0])}
            </div>
          </div> */}
            <LabelValue
              label="Titular"
              value={getFullName(props?.item?.dpto?.titular?.owner) || '-/-'}
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
                          className={`${styles.tableCell} ${isLastRow ? styles.tableCellLeft : ''}`}
                        >
                          {MONTHS_S[periodo.month]}/{periodo.year}
                        </div>
                        <div className={styles.tableCell}>Bs {periodo.amount}</div>
                        <div className={styles.tableCell}>Bs {periodo.penalty || 0}</div>
                        <div
                          className={`${styles.tableCell} ${
                            isLastRow ? styles.tableCellRight : ''
                          }`}
                        >
                          Bs {parseFloat(periodo.amount) + parseFloat(periodo.penalty || 0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.totalPaid}>Total pagado: Bs {props?.item?.amount}</div>
            </div>
          )}

          {/* Botón para ver detalles de pago si está pagado */}
          {props?.item?.status == 'P' && props?.item?.payment_id && (
            <div className={styles.buttonContainer}>
              <Button className={styles.paymentButton} onClick={handleViewPaymentDetails}>
                Ver detalles de pago
              </Button>
            </div>
          )}
        </Card>
        {/* </div> */}
      </DataModal>

      {/* Modal de detalles de pago */}
      {paymentData && payDetails && (
        <PaymentRenderView
          open={payDetails}
          onClose={() => {
            console.log('Closing payment modal');
            setPayDetails(false);
            setPaymentData(null);
            // El modal principal se volverá a mostrar automáticamente porque payDetails será false
          }}
          item={paymentData}
        />
      )}
    </>
  );
};

export default RenderView;
