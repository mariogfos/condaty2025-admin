"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useEvent } from "@/mk/hooks/useEvents";
import { formatBs } from "@/mk/utils/numbers";
import { QrOrderState } from "../types";
import { StateBadge, apiMessage } from "../shared";
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

const DebtQrSection = ({ debtDptoId, onPaymentConfirmed }: Props) => {
  const { execute } = useAxios();

  const [pendingQr, setPendingQr] = useState<PendingQr | null>(null);
  const [history, setHistory] = useState<QrHistoryItem[]>([]);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const verifiedOrderRef = useRef<string | null>(null);
  // Espejo del estado pendiente para el listener de tiempo real
  const pendingQrRef = useRef<PendingQr | null>(null);

  const load = useCallback(async () => {
    const [pendingRes, historyRes] = await Promise.all([
      execute(`/qr-dynamic/debts/${debtDptoId}/pending-qr`, "GET", {}, false, true),
      execute(`/qr-dynamic/debts/${debtDptoId}/qr-history`, "GET", {}, false, true),
    ]);
    const pending = pendingRes?.data?.success ? pendingRes.data.data : null;
    const qr: PendingQr | null = pending?.pending ? pending.qr : null;
    setPendingQr(qr);
    pendingQrRef.current = qr;
    setHistory(
      historyRes?.data?.success ? (historyRes.data.data.history ?? []) : [],
    );
    // Backend caído (error HTTP, no un 200 con pending:false): avisar en vez
    // de desaparecer — que "sin QR" nunca se confunda con "no pude consultar"
    setLoadFailed(Boolean(pendingRes?.error));
    return qr;
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
        const state = Number(res.data.data?.order_state);
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
      } else {
        // Banco sin responder (422): se muestra el mensaje del backend tal
        // cual, sin tocar estados locales ni exponer detalles (DES-32)
        const message = apiMessage(res);
        if (message) setVerifyMessage(message);
      }
    },
    [execute, load, onPaymentConfirmed],
  );

  useEffect(() => {
    let cancelled = false;
    setVerifyMessage(null);
    (async () => {
      const qr = await load();
      if (!cancelled && qr) verify(qr);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtDptoId]);

  // DES-30: un pago QR confirmado en tiempo real (webhook/conciliación)
  // refresca la deuda abierta sin que el administrador haga nada.
  // Solo reacciona si ESTA deuda esperaba un QR: un pago ajeno del mismo
  // condominio no dispara recargas en cascada.
  const onRealtimeConfirm = useCallback(async () => {
    if (!pendingQrRef.current) return;
    const stillPending = await load();
    if (!stillPending) onPaymentConfirmed?.();
  }, [load, onPaymentConfirmed]);
  useEvent("payment:confirmed", onRealtimeConfirm);

  if (!pendingQr && history.length === 0 && !loadFailed) return null;

  return (
    <div className={styles.container} id="debt-qr-section">
      {loadFailed && !pendingQr && (
        <p className={styles.verifyMessage}>
          No se pudo consultar el estado QR de esta deuda. Intente nuevamente.
        </p>
      )}
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
