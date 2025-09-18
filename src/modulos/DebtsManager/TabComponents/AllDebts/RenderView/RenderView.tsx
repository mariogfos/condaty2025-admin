'use client';
import React, { useState } from 'react';
import styles from './RenderView.module.css';
import { formatNumber } from '@/mk/utils/numbers';
import Button from '@/mk/components/forms/Button/Button';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import useAxios from '@/mk/hooks/useAxios';
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen';

// Importar solo los componentes que son modales
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
}

// En el componente RenderView, agregar execute del hook useAxios
const RenderView: React.FC<RenderViewProps> = ({
  open,
  onClose,
  item,
  extraData,
  user,
  onEdit,
  onDel,
  hideSharedDebtButton = false,
  hideEditAndDeleteButtons = false
}) => {
  // Estados para controlar los modales de detalle
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);

  // Llamar a la API para obtener detalles completos
  const { data, execute } = useAxios(
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

  // Obtener los datos detallados de la API
  const debtDetail = data?.data?.[0] || item;
  const debtType = debtDetail?.type || debtDetail?.debt?.type || 0;

  const getStatusText = (status: string, dueDate?: string) => {
    // NUEVA LÓGICA: Verificar si está en mora por fecha vencida
    let finalStatus = status;
    const today = new Date();
    const due = dueDate ? new Date(dueDate) : null;

    // Si la fecha de vencimiento es menor a hoy y el estado es 'A' (Por cobrar), cambiar a 'M' (En mora)
    if (due && due < today && status === 'A') {
      finalStatus = 'M';
    }

    const statusMap: { [key: string]: string } = {
      'A': 'Por cobrar',
      'P': 'Cobrado',
      'S': 'Por confirmar',
      'M': 'En mora',
      'C': 'Cancelada',
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
    // NUEVA LÓGICA: Verificar si está en mora por fecha vencida
    let finalStatus = status;
    const today = new Date();
    const due = dueDate ? new Date(dueDate) : null;

    // Si la fecha de vencimiento es menor a hoy y el estado es 'A' (Por cobrar), cambiar a 'M' (En mora)
    if (due && due < today && status === 'A') {
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
    // Solo el tipo 0 puede editar y anular
    if (type !== 0) {
      return {
        showAnular: false,
        showEditar: false,
        showRegistrarPago: status !== 'P',
        showVerPago: status === 'P'
      };
    }

    // Para tipo 0, comportamiento normal según el status
    switch (status) {
      case 'P':
        return {
          showAnular: false,
          showEditar: false,
          showRegistrarPago: false,
          showVerPago: true
        };
      case 'M':
      case 'A':
        return {
          showAnular: true,
          showEditar: true,
          showRegistrarPago: true,
          showVerPago: false
        };
      default:
        return {
          showAnular: true,
          showEditar: true,
          showRegistrarPago: true,
          showVerPago: false
        };
    }
  };

  // Función para obtener el texto del botón de detalle según el tipo
  const getDetailButtonText = (type: number) => {
    switch (type) {
      case 1: return 'Ver expensa';
      case 2: return 'Ver reserva';
      case 3: return 'Ver reserva';
      case 4: return hideSharedDebtButton ? null : 'Ver deuda compartida';
      default: return null;
    }
  };

  // Función para manejar la apertura del modal de detalle
  const handleDetailButtonClick = (type: number) => {
    const targetId = debtDetail?.debt?.id || debtDetail?.shared_id;

    switch (type) {
      case 1:
        setShowExpenseDetail(true);
        break;
      case 2:
      case 3:
        setShowReservationDetail(true);
        break;
      case 4:
        // Para deuda compartida, redirigir a la ruta correcta
        window.location.href = `/debts_manager/shared-debt-detail/${targetId}`;
        break;
    }
  };

  // Función para recargar el item después de registrar pago
  const reloadItem = async () => {
    try {
      const response = await execute(
        '/debt-dptos',
        'GET',
        {
          fullType: 'DET',
          searchBy: currentItem.id,
          page: 1,
          perPage: 1,
        },
        false,
        true
      );
      if (response?.data?.success) {
        setCurrentItem(response.data.data[0] || currentItem);
      }
    } catch (error) {
      console.error('Error reloading item:', error);
    }
  };

  // Preparar datos para el formulario de pago
  const getPaymentFormData = () => {
    // Usar la información real de la subcategoría de la deuda
    const subcategoryId = debtDetail?.subcategory_id || debtDetail?.subcategory?.id;
    const categoryId = debtDetail?.subcategory?.padre?.id || debtDetail?.subcategory?.category_id;

    // Si no tenemos la categoría padre directamente, buscarla en extraData
    let finalCategoryId = categoryId;
    if (!finalCategoryId && subcategoryId && extraData?.categories) {
      const foundCategory = extraData.categories.find((cat: any) =>
        cat.hijos?.some((hijo: any) => hijo.id === subcategoryId)
      );
      finalCategoryId = foundCategory?.id;
    }

    return {
      // Datos básicos del pago
      paid_at: new Date().toISOString().split('T')[0],

      // Unidad preseleccionada
      dpto_id: debtDetail?.dpto?.nro,

      // Categoría y subcategoría basadas en la deuda real
      category_id: finalCategoryId,
      subcategory_id: subcategoryId,

      // Monto total
      amount: totalBalance,

      // Tipo de pago por defecto
      type: 'T', // Transferencia bancaria por defecto

      // Datos adicionales para el contexto
      debt_dpto_id: debtDetail?.id,
      concept: [
        debtDetail?.subcategory?.name || 'Pago',
        `Pago de ${debtDetail?.subcategory?.name || 'deuda'} - Unidad ${debtDetail?.dpto?.nro}`
      ],
      owner: debtDetail?.dpto?.homeowner,
      status: 'S' // Por confirmar
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

  const statusText = getStatusText(debtDetail?.status, debtDetail?.debt?.due_at);
  const { color, bgColor } = getStatusConfig(debtDetail?.status, debtDetail?.debt?.due_at);
  const balanceTitle = getBalanceTitle(debtDetail?.status);
  const actions = getAvailableActions(debtDetail?.status, debtType);
  const detailButtonText = getDetailButtonText(debtType);

  // Determinar si mostrar el campo de distribución (solo para type 0)
  const showDistribution = debtType === 4;

  return (
    <>
      <DataModal
        open={open}
        onClose={onClose}
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
                  <span className={styles.value}>{formatDate(debtDetail?.debt?.due_at || debtDetail?.due_at || '-/-')}</span>
                </div>
              </div>

              {/* Información adicional para estado cobrado */}
              {debtDetail?.status === 'P' && (
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Método de pago:</span>
                    <span className={styles.value}>{getPaymentTypeText(debtDetail?.payment?.type) || '-/-'}</span>
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
                  <span className={styles.value}>
                    {getFullName(debtDetail?.dpto?.homeowner)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Subcategoría</span>
                  <span className={styles.value}>
                    {debtDetail?.subcategory?.name || '-/-'}
                  </span>
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
                    {debtDetail?.dpto?.holder === 'H' ?
                    getFullName(debtDetail?.dpto?.homeowner) :
                    getFullName(debtDetail?.dpto?.tenant)}
                  </span>
                </div>
                {/* Item vacío en el medio */}
                <div className={styles.infoItem}>
                  {/* Espacio vacío */}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Mant. de valor</span>
                  <span className={styles.value}>Bs {formatNumber(maintenanceAmount)}</span>
                </div>
                {/* Solo mostrar distribución para type 4 */}
                {showDistribution && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Distribución</span>
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
                {debtDetail?.debt?.description ||
                  'Cobro del servicio básico de agua del mes de agosto'}
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
                <Button
                  onClick={() => setShowPaymentForm(true)}
                  className={styles.primaryButton}
                >
                  Registrar Pago
                </Button>
              )}

              {/* Botón de ver pago para estado cobrado */}
              {actions.showVerPago && currentItem?.payment_id && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className={styles.actionButton}
                >
                  Ver pago
                </Button>
              )}

              {/* Botón de detalle específico según el tipo */}
              {detailButtonText && (
                <Button
                  onClick={() => handleDetailButtonClick(debtType)}
                  variant="secondary"
                  className={styles.actionButton}
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
          item={{ id: debtDetail?.debt?.id || debtDetail?.id }}
          reservationId={debtDetail?.debt?.id || debtDetail?.id}
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
          showToast={(msg: string, type: 'info' | 'success' | 'error' | 'warning') => {
            console.log(`${type}: ${msg}`);
          }}
          reLoad={() => {
            reloadItem();
          }}
        />
      )}
    </>
  );
};

export default RenderView;
