'use client';
import React from 'react';
import styles from '../GenerateQrModal/GenerateQrModal.module.css';

// Forma cruda que devuelve el banco (claves en minúscula, sin guiones).
export interface BankTxn {
  qrid: string;
  amount: string;
  currency: string;
  orderstate: string;
  orderdate: string | null; // ddmmyyyy
  paydate: string | null;   // ddmmyyyy
  reference: string;
  transactionid: string;
  accountreference: string;
  type: string;
}

interface Props {
  loading: boolean;
  error: string;
  txns: BankTxn[] | null;
  onReload: () => void;
  onClose: () => void;
}

const BANK_STATE_LABEL: Record<string, string> = {
  '1': 'Registrado',
  '2': 'Pagado',
  '3': 'Anulado',
  '4': 'Vencido',
};

// El banco manda las fechas como ddmmyyyy.
const fmtBankDate = (d: string | null) => {
  if (!d || d.length !== 8) return '—';
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

const cell: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid rgba(128,128,128,0.2)', fontSize: 13, whiteSpace: 'nowrap' };
const th: React.CSSProperties = { ...cell, textAlign: 'left', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--cModalSurface, #1e1e1e)' };

const BankTransactionsModal: React.FC<Props> = ({ loading, error, txns, onReload, onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        style={{ maxWidth: 900, width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Últimos QR en el banco</h2>
          <button id="btn-close-bank" className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 12px' }}>
          Consultado directo al banco: últimos 7 días + hoy. Sirve para verificar
          qué QR tiene registrados el banco.
        </p>

        {loading && <p style={{ padding: 20, textAlign: 'center' }}>Consultando al banco…</p>}

        {!loading && error && (
          <div>
            <p className={styles.apiError}>{error}</p>
            <button id="btn-retry-bank" className={styles.btnOutline} onClick={onReload}>Reintentar</button>
          </div>
        )}

        {!loading && !error && txns && txns.length === 0 && (
          <p style={{ padding: 20, textAlign: 'center', opacity: 0.7 }}>
            El banco no tiene QR registrados en este rango.
          </p>
        )}

        {!loading && !error && txns && txns.length > 0 && (
          <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>QR ID</th>
                  <th style={th}>Monto</th>
                  <th style={th}>Estado</th>
                  <th style={th}>Fecha orden</th>
                  <th style={th}>Fecha pago</th>
                  <th style={th}>Referencia</th>
                  <th style={th}>Transacción</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.qrid}>
                    <td style={{ ...cell, fontFamily: 'monospace', fontSize: 12 }}>{t.qrid}</td>
                    <td style={cell}>{parseFloat(t.amount).toFixed(2)} {t.currency}</td>
                    <td style={cell}>{BANK_STATE_LABEL[t.orderstate] ?? t.orderstate}</td>
                    <td style={cell}>{fmtBankDate(t.orderdate)}</td>
                    <td style={cell}>{fmtBankDate(t.paydate)}</td>
                    <td style={cell}>{t.reference || '—'}</td>
                    <td style={cell}>{t.transactionid && t.transactionid !== '0' ? t.transactionid : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.actions} style={{ marginTop: 16 }}>
          <button id="btn-reload-bank" className={styles.btnOutline} onClick={onReload} disabled={loading}>
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankTransactionsModal;
