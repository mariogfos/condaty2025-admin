'use client';
import React, { useState } from 'react';
import styles from './RenderView.module.css';
import { formatNumber } from '@/mk/utils/numbers';
import Button from '@/mk/components/forms/Button/Button';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import useAxios from '@/mk/hooks/useAxios';
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen';

// Importar el formulario de pagos
import PaymentRenderForm from '@/modulos/Payments/RenderForm/RenderForm';

interface RenderViewProps {
  open: boolean;
  onClose: () => void;
  item: any;
  extraData?: any;
  user?: any;
  onEdit?: (item: any) => void;
  onDel?: (item: any) => void;
  execute?: (...args: any[]) => Promise<any>;
  reLoad?: () => void;
  showToast?: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
}

const RenderView: React.FC<RenderViewProps> = ({
  open,
  onClose,
  item,
  extraData,
  user,
  onEdit,
  onDel,
  execute,
  reLoad,
  showToast
}) => {
  // Estado para el modal de pago
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Llamar a la API para obtener detalles completos
  const { data } = useAxios(
    "/debt-dptos",
    "GET",
    {
      searchBy: item?.id,
      fullType: "DET",
      perPage: -1,
      page: 1,
      type: 0
    },
    open && !!item?.id // Solo hacer la llamada cuando el modal esté abierto y tengamos ID
  );

  if (!open || !item) return null;

  // Obtener los datos detallados de la API
  const debtDetail = data?.data?.[0] || item;

  // Función para recargar el item después de un pago
  const reloadItem = async () => {
    if (reLoad) {
      reLoad();
    }
  };

  // Preparar datos para el formulario de pago
  const getPaymentFormData = () => {
    // Calcular el balance total aquí mismo
    const debtAmount = parseFloat(debtDetail?.amount) || 0;
    const penaltyAmount = parseFloat(debtDetail?.penalty_amount) || 0;
    const maintenanceAmount = parseFloat(debtDetail?.maintenance_amount) || 0;
    const calculatedTotalBalance = debtAmount + penaltyAmount + maintenanceAmount;

    // Usar la información real de la subcategoría de la deuda
    const subcategoryId = debtDetail?.debt?.subcategory_id || debtDetail?.subcategory_id || debtDetail?.debt?.subcategory?.id;
    const categoryId = debtDetail?.debt?.subcategory?.category?.id || debtDetail?.subcategory?.padre?.id || debtDetail?.subcategory?.category_id;

    // Si no tenemos la categoría padre directamente, buscarla en extraData
    let finalCategoryId = categoryId;
    if (!finalCategoryId && subcategoryId && extraData?.categories) {
      const foundCategory = extraData.categories.find((cat: any) =>
        cat.hijos?.some((hijo: any) => hijo.id === subcategoryId)
      );
      finalCategoryId = foundCategory?.id;
    }

    // Determinar el tipo de deuda basado en la subcategoría
    const isExpensasDebt = subcategoryId === extraData?.client_config?.cat_expensas;
    const isReservationsDebt = subcategoryId === extraData?.client_config?.cat_reservations;

    return {
      // Datos básicos del pago
      paid_at: new Date().toISOString().split('T')[0],

      // Unidad preseleccionada
      dpto_id: debtDetail?.dpto?.nro || debtDetail?.dpto_id,

      // Categoría y subcategoría basadas en la deuda real
      category_id: finalCategoryId,
      subcategory_id: subcategoryId,

      // Campos de bloqueo
      isCategoryLocked: isExpensasDebt || isReservationsDebt,
      isSubcategoryLocked: isExpensasDebt || isReservationsDebt,

      // Monto total calculado
      amount: calculatedTotalBalance,

      // Tipo de pago por defecto
      type: 'T', // Transferencia bancaria por defecto

      // Datos adicionales para el contexto
      debt_dpto_id: debtDetail?.id,
      concept: [
        debtDetail?.debt?.subcategory?.name || debtDetail?.subcategory?.name || 'Pago',
        `Pago de ${debtDetail?.debt?.subcategory?.name || debtDetail?.subcategory?.name || 'deuda'} - Unidad ${debtDetail?.dpto?.nro || debtDetail?.dpto_id}`
      ],
      owner: debtDetail?.dpto?.homeowner,
      status: 'S' // Por confirmar
    };
  };

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

  const getAvailableActions = (status: string) => {
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

  const debtAmount = parseFloat(debtDetail?.amount) || 0;
  const penaltyAmount = parseFloat(debtDetail?.penalty_amount) || 0;
  const maintenanceAmount = parseFloat(debtDetail?.maintenance_amount) || 0;
  const totalBalance = debtAmount + penaltyAmount + maintenanceAmount;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const statusText = getStatusText(debtDetail?.status, debtDetail?.debt?.due_at);
  const { color, bgColor } = getStatusConfig(debtDetail?.status, debtDetail?.debt?.due_at);
  const balanceTitle = getBalanceTitle(debtDetail?.status);
  const actions = getAvailableActions(debtDetail?.status);

  // Función para manejar la edición
  const handleEdit = () => {
    if (onEdit) {
      // Cerrar la vista antes de abrir el formulario de edición
      onClose();
      onEdit(debtDetail);
    }
  };

  // Función para manejar la eliminación
  const handleDelete = () => {
    if (onDel) {
      // Cerrar la vista antes de abrir el modal de confirmación
      onClose();
      onDel(debtDetail);
    }
  };

  // Función para manejar el registro de pago
  const handleRegisterPayment = () => {
    setShowPaymentForm(true);
  };

  return (
    <>
      <DataModal
        open={open}
        onClose={onClose}
        title="Detalle de deuda"
        buttonText=""
        buttonCancel=""
      >
        <LoadingScreen
          onlyLoading={Object.keys(debtDetail).length === 0}
          type="CardSkeleton"
        >
          <div className={styles.content}>
          {/* Saldo principal */}
          <div className={styles.balanceSection}>
            <div className={styles.balanceLabel}>{balanceTitle}</div>
            <div className={styles.balanceAmount}>Bs {formatNumber(totalBalance)}</div>
          </div>

          {/* Información principal */}
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Estado:</span>
                <StatusBadge
                  color={color}
                  backgroundColor={bgColor}
                  containerStyle={{
                    justifyContent: "flex-start"
                  }}
                >
                  {statusText}
                </StatusBadge>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Fecha de inicio:</span>
                <span className={styles.value}>
                  {formatDate(debtDetail?.debt?.begin_at || debtDetail?.created_at)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Vencimiento:</span>
                <span className={styles.value}>{formatDate(debtDetail?.debt?.due_at)}</span>
              </div>
            </div>

            {/* Información adicional para estado cobrado */}
            {debtDetail?.status === 'P' && (
              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Método de pago:</span>
                  <span className={styles.value}>{debtDetail?.payment?.method || 'QR'}</span>
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
                <span className={styles.value}>{debtDetail?.dpto?.nro || debtDetail?.dpto_id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Categoría</span>
                <span className={styles.value}>
                  {debtDetail?.debt?.subcategory?.category?.name || 'Expensa'}
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
                  {debtDetail?.dpto?.owner?.name || 'Carlos Daniel Delgadillo Flores'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Subcategoría</span>
                <span className={styles.value}>
                  {debtDetail?.debt?.subcategory?.name || 'Junio'}
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
                  {debtDetail?.dpto?.tenant?.name || 'Marcelo Fernández Peña Galvarro'}
                </span>
              </div>
            </div>
          </div>

          {/* Detalles */}
          {debtDetail?.debt?.description && (
            <>
              <h3 className={styles.detailsTitle}>Detalles</h3>
              <div className={styles.detailsSection}>
                <div className={styles.detailsContent}>
                  {debtDetail.debt.description || 'Cobro de las expensas del mes de junio'}
                </div>
              </div>
            </>
          )}

          {/* Botones de acción */}
          <div className={styles.actions}>
            {actions.showAnular && onDel && (
              <Button
                onClick={handleDelete}
                variant="secondary"
                className={styles.actionButton}
              >
                Anular
              </Button>
            )}

            {actions.showEditar && onEdit && (
              <Button
                onClick={handleEdit}
                variant="secondary"
                className={styles.actionButton}
              >
                Editar
              </Button>
            )}

            {actions.showRegistrarPago && (
              <Button
                onClick={handleRegisterPayment}
                className={styles.primaryButton}
              >
                Registrar Pago
              </Button>
            )}

            {actions.showVerPago && (
              <Button
                onClick={() => {
                  console.log('Ver pago para:', debtDetail);
                }}
                className={styles.actionButton}
              >
                Ver pago
              </Button>
            )}
          </div>
        </div>
        </LoadingScreen>
      </DataModal>

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
          showToast={showToast || ((msg: string, type: 'info' | 'success' | 'error' | 'warning') => {
            console.log(`${type}: ${msg}`);
          })}
          reLoad={() => {
            reloadItem();
          }}
        />
      )}
    </>
  );
};

export default RenderView;
