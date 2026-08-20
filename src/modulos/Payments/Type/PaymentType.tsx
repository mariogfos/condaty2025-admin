export enum PaymentStatus {
  SUBMITTED = 1, // Por confirmar
  PAID = 2,      // Confirmado
  REJECTED = 3,  // Rechazado
  CANCELLED = 4, // Anulado
}


export enum PaymentMethod {
  TRANSFER = 1,
  OFFICE = 2,
  QR = 3,
  CASH = 4,
  CHEQUE = 5,
  /**
   * Pago acreditado por una integración externa, sin que nadie lo cargue a
   * mano (hoy el webhook de Orange/Luka de Urubó Village).
   *
   * ⚠️ No dice "Orange" a propósito: esa integración es temporal y el case
   * sirve para las que vengan después. Qué proveedor lo trajo se lee en
   * `payments.ext`, no en el método.
   */
  EXTERNAL_AUTOMATIC = 6,
}

export enum PaymentType {
  ALL_DEBTS = 1,
  EXPENSES = 2,
  RESERVATIONS = 3,
  CONDONATION = 4,
  PAYMENT_PLAN = 5,
  OTHER_DEBTS = 6,
  DIRECT_INCOME = 7,
}

/**
 * S18.5a — ExpenseStatus numeric enum.
 *
 * Sincronizado con backend `App\Modules\Expenses\Enums\ExpenseStatus` (PHP):
 * - ACTIVE = 1 (legacy 'A')
 * - CANCELLED = 0 (legacy 'X')
 *
 * El backend serializa como TINYINT (no string), pineado desde S2-T2 + S6.5.
 * El admin debe pinear estos int values, no chars.
 */
export enum ExpenseStatus {
  ACTIVE = 1,
  CANCELLED = 0,
}

/**
 * S18.5a — AreaStatus numeric enum.
 *
 * Sincronizado con backend `App\Models\Enums\AreaStatus` (PHP):
 * - ACTIVE = 1 (legacy 'A')
 * - MAINTENANCE = 2 (legacy 'M')
 */
export enum AreaStatus {
  ACTIVE = 1,
  MAINTENANCE = 2,
}

/**
 * S18.5a — DptoStatus numeric enum.
 *
 * Sincronizado con backend `App\Models\Enums\DptoStatus` (PHP):
 * - INACTIVE = 0 (legacy 'X') — S_front + S135 pineado
 * - ACTIVE = 1 (legacy 'A')
 */
export enum DptoStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

/**
 * S_front — ClientStatus numeric enum.
 *
 * Sincronizado con backend `App\Modules\Clients\Enums\ClientStatus` (PHP):
 * - INACTIVE = 0 (legacy 'I') — S135 pineado
 * - ACTIVE = 1 (legacy 'A')
 */
export enum ClientStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

/**
 * ClientType — enum numérico.
 *
 * Sincronizado con el backend `App\Modules\Clients\Enums\ClientType` (PHP):
 * - CONDOMINIO = 1 (legacy 'C') — 23 de los 37, y el default del esquema
 * - EDIFICIO = 2 (legacy 'E') — 14 de los 37
 */
export enum ClientType {
  CONDOMINIO = 1,
  EDIFICIO = 2,
}

/**
 * ClientPrivacy — enum numérico.
 *
 * Sincronizado con el backend `App\Modules\Clients\Enums\ClientPrivacy` (PHP):
 * - PUBLICO = 1 (legacy 'P') — 34 de los 37, y el default del esquema
 * - PRUEBA = 2 (legacy 'T') — 3 de los 37
 *
 * 🔴 No es cosmético: `PUBLICO` es lo que decide qué condominios ve el residente
 * al registrarse desde rnOwner, y lo que impide borrar un condominio público
 * desde este panel.
 */
export enum ClientPrivacy {
  PUBLICO = 1,
  PRUEBA = 2,
}

/**
 * S18.5a — OwnerStatus numeric enum.
 *
 * Sincronizado con backend `App\Modules\HomeOwner\Enums\OwnerStatus` (PHP):
 * - ACTIVE = 1 (legacy 'A')
 * - WAITING = 2 (legacy 'W') — S_front + S132 pineado
 * - PASSWORD_CHANGE_REQUIRED = 3 (legacy 'P') — S132 pineado
 * - DISABLED = 4 (legacy 'X') — S132 pineado
 */
export enum OwnerStatus {
  ACTIVE = 1,
  WAITING = 2,
  PASSWORD_CHANGE_REQUIRED = 3,
  DISABLED = 4,
}

/**
 * S18.5a — ClientOwnerStatus numeric enum.
 *
 * Sincronizado con backend `App\Modules\HomeOwner\Enums\ClientOwnerStatus` (PHP):
 * - ACTIVE = 1 (legacy 'A')
 * - WAITING = 2 (legacy 'W')
 * - PASSWORD_CHANGE_REQUIRED = 3 (legacy 'P') — S132 pineado en back
 * - DISABLED = 4 (legacy 'X') — S132 pineado en back
 */
export enum ClientOwnerStatus {
  ACTIVE = 1,
  WAITING = 2,
  PASSWORD_CHANGE_REQUIRED = 3,
  DISABLED = 4,
}

/**
 * S18.5a — ClientOwnerType numeric enum.
 *
 * Sincronizado con backend `App\Modules\HomeOwner\Enums\ClientOwnerType` (PHP):
 * - HOMEOWNER = 1 (legacy 'H')
 * - RESIDENT = 2 (legacy 'R')
 * - DEPENDENT = 3 (legacy 'D')
 * - HOMEOWNER_RESIDENT = 4 (legacy 'HT')
 * - HOMEOWNER_DEPENDENT = 5 (legacy 'HD')
 */
