'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './RenderView.module.css';
import paymentStyles from '@/modulos/Payments/RenderView/RenderView.module.css';
import { formatBs } from '@/mk/utils/numbers';
import Button from '@/mk/components/forms/Button/Button';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import useAxios from '@/mk/hooks/useAxios';
import Loading from '@/mk/components/ui/LoadingScreen/Loading/Loading';
import { useAuth } from '@/mk/contexts/AuthProvider';
import ExpenseDetailModal from '@/modulos/Expenses/ExpensesDetails/RenderView/RenderView';
import ReservationDetailModal from '@/modulos/Reservas/RenderView/RenderView';
import PaymentRenderView from '@/modulos/Payments/RenderView/RenderView';
import PaymentRenderForm from '@/modulos/Payments/RenderForm/RenderForm';
import { MONTHS_ES, formatToDayDDMMYYYY, formatToDayFdMYH } from '@/mk/utils/date';
import { getFullName } from '@/mk/utils/string';
import { getTitular } from '@/mk/utils/adapters';
import { hasMaintenanceValue } from '@/mk/utils/utils';
import { getStatusText, getStatusConfig, getDetailButtonText as getDetailButtonTextFromConstants, getAvailableActions as getAvailableActionsFromConstants } from '../../constants';
import { paymentsApi } from '@/modulos/Payments/api';

interface RenderViewProps {
  open: boolean;
  onClose: () => void;
  item: any;
  extraData?: any;
  user?: any;
  onEdit?: (item: any) => void;
  onDel?: (item: any) => void;
  hideSharedDebtButton?: boolean;
  hideEditAndDeleteButtons?: boolean;
  onReload?: () => void;
}

const getResolvedPaymentId = (item: any) =>
  item?.resolved_payment_id ?? item?.payment_id ?? null;

const hasEnoughDebtDetail = (item: any) =>
  Boolean(
    item?.dpto &&
      (item?.subcategory || item?.subcategory_id) &&
      (item?.type != null || item?.debt || item?.description),
  );


