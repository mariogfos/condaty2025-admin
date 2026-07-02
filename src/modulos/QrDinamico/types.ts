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
 * - 0: sandbox    → entorno de pruebas
 * - 1: production → entorno de producción
 */
export enum QrEnvironment {
  SANDBOX = 0,
  PRODUCTION = 1,
}

/**
 * Estado de la orden QR.
 * @see QrOrderStateEnum (backend: app/Modules/QrDinamico/Enums/QrOrderStateEnum.php)
 * - 1: registered → Orden registrada, pendiente de pago
 * - 2: paid       → Orden pagada
 * - 3: cancelled  → Orden anulada
 */
export enum QrOrderState {
  REGISTERED = 1,
  PAID = 2,
  CANCELLED = 3,
}

/**
 * Tipo de pago asociado al QR.
 * - 'T': EXPENSE    → Expensas
 * - 'R': RESERVATION → Reservas
 * - 'E': OUTLAY     → Egresos
 */
export enum PaymentType {
  EXPENSE = "T",
  RESERVATION = "R",
  OUTLAY = "E",
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

export interface GenerateQrPayload {
  amount: number;
  currency?: "BOB" | "USD";
  gloss?: string;
  payment_type?: PaymentType;
  payment_id?: string;
  expiration_date?: string; // format: ddMMyyyy
  single_use?: boolean;
  owner_id?: string;
}

export interface GenerateQrResponse {
  success: boolean;
  message?: string;
  data: {
    id: string;
    qr_id_banco: string;
    reference: string;
    qr_image_base64: string | null;
    amount: string;
    currency: string;
    gloss: string | null;
    expiration_date: string | null;
    order_state: QrOrderState;
  };
}

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
  [QrOrderState.REGISTERED]: "Registrado",
  [QrOrderState.PAID]: "Pagado",
  [QrOrderState.CANCELLED]: "Anulado",
};

export const QR_STATE_COLOR: Record<
  QrOrderState,
  { color: string; bg: string }
> = {
  [QrOrderState.REGISTERED]: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  [QrOrderState.PAID]: { color: "#00E38C", bg: "rgba(0,227,140,0.12)" },
  [QrOrderState.CANCELLED]: { color: "#F23D2D", bg: "rgba(242,61,45,0.12)" },
};

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  [PaymentType.EXPENSE]: "Expensas",
  [PaymentType.RESERVATION]: "Reservas",
  [PaymentType.OUTLAY]: "Egresos",
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