export enum ClientOwnerType {
  HOMEOWNER = 1,
  RESIDENT = 2,
  DEPENDENT = 3,
  HOMEOWNER_RESIDENT = 4,
  HOMEOWNER_DEPENDENT = 5,
}

export interface PaymentStatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
  longLabel?: string;
}


// Mapa de estados de PAGO
export const PAYMENT_STATUS_MAP: Record<number, PaymentStatusConfig> = {
  [PaymentStatus.SUBMITTED]: {
    label: "Por confirmar",
    color: "var(--cWarning)",
    backgroundColor: "var(--cHoverCompl4)",
  },
  [PaymentStatus.PAID]: {
    label: "Confirmado",
    color: "var(--cSuccess)",
    backgroundColor: "var(--cHoverCompl2)",
  },
  [PaymentStatus.REJECTED]: {
    label: "Rechazado",
    color: "var(--cMediumAlert)",
    backgroundColor: "var(--cHoverCompl5)",
  },
  [PaymentStatus.CANCELLED]: {
    label: "Anulado",
    color: "var(--cError)",
    backgroundColor: "var(--cHoverError)",
  },
};


export const getPaymentStatusConfig = (status: number): PaymentStatusConfig => {
  return PAYMENT_STATUS_MAP[status] || {
    label: "Desconocido",
    color: "var(--cLight)",
    backgroundColor: "var(--cHoverLight)",
  };
};

export enum FormPaymentType {
  EXPENSE = PaymentType.EXPENSES,
  RESERVATION = PaymentType.RESERVATIONS,
  CONDONATION = PaymentType.CONDONATION,
  OTHER = PaymentType.OTHER_DEBTS,
  DIRECT = PaymentType.DIRECT_INCOME,
}

export const PERIOD_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: "d", name: "Hoy" },
  { id: "ld", name: "Ayer" },
  { id: "w", name: "Esta semana" },
  { id: "lw", name: "Semana anterior" },
  { id: "m", name: "Este mes" },
  { id: "lm", name: "Mes anterior" },
  { id: "y", name: "Este año" },
  { id: "ly", name: "Año anterior" },
  { id: "custom", name: "Personalizado" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: PaymentMethod.TRANSFER, name: "Transferencia bancaria" },
  { id: PaymentMethod.CASH, name: "Efectivo" },
  { id: PaymentMethod.CHEQUE, name: "Cheque" },
  { id: PaymentMethod.QR, name: "Pago QR" },
  { id: PaymentMethod.OFFICE, name: "Pago en oficina" },
  { id: PaymentMethod.EXTERNAL_AUTOMATIC, name: "Pago externo automático" },
];

export const STATUS_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: PaymentStatus.PAID, name: "Cobrado" },
  { id: PaymentStatus.SUBMITTED, name: "Por confirmar" },
  { id: PaymentStatus.REJECTED, name: "Rechazado" },
  { id: PaymentStatus.CANCELLED, name: "Anulado" },
];

export const TYPE_OPTIONS = [
  { id: FormPaymentType.EXPENSE, name: "Expensas" },
  { id: FormPaymentType.RESERVATION, name: "Reservas" },
  { id: FormPaymentType.CONDONATION, name: "Condonación" },
  { id: FormPaymentType.OTHER, name: "Otras deudas" },
  { id: FormPaymentType.DIRECT, name: "Pago directo" },
];

/**
 * Los métodos que administración puede elegir al CARGAR un pago a mano.
 *
 * ⚠️ `EXTERNAL_AUTOMATIC` no está acá a propósito: ese método lo escribe una
 * integración externa cuando acredita un pago sola. Nadie lo carga a mano, y
 * ofrecerlo en el formulario dejaría marcar como automático algo que no lo es.
 */
export const FORM_PAYMENT_METHODS = [
  { id: PaymentMethod.QR, name: "Pago QR" },
  { id: PaymentMethod.TRANSFER, name: "Transferencia bancaria" },
  { id: PaymentMethod.CASH, name: "Efectivo" },
  { id: PaymentMethod.CHEQUE, name: "Cheque" },
  { id: PaymentMethod.OFFICE, name: "Pago en oficina" },
];

export const METHOD_MAP: Record<string | number, string> = {
  [PaymentMethod.TRANSFER]: "Transferencia bancaria",
  [PaymentMethod.OFFICE]: "Pago en oficina",
  [PaymentMethod.QR]: "Pago QR",
  [PaymentMethod.CASH]: "Efectivo",
  [PaymentMethod.CHEQUE]: "Cheque",
  [PaymentMethod.EXTERNAL_AUTOMATIC]: "Pago externo automático",
};

export const FORM_LABELS = {
  paidAt: "Fecha de cobro",
  dptos: "Unidad",
  method: "Método de pago",
  concepto: "Concepto",
  status: "Estado",
  amount: "Monto total",
  placeholderConcepto: "Ej: Pago de servicios",
  placeholderAmount: "Ej: 100.00",
} as const;

export const MESSAGES = {
  addSuccess: "Ingreso creado con éxito",
  editSuccess: "Ingreso actualizado con éxito",
  delSuccess: "Ingreso anulado con éxito",
  emptyList: "Lista de ingresos vacía. Cuando empieces a registrar los pagos",
  emptyListLine2: "de expensas y otros ingresos, los verás aquí.",
  rejectTitle: "Rechazar pago",
} as const;
