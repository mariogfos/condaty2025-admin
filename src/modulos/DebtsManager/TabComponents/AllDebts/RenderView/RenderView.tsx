'use client';
import React, { useState } from 'react';
import styles from './RenderView.module.css';
import { formatNumber } from '@/mk/utils/numbers';
import Button from '@/mk/components/forms/Button/Button';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import useAxios from '@/mk/hooks/useAxios';
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen';
import { useAuth } from '@/mk/contexts/AuthProvider';
import ExpenseDetailModal from '@/modulos/Expenses/ExpensesDetails/RenderView/RenderView';
import ReservationDetailModal from '@/modulos/Reservas/RenderView/RenderView';
import PaymentRenderView from '@/modulos/Payments/RenderView/RenderView';
import PaymentRenderForm from '@/modulos/Payments/RenderForm/RenderForm';
import { getDateStrMesShort } from '@/mk/utils/date';
import { getFullName } from '@/mk/utils/string';

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
  onReload?: () => void; // Nueva prop para reload de la lista padre
}


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

  // Declarar la variable today
  const today = new Date();

  const { data, execute, loaded } = useAxios(
    '/debt-dptos',
    'GET',
    {
      searchBy: item?.id,
      fullType: 'DET',
      perPage: -1,
      page: 1,
    },
    open && !!item?.id
  );

  if (!open || !item) return null;


  const debtDetail = data?.data?.[0] || item;
  const debtType = debtDetail?.type || debtDetail?.debt?.type || 0;


  const hasApiData = data?.data?.[0];


  const getStatusText = (status: string, dueDate?: string) => {
    console.log("llega entra");
    console.log("status", status);
    console.log("dueDate", dueDate);

    let finalStatus = status;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación precisa

    const due = dueDate ? new Date(dueDate) : null;
    if (due) {
      due.setHours(0, 0, 0, 0); // Normalizar a medianoche
    }

    // Solo marcar en mora si la fecha actual es MAYOR que la fecha de vencimiento
    if (due && today > due && status === 'A') {
      finalStatus = 'M';
    }

    const statusMap: { [key: string]: string } = {
      'A': 'Por cobrar',
      'P': 'Cobrado',
      'S': 'Por confirmar',
      'M': 'En mora',
      'C': 'Cancelada',
      'F': 'Perdonada',
      'X': 'Anulada'
    };
    return statusMap[finalStatus] || finalStatus;
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

  const getStatusConfig = (status: string, dueDate?: string) => {
    let finalStatus = status;
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación precisa

    const due = dueDate ? new Date(dueDate) : null;
    if (due) {
      due.setHours(0, 0, 0, 0); // Normalizar a medianoche
    }

    // Solo marcar en mora si la fecha actual es MAYOR que la fecha de vencimiento
    if (due && today > due && status === 'A') {
      finalStatus = 'M';
    }

    const statusConfig: { [key: string]: { color: string; bgColor: string } } = {
      A: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl8)' },
      P: { color: 'var(--cSuccess)', bgColor: 'var(--cHoverCompl2)' },
      S: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl4)' },
      R: { color: 'var(--cMediumAlert)', bgColor: 'var(--cMediumAlertHover)' },
      E: { color: 'var(--cWhite)', bgColor: 'var(--cHoverCompl1)' },
      M: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
      C: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
      F: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
      X: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
    };
    return statusConfig[finalStatus] || statusConfig.E;
  };

  const getBalanceTitle = (status: string) => {
    switch (status) {
      case 'P': return 'Saldo cobrado';
      case 'M': return 'Saldo a cobrar';
      case 'A': return 'Saldo a cobrar';
      default: return 'Saldo a cobrar';
    }
  };

  const getAvailableActions = (status: string, type: number) => {
    if (type !== 0) {
      return {
        showAnular: false,
        showEditar: false,
        showRegistrarPago: status !== 'P' && status !== 'S',
        showVerPago: status === 'P' || status === 'S'
      };
    }

    switch (status) {
      case 'P':
        return {
          showAnular: false,
          showEditar: false,
          showRegistrarPago: false,
          showVerPago: true
        };
      case 'S': // Por confirmar debe mostrar "Ver pago"
        return {
          showAnular: false,
          showEditar: false,
          showRegistrarPago: false,
          showVerPago: true
        };
      case 'A':
        return {
          showAnular: true,
          showEditar: true,
          showRegistrarPago: true,
          showVerPago: false
        };
      case 'M': // En mora solo se puede registrar pago, no editar ni anular
        return {
          showAnular: false,
          showEditar: false,
          showRegistrarPago: true,
          showVerPago: false
        };
      default: // Otros estados no permiten editar ni anular
        return {
          showAnular: false,
          showEditar: false,
          showRegistrarPago: status !== 'P' && status !== 'S',
          showVerPago: false
        };
    }
  };

  const getDetailButtonText = (type: number) => {
    switch (type) {
      case 1: return 'Ver expensa';
      case 2: return 'Ver reserva';
      case 3: return ;
      case 4: return hideSharedDebtButton ? null : 'Ver deuda compartida';
      default: return null;
    }
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

  const handleShowToast = (msg: string, type: 'info' | 'success' | 'error' | 'warning') => {
    authShowToast(msg, type);
  };

  const reloadItem = async () => {
    try {
      const response = await execute(
        '/debt-dptos',
        'GET',
        {
          searchBy: currentItem.id,
          fullType: 'DET',
          perPage: -1,
          page: 1,
        },
        false,
        true
      );
      if (response?.data?.success) {
        setCurrentItem(response.data.data[0] || currentItem);
      }

      // Llamar al reload de la lista padre si está disponible
      if (onReload) {
        onReload();
      }
    } catch (error) {
      handleShowToast('Error al actualizar los datos', 'error');
    }
  };

  // Función para manejar el cierre del modal con reload
  const handleClose = () => {
    if (onReload) {
      onReload();
    }
    onClose();
  };

  const getPaymentFormData = () => {
    const calculatedTotalBalance = debtAmount + penaltyAmount + maintenanceAmount;
    const subcategoryId = debtDetail?.subcategory_id || debtDetail?.subcategory?.id;
    const categoryId = debtDetail?.subcategory?.padre?.id || debtDetail?.subcategory?.category_id;
    let finalCategoryId = categoryId;
    if (!finalCategoryId && subcategoryId && extraData?.categories) {
      const foundCategory = extraData.categories.find((cat: any) =>
        cat.hijos?.some((hijo: any) => hijo.id === subcategoryId)
      );
      finalCategoryId = foundCategory?.id;
    }

    const isIndividualDebt = debtType === 0; // Tipo 0 = Deudas individuales
    const isExpensasDebt = debtType === 1; // Tipo 1 = Expensas
    const isReservationsDebt = debtType === 2 || debtType === 3; // Tipo 2 y 3 = Reservas
    const isSharedDebt = debtType === 4; // Tipo 4 = Deudas compartidas

    const isForgivenessDebt = debtDetail?.description?.toLowerCase().includes('condonación') ||
                           debtDetail?.debt?.description?.toLowerCase().includes('condonación') ||
                           debtDetail?.subcategory?.name?.toLowerCase().includes('condonación');

    const shouldLockFields = isIndividualDebt || isExpensasDebt || isReservationsDebt || isSharedDebt;

    let paymentType = 'I';

    if (isForgivenessDebt) {
      paymentType = 'F'; // Condonación
    } else if (isExpensasDebt) {
      paymentType = 'E'; // Expensas
    } else if (isReservationsDebt) {
      paymentType = 'R'; // Reservas
    } else if (isIndividualDebt || isSharedDebt) {
      paymentType = 'O'; // Otras deudas
    }

    return {
      paid_at: new Date().toISOString().split('T')[0],
      dpto_id: debtDetail?.dpto?.nro,
      category_id: finalCategoryId,
      subcategory_id: subcategoryId,
      isCategoryLocked: shouldLockFields,
      isSubcategoryLocked: shouldLockFields,
      isAmountLocked: shouldLockFields, // Nuevo campo para bloquear el monto
      amount: calculatedTotalBalance,
      type: paymentType,
      debt_dpto_id: debtDetail?.id,
      concept: [
        debtDetail?.subcategory?.name || 'Pago',
        `Pago de ${debtDetail?.subcategory?.name || 'deuda'} - Unidad ${debtDetail?.dpto?.nro}`
      ],
      owner: debtDetail?.dpto?.homeowner,
      status: 'S'
    };
  };

  const debtAmount = parseFloat(debtDetail?.amount) || 0;
  const penaltyAmount = parseFloat(debtDetail?.penalty_amount) || 0;
  const maintenanceAmount = parseFloat(debtDetail?.maintenance_amount) || 0;
  const totalBalance = debtAmount + penaltyAmount + maintenanceAmount;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-/-';
    return getDateStrMesShort(dateString);
  };

  const statusText = getStatusText(debtDetail?.status, debtDetail?.due_at);
  const { color, bgColor } = getStatusConfig(debtDetail?.status, debtDetail?.due_at);
  const balanceTitle = getBalanceTitle(debtDetail?.status);
  const actions = getAvailableActions(debtDetail?.status, debtType);
  const detailButtonText = getDetailButtonText(debtType);
  const showDistribution = debtType === 4;

  return (
    <>
      <DataModal
        open={open}
        onClose={handleClose} // Usar la nueva función de cierre
        title="Detalle de deuda"
        buttonText=""
        buttonCancel=""
      >
        <LoadingScreen onlyLoading={Object.keys(debtDetail).length === 0} type="CardSkeleton">
          <div className={styles.content}>
            {/* Saldo principal */}
            <div className={styles.balanceSection}>
              <div className={styles.balanceLabel}>{balanceTitle}</div>
              <div className={styles.balanceAmount}>Bs {formatNumber(totalBalance)}</div>
            </div>

            {/* Información principal */}
            <div className={styles.infoGrid}>
              <div className={`${styles.infoRow} ${styles.statusRow}`}>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Estado:</span>
                  <StatusBadge
                    color={color}
                    backgroundColor={bgColor}
                    containerStyle={{
                      justifyContent: 'flex-start',
                    }}
                  >
                    {statusText}
                  </StatusBadge>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Fecha de inicio:</span>
                  <span className={styles.value}>
                    {formatDate(debtDetail?.debt?.begin_at || debtDetail?.created_at)}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Vencimiento:</span>
                  <span className={styles.value}>
                    {formatDate(debtDetail?.debt?.due_at || debtDetail?.due_at || '-/-')}
                  </span>
                </div>
              </div>

              {/* Información adicional para estado cobrado */}
              {debtDetail?.status === 'P' && (
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Método de pago:</span>
                    <span className={styles.value}>
                      {getPaymentTypeText(debtDetail?.payment?.type) || '-/-'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Fecha de pago:</span>
                    <span className={styles.value}>
                      {formatDate(debtDetail?.payment?.paid_at || debtDetail?.paid_at)}
                    </span>
                  </div>
                </div>
              )}

              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Unidad</span>
                  <span className={styles.value}>{debtDetail?.dpto?.nro || '-/-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Categoría</span>
                  <span className={styles.value}>
                    {debtDetail?.subcategory?.padre?.name || '-/-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Deuda</span>
                  <span className={styles.value}>Bs {formatNumber(debtAmount)}</span>
                </div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Propietario</span>
                  <span className={styles.value}>{getFullName(debtDetail?.dpto?.homeowner)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Subcategoría</span>
                  <span className={styles.value}>{debtDetail?.subcategory?.name || '-/-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Multa</span>
                  <span className={styles.value}>Bs {formatNumber(penaltyAmount)}</span>
                </div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Titular</span>
                  <span className={styles.value}>
                    {debtDetail?.dpto?.holder === 'H'
                      ? getFullName(debtDetail?.dpto?.homeowner)
                      : getFullName(debtDetail?.dpto?.tenant)}
                  </span>
                </div>
                {/* Item vacío en el medio */}
                <div className={styles.infoItem}>{/* Espacio vacío */}</div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Mant. de valor</span>
                  <span className={styles.value}>Bs {formatNumber(maintenanceAmount)}</span>
                </div>
                {/* Solo mostrar distribución para type 4 */}
                {showDistribution && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Tipo</span>
                    <span className={styles.value}>
                      {debtDetail?.debt?.distribution || 'Dividido por igual'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles */}
            <h3 className={styles.detailsTitle}>Detalles</h3>
            <div className={styles.detailsSection}>
              <div className={styles.detailsContent}>
                {debtDetail?.debt?.description || debtDetail?.description}
              </div>
            </div>

            {/* Botones de acción */}
            <div className={styles.actions}>
              {actions.showAnular && onDel && !hideEditAndDeleteButtons && (
                <Button
                  onClick={() => onDel(debtDetail)}
                  variant="secondary"
                  className={styles.actionButton}
                >
                  Anular
                </Button>
              )}

              {actions.showEditar && onEdit && !hideEditAndDeleteButtons && (
                <Button
                  onClick={() => onEdit(debtDetail)}
                  variant="secondary"
                  className={styles.actionButton}
                >
                  Editar
                </Button>
              )}

              {actions.showRegistrarPago && (
                <Button onClick={() => setShowPaymentForm(true)} className={styles.primaryButton}>
                  Registrar Pago
                </Button>
              )}

              {/* Botón de ver pago para estado cobrado */}
              {actions.showVerPago && currentItem?.payment_id && (
                <Button onClick={() => setShowPaymentModal(true)} className={styles.actionButton}>
                  Ver pago
                </Button>
              )}

              {/* Botón de detalle específico según el tipo */}
              {detailButtonText && (
                <Button
                  onClick={() => handleDetailButtonClick(debtType)}
                  variant="secondary"
                  className={styles.actionButton}
                  disabled={!hasApiData}
                >
                  {detailButtonText}
                </Button>
              )}
            </div>
          </div>
        </LoadingScreen>
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
          // No pasar reservationId ya que tenemos el item completo
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
          payment_id={currentItem?.payment_id}
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
          extraData={extraData}
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
