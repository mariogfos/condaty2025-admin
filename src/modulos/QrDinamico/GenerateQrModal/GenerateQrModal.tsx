'use client';
import React, { useState } from 'react';
import useAxios from '@/mk/hooks/useAxios';
import { GenerateQrPayload, GenerateQrResponse, PaymentType, QrOrderState, QR_STATE_COLOR } from '../types';
import styles from './GenerateQrModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (order: GenerateQrResponse['data']) => void;
}

const GenerateQrModal = ({ open, onClose, onSuccess }: Props) => {
  const { execute, loaded } = useAxios();

  const [form, setForm] = useState<GenerateQrPayload>({
    amount: 0,
    currency: 'BOB',
    gloss: '',
    single_use: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GenerateQrPayload, string>>>({});
  const [generatedOrder, setGeneratedOrder] = useState<GenerateQrResponse['data'] | null>(null);
  const [apiError, setApiError] = useState('');

  if (!open) return null;

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.amount || form.amount <= 0) errs.amount = 'El monto debe ser mayor a 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setApiError('');

    const payload: GenerateQrPayload = {
      amount:    form.amount,
      currency:  form.currency,
      gloss:     form.gloss || undefined,
      single_use: form.single_use,
    };
    if (form.payment_type) payload.payment_type = form.payment_type;
    if (form.owner_id)     payload.owner_id = form.owner_id;

    const res: GenerateQrResponse = await execute('qr-dynamic/generate', 'POST', payload);

    if (res?.success && res.data) {
      setGeneratedOrder(res.data);
    } else {
      setApiError(res?.message ?? 'Error al generar el QR. Intenta nuevamente.');
    }
  };

  const handleDownload = () => {
    if (!generatedOrder?.qr_image_base64) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${generatedOrder.qr_image_base64}`;
    a.download = `QR_${generatedOrder.reference}.png`;
    a.click();
  };

  // ── Render: Generated QR ────────────────────────────────────────────────
  if (generatedOrder) {
    const cfg = QR_STATE_COLOR[generatedOrder.order_state ?? QrOrderState.REGISTERED];
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>✅ QR Generado</h2>
            <button id="btn-close-generated" className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>

          <div className={styles.successInfo}>
            <p className={styles.successRef}>{generatedOrder.reference}</p>
            <p className={styles.successAmount}>
              {parseFloat(generatedOrder.amount).toFixed(2)} {generatedOrder.currency}
            </p>
          </div>

          {generatedOrder.qr_image_base64 && (
            <div className={styles.qrBox}>
              <img
                src={`data:image/png;base64,${generatedOrder.qr_image_base64}`}
                alt="QR Dinámico"
                className={styles.qrImage}
              />
            </div>
          )}

          <div className={styles.actions}>
            {generatedOrder.qr_image_base64 && (
              <button id="btn-download-generated" className={styles.btnPrimary} onClick={handleDownload}>
                ⬇ Descargar QR
              </button>
            )}
            <button
              id="btn-done-generated"
              className={styles.btnOutline}
              onClick={() => onSuccess(generatedOrder)}
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Form ────────────────────────────────────────────────────────
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Generar QR Dinámico</h2>
          <button id="btn-close-generate-form" className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {apiError && <div className={styles.apiError}>{apiError}</div>}

        <div className={styles.form}>
          {/* Monto */}
          <div className={styles.field}>
            <label className={styles.label}>Monto *</label>
            <div className={styles.amountRow}>
              <input
                id="input-amount"
                type="number"
                min={1}
                step="0.01"
                className={`${styles.input} ${errors.amount ? styles.inputError : ''}`}
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <select
                id="select-currency"
                className={styles.select}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value as 'BOB' | 'USD' })}
              >
                <option value="BOB">BOB</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {errors.amount && <p className={styles.errorMsg}>{errors.amount}</p>}
          </div>

          {/* Glosa */}
          <div className={styles.field}>
            <label className={styles.label}>Glosa / Concepto</label>
            <input
              id="input-gloss"
              type="text"
              maxLength={100}
              className={styles.input}
              value={form.gloss ?? ''}
              onChange={(e) => setForm({ ...form, gloss: e.target.value })}
              placeholder="Ej: Expensa Enero 2026"
            />
          </div>

          {/* Tipo de pago */}
          <div className={styles.field}>
            <label className={styles.label}>Tipo de pago (opcional)</label>
            <select
              id="select-payment-type"
              className={styles.select}
              value={form.payment_type ?? ''}
              onChange={(e) => setForm({ ...form, payment_type: e.target.value as PaymentType || undefined })}
            >
              <option value="">Sin vincular</option>
              <option value={PaymentType.EXPENSE}>Expensas</option>
              <option value={PaymentType.RESERVATION}>Reservas</option>
              <option value={PaymentType.OUTLAY}>Egresos</option>
            </select>
          </div>

          {/* Uso único */}
          <div className={styles.fieldRow}>
            <label className={styles.label}>Uso único (se invalida al cobrar)</label>
            <input
              id="checkbox-single-use"
              type="checkbox"
              checked={form.single_use ?? true}
              onChange={(e) => setForm({ ...form, single_use: e.target.checked })}
              className={styles.checkbox}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button id="btn-cancel-generate" className={styles.btnOutline} onClick={onClose}>
            Cancelar
          </button>
          <button
            id="btn-submit-generate"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={!loaded}
          >
            {!loaded ? 'Generando...' : 'Generar QR'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateQrModal;