const RenderView: React.FC<RenderViewProps> = ({
  open,
  onClose,
  item,
  extraData,
  user,
  onEdit,
  onDel,
  hideSharedDebtButton = false,
  hideEditAndDeleteButtons = false,
  onReload, // Nueva prop
}) => {
  const { showToast: authShowToast } = useAuth();

  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);
  const [resolvedPaymentId, setResolvedPaymentId] = useState<string | number | null>(
    getResolvedPaymentId(item),
  );

  // Declarar la variable today
  const today = new Date();

  const { data, execute, loaded } = useAxios(
    "/debt-dptos",
    "GET",
    {
      searchBy: item?.id,
      fullType: "DET",
      perPage: -1,
      page: 1,
      extraData: true,
    },
    open && !!item?.id,
  );

  const debtDetail = data?.data?.[0] || item;
  const debtType = debtDetail?.type || debtDetail?.debt?.type || 0;
  const executeRef = useRef(execute);

  const hasApiData = data?.data?.[0];
  const shouldShowLoading = Boolean(
    open && item?.id && !loaded && !hasApiData && !hasEnoughDebtDetail(item),
  );

  const resolveStatus = (status: string, dueDate?: string) => {
    let finalStatus = status;
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const dueAtString = dueDate;
    if (dueAtString && dueAtString < todayString && status === "A") {
      finalStatus = "M";
    }
    return finalStatus;
  };

  const getPaymentTypeText = (type: string) => {
    const paymentTypeMap: { [key: string]: string } = {
      T: "Transferencia bancaria",
      E: "Efectivo",
      C: "Cheque",
      Q: "Pago QR",
      O: "Pago en oficina",
    };
    return paymentTypeMap[type] || type;
  };

  const getStatusStyle = (status: string, dueDate?: string) => {
    return getStatusConfig(status, dueDate);
  };

  const getDebtTypeText = (type: number) => {
    switch (Number(type)) {
      case 0:
        return 'Otras deudas';
      case 1:
        return 'Expensas';
      case 2:
        return 'Reservas';
      case 3:
        return 'Reserva con multa';
      case 4:
        return 'Deuda compartida';
      case 5:
        return 'Condonación';
      default:
        return '-/-';
    }
  };

  const getConceptText = (detail: any) => {
    switch (Number(detail?.type ?? detail?.debt?.type ?? 0)) {
      case 1: {
        const month = detail?.debt?.month ?? detail?.shared?.month;
        const year = detail?.debt?.year ?? detail?.shared?.year;
        if (month && year) {
          return `${MONTHS_ES[Number(month) - 1] || month} ${year}`;
        }
        return detail?.description || detail?.subcategory?.name || '-/-';
      }
      case 2:
        return (
          detail?.reservation?.area?.title ||
          detail?.debt?.reservation?.area?.title ||
          detail?.description ||
          '-/-'
        );
      case 3:
        return (
          detail?.penaltyReservation?.area?.title ||
          detail?.debt?.reservation_penalty?.area?.title ||
          detail?.penalty_reservation?.area?.title ||
          detail?.description ||
          '-/-'
        );
      case 4:
        return detail?.shared?.description || detail?.description || '-/-';
      default:
        return (
          detail?.description ||
          detail?.debt?.description ||
          detail?.subcategory?.name ||
          '-/-'
        );
    }
  };

  const getAvailableActions = (status: string, type: number) => {
    return getAvailableActionsFromConstants(status, type);
  };

  const getDetailButtonText = (type: number) => {
    return getDetailButtonTextFromConstants(type, hideSharedDebtButton);
  };

  const handleDetailButtonClick = (type: number) => {
    const targetId = debtDetail?.debt?.id || debtDetail?.shared_id;

    switch (type) {
      case 1:
        setShowExpenseDetail(true);
        break;
      case 2:
        setShowReservationDetail(true);
        break;
      case 3:
        setShowPaymentForm(true);
        break;
      case 4:
        window.location.href = `/debts_manager/shared-debt-detail/${targetId}`;
        break;
    }
  };

  const handleShowToast = (
    msg: string,
    type: "info" | "success" | "error" | "warning",
  ) => {
    authShowToast(msg, type);
  };

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    setCurrentItem(item);
    setResolvedPaymentId(getResolvedPaymentId(item));
  }, [item]);

  useEffect(() => {
    if (!open || !item?.id) return;

    let cancelled = false;

    const fetchResolvedPayment = async () => {
      const response = await executeRef.current(
        paymentsApi.resolvedPayment(item.id),
        'GET',
        {},
        false,
        true,
      );

      if (!cancelled && response?.data?.success) {
        setResolvedPaymentId(response.data.data?.payment_id || null);
      }
    };

    fetchResolvedPayment();

    return () => {
      cancelled = true;
    };
  }, [open, item?.id]);

  if (!open || !item) return null;

  const reloadItem = async () => {
    try {
      const response = await executeRef.current(
        '/debt-dptos',
        'GET',
        {
          searchBy: currentItem.id,
          fullType: "DET",
          perPage: -1,
          page: 1,
        },
        false,
        true,
      );
      if (response?.data?.success) {
        setCurrentItem(response.data.data[0] || currentItem);
      }

      const resolvedResponse = await executeRef.current(
        paymentsApi.resolvedPayment(currentItem.id),
        'GET',
        {},
        false,
        true,
      );
      if (resolvedResponse?.data?.success) {
        setResolvedPaymentId(resolvedResponse.data.data?.payment_id || null);
      }

      if (onReload) {
        onReload();
      }
    } catch (error) {
      handleShowToast("Error al actualizar los datos", "error");
    }
  };

  const handleClose = () => {
    onClose();
  };

  const getPaymentFormData = () => {
    const currentExtraData = data?.extraData || extraData;

    const calculatedTotalBalance =
      debtAmount + penaltyAmount + maintenanceAmount;
    const subcategoryId =
      debtDetail?.subcategory_id || debtDetail?.subcategory?.id;
    const categoryId =
      debtDetail?.subcategory?.padre?.id ||
      debtDetail?.subcategory?.category_id;
    let finalCategoryId = categoryId;
    if (!finalCategoryId && subcategoryId && currentExtraData?.categories) {
      const foundCategory = currentExtraData.categories.find((cat: any) =>
        cat.hijos?.some((hijo: any) => hijo.id === subcategoryId),
      );
      finalCategoryId = foundCategory?.id;
    }

    const isIndividualDebt = debtType === 0; // Tipo 0 = Deudas individuales
    const isExpensasDebt = debtType === 1; // Tipo 1 = Expensas
    const isReservationsDebt = debtType === 2 || debtType === 3; // Tipo 2 y 3 = Reservas
    const isSharedDebt = debtType === 4; // Tipo 4 = Deudas compartidas

    const isForgivenessDebt =
      debtDetail?.description?.toLowerCase().includes("condonación") ||
      debtDetail?.debt?.description?.toLowerCase().includes("condonación") ||
      debtDetail?.subcategory?.name?.toLowerCase().includes("condonación");

    const shouldLockFields =
      isIndividualDebt || isExpensasDebt || isReservationsDebt || isSharedDebt;

    let paymentType = "I";

    if (isForgivenessDebt) {
      paymentType = "F"; // Condonación
    } else if (isExpensasDebt) {
      paymentType = "E"; // Expensas
    } else if (isReservationsDebt) {
      paymentType = "R"; // Reservas
    } else if (isIndividualDebt || isSharedDebt) {
      paymentType = "O"; // Otras deudas
    }

    const titular = getTitular(debtDetail?.dpto);
    const owner_id = titular?.id;

    return {
      paid_at: new Date().toISOString().split("T")[0],
      dpto_id: debtDetail?.dpto?.nro,
      category_id: finalCategoryId,
      subcategory_id: subcategoryId,
      isCategoryLocked: shouldLockFields,
      isSubcategoryLocked: shouldLockFields,
      isAmountLocked: shouldLockFields,
      amount: calculatedTotalBalance,
      type: paymentType,
      debt_dpto_id: debtDetail?.id,
      concept: [
        debtDetail?.subcategory?.name || "Pago",
        `Pago de ${debtDetail?.subcategory?.name || "deuda"} - Unidad ${debtDetail?.dpto?.nro}`,
      ],
      owner: debtDetail?.dpto?.homeowner,
      owner_id: owner_id,
      status: "S",
    };
  };

  const debtAmount = parseFloat(debtDetail?.amount) || 0;
  const penaltyAmount = parseFloat(debtDetail?.penalty_amount) || 0;
  const maintenanceAmount = parseFloat(debtDetail?.maintenance_amount) || 0;
  const totalBalance = debtAmount + penaltyAmount + maintenanceAmount;

