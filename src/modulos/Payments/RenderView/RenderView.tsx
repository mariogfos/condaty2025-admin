// @ts-nocheck

import React, { memo, useState, useEffect } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import Button from '@/mk/components/forms/Button/Button';
import { formatToDayDDMMYYYYHHMM } from '@/mk/utils/date';
import styles from './RenderView.module.css';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { formatBs } from '@/mk/utils/numbers';

interface DetailPaymentProps {
  open: boolean;
  onClose: () => void;

  extraData?: any;
  reLoad?: () => void;
  payment_id: string | number;
  onDel?: () => void;
}

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const RenderView: React.FC<DetailPaymentProps> = memo(props => {
  const { open, onClose, extraData, reLoad, payment_id, onDel } = props;
  const [formState, setFormState] = useState<{ confirm_obs?: string }>({});
  const [onRechazar, setOnRechazar] = useState(false);
  const [errors, setErrors] = useState<{ confirm_obs?: string }>({});
  const [item, setItem] = useState(null);
  const { execute } = useAxios();
  const { showToast } = useAuth();

  const fetchPaymentData = async () => {
    if (payment_id && open) {
      const { data } = await execute(
        '/payments',
        'GET',
        {
          fullType: 'DET',
          searchBy: payment_id,
          page: 1,
          perPage: 1,
        },
        false,
        true
      );
      setItem(data?.data);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [payment_id]);

  const handleChangeInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value = e.target.value;
    if ((e.target as HTMLInputElement).type === 'checkbox') {
      value = (e.target as HTMLInputElement).checked ? 'P' : 'N';
    }
    setFormState({ ...formState, [e.target.name]: value });
  };

  const onConfirm = async (rechazado = true) => {
    setErrors({});
    if (!rechazado) {
      if (!formState.confirm_obs || formState.confirm_obs.trim() === '') {
        setErrors({
          confirm_obs: 'La observación es obligatoria para rechazar un pago',
        });
        return;
      }
    }
    const { data: payment, error } = await execute('/payment-confirm', 'POST', {
      id: item?.id,
      confirm: rechazado ? 'P' : 'R',
      confirm_obs: formState.confirm_obs,
    });

    if (payment?.success === true) {
      showToast(payment?.message, 'success');
      if (reLoad) reLoad();
      setFormState({ confirm_obs: '' });
      onClose();
      setOnRechazar(false);
    } else {
      showToast(error?.data?.message || error?.message, 'error');
    }
  };

  // Función para mapear el tipo de pago
  const getPaymentType = (type: string) => {
    const typeMap: Record<string, string> = {
      T: 'Transferencia bancaria',
      E: 'Efectivo',
      C: 'Cheque',
      Q: 'QR',
      O: 'Pago en oficina',
    };
    return typeMap[type] || type;
  };

  // Función para mapear el estado
  const getStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      P: 'Cobrado',
      S: 'Por confirmar',
      R: 'Rechazado',
      E: 'Por subir comprobante',
      A: 'Por pagar',
      M: 'Moroso',
      X: 'Anulado',
    };
    return statusMap[status] || status;
  };

  // Busca la categoría en extraData
  const getCategoryName = () => {
    if (item?.category) return item.category.name;
    if (!extraData || !extraData.categories)
      return `Categoría ID: ${item?.category_id}`;
    const category = extraData.categories.find(
      (c: any) => c.id === item?.category_id
    );
    return category ? category.name : `Categoría ID: ${item?.category_id}`;
  };

  // Busca la unidad en extraData
  const getDptoName = () => {
    if (!extraData || !extraData.dptos)
      return (item?.dptos || '-/-').replace(/,/g, '');

    const dpto = extraData.dptos.find(
      (d: any) => d.id === item?.dpto_id || d.id === item?.dptos
    );

    if (dpto) {
      const nroSinComa = dpto.nro ? dpto.nro.replace(/,/g, '') : '';
      const descSinComa = dpto.description
        ? dpto.description.replace(/,/g, '')
        : '';
      return `${nroSinComa} - ${descSinComa}`;
    } else {
      return (item?.dptos || '-/-').replace(/,/g, '');
    }
  };

  // Calcular monto total de los detalles
  const getTotalAmount = () => {
    if (!item?.details || !item.details.length) return item?.amount || 0;
    return item.details.reduce(
      (sum: number, detail: any) => sum + (parseFloat(detail.amount) || 0),
      0
    );
  };
  const handleAnularClick = () => {
    if (item && onDel) {
      // Verifica que item y onDel existan
      onDel(item);
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
      ></DataModal>
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
        {item && onDel && item.status === 'P' && (
          <div className={styles.headerActionContainer}>
            {/* REEMPLAZO DEL BOTÓN */}
            <button
              type="button" // Es buena práctica especificar el type para botones fuera de forms
              onClick={handleAnularClick}
              className={styles.textButtonDanger} // Nueva clase para el text button rojo
            >
              Anular ingreso
            </button>
          </div>
        )}
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <div className={styles.amountDisplay}>{formatBs(item.amount)}</div>
            <div className={styles.dateDisplay}>
              {formatToDayDDMMYYYYHHMM(item.paid_at)}
            </div>
          </div>

          {/* Divisor antes de la sección de info y botón */}
          <hr className={styles.sectionDivider} />

          <section className={styles.detailsSection}>
            <div className={styles.detailsColumn}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Unidad</span>
                <span className={styles.infoValue}>{getDptoName()}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Pagado por </span>
                <span className={styles.infoValue}>
                  {getFullName(item.propietario) ||
                    getFullName(item.owner) ||
                    '-/-'}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Categoría</span>
                <span className={styles.infoValue}>
                  {/* Asumiendo que item.concept es un array o string formateado.
                        La imagen muestra "-Expensas", "-Multas", "-Reservas".
                        Si es un array, podrías hacer item.concept.map(c => <div>-{c}</div>)
                        o si es un string formateado, usarlo directamente.
                        Asegúrate que tus datos 'item.concept' o 'item.description'
                        reflejen el formato de la imagen.
                    */}
                  {item.concept?.map((c: string, i: number) => (
                    <div key={i}>-{c}</div>
                  )) ||
                    item?.category?.padre?.name ||
                    '-/-'}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Observación</span>
                <span className={styles.infoValue}>{item.obs || '-/-'}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Registrado por</span>
                <span className={styles.infoValue}>
                  {getFullName(item.user) ||
                    getFullName(item.user) ||
                    '-/-'}
                </span>
              </div>
            </div>
            {/* Columna Derecha */}
            <div className={styles.detailsColumn}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Estado</span>
                <span
                  className={`${styles.infoValue} ${
                    item.status === 'P'
                      ? styles.statusPaid
                      : item.status === 'S'
                      ? styles.statusPending
                      : item.status === 'R'
                      ? styles.statusRejected
                      : item.status === 'X'
                      ? styles.statusCanceled
                      : ''
                  }`}
                >
                  {getStatus(item.status)}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Forma de pago</span>
                <span className={styles.infoValue}>
                  {getPaymentType(item.type)}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Titular</span>
                <span className={styles.infoValue}>
                  {getFullName(item.owner) || '-/-'}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Número de comprobante</span>
                <span className={styles.infoValue}>
                  {item.voucher || '-/-'}
                </span>
              </div>
            </div>
          </section>
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
                      '/PAYMENT-' +
                        item.id +
                        '.' +
                        item.ext +
                        '?d=' +
                        item.updated_at
                    ),
                    '_blank'
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
                      <div
                        className={styles.periodsTableRow}
                        key={periodo.id || index}
                      >
                        <div
                          className={styles.periodsTableCell}
                          data-label="Periodo"
                        >
                          {
                            MONTHS_ES[
                              (periodo?.debt_dpto?.debt?.month ?? 1) - 1
                            ]
                          }{' '}
                          {periodo?.debt_dpto?.debt?.year}
                        </div>
                        <div
                          className={styles.periodsTableCell}
                          data-label="Concepto"
                        >
                          {item?.category?.padre?.name || '-/-'}
                        </div>
                        <div
                          className={styles.periodsTableCell}
                          data-label="Monto"
                        >
                          {formatBs(periodo?.debt_dpto?.amount || 0)}
                        </div>
                        <div
                          className={styles.periodsTableCell}
                          data-label="Multa"
                        >
                          {formatBs(periodo?.debt_dpto?.penalty_amount || 0)}
                        </div>
                        <div
                          className={styles.periodsTableCell}
                          data-label="Subtotal"
                        >
                          {formatBs(periodo?.amount || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.periodsDetailsFooter}>
                <div className={styles.periodsDetailsTotal}>
                  Total pagado:{' '}
                  <span className={styles.totalAmountValue}>
                    {formatBs(getTotalAmount())}
                  </span>
                </div>
              </div>
            </div>
          )}

          {item?.status === 'S' && (
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
          error={errors}
          name="confirm_obs"
          onChange={handleChangeInput}
          value={formState?.confirm_obs || ''}
        />
      </DataModal>
    </>
  );
});

export default RenderView;
