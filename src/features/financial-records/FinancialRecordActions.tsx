"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  BadgeDollarSign,
  CalendarDays,
  CircleDollarSign,
  MoreVertical,
  Percent,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { formatBs } from "@/mk/utils/numbers";
import { financialRecordsApi } from "./api";
import { penaltyEditError } from "./penaltyEdit";
import { discountTypes } from "./debtDiscountFields";
import styles from "./FinancialDetail.module.css";
import type {
  FinancialCapabilities,
  DebtDiscountType,
  FinancialMenuAction,
  FinancialRecordReference,
  PenaltyEditLimits,
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

const PENALTY_UNCONFIRMED = "No se pudo confirmar la corrección. Vuelve a abrir el detalle para comprobar el estado de la multa antes de intentarlo otra vez.";

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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountType, setDiscountType] = useState<DebtDiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [recordAmount, setRecordAmount] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyLimits, setPenaltyLimits] = useState<PenaltyEditLimits | undefined>(record.penalty_edit);
  const [paidAt, setPaidAt] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    setPenaltyLimits(record.penalty_edit);
  }, [record.id, record.type, record.penalty_edit]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (event: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const notifyChanged = async () => {
    if (onChanged) await onChanged();
  };

  const openPenaltyEditor = () => {
    setPenaltyAmount(String(record.penaltyAmount ?? 0));
    setReason("");
    setFormError("");
    setPenaltyOpen(true);
  };

  const openDiscountEditor = () => {
    setDiscountType(record.discount_type ?? "percent");
    setDiscountValue(record.discount_value == null ? "" : String(record.discount_value));
    setReason("");
    setFormError("");
    setDiscountOpen(true);
  };

  const openAmountEditor = () => {
    setRecordAmount(String(record.amount ?? ""));
    setReason("");
    setFormError("");
    setAmountOpen(true);
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
    if (submitting) return;
    const validation = penaltyEditError(penaltyAmount, penaltyLimits);
    if (validation) {
      setFormError(validation);
      return;
    }
    const amount = Math.round(Number(penaltyAmount.replace(",", ".")) * 100) / 100;
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
    try {
      const { data, error } = await execute(
        financialRecordsApi.penalty(record.id),
        "PUT",
        { amount, reason: reason.trim() },
        false,
        true,
      );

      if (data?.success) {
        showToast(data.message || "Multa actualizada", "success");
        setPenaltyOpen(false);
        await notifyChanged();
      } else {
        let message = extractError(data, error, "No se pudo editar la multa.");
        if (error?.status === 0 || error?.status === 422) {
          // Read the current limits after a rejection or an unreadable response.
          // A correction is never retried automatically.
          const latest = await execute(financialRecordsApi.workspace(record), "GET", {}, false, true);
          if (latest.data?.success
            && latest.data.data?.record?.type === record.type
            && String(latest.data.data?.record?.id) === String(record.id)) {
            const limits = latest.data.data.record.penalty_edit as PenaltyEditLimits | undefined;
            setPenaltyLimits(limits);
            message = penaltyEditError(penaltyAmount, limits) || message;
          }
          if (error?.status === 0 && message === error?.message) {
            message = PENALTY_UNCONFIRMED;
          }
        }
        setFormError(message);
      }
    } catch {
      setFormError(PENALTY_UNCONFIRMED);
    } finally {
      setSubmitting(false);
    }
  };

  const saveDiscount = async () => {
    const value = discountValue.trim().replace(",", ".");
    const maximum = discountType === "percent" ? 100 : Number(record.gross_principal_amount ?? 99999999.99);
    if (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) > maximum) {
      setFormError(discountType === "percent"
        ? "Ingresa un porcentaje entre 0 y 100, con hasta dos decimales."
        : "Ingresa un importe válido que no supere el capital.");
      return;
    }
    if (reason.trim().length < 3) {
      setFormError("Indica el motivo de esta corrección.");
      return;
    }
    if (previewMode) {
      setDiscountOpen(false);
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const { data, error } = await execute(financialRecordsApi.discount(record.id), "PUT", {
        type: discountType,
        value: Number(value),
        reason: reason.trim(),
      }, false, true);
      if (!data?.success) {
        setFormError(extractError(data, error, "No se pudo guardar el descuento."));
        return;
      }
      showToast(Number(value) === 0 && data.data?.changed ? "Descuento eliminado" : data.message || "Descuento actualizado", "success");
      setDiscountOpen(false);
      await notifyChanged();
    } catch {
      setFormError("No se pudo completar la solicitud. Vuelve a consultar el detalle.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveAmount = async () => {
    const amount = Number(recordAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Ingresa un monto válido mayor a Bs 0,00.");
      return;
    }
    if (reason.trim().length < 3) {
      setFormError("Indica el motivo de esta corrección.");
      return;
    }

    if (previewMode) {
      showToast("Corrección simulada: la muestra no modifica datos", "info");
      setAmountOpen(false);
      return;
    }

    setSubmitting(true);
    setFormError("");
    const { data, error } = await execute(
      financialRecordsApi.amount(record),
      "PUT",
      { amount: Math.round(amount * 100) / 100, reason: reason.trim() },
      false,
      true,
    );

    if (data?.success) {
      showToast(data.message || "Monto actualizado", "success");
      setAmountOpen(false);
      await notifyChanged();
    } else {
      setFormError(extractError(data, error, "No se pudo editar el monto."));
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
  if (capabilities?.can_edit_amount) {
    actions.push({
      id: "edit-amount",
      label: "Editar monto",
      icon: <BadgeDollarSign size={18} aria-hidden="true" />,
      onSelect: openAmountEditor,
    });
  }
  if (capabilities?.can_edit_penalty) {
    actions.push({
      id: "edit-penalty",
      label: "Editar multa",
      icon: <CircleDollarSign size={18} aria-hidden="true" />,
      onSelect: openPenaltyEditor,
    });
  }
  const discountTitle = record.discount_type ? "Editar descuento" : "Aplicar descuento";
  if (capabilities?.can_edit_discount) {
    actions.push({
      id: "edit-discount",
      label: discountTitle,
      icon: <Percent size={18} aria-hidden="true" />,
      onSelect: openDiscountEditor,
    });
  }
  if (capabilities?.can_verify_payment) {
    actions.push({
      id: "verify-payment",
      label: "Verificar estado del pago",
      icon: <ShieldCheck size={18} aria-hidden="true" />,
      onSelect: () => void scanPaymentState(),
    });
  }
  if (capabilities?.can_edit_paid_at) {
    actions.push({
      id: "edit-paid-at",
      label: "Editar fecha de pago",
      icon: <CalendarDays size={18} aria-hidden="true" />,
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

  const selectAction = (action: FinancialMenuAction) => {
    if (action.disabled) return;
    setMenuOpen(false);
    action.onSelect();
  };
  const amountTitle =
    record.type === "debt" ? "Editar monto de la deuda" : "Editar monto pagado";
  const amountDescription =
    record.type === "debt"
      ? "Cambia el monto principal y recalcula el saldo. Los ingresos relacionados se conservan."
      : "Cambia el total del ingreso. Si tiene varias aplicaciones, se ajustarán proporcionalmente para conservar su consistencia.";

  return (
    <>
      <div
        ref={menuRef}
        className={styles.actions}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            event.stopPropagation();
            setMenuOpen(false);
          }
        }}
      >
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Más acciones"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <MoreVertical size={21} aria-hidden="true" />
        </button>

        {menuOpen ? (
          <div className={styles.actionMenu} role="menu">
            {actions.map((action, index) => (
              <Fragment key={action.id}>
                {action.destructive && index > 0 ? (
                  <div className={styles.menuDivider} />
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  disabled={action.disabled}
                  className={`${styles.menuItem} ${
                    action.destructive ? styles.menuItemDanger : ""
                  }`.trim()}
                  onClick={() => selectAction(action)}
                >
                  <span className={styles.menuIcon}>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              </Fragment>
            ))}
          </div>
        ) : null}
      </div>

      <ActionDialog
        open={amountOpen}
        title={amountTitle}
        description={amountDescription}
        onClose={() => setAmountOpen(false)}
        onSubmit={() => void saveAmount()}
        submitLabel={submitting ? "Guardando…" : "Guardar corrección"}
        busy={submitting}
      >
        <div className={styles.formStack}>
          <Input
            name="financial-record-amount"
            label={record.type === "debt" ? "Monto de la deuda" : "Monto pagado"}
            type="number"
            min={0.01}
            value={recordAmount}
            onChange={(event: any) => setRecordAmount(event.target.value)}
          />
          <ReasonField
            id="financial-amount-reason"
            value={reason}
            onChange={setReason}
          />
          <FormError message={formError} />
        </div>
      </ActionDialog>

      <ActionDialog
        open={discountOpen}
        title={discountTitle}
        description="El descuento se aplica al capital. Ingresa cero para quitarlo."
        onClose={() => setDiscountOpen(false)}
        onSubmit={() => void saveDiscount()}
        submitLabel={submitting ? "Guardando…" : "Guardar descuento"}
        busy={submitting}
      >
        <div className={styles.formStack}>
          <Select name="financial-discount-type" label="Tipo de descuento"
            value={discountType} options={discountTypes} selectOptionsClassName={styles.dialogSelectOptions}
            onChange={(event) => setDiscountType(event.target.value)} />
          <Input
            name="financial-discount-value"
            label={discountType === "percent" ? "Porcentaje (%)" : "Monto en bolivianos"}
            type="number"
            min={0}
            value={discountValue}
            onChange={(event) => setDiscountValue(event.target.value)}
          />
          <ReasonField id="financial-discount-reason" value={reason} onChange={setReason} />
          <FormError message={formError} />
        </div>
      </ActionDialog>

      <ActionDialog
        open={penaltyOpen}
        title="Editar multa"
        description="Cambia únicamente la multa. La deuda se recalculará sin crear ni eliminar ingresos."
        onClose={() => setPenaltyOpen(false)}
        onSubmit={() => void savePenalty()}
        submitLabel={submitting ? "Guardando…" : "Guardar corrección"}
        busy={submitting}
      >
        <div className={styles.formStack}>
          <Input
            name="financial-penalty-amount"
            label="Monto en bolivianos"
            type="number"
            min={Number(penaltyLimits?.minimum_amount ?? 0)}
            value={penaltyAmount}
            disabled={submitting}
            onChange={(event: any) => {
              setPenaltyAmount(event.target.value);
              setFormError("");
            }}
          />
          <p className={styles.actionDescription}>
            {penaltyLimits ? <>
              Mínimo permitido: <strong>{formatBs(penaltyLimits.minimum_amount)}</strong>.
              {Number(penaltyLimits.applied_payments_amount) > 0
                ? " Este límite conserva los ingresos confirmados o por confirmar ya aplicados."
                : " Para quitar la multa, escribe 0."}
            </> : "Para quitar la multa, escribe 0. Se conservarán los ingresos ya registrados."}
          </p>
          <ReasonField
            id="financial-penalty-reason"
            value={reason}
            onChange={setReason}
          />
          <FormError message={formError || penaltyEditError(penaltyAmount, penaltyLimits)} />
        </div>
      </ActionDialog>

      <ActionDialog
        open={dateOpen}
        title="Editar fecha de pago"
        description="Actualiza el comprobante y los registros vinculados. No modifica el monto ni el estado."
        onClose={() => setDateOpen(false)}
        onSubmit={() => void savePaidAt()}
        submitLabel={submitting ? "Guardando…" : "Guardar corrección"}
        busy={submitting}
      >
        <div className={styles.formStack}>
          <Input
            name="financial-paid-at"
            label="Fecha de pago"
            type="date"
            max={getLocalToday()}
            value={paidAt}
            onChange={(event: any) => setPaidAt(event.target.value)}
          />
          <ReasonField
            id="financial-paid-at-reason"
            value={reason}
            onChange={setReason}
          />
          <FormError message={formError} />
        </div>
      </ActionDialog>

      <ActionDialog
        open={verificationOpen}
        title="Verificar estado del pago"
        description="Compara la deuda con sus ingresos y pagos parciales. Verificar no cambia ningún estado."
        onClose={() => setVerificationOpen(false)}
        onSubmit={
          verification?.has_changes ? () => void repairPaymentState() : undefined
        }
        submitLabel={
          verification?.has_changes
            ? submitting
              ? "Corrigiendo…"
              : "Corregir estados"
            : undefined
        }
        busy={submitting || verificationLoading}
        cancelLabel="Cerrar"
      >
        <div className={styles.formStack}>
          {verificationLoading ? (
            <div
              className={`${styles.verificationState} ${styles.verificationLoading}`}
            >
              <RefreshCw className={styles.spinner} size={19} aria-hidden="true" />
              Verificando datos relacionados…
            </div>
          ) : verification?.has_changes ? (
            <>
              <div
                className={`${styles.verificationState} ${styles.verificationWarning}`}
              >
                Se encontraron {changedGroups} grupo{changedGroups === 1 ? "" : "s"}{" "}
                con estados inconsistentes. La corrección utilizará los detalles
                de pago existentes como fuente de verdad.
              </div>
              <ReasonField
                id="financial-payment-state-reason"
                value={reason}
                onChange={setReason}
              />
            </>
          ) : verification ? (
            <div
              className={`${styles.verificationState} ${styles.verificationSuccess}`}
            >
              No se encontraron inconsistencias. La deuda, sus ingresos y las
              reservas vinculadas ya tienen un estado coherente.
            </div>
          ) : null}
          <FormError message={formError} />
        </div>
      </ActionDialog>
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
  <TextArea
    name={id}
    label="Motivo de la corrección"
    value={value}
    lines={4}
    maxLength={500}
    isLimit
    placeholder="Describe brevemente por qué se realiza este cambio"
    onChange={(event: any) => onChange(event.target.value)}
  />
);

const FormError = ({ message }: { message?: string }) =>
  message ? (
    <p role="alert" className={styles.formError}>
      {message}
    </p>
  ) : null;

type ActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
};

const ActionDialog = ({
  open,
  title,
  description,
  children,
  onClose,
  onSubmit,
  submitLabel,
  cancelLabel = "Cancelar",
  busy = false,
}: ActionDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open) window.setTimeout(() => dialogRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !busy) onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && !busy) onClose();
  };

  return createPortal(
    <div className={styles.actionOverlay} onMouseDown={handleBackdrop}>
      <div
        ref={dialogRef}
        className={styles.actionDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.actionHeader}>
          <div>
            <h2 id={titleId} className={styles.actionTitle}>
              {title}
            </h2>
            <p id={descriptionId} className={styles.actionDescription}>
              {description}
            </p>
          </div>
          <button
            type="button"
            className={styles.actionClose}
            aria-label="Cerrar"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.actionBody}>{children}</div>
        <footer className={styles.actionFooter}>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Button>
          {onSubmit && submitLabel ? (
            <Button disabled={busy} onClick={onSubmit}>
              {submitLabel}
            </Button>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body,
  );
};
