'use client';
import React, { useRef } from 'react';
import useAxios from '@/mk/hooks/useAxios';
import { QrOrder, QrOrderState, QR_STATE_LABEL, QR_STATE_COLOR, PAYMENT_TYPE_LABEL } from '../types';
import styles from './RenderView.module.css';

interface Props {
  order: QrOrder;
  onClose: () => void;
  onCancel: () => void;
}

const formatDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
};

const RenderView = ({ order, onClose, onCancel }: Props) => {
  const { execute: doCancel, loaded } = useAxios();
  const printRef = useRef<HTMLDivElement>(null);
  const cfg = QR_STATE_COLOR[order.order_state];

  const handleCancel = async () => {
    if (!confirm('¿Confirmas la anulación de este QR?')) return;
    const res = await doCancel(`qr-dynamic/orders/${order.id}/cancel`, 'POST');
    if (res?.success) onCancel();
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
            <button id="btn-close-render-view" className={styles.closeBtn} onClick={onClose}>✕</button>
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

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          <InfoRow label="Referencia banco" value={order.qr_id_banco ?? '—'} />
          <InfoRow label="Monto" value={`${parseFloat(order.amount).toFixed(2)} ${order.currency}`} />
          <InfoRow label="Tipo de pago" value={order.payment_type ? PAYMENT_TYPE_LABEL[order.payment_type] : '—'} />
          <InfoRow label="Fecha orden" value={formatDate(order.order_date)} />
          <InfoRow label="Fecha pago" value={formatDate(order.pay_date)} />
          <InfoRow label="Hora pago" value={order.pay_hour ?? '—'} />
          <InfoRow label="N° transacción" value={order.transaction_id ?? '—'} />
          <InfoRow label="Vencimiento" value={formatDate(order.expiration_date)} />
          <InfoRow label="Uso único" value={order.single_use ? 'Sí' : 'No'} />
          {order.consolidated_at && (
            <InfoRow label="Conciliado" value={new Date(order.consolidated_at).toLocaleDateString('es-BO')} />
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
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
          {order.order_state === QrOrderState.REGISTERED && (
            <button id="btn-cancel-qr" className={styles.btnDanger} onClick={handleCancel} disabled={!loaded}>
              Anular QR
            </button>
          )}
          <button id="btn-close-order" className={styles.btnOutline} onClick={onClose}>
            Cerrar
          </button>
        </div>
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
