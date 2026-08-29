"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { formatBs } from "@/mk/utils/numbers";
import {
  QR_STATE_COLOR,
  QR_STATE_LABEL,
  QrOrderState,
} from "../types";
import styles from "./DebtQrSection.module.css";

/**
 * Sección QR dinámico del detalle de una deuda (DES-22/23/24).
 *
 * - Indicador "En espera de confirmación de QR Dinámico" cuando el backend
 *   informa un QR PENDING (RN-ADM-06: el estado viene del backend, acá no
 *   se calcula nada).
 * - Al abrir el detalle con un QR pendiente se dispara UNA revalidación
 *   automática contra el banco (RN-ADM-07). Si el backend confirma el pago,
 *   se avisa al padre para recargar; si el banco no responde, se muestra el
 *   mensaje del backend y no se toca ningún estado local.
 * - Historial de TODOS los QR que incluyeron la deuda (DES-24/27), con su
 *   linaje de reemplazo. Un QR del historial jamás se presenta como activo.
 */

interface PendingQr {
  id: string;
  order_state: QrOrderState;
  created_at: string | null;
  expires_at: string | null;
  bank_account_id: number | null;
  amount: string | number;
  debt_dpto_ids: (number | string)[];
}

interface QrHistoryItem {
  id: string;
  order_state: QrOrderState;
  created_at: string | null;
  expires_at: string | null;
  paid_at: string | null;
  amount: string | number;
  debt_amount: string | number | null;
  qr_id_banco: string | null;
  transaction_id: string | null;
  payment_id: string | null;
  replaces: { id: string } | null;
  replaced_by: { id: string } | null;
  debt_dpto_ids: (number | string)[];
}

interface Props {
  debtDptoId: number | string;
  /** El backend confirmó el pago durante la revalidación: recargar el detalle */
  onPaymentConfirmed?: () => void;
}

const StateBadge = ({ state }: { state: QrOrderState }) => {
  const cfg = QR_STATE_COLOR[state];
  if (!cfg) return <span>{String(state)}</span>;
  return (
    <span
      className={styles.badge}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {QR_STATE_LABEL[state] ?? state}
    </span>
  );
};

const DebtQrSection = ({ debtDptoId, onPaymentConfirmed }: Props) => {
  const { execute } = useAxios();

  const [pendingQr, setPendingQr] = useState<PendingQr | null>(null);
  const [history, setHistory] = useState<QrHistoryItem[]>([]);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const verifiedOrderRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const [pendingRes, historyRes] = await Promise.all([
      execute(`/qr-dynamic/debts/${debtDptoId}/pending-qr`, "GET", {}, false, true),
      execute(`/qr-dynamic/debts/${debtDptoId}/qr-history`, "GET", {}, false, true),
    ]);
    const pending = pendingRes?.data?.success ? pendingRes.data.data : null;
    setPendingQr(pending?.pending ? pending.qr : null);
    setHistory(
      historyRes?.data?.success ? (historyRes.data.data.history ?? []) : [],
    );
    return pending?.pending ? (pending.qr as PendingQr) : null;
  }, [debtDptoId, execute]);

  // RN-ADM-07: al abrir con QR pendiente, UNA revalidación automática
  const verify = useCallback(
    async (qr: PendingQr) => {
      if (verifiedOrderRef.current === qr.id) return;
      verifiedOrderRef.current = qr.id;
      setVerifying(true);
      setVerifyMessage(null);
      const res = await execute(
        `/qr-dynamic/debts/orders/${qr.id}/verify`,
        "POST",
        {},
        false,
        true,
      );
      setVerifying(false);
      if (res?.data?.success) {
        const state = res.data.data?.order_state;
        if (state === QrOrderState.PAID) {
          setVerifyMessage(
            "El banco confirmó el pago de este QR: la deuda quedó pagada y el ingreso ya está disponible.",
          );
          await load();
          onPaymentConfirmed?.();
        } else if (state !== QrOrderState.PENDING) {
          // Expiró o se anuló en la última consulta: refrescar el indicador
          await load();
        }
      } else if (res?.data?.message) {
        // Banco sin responder (422): mostrar el mensaje del backend tal cual,
        // sin tocar estados locales
        setVerifyMessage(res.data.message);
      }
    },
    [execute, load, onPaymentConfirmed],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const qr = await load();
      if (!cancelled && qr) verify(qr);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtDptoId]);

  if (!pendingQr && history.length === 0) return null;

  return (
    <div className={styles.container} id="debt-qr-section">
      {pendingQr && (
        <div className={styles.pendingBanner}>
          <div className={styles.pendingTitle}>
            En espera de confirmación de QR Dinámico
            {verifying && (
              <span className={styles.verifying}> — verificando con el banco…</span>
            )}
          </div>
          <div className={styles.pendingInfo}>
            <span>Monto: {formatBs(Number(pendingQr.amount) || 0)}</span>
            <span>Generado: {pendingQr.created_at ?? "-/-"}</span>
            <span>Vence: {pendingQr.expires_at ?? "-/-"} (hora de Bolivia)</span>
            {pendingQr.debt_dpto_ids.length > 1 && (
              <span>
                Incluye {pendingQr.debt_dpto_ids.length} deudas en el mismo QR
              </span>
            )}
          </div>
        </div>
      )}

      {verifyMessage && <p className={styles.verifyMessage}>{verifyMessage}</p>}

      {history.length > 0 && (
        <div className={styles.historyBlock}>
          <button
            type="button"
            className={styles.historyToggle}
            onClick={() => setShowHistory((v) => !v)}
          >
            Historial de QR dinámicos ({history.length}){" "}
            {showHistory ? "▲" : "▼"}
          </button>
          {showHistory && (
            <div className={styles.historyList}>
              {history.map((h) => (
                <div key={h.id} className={styles.historyItem}>
                  <div className={styles.historyRow}>
                    <StateBadge state={h.order_state} />
                    <span className={styles.historyAmount}>
                      {formatBs(Number(h.debt_amount ?? h.amount) || 0)}
                    </span>
                    <span className={styles.historyDate}>
                      {h.created_at ?? "-/-"}
                    </span>
                  </div>
                  <div className={styles.historyMeta}>
                    {h.qr_id_banco && <span>QR banco: {h.qr_id_banco}</span>}
                    {h.transaction_id && (
                      <span>Transacción: {h.transaction_id}</span>
                    )}
                    {h.paid_at && <span>Pagado: {h.paid_at}</span>}
                    {h.replaced_by && <span>Reemplazado por otro QR</span>}
                    {h.replaces && <span>Reemplazó a un QR anterior</span>}
                    {h.debt_dpto_ids.length > 1 && (
                      <span>{h.debt_dpto_ids.length} deudas en el QR</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebtQrSection;