=======
>>>>>>> origin/dev
  const finalStatus = resolveStatus(debtDetail?.status, debtDetail?.due_at);
  const statusText = getStatusText(finalStatus);
  const { color } = getStatusStyle(finalStatus, debtDetail?.due_at);
  const actions = getAvailableActions(debtDetail?.status, debtType);
  const detailButtonText = getDetailButtonText(debtType);
  const showDistribution = debtType === 4;
  const ownerDisplay = getFullName(debtDetail?.dpto?.homeowner) || '-/-';
  const tenantDisplay = getFullName(debtDetail?.dpto?.tenant) || '-/-';
  const holderDisplay =
    debtDetail?.dpto?.holder === 'T' ? tenantDisplay : ownerDisplay;
  const unitDisplay = [debtDetail?.dpto?.nro, debtDetail?.dpto?.description]
    .filter(Boolean)
    .join(' - ') || '-/-';
  const categoryDisplay = debtDetail?.subcategory?.padre?.name || '-/-';
  const subcategoryDisplay = debtDetail?.subcategory?.name || '-/-';
  const conceptDisplay = getConceptText(debtDetail);
  const debtDescription =
    debtDetail?.debt?.description || debtDetail?.description || conceptDisplay || '-/-';
  const startDateDisplay = formatToDayDDMMYYYY(
    debtDetail?.debt?.begin_at || debtDetail?.created_at,
  );
  const dueDateDisplay = formatToDayDDMMYYYY(
    debtDetail?.debt?.due_at || debtDetail?.due_at,
  );
  const paidAtDisplay = formatToDayDDMMYYYY(
    debtDetail?.payment?.paid_at || debtDetail?.paid_at,
  );
  const headerSubtitle = finalStatus === 'P'
    ? `Pagada el ${formatToDayFdMYH(
        debtDetail?.payment?.paid_at || debtDetail?.paid_at,
        true,
        false,
        true,
      )}`
    : [conceptDisplay !== '-/-' ? conceptDisplay : null, dueDateDisplay !== '-/-' ? `Vence el ${dueDateDisplay}` : null]
        .filter(Boolean)
        .join(' · ');

  return (
    <>
      <DataModal
        open={open}
        onClose={handleClose}
        title="Detalle de deuda"
        buttonText=""
        buttonCancel=""
        variant="mini"
        headerDivider={false}
        minWidth={860}
        maxWidth={980}
      >
        {shouldShowLoading || Object.keys(debtDetail).length === 0 ? (
          <Loading />
        ) : (
          <>
            <div className={paymentStyles.container}>
              <div className={paymentStyles.headerSection}>
                <div className={paymentStyles.amountDisplay}>
                  {formatBs(totalBalance)}
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Fecha de inicio:</span>
                  <span className={styles.value}>
                    {formatDate(
                      debtDetail?.debt?.begin_at || debtDetail?.created_at,
                    )}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Vencimiento:</span>
                  <span className={styles.value}>
                    {formatDate(debtDetail?.due_at || "-/-")}
                  </span>
                </div>
              </div>
                <div className={paymentStyles.dateDisplay}>
                  {headerSubtitle || '-/-'}
                </div>
              </div>
            </div>

              {/* Información adicional para estado cobrado */}
              {debtDetail?.status === "P" && (
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Método de pago:</span>
                    <span className={styles.value}>
                      {getPaymentTypeText(debtDetail?.payment?.method) || "-/-"}
                    </span>
            <div className={paymentStyles.container}>
              <section className={paymentStyles.detailsSection}>
                <div className={paymentStyles.detailsColumn}>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Unidad</span>
                    <span className={paymentStyles.infoValue}>{unitDisplay}</span>
                  </div>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Propietario</span>
                    <span className={paymentStyles.infoValue}>{ownerDisplay}</span>
                  </div>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Titular</span>
                    <span className={paymentStyles.infoValue}>{holderDisplay}</span>
                  </div>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Categoría</span>
                    <span className={paymentStyles.infoValue}>{categoryDisplay}</span>
                  </div>
                </div>

                <div className={paymentStyles.detailsColumn}>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Tipo</span>
                    <span className={paymentStyles.infoValue}>
                      {getDebtTypeText(debtType)}
                    </span>
                  </div>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Concepto / Periodo</span>
                    <span className={paymentStyles.infoValue}>{conceptDisplay}</span>
                  </div>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Fecha de inicio</span>
                    <span className={paymentStyles.infoValue}>{startDateDisplay}</span>
                  </div>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Vencimiento</span>
                    <span className={paymentStyles.infoValue}>{dueDateDisplay}</span>
                  </div>
                </div>

                <div className={paymentStyles.detailsColumn}>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Estado</span>
                    <span
                      className={`${paymentStyles.infoValue} ${styles.statusValue}`}
                      style={{ color }}
                    >
                      {statusText}
                    </span>
                  </div>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Deuda</span>
                    <span className={paymentStyles.infoValue}>{formatBs(debtAmount)}</span>
                  </div>
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Multa</span>
                    <span className={paymentStyles.infoValue}>{formatBs(penaltyAmount)}</span>
                  </div>
                  {hasMaintenanceValue(user) ? (
                    <div className={paymentStyles.infoBlock}>
                      <span className={paymentStyles.infoLabel}>Mant. de valor</span>
                      <span className={paymentStyles.infoValue}>
                        {formatBs(maintenanceAmount)}
                      </span>
                    </div>
                  ) : null}
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Saldo pendiente</span>
                    <span className={paymentStyles.infoValue}>
                      {formatBs(totalBalance)}
                    </span>
                  </div>
                  {debtDetail?.status === 'P' ? (
                    <>
                      <div className={paymentStyles.infoBlock}>
                        <span className={paymentStyles.infoLabel}>Método de pago</span>
                        <span className={paymentStyles.infoValue}>
                          {getPaymentTypeText(debtDetail?.payment?.method) || '-/-'}
                        </span>
                      </div>
                      <div className={paymentStyles.infoBlock}>
                        <span className={paymentStyles.infoLabel}>Fecha de pago</span>
                        <span className={paymentStyles.infoValue}>{paidAtDisplay}</span>
                      </div>
                    </>
                  ) : null}
                  {showDistribution ? (
                    <div className={paymentStyles.infoBlock}>
                      <span className={paymentStyles.infoLabel}>Distribución</span>
                      <span className={paymentStyles.infoValue}>
                        {debtDetail?.debt?.distribution || 'Dividido por igual'}
                      </span>
                    </div>
                  ) : null}
                  <div className={paymentStyles.infoBlock}>
                    <span className={paymentStyles.infoLabel}>Subcategoría</span>
                    <span className={paymentStyles.infoValue}>{subcategoryDisplay}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className={paymentStyles.container}>
              <div className={styles.sectionHeading}>Detalles de la deuda</div>
              <div className={styles.detailsContent}>{debtDescription}</div>
            </div>

            <div className={`${paymentStyles.voucherButtonContainer} ${styles.actionsWrap}`}>
              {actions.showRegistrarPago && debtDetail?.status !== 'F' && (
                <Button
                  onClick={() => setShowPaymentForm(true)}
                  className={`${paymentStyles.voucherButton} ${styles.actionButtonStretch}`}
                >
                  Registrar Pago
                </Button>
              )}
              {actions.showVerPago && resolvedPaymentId && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  variant="secondary"
                  className={`${paymentStyles.voucherButton} ${styles.actionButtonStretch}`}
                >
                  Ver pago
                </Button>
              )}
              {detailButtonText && (
                <Button
                  onClick={() => handleDetailButtonClick(debtType)}
                  variant="secondary"
                  className={`${paymentStyles.voucherButton} ${styles.actionButtonStretch}`}
                  disabled={!hasApiData}
                >
                  {detailButtonText}
                </Button>
              )}
              {actions.showEditar && onEdit && !hideEditAndDeleteButtons && (
                <Button
                  onClick={() => onEdit(debtDetail)}
                  variant="secondary"
                  className={`${paymentStyles.voucherButton} ${styles.actionButtonStretch}`}
                >
                  Editar
                </Button>
              )}
              {actions.showAnular && onDel && !hideEditAndDeleteButtons && (
                <Button
                  onClick={() => onDel(debtDetail)}
                  variant="secondary"
                  className={`${paymentStyles.voucherButton} ${styles.actionButtonStretch}`}
                >
                  Anular
                </Button>
              )}
            </div>
          </>
        )}
      </DataModal>

      {/* Modales de detalle - solo para los que son modales */}
      {showExpenseDetail && (
        <ExpenseDetailModal
          open={showExpenseDetail}
          onClose={() => setShowExpenseDetail(false)}
          item={debtDetail}
          execute={execute}
        />
      )}

      {showReservationDetail && (
        <ReservationDetailModal
          open={showReservationDetail}
          onClose={() => setShowReservationDetail(false)}
          reservationId={debtDetail?.reservation?.id}
        />
      )}

      {/* Modal de Payment para ver pago existente */}
      {showPaymentModal && (
        <PaymentRenderView
          open={showPaymentModal}
          onClose={() => {
            reloadItem();
            setShowPaymentModal(false);
          }}
          payment_id={resolvedPaymentId as string | number}
          noWaiting={true}
        />
      )}

      {/* Formulario de Payment para registrar nuevo pago */}
      {showPaymentForm && (
        <PaymentRenderForm
          open={showPaymentForm}
          onClose={() => {
            reloadItem();
            setShowPaymentForm(false);
          }}
          item={getPaymentFormData()}
          extraData={data?.extraData || extraData}
          execute={execute as (...args: any[]) => Promise<any>}
          showToast={handleShowToast}
          reLoad={() => {
            reloadItem();
          }}
          debtId={item?.id}
        />
      )}
    </>
  );
};

export default RenderView;
