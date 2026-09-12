"use client";
import React, { useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { formatBs } from "@/mk/utils/numbers";
import { QR_STATE_LABEL, QrOrderState } from "../types";
import { StateBadge } from "../shared";
import {
  FinancialDetailGrid,
  FinancialDetailSection,
  type FinancialDetailField,
} from "@/features/financial-records/FinancialDetailPrimitives";

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

const PaymentQrSection = ({ paymentId }: Props) => {
  const { execute } = useAxios();
  const [audit, setAudit] = useState<QrAudit | null>(null);

  useEffect(() => {
    if (!paymentId) return;
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
    // execute cambia de identidad en cada render (useAxios): con él en las
    // deps el fetch en vuelo se cancela y la sección no renderiza nunca
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  if (!audit) return null;

  const accountDisplay = audit.bank_account
    ? `${audit.bank_account.alias_holder ?? ""} ${audit.bank_account.account_number ?? ""}`.trim()
    : null;
  const debtsDisplay = audit.debts.length
    ? audit.debts
        .map(
          (debt) =>
            `#${debt.debt_dpto_id} (${formatBs(Number(debt.amount) || 0)})`,
        )
        .join(", ")
    : null;
  const fields: FinancialDetailField[] = [
    { id: "origin", label: "Origen del ingreso", value: "QR dinámico" },
    {
      id: "state",
      label: "Estado del QR",
      value: <StateBadge state={audit.order_state} />,
    },
    { id: "qr-id", label: "ID del QR", value: audit.id },
    { id: "bank-qr", label: "QR del banco", value: audit.qr_id_banco },
    {
      id: "transaction",
      label: "Transacción bancaria",
      value: audit.transaction_id,
    },
    { id: "paid-at", label: "Confirmado", value: audit.paid_at },
    {
      id: "bank-account",
      label: "Cuenta bancaria",
      value: accountDisplay,
    },
    {
      id: "debts",
      label: "Deudas pagadas",
      value: debtsDisplay,
      wide: true,
    },
    { id: "created-at", label: "Generado", value: audit.created_at },
    { id: "expires-at", label: "Vencía", value: audit.expires_at },
    { id: "category", label: "Categoría", value: audit.category?.name },
    {
      id: "amount",
      label: "Monto total del QR",
      value: `${formatBs(Number(audit.amount) || 0)} ${audit.currency ?? ""}`.trim(),
    },
    {
      id: "replaces",
      label: "Reemplazó a",
      value: audit.replaces
        ? `${audit.replaces.qr_id_banco ?? audit.replaces.id}${
            audit.replaces.order_state != null
              ? ` (${QR_STATE_LABEL[audit.replaces.order_state]})`
              : ""
          }`
        : "—",
    },
    {
      id: "replaced-by",
      label: "Reemplazado por",
      value: audit.replaced_by
        ? `${audit.replaced_by.qr_id_banco ?? audit.replaced_by.id}${
            audit.replaced_by.order_state != null
              ? ` (${QR_STATE_LABEL[audit.replaced_by.order_state]})`
              : ""
          }`
        : "—",
    },
    {
      id: "last-checked-at",
      label: "Última consulta al banco",
      value: audit.last_checked_at,
      wide: true,
    },
  ];

  return (
    <FinancialDetailSection
      id="payment-qr-section"
      title="Datos del QR dinámico"
      description="Origen bancario y trazabilidad del ingreso."
      defaultOpen={false}
    >
      <FinancialDetailGrid fields={fields} />
    </FinancialDetailSection>
  );
};

export default PaymentQrSection;
