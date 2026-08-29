"use client";
import React, { useEffect, useRef, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { formatBs } from "@/mk/utils/numbers";
import { QR_STATE_COLOR, QR_STATE_LABEL, QrOrderState } from "../types";
import styles from "./PaymentQrSection.module.css";

/**
 * Origen QR dinámico de un ingreso (DES-25/26/27).
 *
 * Consulta qr-dynamic/payments/{paymentId}/order: si el ingreso no proviene
 * de un QR dinámico (404) no renderiza nada — un ingreso manual con método
 * "Código QR" sigue viéndose como siempre. Si proviene, muestra el origen
 * como información ADICIONAL (el método de pago general sigue siendo
 * "Código QR") y la auditoría completa expandible, linaje incluido.
 * Todo es persistente: viene del backend, nada se calcula acá.
 */

interface QrAudit {
  id: string;
  created_at: string | null;
  bank_account: { id: number; alias_holder?: string; account_number?: string } | null;
  category: { id: number; name?: string } | null;
  debts: {
    debt_dpto_id: number;
    amount: string | number;
    status: string;
    payment_id: string | number | null;
  }[];
  amount: string | number;
  currency: string;
  qr_id_banco: string | null;
  order_state: QrOrderState;
  expires_at: string | null;
  replaces: { id: string; qr_id_banco?: string; order_state?: QrOrderState } | null;
  replaced_by: { id: string; qr_id_banco?: string; order_state?: QrOrderState } | null;
  paid_at: string | null;
  transaction_id: string | null;
  payment_id: string | null;
  last_checked_at: string | null;
}

interface Props {
  paymentId: number | string;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className={styles.row}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value}>{value ?? "-/-"}</span>
  </div>
);

const PaymentQrSection = ({ paymentId }: Props) => {
  const { execute } = useAxios();
  const [audit, setAudit] = useState<QrAudit | null>(null);
  const [expanded, setExpanded] = useState(false);
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    if (loadedForRef.current === String(paymentId)) return;
    loadedForRef.current = String(paymentId);
    let cancelled = false;
    (async () => {
      const res = await execute(
        `/qr-dynamic/payments/${paymentId}/order`,
        "GET",
        {},
        false,
        true,
      );
      if (!cancelled) {
        setAudit(res?.data?.success ? res.data.data : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentId, execute]);

  if (!audit) return null;

  const stateCfg = QR_STATE_COLOR[audit.order_state];

  return (
    <div className={styles.container} id="payment-qr-section">
      <div className={styles.header}>
        <span className={styles.originBadge}>Origen: QR Dinámico</span>
        {stateCfg && (
          <span
            className={styles.stateBadge}
            style={{ color: stateCfg.color, backgroundColor: stateCfg.bg }}
          >
            {QR_STATE_LABEL[audit.order_state]}
          </span>
        )}
      </div>

      <div className={styles.grid}>
        <Row label="ID del QR" value={audit.id} />
        <Row label="QR del banco" value={audit.qr_id_banco} />
        <Row label="Transacción bancaria" value={audit.transaction_id} />
        <Row label="Confirmado" value={audit.paid_at} />
        <Row
          label="Cuenta bancaria"
          value={
            audit.bank_account
              ? `${audit.bank_account.alias_holder ?? ""} ${audit.bank_account.account_number ?? ""}`.trim()
              : null
          }
        />
        <Row
          label="Deudas pagadas"
          value={
            audit.debts.length
              ? audit.debts
                  .map((d) => `#${d.debt_dpto_id} (${formatBs(Number(d.amount) || 0)})`)
                  .join(", ")
              : null
          }
        />
      </div>

      <button
        type="button"
        className={styles.toggle}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Ocultar auditoría ▲" : "Ver auditoría completa ▼"}
      </button>

      {expanded && (
        <div className={styles.grid}>
          <Row label="Generado" value={audit.created_at} />
          <Row label="Vencía" value={audit.expires_at} />
          <Row label="Categoría" value={audit.category?.name} />
          <Row
            label="Monto total del QR"
            value={`${formatBs(Number(audit.amount) || 0)} ${audit.currency ?? ""}`}
          />
          <Row
            label="Reemplazó a"
            value={
              audit.replaces
                ? `${audit.replaces.qr_id_banco ?? audit.replaces.id}${
                    audit.replaces.order_state != null
                      ? ` (${QR_STATE_LABEL[audit.replaces.order_state]})`
                      : ""
                  }`
                : "—"
            }
          />
          <Row
            label="Reemplazado por"
            value={
              audit.replaced_by
                ? `${audit.replaced_by.qr_id_banco ?? audit.replaced_by.id}${
                    audit.replaced_by.order_state != null
                      ? ` (${QR_STATE_LABEL[audit.replaced_by.order_state]})`
                      : ""
                  }`
                : "—"
            }
          />
          <Row label="Última consulta al banco" value={audit.last_checked_at} />
        </div>
      )}
    </div>
  );
};

export default PaymentQrSection;
