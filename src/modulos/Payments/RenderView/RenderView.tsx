import React, { memo, useState, useEffect, useCallback, CSSProperties } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import Button from '@/mk/components/forms/Button/Button';
import { formatToDayDDMMYYYYHHMM, MONTHS_ES, formatToDayDDMMYYYY } from '@/mk/utils/date';
import styles from './RenderView.module.css';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { formatBs } from '@/mk/utils/numbers';

interface PaymentDetail {
  id: string | number;
  status: string;
  user?: any;
  confirmed_by?: any;
  canceled_by?: any;
  canceled_obs?: string;
  owner?: any;
  details?: any[];
  dptos?: string;
  dpto_id?: string | number;
  amount?: number;
  paid_at?: string;
  concept?: string[];
  category?: { padre?: { name?: string } };
  obs?: string; 
  type?: string;
  method?: string;
  voucher?: string;
  ext?: string;
  updated_at?: string;
}

interface DetailPaymentProps {
  open: boolean;
  onClose: () => void;
  extraData?: { dptos?: any[] };
  reLoad?: () => void;
  item?: PaymentDetail;
  payment_id?: string | number;
  onDel?: (item?: PaymentDetail) => void;
  style?: CSSProperties;
  noWaiting?: boolean;
}

const RenderView: React.FC<DetailPaymentProps> = memo(props => {
  const {
    open,
    onClose,
    extraData,
    reLoad,
    item: propItem,
    onDel,
    payment_id,
    style,
    noWaiting = false,
  } = props;
  const [formState, setFormState] = useState<{ confirm_obs?: string }>({});
  const [onRechazar, setOnRechazar] = useState(false);
  const [errors, setErrors] = useState<{ confirm_obs?: string }>({});
  const [item, setItem] = useState<PaymentDetail | null>(propItem || null);
  const { execute } = useAxios();
  const { showToast } = useAuth();

  useEffect(() => {
    if (open) {
      setItem(propItem || null);
    }
  }, [propItem, open]);

  useEffect(() => {
    // A detailed item should have a `details` property. A list item won't.
    const isDetailed = !!item?.details;

    const fetchPaymentData = async () => {
      const idToFetch = item?.id || payment_id;
      if (idToFetch && open) {
        const { data } = await execute(
          '/payments',
          'GET',
          {
            fullType: 'DET',
            searchBy: idToFetch,
            page: 1,
            perPage: 1,
          },
          false,
          true
        );
        if (data?.data) {
          setItem(data.data);
        }
      }
    };

    if (open && !isDetailed) {
      fetchPaymentData();
    }
  }, [open, item, payment_id, execute]);

  const handleGenerateReceipt = async () => {
    showToast('Generando recibo...', 'info');

    const { data: file, error } = await execute(
      '/payment-recibo',
      'POST',
      { id: item?.id },
      false,
      true
    );

    if (file?.success === true && file?.data?.path) {
      const receiptUrl = getUrlImages('/' + file.data.path);
      window.open(receiptUrl, '_blank');
      showToast('Recibo generado con éxito.', 'success');
    } else {
      showToast(error?.data?.message || 'No se pudo generar el recibo.', 'error');
    }
  };

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const { data: payment, error } = await execute(
      '/payment-confirm',
      'POST',
      {
        id: item?.id,
        confirm: rechazado ? 'P' : 'R',
        confirm_obs: formState.confirm_obs,
      },
      false,
      noWaiting
    );

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
      Q: 'Pago QR',
      O: 'Pago en oficina',
    };
    return typeMap[type] || type;
  };

  const getStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      P: 'Cobrado',
      S: 'Por confirmar',
      R: 'Rechazado',
      A: 'Por pagar',
      M: 'Moroso',
      X: 'Anulado',
    };
    return statusMap[status] || status;
  };

  const getDptoName = () => {
    if (!extraData?.dptos) return (item?.dptos || '-/-').replace(/,/g, '');

    const dpto = extraData.dptos.find((d: any) => d.id === item?.dpto_id || d.id === item?.dptos);

    if (dpto) {
      const nroSinComa = dpto.nro ? dpto.nro.replace(/,/g, '') : '';
      const descSinComa = dpto.description ? dpto.description.replace(/,/g, '') : '';
      return `${nroSinComa} - ${descSinComa}`;
    } else {
      return (item?.dptos || '-/-').replace(/,/g, '');
    }
  };
  const getTotalAmount = () => {
    if (!item?.details?.length) return item?.amount || 0;
    return item.details.reduce(
      (sum: number, detail: any) => {
        const amount = parseFloat(detail.amount) || 0;
        const maintenanceAmount = parseFloat(detail?.debt_dpto?.maintenance_amount) || 0;
        return sum + amount + maintenanceAmount;
      },
      0
    );
  };

  const getUniqueConcepts = () => {
    if (!item) return <div>-/-</div>;

    if (item.details?.length) {
      const uniqueCategories = Array.from(
        new Set(
          item.details
            .map(detail => detail?.subcategory?.padre?.name)
            .filter(Boolean)
        )
      );

      return uniqueCategories.length > 0
        ? uniqueCategories.map((name, i) => (
            <div key={`category-${i}`}>- {name}</div>
          ))
        : <div>-/-</div>;
    }

    return <div>-/-</div>;
  };

  const handleAnularClick = () => {
    if (item && onDel) {
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
      >
        {/* Necesario por lo childres solicitados por le datamodal, manejo del null exeption en item */}
        <></>
      </DataModal>
    );
  }

  let aprobadoLabel;
  if (item.status === 'P') {
    aprobadoLabel = 'Aprobado por';
  } else if (item.status === 'R') {
    aprobadoLabel = 'Rechazado por';
  } else if (item.status === 'S') {
    aprobadoLabel = 'Por confirmar por';
  } else {
    aprobadoLabel = 'Aprobado por';
  }

  let statusClass = '';
  if (item.status === 'P') {
    statusClass = styles.statusPaid;
  } else if (item.status === 'S') {
    statusClass = styles.statusPending;
  } else if (item.status === 'R') {
    statusClass = styles.statusRejected;
  } else if (item.status === 'X') {
    statusClass = styles.statusCanceled;
  }

  let ownerDisplay = '-/-';
  if (item.owner && typeof item.owner === 'object') {
    ownerDisplay = getFullName(item.owner);
  }

  let propietarioDisplay = '-/-';
  if (typeof item.details?.[0]?.debt_dpto?.dpto?.homeowner === 'object') {
    propietarioDisplay = getFullName(item.details[0].debt_dpto.dpto.homeowner);
  }

  let registradoPorDisplay = '-/-';
  if (item.user && typeof item.user === 'object') {
    registradoPorDisplay = getFullName(item.user);
  }

  let aprobadoPorDisplay = '-/-';
  if (item.confirmed_by && typeof item.confirmed_by === 'object') {
    aprobadoPorDisplay = getFullName(item.confirmed_by);
  }

  let anuladoPorDisplay = '-/-';
  if (item.canceled_by && typeof item.canceled_by === 'object') {
    anuladoPorDisplay = getFullName(item.canceled_by);
  }

  let infoBlockContent;
  if (item.user) {
    infoBlockContent = (
      <div className={styles.infoBlock}>
        <span className={styles.infoLabel}>Registrado por</span>
        <span className={styles.infoValue}>{registradoPorDisplay}</span>
      </div>
    );
  } else {
    infoBlockContent = (
      <>
        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>{aprobadoLabel}</span>
          <span className={styles.infoValue}>-/-</span>
        </div>
        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>Registrado por</span>
          <span className={styles.infoValue}>-/-</span>
        </div>
      </>
    );
  }

  return (
    <>
      <DataModal
        open={open}
        title="Detalle del ingreso"
        buttonText={item?.status !== 'S' ? '' : 'Aprobar Pago'}
        buttonCancel={''}
        onSave={() => {
          if (item?.status === 'S') {
            onConfirm(true);
          }
        }}
        onClose={onClose}
        buttonExtra={
          item.status === 'S' ? (
            <Button
              variant="secondary"
              onClick={() => {
                setOnRechazar(true);
              }}
            >
              Rechazar pago
            </Button>
          ) : undefined
        }
        style={style}
      >
        {item && onDel && item.status === 'P' && item.user && (
          <div className={styles.headerActionContainer}>
            <button type="button" onClick={handleAnularClick} className={styles.textButtonDanger}>
              Anular ingreso
            </button>
          </div>
        )}
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <div className={styles.amountDisplay}>{formatBs(item.amount ?? 0)}</div>
            <div className={styles.dateDisplay}>{formatToDayDDMMYYYYHHMM(item.paid_at)}</div>
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
                <span className={styles.infoLabel}>Propietario </span>
                <span className={styles.infoValue}>{propietarioDisplay}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Titular</span>
                <span className={styles.infoValue}>{ownerDisplay}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Concepto</span>
                <span className={styles.infoValue}>
                  {getUniqueConcepts()}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Observación</span>
                <span className={styles.infoValue}>{item.obs || '-/-'}</span>
              </div>

              {item.status === 'X' && item.canceled_obs && (
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Motivo de anulación</span>
                  <span className={`${styles.infoValue} ${styles.canceledReason}`}>
                    {item.canceled_obs}
                  </span>
                </div>
              )}
            </div>
            {/* Columna Derecha */}
            <div className={styles.detailsColumn}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={`${styles.infoValue} ${statusClass}`}>
                  {getStatus(item.status)}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Forma de pago</span>
                <span className={styles.infoValue}>{getPaymentType(item.method || '')}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Pagado por</span>
                <span className={styles.infoValue}>{getFullName(item.owner) || '-/-'}</span>
              </div>

              {item.status === 'X' ? (
                <>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Anulado por</span>
                    <span className={styles.infoValue}>{anuladoPorDisplay}</span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Registrado por</span>
                    <span className={styles.infoValue}>{registradoPorDisplay}</span>
                  </div>
                </>
              ) : item.confirmed_by ? (
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>{aprobadoLabel}</span>
                  <span className={styles.infoValue}>{aprobadoPorDisplay}</span>
                </div>
              ) : (
                infoBlockContent
              )}

              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Número de comprobante</span>
                <span className={styles.infoValue}>{item.voucher || '-/-'}</span>
              </div>
            </div>
          </section>
          {/* Divisor después de la sección de info y botón */}
          <hr className={styles.sectionDivider} />
          <div className={styles.voucherButtonContainer}>
            {item.status === 'P' && (
              <Button
                variant="secondary"
                className={styles.voucherButton}
                style={item.ext ? { marginRight: 8 } : {}}
                onClick={handleGenerateReceipt}
              >
                Ver Recibo
              </Button>
            )}
            {item.ext && (
              <Button
                variant="secondary"
                className={styles.voucherButton}
                onClick={() => {
                  window.open(
                    getUrlImages('/PAYMENT-' + item.id + '.' + item.ext + '?d=' + item.updated_at),
                    '_blank'
                  );
                }}
              >
                Ver comprobante
              </Button>
            )}
          </div>

          {Array.isArray(item.details) && item.details.length > 0 && (
            <div className={styles.periodsDetailsSection}>
              <div className={styles.periodsDetailsHeader}>
                <h3 className={styles.periodsDetailsTitle}>
                  Detalles del pago
                </h3>
              </div>

              <div className={styles.periodsTableWrapper}>
                <div className={styles.periodsTable}>
                  <div className={styles.periodsTableHeader}>
                    <div className={styles.periodsTableCell}>Tipo</div>
                    <div className={styles.periodsTableCell}>Concepto</div>
                    <div className={styles.periodsTableCell}>Monto</div>
                    <div className={styles.periodsTableCell}>Multa</div>
                    <div className={styles.periodsTableCell}>MV</div>
                    <div className={styles.periodsTableCell}>Subtotal</div>
                  </div>
                  <div className={styles.periodsTableBody}>
                    {item.details?.map((periodo: any, index: number) => {
                      const debtType = periodo?.debt_dpto?.type;

                      return (
                        <div
                          className={styles.periodsTableRow}
                          key={periodo?.id ?? index}
                        >
                          <div className={styles.periodsTableCell} data-label="Tipo">
                            {getDebtType(debtType)}
                          </div>
                          <div className={styles.periodsTableCell} data-label="Concepto">
                            {getConceptByType(periodo)}
                          </div>
                          <div className={styles.periodsTableCell} data-label="Monto">
                            {formatBs(periodo?.debt_dpto?.amount || 0)}
                          </div>
                          <div className={styles.periodsTableCell} data-label="Multa">
                            {formatBs(periodo?.debt_dpto?.penalty_amount || 0)}
                          </div>
                          <div className={styles.periodsTableCell} data-label="MV">
                            {formatBs(periodo?.debt_dpto?.maintenance_amount || 0)}
                          </div>
                          <div className={styles.periodsTableCell} data-label="Subtotal">
                            {formatBs(getSubtotal(periodo))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className={styles.periodsDetailsFooter}>
                <div className={styles.periodsDetailsTotal}>
                  Total pagado:{' '}
                  <span className={styles.totalAmountValue}>{formatBs(getTotalAmount())}</span>
                </div>
              </div>
            </div>
          )}

          {/*           {item?.status === 'S' && (
            <div className={styles.actionButtonsContainer}>
              <Button
                variant="cancel"
                className={`${styles.actionButton} ${styles.rejectButton}`}
                onClick={() => {
                  setOnRechazar(true);
                }}
              >
                Rechazar pago
              </Button>
              <Button
                variant="accent"
                className={`${styles.actionButton} ${styles.confirmButton}`}
                onClick={() => onConfirm(true)}
              >
                Confirmar pago
              </Button>
            </div>
          )} */}
        </div>
      </DataModal>

      <DataModal
        title="Rechazar pago"
        buttonText="Rechazar"
        buttonCancel="Cancelar"
        onSave={() => onConfirm(false)}
        open={onRechazar}
        onClose={() => setOnRechazar(false)}
        style={style}
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

RenderView.displayName = 'RenderViewPayment';

export default RenderView;

  // Función para obtener el tipo de deuda
  const getDebtType = (type: number) => {
    switch (type) {
      case 0:
        return 'Individual';
      case 1:
        return 'Expensas';
      case 2:
        return 'Reservas';
      case 3:
        return 'Multa por Cancelación';
      case 4:
        return 'Compartida';
      case 5:
        return 'Condonación';
      default:
        return 'Desconocido';
    }
  };

  // Función para obtener el concepto basado en el tipo
  const getConceptByType = (periodo: any) => {
    const type = periodo?.debt_dpto?.type;

    switch (type) {
      case 0: // Individual
      case 4: // Compartida
        return periodo?.subcategory?.name || '-/-';
      case 2: // Reservas
        return `Reserva: ${periodo?.debt_dpto?.debt?.reservation?.area?.title || '-/-'}`;
      case 3: // Multa por Cancelación
        return `Multa por Cancelación: ${periodo?.debt_dpto?.debt?.reservation_penalty?.area?.title || '-/-'}`;
      default:
        return periodo?.subcategory?.name || '-/-';
    }
  };

  // Función para calcular el subtotal incluyendo mantenimiento de valor
  const getSubtotal = (periodo: any) => {
    const amount = parseFloat(periodo?.amount) || 0;
    const maintenanceAmount = parseFloat(periodo?.debt_dpto?.maintenance_amount) || 0;
    return amount + maintenanceAmount;
  };
