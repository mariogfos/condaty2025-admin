"use client";

import { Fragment, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  MoreVertical,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { financialRecordsApi } from "./api";
import type {
  FinancialCapabilities,
  FinancialMenuAction,
  FinancialRecordReference,
} from "./types";

type VerificationResult = {
  has_changes?: boolean;
  applied?: boolean;
  debt_dptos_found?: number;
  parent_debts_found?: number;
  reservations_found?: number;
  debt_dptos?: Array<{ changes?: Record<string, unknown> }>;
  parent_debts?: Array<{ changes?: Record<string, unknown> }>;
  reservations?: Array<{ changes?: Record<string, unknown> }>;
};

type Props = {
  record: FinancialRecordReference;
  capabilities?: FinancialCapabilities | null;
  customActions?: FinancialMenuAction[];
  onChanged?: () => void | Promise<void>;
  previewMode?: boolean;
};

const extractError = (data: any, error: any, fallback: string) => {
  const validationErrors = error?.data?.errors;
  const firstValidation = validationErrors
    ? Object.values(validationErrors).flat().find(Boolean)
    : null;

  return String(
    firstValidation ||
      data?.message ||
      error?.data?.message ||
      error?.message ||
      fallback,
  );
};

const normalizeDateInput = (value?: string | null) => {
  if (!value) return "";
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset();
  return new Date(parsed.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const getLocalToday = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export const FinancialRecordActions = ({
  record,
  capabilities,
  customActions = [],
  onChanged,
  previewMode = false,
}: Props) => {
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const notifyChanged = async () => {
    if (onChanged) await onChanged();
  };

  const openPenaltyEditor = () => {
    setPenaltyAmount(String(record.penaltyAmount ?? 0));
    setReason("");
    setFormError("");
    setPenaltyOpen(true);
  };

  const openDateEditor = () => {
    setPaidAt(normalizeDateInput(record.paidAt));
    setReason("");
    setFormError("");
    setDateOpen(true);
  };

  const scanPaymentState = async () => {
    setVerificationOpen(true);
    setVerification(null);
    setReason("");
    setFormError("");
    setVerificationLoading(true);

    if (previewMode) {
      setVerification({
        has_changes: true,
        applied: false,
        debt_dptos_found: 1,
        parent_debts_found: 0,
        reservations_found: 1,
      });
      setVerificationLoading(false);
      return;
    }

    const { data, error } = await execute(
      financialRecordsApi.verifyPaymentState(record.id),
      "POST",
      { mode: "scan" },
      false,
      true,
    );

    if (data?.success) {
      setVerification(data.data || {});
      await notifyChanged();
    } else {
      setFormError(
        extractError(data, error, "No se pudo verificar el estado del pago."),
      );
    }
    setVerificationLoading(false);
  };

  const savePenalty = async () => {
    const amount = Number(penaltyAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Ingresa un monto válido mayor o igual a Bs 0,00.");
      return;
    }
    if (reason.trim().length < 3) {
      setFormError("Indica el motivo de esta corrección.");
      return;
    }

    if (previewMode) {
      showToast("Corrección simulada: la muestra no modifica datos", "info");
      setPenaltyOpen(false);
      return;
    }

    setSubmitting(true);
    setFormError("");
    const { data, error } = await execute(
      financialRecordsApi.penalty(record.id),
      "PUT",
      { amount: Math.round(amount * 100) / 100, reason: reason.trim() },
      false,
      true,
    );

    if (data?.success) {
      showToast(data.message || "Multa actualizada", "success");
      setPenaltyOpen(false);
      await notifyChanged();
    } else {
      setFormError(extractError(data, error, "No se pudo editar la multa."));
    }
    setSubmitting(false);
  };

  const savePaidAt = async () => {
    if (!paidAt) {
      setFormError("Selecciona la fecha de pago.");
      return;
    }
    if (reason.trim().length < 3) {
      setFormError("Indica el motivo de esta corrección.");
      return;
    }

    if (previewMode) {
      showToast("Corrección simulada: la muestra no modifica datos", "info");
      setDateOpen(false);
      return;
    }

    setSubmitting(true);
    setFormError("");
    const { data, error } = await execute(
      financialRecordsApi.paidAt(record),
      "PUT",
      { paid_at: paidAt, reason: reason.trim() },
      false,
      true,
    );

    if (data?.success) {
      showToast(data.message || "Fecha de pago actualizada", "success");
      setDateOpen(false);
      await notifyChanged();
    } else {
      setFormError(
        extractError(data, error, "No se pudo editar la fecha de pago."),
      );
    }
    setSubmitting(false);
  };

  const repairPaymentState = async () => {
    if (reason.trim().length < 3) {
      setFormError("Indica por qué debe repararse el estado.");
      return;
    }

    if (previewMode) {
      showToast("Reparación simulada: la muestra no modifica datos", "info");
      setVerificationOpen(false);
      return;
    }

    setSubmitting(true);
    setFormError("");
    const { data, error } = await execute(
      financialRecordsApi.verifyPaymentState(record.id),
      "POST",
      { mode: "fix", reason: reason.trim() },
      false,
      true,
    );

    if (data?.success) {
      showToast(data.message || "Estado financiero reparado", "success");
      setVerification(data.data || {});
      setVerificationOpen(false);
      await notifyChanged();
    } else {
      setFormError(
        extractError(data, error, "No se pudo reparar el estado del pago."),
      );
    }
    setSubmitting(false);
  };

  const actions: FinancialMenuAction[] = [];
  if (capabilities?.can_edit_penalty) {
    actions.push({
      id: "edit-penalty",
      label: "Editar multa",
      icon: <CircleDollarSign className="size-4" />,
      onSelect: openPenaltyEditor,
    });
  }
  if (capabilities?.can_verify_payment) {
    actions.push({
      id: "verify-payment",
      label: "Verificar estado del pago",
      icon: <ShieldCheck className="size-4" />,
      onSelect: () => void scanPaymentState(),
    });
  }
  if (capabilities?.can_edit_paid_at) {
    actions.push({
      id: "edit-paid-at",
      label: "Editar fecha de pago",
      icon: <CalendarDays className="size-4" />,
      onSelect: openDateEditor,
    });
  }
  actions.push(
    ...customActions.filter((action) => !action.destructive),
    ...customActions.filter((action) => action.destructive),
  );

  if (actions.length === 0) return null;

  const changedGroups =
    Number(verification?.debt_dptos_found || 0) +
    Number(verification?.parent_debts_found || 0) +
    Number(verification?.reservations_found || 0);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Más acciones"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="financial-ui w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Acciones del registro</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {actions.map((action, index) => (
              <Fragment key={action.id}>
                {action.destructive && index > 0 ? (
                  <DropdownMenuSeparator />
                ) : null}
                <DropdownMenuItem
                  disabled={action.disabled}
                  variant={action.destructive ? "destructive" : "default"}
                  onClick={action.onSelect}
                  className="min-h-9"
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              </Fragment>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={penaltyOpen} onOpenChange={setPenaltyOpen}>
        <AlertDialogContent className="financial-ui max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Editar multa</AlertDialogTitle>
            <AlertDialogDescription>
              Cambia únicamente el monto de la multa. La deuda y sus pagos se
              recalcularán sin crear ni eliminar ingresos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="financial-penalty-amount">Monto en bolivianos</Label>
              <Input
                id="financial-penalty-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={penaltyAmount}
                onChange={(event) => setPenaltyAmount(event.target.value)}
              />
            </div>
            <ReasonField id="financial-penalty-reason" value={reason} onChange={setReason} />
            <FormError message={formError} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <Button onClick={() => void savePenalty()} disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar corrección"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dateOpen} onOpenChange={setDateOpen}>
        <AlertDialogContent className="financial-ui max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Editar fecha de pago</AlertDialogTitle>
            <AlertDialogDescription>
              Esta corrección actualiza el comprobante y los registros
              financieros vinculados. No cambia el monto ni el estado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="financial-paid-at">Fecha de pago</Label>
              <Input
                id="financial-paid-at"
                type="date"
                max={getLocalToday()}
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
              />
            </div>
            <ReasonField id="financial-paid-at-reason" value={reason} onChange={setReason} />
            <FormError message={formError} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <Button onClick={() => void savePaidAt()} disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar corrección"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <AlertDialogContent className="financial-ui max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Verificar estado del pago</AlertDialogTitle>
            <AlertDialogDescription>
              Se compara la deuda con sus ingresos y pagos parciales. La
              verificación no marca nada como pagado por sí sola.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4">
            {verificationLoading ? (
              <div className="flex min-h-28 items-center justify-center rounded-xl border border-border bg-muted/35 text-sm text-muted-foreground">
                <RefreshCw className="mr-2 size-4 animate-spin" />
                Verificando datos relacionados…
              </div>
            ) : verification?.has_changes ? (
              <>
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                  Se encontraron {changedGroups} grupo{changedGroups === 1 ? "" : "s"}{" "}
                  con estados inconsistentes. La reparación usará los detalles
                  de pago existentes como fuente de verdad.
                </div>
                <ReasonField
                  id="financial-payment-state-reason"
                  value={reason}
                  onChange={setReason}
                />
              </>
            ) : verification ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
                No se encontraron inconsistencias. La deuda, sus ingresos y las
                reservas vinculadas ya tienen un estado coherente.
              </div>
            ) : null}
            <FormError message={formError} />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting || verificationLoading}>
              Cerrar
            </AlertDialogCancel>
            {verification?.has_changes ? (
              <Button
                onClick={() => void repairPaymentState()}
                disabled={submitting || verificationLoading}
              >
                {submitting ? "Corrigiendo…" : "Corregir estados"}
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ReasonField = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="grid gap-2">
    <Label htmlFor={id}>Motivo de la corrección</Label>
    <Textarea
      id={id}
      required
      value={value}
      maxLength={500}
      placeholder="Describe brevemente por qué se realiza este cambio"
      onChange={(event) => onChange(event.target.value)}
    />
    <span className="text-right text-xs text-muted-foreground">{value.length}/500</span>
  </div>
);

const FormError = ({ message }: { message?: string }) =>
  message ? (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  ) : null;
