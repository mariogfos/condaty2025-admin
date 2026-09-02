"use client";

import { useMemo, useState } from "react";
import { Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinancialDetailModal } from "../FinancialDetailModal";
import {
  FinancialDetailGrid,
  FinancialDetailSection,
  type FinancialDetailField,
} from "../FinancialDetailPrimitives";
import type {
  FinancialRecordReference,
  FinancialStatusTone,
  FinancialWorkspace,
} from "../types";

type ExampleKey = "debt" | "payment" | "expense" | "partial";

type Example = {
  title: string;
  description: string;
  amount: string;
  date: string;
  status: string;
  tone: FinancialStatusTone;
  record: FinancialRecordReference;
  fields: FinancialDetailField[];
};

const EXAMPLES: Record<ExampleKey, Example> = {
  debt: {
    title: "Detalle de deuda",
    description: "Expensa pendiente con una multa corregible.",
    amount: "Bs 450,00",
    date: "Septiembre 2026 · vence el 10/09/2026",
    status: "Por cobrar",
    tone: "warning",
    record: { type: "debt", id: 150001, penaltyAmount: 50 },
    fields: [
      { id: "unit", label: "Unidad", value: "Casa 12" },
      { id: "owner", label: "Propietario", value: "María Pérez" },
      { id: "period", label: "Periodo", value: "Septiembre 2026" },
      { id: "principal", label: "Deuda", value: "Bs 400,00" },
      { id: "penalty", label: "Multa", value: "Bs 50,00" },
      { id: "total", label: "Saldo pendiente", value: "Bs 450,00" },
    ],
  },
  payment: {
    title: "Detalle del ingreso",
    description: "Pago confirmado aplicado a una expensa.",
    amount: "Bs 450,00",
    date: "2 de septiembre de 2026, 10:15",
    status: "Cobrado",
    tone: "success",
    record: {
      type: "payment",
      id: "00000000-0000-4000-8000-000000000151",
      paidAt: "2026-09-02",
    },
    fields: [
      { id: "unit", label: "Unidad", value: "Casa 12" },
      { id: "method", label: "Método", value: "Transferencia bancaria" },
      { id: "voucher", label: "Nro. de respaldo", value: "TRX-29483" },
      { id: "owner", label: "Pagado por", value: "María Pérez" },
      { id: "registered", label: "Registrado por", value: "Ana Rojas" },
      { id: "status", label: "Estado", value: "Cobrado", tone: "success" },
    ],
  },
  expense: {
    title: "Detalle del egreso",
    description: "Gasto operativo con comprobante adjunto.",
    amount: "Bs 1.280,00",
    date: "1 de septiembre de 2026, 16:30",
    status: "Pagado",
    tone: "success",
    record: { type: "expense", id: 150152, paidAt: "2026-09-01" },
    fields: [
      { id: "category", label: "Categoría", value: "Mantenimiento" },
      { id: "subcategory", label: "Subcategoría", value: "Jardinería" },
      { id: "method", label: "Método", value: "Transferencia bancaria" },
      { id: "account", label: "Cuenta", value: "Banco Ganadero · 123456" },
      { id: "registered", label: "Registrado por", value: "Ana Rojas" },
      { id: "description", label: "Descripción", value: "Servicio mensual", wide: true },
    ],
  },
  partial: {
    title: "Detalle de pago parcial",
    description: "Deuda con dos abonos confirmados.",
    amount: "Bs 230,00",
    date: "Expensa septiembre 2026",
    status: "Pago parcial",
    tone: "warning",
    record: { type: "debt", id: 150153, penaltyAmount: 30 },
    fields: [
      { id: "unit", label: "Unidad", value: "Dpto. 4B" },
      { id: "principal", label: "Deuda", value: "Bs 600,00" },
      { id: "penalty", label: "Multa", value: "Bs 30,00" },
      { id: "paid", label: "Total pagado", value: "Bs 400,00" },
      { id: "remaining", label: "Saldo restante", value: "Bs 230,00", tone: "warning" },
      { id: "payments", label: "Abonos confirmados", value: "2" },
    ],
  },
};

const makeWorkspace = (example: Example): FinancialWorkspace => ({
  record: {
    type: example.record.type,
    id: String(example.record.id),
  },
  capabilities: {
    can_edit_penalty: example.record.type === "debt",
    can_verify_payment: example.record.type === "debt",
    can_edit_paid_at:
      example.record.type === "payment" || example.record.type === "expense",
  },
  history_notice: "Datos de muestra para revisar el componente en Test.",
  history: [
    {
      id: "example-action-2",
      source: "audit",
      action: "payment_state_repaired",
      actor: { id: "admin-1", name: "Ana Rojas", type: "ADM" },
      reason: "El ingreso existía, pero la deuda seguía pendiente.",
      before: { debt: { status: "A" }, reservation: { status: "A" } },
      after: { debt: { status: "P" }, reservation: { status: "L" } },
      occurred_at: "2026-09-02T10:20:00-04:00",
      correlation_id: "example-correlation-2",
    },
    {
      id: "example-action-1",
      source: "record",
      action: `${example.record.type}_created`,
      actor: { id: "admin-2", name: "Carlos Méndez", type: "ADM" },
      occurred_at: "2026-09-01T09:10:00-04:00",
    },
  ],
});

export const FinancialDetailExamples = () => {
  const [selected, setSelected] = useState<ExampleKey | null>(null);
  const [feedback, setFeedback] = useState("");
  const example = selected ? EXAMPLES[selected] : null;
  const workspace = useMemo(
    () => (example ? makeWorkspace(example) : undefined),
    [example],
  );

  const copyReference = async () => {
    if (!example) return;
    await navigator.clipboard.writeText(
      `${example.record.type}:${example.record.id}`,
    );
    setFeedback("Referencia copiada");
  };

  return (
    <div className="financial-ui">
      <div className="min-h-full rounded-2xl bg-background p-5 text-foreground sm:p-7">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
            UI Lab · sólo Test
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Detalles financieros
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Muestras ensambladas del componente común. Sirven para revisar
            jerarquía, estados, scroll, acciones e historial sin modificar datos.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {(Object.entries(EXAMPLES) as [ExampleKey, Example][]).map(
              ([key, item]) => (
                <article
                  key={key}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-medium">{item.title}</h2>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      {item.status}
                    </span>
                  </div>
                  <Button className="mt-5" onClick={() => setSelected(key)}>
                    <Eye className="size-4" />
                    Abrir muestra
                  </Button>
                </article>
              ),
            )}
          </div>

          {feedback ? (
            <p className="mt-4 text-sm text-primary" role="status">
              {feedback}
            </p>
          ) : null}
        </div>

        {example && workspace ? (
          <FinancialDetailModal
            open
            onClose={() => {
              setSelected(null);
              setFeedback("");
            }}
            title={example.title}
            description={example.description}
            record={example.record}
            summary={{
              amount: example.amount,
              date: example.date,
              eyebrow: "Monto del comprobante",
              status: { label: example.status, tone: example.tone },
            }}
            customActions={[
              {
                id: "copy-example-reference",
                label: "Copiar referencia",
                icon: <Copy className="size-4" />,
                onSelect: () => void copyReference(),
              },
            ]}
            previewMode
            workspaceOverride={workspace}
            footer={
              <Button variant="secondary">Acción principal de muestra</Button>
            }
          >
            <FinancialDetailSection title="Datos del registro">
              <FinancialDetailGrid fields={example.fields} />
            </FinancialDetailSection>
          </FinancialDetailModal>
        ) : null}
      </div>
    </div>
  );
};
