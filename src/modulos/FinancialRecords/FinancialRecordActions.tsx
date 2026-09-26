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
  X,
} from "lucide-react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios, { type ApiEnvelope, type ApiError } from "@/mk/hooks/useAxios";
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

/**
 * El menú «Más acciones» del detalle financiero y sus tres correcciones
 * auditadas: monto, multa y fecha de pago. Cada una la habilita una
 * `capability` que calcula el API; el front no decide quién puede.
 *
 * ⚠️ `can_verify_payment` se ignora a propósito: en `dev` la verificación y
 * reparación del estado del pago se descartó y el API la manda siempre en
 * `false`. Si algún día llega en `true`, el menú no ofrece nada que no exista.
 */
type Props = {
  record: FinancialRecordReference;
  capabilities?: FinancialCapabilities | null;
  /** Acciones propias de cada pantalla (p. ej. «Anular»). */
  customActions?: FinancialMenuAction[];
  onChanged?: () => void | Promise<void>;
};

/**
 * El orden importa: el 422 de validación de Laravel trae `errors` por campo y
 * un `message` genérico; se muestra el del campo. Un rechazo de negocio llega
 * como 422 con el motivo en `error.data.message`, o como 200 con
 * `success: false` y el motivo en `data.message`.
 */
const extractError = (
  data: ApiEnvelope | null,
  error: ApiError | null,
  fallback: string,
) => {
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

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

export const FinancialRecordActions = ({
  record,
  capabilities,
  customActions = [],
  onChanged,
}: Props) => {
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [recordAmount, setRecordAmount] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const resetForm = () => {
    setReason("");
    setFormError("");
  };

  const openPenaltyEditor = () => {
    setPenaltyAmount(String(record.penaltyAmount ?? 0));
    resetForm();
    setPenaltyOpen(true);
  };

  const openAmountEditor = () => {
    setRecordAmount(String(record.amount ?? ""));
    resetForm();
    setAmountOpen(true);
  };

  const openDateEditor = () => {
    setPaidAt(normalizeDateInput(record.paidAt));
    resetForm();
    setDateOpen(true);
  };

  const hasValidReason = () => {
    if (reason.trim().length >= REASON_MIN_LENGTH) return true;
    setFormError("Indica el motivo de esta corrección.");
    return false;
  };

  /**
   * Las tres correcciones comparten el mismo ciclo: enviar, avisar, cerrar el
   * diálogo y pedirle al detalle que recargue el historial.
   */
  const submitCorrection = async (
    url: string,
    payload: Record<string, unknown>,
    successMessage: string,
    errorMessage: string,
    close: () => void,
  ) => {
    setSubmitting(true);
    setFormError("");
    const { data, error } = await execute(url, "PUT", payload, false, true);

    if (data?.success) {
      showToast(data.message || successMessage, "success");
      close();
      await notifyChanged();
    } else {
      setFormError(extractError(data, error, errorMessage));
    }
    setSubmitting(false);
  };

  const savePenalty = async () => {
    const amount = Number(penaltyAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Ingresa un monto válido mayor o igual a Bs 0,00.");
      return;
    }
    if (!hasValidReason()) return;

    await submitCorrection(
      financialRecordsApi.penalty(record.id),
      { amount: Math.round(amount * 100) / 100, reason: reason.trim() },
      "Multa actualizada",
      "No se pudo editar la multa.",
      () => setPenaltyOpen(false),
    );
  };

  const saveAmount = async () => {
    const amount = Number(recordAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Ingresa un monto válido mayor a Bs 0,00.");
      return;
    }
    if (!hasValidReason()) return;

    await submitCorrection(
      financialRecordsApi.amount(record),
      { amount: Math.round(amount * 100) / 100, reason: reason.trim() },
      "Monto actualizado",
      "No se pudo editar el monto.",
      () => setAmountOpen(false),
    );
  };

  const savePaidAt = async () => {
    if (!paidAt) {
      setFormError("Selecciona la fecha de pago.");
      return;
    }
    if (!hasValidReason()) return;

    await submitCorrection(
      financialRecordsApi.paidAt(record),
      { paid_at: paidAt, reason: reason.trim() },
      "Fecha de pago actualizada",
      "No se pudo editar la fecha de pago.",
      () => setDateOpen(false),
    );
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
  if (capabilities?.can_edit_paid_at) {
    actions.push({
      id: "edit-paid-at",
      label: "Editar fecha de pago",
      icon: <CalendarDays size={18} aria-hidden="true" />,
      onSelect: openDateEditor,
    });
  }
  // Las destructivas («Anular») van al final, separadas por un divisor.
  actions.push(
    ...customActions.filter((action) => !action.destructive),
    ...customActions.filter((action) => action.destructive),
  );

  if (actions.length === 0) return null;

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
  const submitLabel = submitting ? "Guardando…" : "Guardar corrección";

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
        submitLabel={submitLabel}
        busy={submitting}
      >
        <div className={styles.formStack}>
          <Input
            name="financial-record-amount"
            label={record.type === "debt" ? "Monto de la deuda" : "Monto pagado"}
            type="number"
            min={0.01}
            value={recordAmount}
            onChange={(event) => setRecordAmount(event.target.value)}
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
        open={penaltyOpen}
        title="Editar multa"
        description="Cambia únicamente la multa. La deuda se recalculará sin crear ni eliminar ingresos."
        onClose={() => setPenaltyOpen(false)}
        onSubmit={() => void savePenalty()}
        submitLabel={submitLabel}
        busy={submitting}
      >
        <div className={styles.formStack}>
          <Input
            name="financial-penalty-amount"
            label="Monto en bolivianos"
            type="number"
            min={0}
            value={penaltyAmount}
            onChange={(event) => setPenaltyAmount(event.target.value)}
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
        submitLabel={submitLabel}
        busy={submitting}
      >
        <div className={styles.formStack}>
          <Input
            name="financial-paid-at"
            label="Fecha de pago"
            type="date"
            max={getLocalToday()}
            value={paidAt}
            onChange={(event) => setPaidAt(event.target.value)}
          />
          <ReasonField
            id="financial-paid-at-reason"
            value={reason}
            onChange={setReason}
          />
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
    maxLength={REASON_MAX_LENGTH}
    isLimit
    placeholder="Describe brevemente por qué se realiza este cambio"
    onChange={(event) => onChange(event.target.value)}
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
  onSubmit: () => void;
  submitLabel: string;
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

  /**
   * El portal saca el diálogo del DOM del detalle, pero NO del árbol de React:
   * sin el `stopPropagation`, el Escape sube hasta el `onKeyDown` del detalle y
   * cierra también el detalle entero.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    if (!busy) onClose();
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
            Cancelar
          </Button>
          <Button disabled={busy} onClick={onSubmit}>
            {submitLabel}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
};
