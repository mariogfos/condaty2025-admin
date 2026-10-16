'use client';
import React, { useRef, useState } from 'react';
import { QrOrder, QR_STATE_LABEL, QR_STATE_COLOR, PAYMENT_TYPE_LABEL } from '../types';
import { formatQrDate } from '../shared';
import styles from './RenderView.module.css';

interface Props {
  order: QrOrder;
  onClose: () => void;
  onVerify?: () => Promise<{ success: boolean; message: string }>;
}

const INCIDENT_REASON: Record<string, string> = {
  debt_changed: 'La deuda o su saldo cambió después de generar el QR.',
  debt_claimed: 'Otro pago reclamó una de las deudas del QR.',
  order_cancelled: 'El banco reportó pagado un QR que figuraba anulado.',
  credit_failed: 'La acreditación completa no se pudo terminar.',
  legacy_credit_failed: 'El ingreso heredado no pudo confirmarse íntegramente.',
};

const RenderView = ({ order, onClose, onVerify }: Props) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const cfg = QR_STATE_COLOR[order.order_state];
  const incident = order.reconciliation_incident;
  const incidentOpen = Boolean(incident && !incident.resolved_at);

  const handleVerify = async () => {
    if (!onVerify || verifying) return;
    setVerifying(true);
    setVerifyMessage(null);
    try {
      const result = await onVerify();
      setVerifyMessage(result.message);
    } catch {
      setVerifyMessage('No se pudo reverificar el QR. La incidencia sigue abierta.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank');
    win?.document.write(`<html><head><title>QR ${order.reference}</title></head><body>${content}</body></html>`);
    win?.document.close();
    win?.print();
  };

  const handleDownload = () => {
    if (!order.qr_image_base64) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${order.qr_image_base64}`;
    a.download = `QR_${order.reference}.png`;
    a.click();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Detalle de Orden QR</h2>
            <p className={styles.modalRef}>{order.reference}</p>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.badge} style={{ color: cfg.color, background: cfg.bg }}>
              {QR_STATE_LABEL[order.order_state]}
            </span>
            <button id="btn-close-render-view" aria-label="Cerrar detalle" className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* QR Image */}
        {order.qr_image_base64 && (
          <div className={styles.qrSection} ref={printRef}>
            <img
              src={`data:image/png;base64,${order.qr_image_base64}`}
              alt={`QR ${order.reference}`}
              className={styles.qrImage}
            />
            <p className={styles.qrAmount}>
              {parseFloat(order.amount).toFixed(2)} {order.currency}
            </p>
            {order.gloss && <p className={styles.qrGloss}>{order.gloss}</p>}
          </div>
        )}

        {incidentOpen && incident && (
          <div className={styles.incidentAlert} role="alert">
            <strong>Cobro bancario por conciliar</strong>
            <p>{INCIDENT_REASON[incident.reason_code] ?? 'La acreditación completa no se pudo terminar.'}</p>
            <p>No se creó un ingreso parcial. El QR permanece bajo revisión: verifique el movimiento en el banco antes de cualquier ajuste financiero.</p>
            <div className={styles.incidentMeta}>
              <span>Transacción: {incident.bank_transaction_id ?? 'No informada'}</span>
              <span>Intentos: {incident.attempts}</span>
              <span>Detectado: {formatQrDate(incident.first_detected_at)}</span>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          <InfoRow label="Referencia banco" value={order.qr_id_banco ?? '—'} />
          <InfoRow label="Monto" value={`${parseFloat(order.amount).toFixed(2)} ${order.currency}`} />
          <InfoRow label="Tipo de pago" value={order.payment_type ? PAYMENT_TYPE_LABEL[order.payment_type] : '—'} />
          <InfoRow label="Unidad" value={order.unit || '—'} />
          <InfoRow label="Concepto" value={order.concept || '—'} />
          <InfoRow label="Fecha orden" value={formatQrDate(order.order_date)} />
          <InfoRow label="Fecha pago" value={formatQrDate(order.pay_date)} />
          <InfoRow label="Hora pago" value={order.pay_hour ?? '—'} />
          <InfoRow label="N° transacción" value={order.transaction_id ?? '—'} />
          <InfoRow label="Vencimiento" value={formatQrDate(order.expiration_date)} />
          <InfoRow label="Uso único" value={order.single_use ? 'Sí' : 'No'} />
          {order.consolidated_at && (
            <InfoRow label="Conciliado" value={new Date(order.consolidated_at).toLocaleDateString('es-BO')} />
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {incidentOpen && onVerify && (
            <button
              id="btn-verify-incident"
              className={styles.btnSecondary}
              disabled={verifying}
              onClick={handleVerify}
            >
              {verifying ? 'Consultando banco…' : 'Reverificar con banco'}
            </button>
          )}
          {order.qr_image_base64 && (
            <>
              <button id="btn-download-qr" className={styles.btnSecondary} onClick={handleDownload}>
                ⬇ Descargar QR
              </button>
              <button id="btn-print-qr" className={styles.btnSecondary} onClick={handlePrint}>
                🖨 Imprimir
              </button>
            </>
          )}
          <button id="btn-close-order" className={styles.btnOutline} onClick={onClose}>
            Cerrar
          </button>
        </div>
        {verifyMessage && <p className={styles.verifyMessage} role="status">{verifyMessage}</p>}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.infoRow}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={styles.infoValue}>{value}</span>
  </div>
);

export default RenderView;
