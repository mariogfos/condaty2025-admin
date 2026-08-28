/**
 * QrDinamico — Types
 * Tipos centralizados para el módulo de Pagos QR Dinámico (R-P-003 + R-G-010)
 */

// ─── Enums (espejo del backend) ─────────────────────────────────────────────

/**
 * Modo de operación del QR dinámico.
 * @see QrDynamicModeEnum (backend: app/Modules/QrDinamico/Enums/QrDynamicModeEnum.php)
 * - 0: disabled  → QR deshabilitado globalmente
 * - 1: global    → QR compartido por todos los propietarios
 * - 2: own       → QR propio de cada propietario
 */
export enum QrDynamicMode {
  DISABLED = 0,
  GLOBAL = 1,
  OWN = 2,
}

/**
 * Entorno del QR dinámico.
 * @see QrEnvironmentEnum (backend: app/Modules/QrDinamico/Enums/QrEnvironmentEnum.php)
 * - 'S': sandbox  → entorno de pruebas
 * - 'P': production → entorno de producción
 */
export enum QrEnvironment {
  SANDBOX = "S",
  PRODUCTION = "P",
}

/**
 * Estado de la orden QR.
 * @see QrOrderStateEnum (backend: app/Modules/QrDinamico/Enums/QrOrderStateEnum.php)
 * - 1: pending   → QR generado, pendiente de confirmación
 * - 2: paid      → Pago confirmado por el proveedor
 * - 3: replaced  → Sustituido por un nuevo intento de pago
 * - 4: expired   → Vigencia terminada y última verificación sin pago
 * - 5: cancelled → Anulado por proceso interno o por el proveedor
 */
export enum QrOrderState {
  PENDING = 1,
  PAID = 2,
  REPLACED = 3,
  EXPIRED = 4,
  CANCELLED = 5,
}

/**
 * Tipo de pago asociado al QR.
 * @see PaymentTypeEnum (backend: app/Modules/QrDinamico/Enums/PaymentTypeEnum.php)
 * - 'T': EXPENSE     → Expensas
 * - 'R': RESERVATION → Reservas
 * - 'E': OUTLAY      → Egresos (legacy)
 * - 'O': OTHER       → Otras deudas
 */
export enum PaymentType {
  EXPENSE = "T",
  RESERVATION = "R",
  OUTLAY = "E",
  OTHER = "O",
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface QrOrder {
  id: string;
  client_id: string | null;
  owner_id: string | null;
  qr_id_banco: string | null;
  qr_image_base64: string | null;
  reference: string;
  amount: string; // decimal string from API
  currency: "BOB" | "USD";
  gloss: string | null;
  expiration_date: string | null; // ISO date
  single_use: boolean;
  order_state: QrOrderState;
  order_date: string | null;
  pay_date: string | null;
  pay_hour: string | null;
  transaction_id: string | null;
  payment_type: PaymentType | null;
  payment_id: string | null;
  consolidated_at: string | null;
  consolidated_by: string | null;
  created_at: string;
  updated_at: string;
  // ─── QR-primero por deudas (épica DES) ───────────────────────────────────
  bank_account_id?: number | null;
  category_id?: number | null;
  expires_at?: string | null; // "YYYY-MM-DD HH:mm:ss" hora de Bolivia
  paid_at?: string | null;
  replaces_qr_id?: string | null;
  replaced_by_qr_id?: string | null;
  last_checked_at?: string | null;
}

export interface QrOrderPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more: boolean;
}

export interface QrOrdersResponse {
  success: boolean;
  data: {
    items: QrOrder[];
    pagination: QrOrderPagination;
  };
}

// RN-ADM-04: la Plataforma Admin NO genera ni anula QR dinámicos — el QR se
// genera exclusivamente desde la App Residente. Por eso acá no existen tipos
// de generación.

export interface ConciliationTotal {
  client_id: string;
  currency: string;
  total: string;
  count: number;
}

export interface ConciliationData {
  summary: ConciliationTotal[];
  items: QrOrder[];
  pagination: Omit<QrOrderPagination, "has_more">;
}

export interface QrOrderFilters {
  order_state?: QrOrderState | "";
  payment_type?: PaymentType | "";
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const QR_STATE_LABEL: Record<QrOrderState, string> = {
  [QrOrderState.PENDING]: "Pendiente",
  [QrOrderState.PAID]: "Pagado",
  [QrOrderState.REPLACED]: "Reemplazado",
  [QrOrderState.EXPIRED]: "Expirado",
  [QrOrderState.CANCELLED]: "Anulado",
};

export const QR_STATE_COLOR: Record<
  QrOrderState,
  { color: string; bg: string }
> = {
  [QrOrderState.PENDING]: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  [QrOrderState.PAID]: { color: "#00E38C", bg: "rgba(0,227,140,0.12)" },
  [QrOrderState.REPLACED]: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  [QrOrderState.EXPIRED]: { color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  [QrOrderState.CANCELLED]: { color: "#F23D2D", bg: "rgba(242,61,45,0.12)" },
};

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  [PaymentType.EXPENSE]: "Expensas",
  [PaymentType.RESERVATION]: "Reservas",
  [PaymentType.OUTLAY]: "Egresos",
  [PaymentType.OTHER]: "Otras deudas",
};

// ─── Helpers: QrDynamicMode ──────────────────────────────────────────────────

export const QR_MODE_LABEL: Record<QrDynamicMode, string> = {
  [QrDynamicMode.DISABLED]: "Deshabilitado",
  [QrDynamicMode.GLOBAL]: "Global",
  [QrDynamicMode.OWN]: "Propio",
};

export const QR_MODE_COLOR: Record<
  QrDynamicMode,
  { color: string; bg: string }
> = {
  [QrDynamicMode.DISABLED]: { color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  [QrDynamicMode.GLOBAL]: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  [QrDynamicMode.OWN]: { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
};

// ─── Helpers: QrEnvironment ─────────────────────────────────────────────────

export const QR_ENVIRONMENT_LABEL: Record<QrEnvironment, string> = {
  [QrEnvironment.SANDBOX]: "Sandbox",
  [QrEnvironment.PRODUCTION]: "Producción",
};
