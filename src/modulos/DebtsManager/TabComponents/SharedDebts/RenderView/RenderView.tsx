'use client';
import React from 'react';
import styles from './RenderView.module.css';
import { formatNumber } from '@/mk/utils/numbers';
import Button from '@/mk/components/forms/Button/Button';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';

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
  if (!open || !item) return null;

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

  // Usar la misma configuración de colores que AllDebts.tsx
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

  const debtAmount = parseFloat(item?.amount) || 0;
  const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
  const maintenanceAmount = parseFloat(item?.maintenance_amount) || 0;
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

  const statusText = getStatusText(item?.status);
  const { color, bgColor } = getStatusConfig(item?.status);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Detalle de deuda</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Saldo principal */}
          <div className={styles.balanceSection}>
            <div className={styles.balanceLabel}>Saldo a cobrar</div>
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
                    justifyContent: "flex-start" // Cambiar de center a flex-start
                  }}
                >
                  {statusText}
                </StatusBadge>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Fecha de inicio:</span>
                <span className={styles.value}>
                  {formatDate(item?.debt?.begin_at || item?.created_at)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Vencimiento:</span>
                <span className={styles.value}>{formatDate(item?.debt?.due_at)}</span>
              </div>
            </div>

            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Unidad</span>
                <span className={styles.value}>{item?.dpto?.nro || item?.dpto_id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Categoría</span>
                <span className={styles.value}>
                  {item?.debt?.subcategory?.category?.name || 'Expensa / Reserva / Otro'}
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
                  {item?.dpto?.owner?.name || 'Carlos Daniel Delgadillo Flores'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Subcategoría</span>
                <span className={styles.value}>
                  {item?.debt?.subcategory?.name || 'Churrasquera'}
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
                  {item?.dpto?.tenant?.name || 'Marcelo Fernández Peña Galvarro'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Distribución</span>
                <span className={styles.value}>
                  {item?.debt?.distribution || 'Monto fijo por unidad / grupal'}
                </span>
              </div>
            </div>
          </div>

          {/* Detalles */}
          {item?.debt?.description && (
            <>
              <h3 className={styles.detailsTitle}>Detalles</h3>
              <div className={styles.detailsSection}>
                <div className={styles.detailsContent}>{item.debt.description}</div>
              </div>
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div className={styles.actions}>
          {onDel && (
            <Button
              onClick={() => onDel(item)}
              style={{
                backgroundColor: 'var(--cBlackV2)',
                color: 'var(--cWhite)',
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid var(--cWhiteV1)',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Anular deuda
            </Button>
          )}
          {onEdit && (
            <Button
              onClick={() => onEdit(item)}
              style={{
                backgroundColor: 'var(--cBlackV2)',
                color: 'var(--cWhite)',
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid var(--cWhiteV1)',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Modificar
            </Button>
          )}

          <Button
            onClick={() => {
              // Lógica para registrar pago
              console.log('Registrar pago para:', item);
            }}
            style={{
              backgroundColor: '#10b981',
              color: 'var(--cBlack)',
              flex: 1,
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Registrar Pago
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RenderView;
