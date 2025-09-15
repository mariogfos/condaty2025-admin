'use client';
import React from 'react';
import styles from './RenderView.module.css';
import { formatNumber } from '@/mk/utils/numbers';
import Button from '@/mk/components/forms/Button/Button';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import useAxios from '@/mk/hooks/useAxios';
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen';

interface RenderViewProps {
  open: boolean;
  onClose: () => void;
  item: any;
  extraData?: any;
  user?: any;
  onEdit?: (item: any) => void;
  onDel?: (item: any) => void;
}

const RenderView: React.FC<RenderViewProps> = ({
  open,
  onClose,
  item,
  extraData,
  user,
  onEdit,
  onDel
}) => {
  // Llamar a la API para obtener detalles completos de la deuda compartida
  const { data } = useAxios(
    "/shared-debts", // Endpoint para deudas compartidas
    "GET",
    {
      searchBy: item?.id,
      fullType: "DET",
      perPage: -1,
      page: 1,
    },
    open && !!item?.id // Solo hacer la llamada cuando el modal esté abierto y tengamos ID
  );

  if (!open || !item) return null;

  // Obtener los datos detallados de la API
  const debtDetail = data?.data?.[0] || item;

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'A': 'Por cobrar',
      'P': 'Cobrado',
      'S': 'Por confirmar',
      'M': 'En mora',
      'C': 'Cancelada',
      'X': 'Anulada'
    };
    return statusMap[status] || status;
  };

  const getStatusConfig = (status: string) => {
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
    return statusConfig[status] || statusConfig.E;
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

  const statusText = getStatusText(debtDetail?.status);
  const { color, bgColor } = getStatusConfig(debtDetail?.status);
  const balanceTitle = getBalanceTitle(debtDetail?.status);
  const actions = getAvailableActions(debtDetail?.status);

  return (
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
              <span className={styles.value}>{debtDetail?.dpto?.nro || '24-B'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Categoría</span>
              <span className={styles.value}>
                {debtDetail?.debt?.subcategory?.category?.name || 'Servicios básicos'}
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
                {debtDetail?.debt?.subcategory?.name || 'Pago de agua'}
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
            <div className={styles.infoItem}>
              <span className={styles.label}>Distribución</span>
              <span className={styles.value}>
                {debtDetail?.debt?.distribution || 'Dividido por igual'}
              </span>
            </div>
          </div>
        </div>

        {/* Sección específica de Deuda compartida */}
        <div className={styles.sharedDebtSection}>
          <div className={styles.sharedDebtHeader}>
            <h3 className={styles.sharedDebtTitle}>Deuda compartida</h3>
            <button
              className={styles.viewSharedDebtButton}
              onClick={() => {
                // Navegar al componente de detalle
                window.location.href = `/debts_manager/shared-debt-detail/${debtDetail?.debt?.id || debtDetail?.id}`;
              }}
            >
              Ver deuda compartida
            </button>
          </div>

          <div className={styles.sharedDebtStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total de personas:</span>
              <span className={styles.statValue}>{debtDetail?.debt?.total_units || 35}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Personas que pagaron:</span>
              <span className={styles.statValue}>{debtDetail?.debt?.paid_units || 21}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Personas por cobrar:</span>
              <span className={styles.statValue}>{debtDetail?.debt?.pending_units || 14}</span>
            </div>
          </div>
        </div>

        {/* Detalles */}
        <h3 className={styles.detailsTitle}>Detalles</h3>
        <div className={styles.detailsSection}>
          <div className={styles.detailsContent}>
            {debtDetail?.debt?.description || 'Cobro del servicio básico de agua del mes de agosto'}
          </div>
        </div>

        {/* Botones de acción */}
        <div className={styles.actions}>
          {actions.showAnular && onDel && (
            <Button
              onClick={() => onDel(debtDetail)}
              variant="secondary"
              className={styles.actionButton}
            >
              Anular
            </Button>
          )}

          {actions.showEditar && onEdit && (
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
              onClick={() => {
                console.log('Registrar pago para:', debtDetail);
              }}
              className={styles.primaryButton}
            >
              Registrar Pago
            </Button>
          )}

          {/* Para estado cobrado, solo mostrar Ver pago */}
          {debtDetail?.status === 'P' && (
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
  );
};

export default RenderView;
