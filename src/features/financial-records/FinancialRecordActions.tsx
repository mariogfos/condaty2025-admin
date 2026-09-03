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
  CalendarDays,
  CircleDollarSign,
  MoreVertical,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { financialRecordsApi } from "./api";
import styles from "./FinancialDetail.module.css";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
      icon: <CircleDollarSign size={18} aria-hidden="true" />,
      onSelect: openPenaltyEditor,
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
            <p className={styles.menuLabel}>Acciones del registro</p>
            <div className={styles.menuDivider} />
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
            min={0}
            value={penaltyAmount}
            onChange={(event: any) => setPenaltyAmount(event.target.value)}
          />
          <ReasonField
            id="financial-penalty-reason"
            value={reason}
            onChange={setReason}
          />
          <FormError message={formError} />
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
