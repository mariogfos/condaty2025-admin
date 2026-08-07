import { DebtStatus } from "@/types/PaymentType";

// ---------------------------------------------------------------------------
// Numeric-native debt status maps — keyed by DebtStatus enum (int 1-10)
// Legacy string-code compat ('A','P','M',...) has been removed.
// ---------------------------------------------------------------------------

export const DEBT_STATUS_MAP: Record<number, string> = {
  [DebtStatus.PENDING]:         'Por cobrar',
  [DebtStatus.OVERDUE]:         'En mora',
  [DebtStatus.PARTIAL]:         'Pago parcial',
  [DebtStatus.SUBMITTED]:       'Por confirmar',
  [DebtStatus.PAID]:            'Cobrado',
  [DebtStatus.FORGIVEN]:        'Condonada',
  [DebtStatus.WORKFLOW_PENDING]:'En flujo externo',
  [DebtStatus.CANCELLED]:       'Anulada',
  [DebtStatus.AWAITING_VOUCHER]:'Por subir comprobante',
  [DebtStatus.REJECTED]:        'Rechazado',
};

export const DEBT_STATUS_CONFIG: Record<number, { color: string; bgColor: string }> = {
  [DebtStatus.PENDING]:         { color: 'var(--cWarning)',     bgColor: 'var(--cHoverCompl8)' },
  [DebtStatus.OVERDUE]:         { color: 'var(--cError)',       bgColor: 'var(--cHoverError)' },
  [DebtStatus.PARTIAL]:         { color: 'var(--cWhiteV1)',     bgColor: 'color-mix(in srgb, var(--cWhiteV1) 25%, transparent)' },
  [DebtStatus.SUBMITTED]:       { color: 'var(--cWarning)',     bgColor: 'var(--cHoverCompl4)' },
  [DebtStatus.PAID]:            { color: 'var(--cSuccess)',     bgColor: 'var(--cHoverCompl2)' },
  [DebtStatus.FORGIVEN]:        { color: '#1E8AE9',             bgColor: '#517FE133' },
  [DebtStatus.WORKFLOW_PENDING]:{ color: 'var(--cMediumAlert)', bgColor: 'var(--cMediumAlertHover)' },
  [DebtStatus.CANCELLED]:       { color: 'var(--cInfo)',        bgColor: 'var(--cHoverCompl3)' },
  [DebtStatus.AWAITING_VOUCHER]:{ color: 'var(--cWarning)',     bgColor: 'var(--cHoverCompl4)' },
  [DebtStatus.REJECTED]:        { color: 'var(--cError)',       bgColor: 'var(--cHoverError)' },
};


export const PAYMENT_TYPE_MAP: { [key: string]: string } = {
  T: "Transferencia bancaria",
  E: "Efectivo",
  C: "Cheque",
  Q: "Pago QR",
  O: "Pago en oficina",
};


/**
 * Cómo se reparte una deuda compartida entre las unidades.
 *
 * 🔴 2026-08-07: esto vivía en CUATRO tablas que no coincidían — dos acá
 * (`DISTRIBUTION_TYPE_MAP` y `AMOUNT_TYPE_MAP`, ninguna usada) y una adentro de
 * cada pantalla de compartidas. Entre las cuatro ofrecían `P` como "Promedio"
 * y como "Porcentual", y una `V` de "Variable".
 *
 * El back sabe repartir TRES: fijo por unidad, promedio y por m²
 * (`SharedDebtService::generate`). `P` y `V` no existen: eran opciones de
 * filtro que nunca podían traer una fila.
 *
 * Su gemela en PHP es `App\Modules\DebtDptos\Export\TipoDeMonto`.
 */
export const AMOUNT_TYPE_MAP: { [key: string]: string } = {
  F: 'Fijo',
  A: 'Promedio',
  M: 'Por m²'
};


export const DEBT_TYPE_MAP: { [key: number]: string } = {
  0: 'Deuda individual',
  1: 'Expensa',
  2: 'Reserva',
  3: 'Reserva con multa',
  4: 'Deuda compartida'
};

export const DEBT_TYPE_BUTTON_TEXT: { [key: number]: string } = {
  1: 'Ver expensa',
  2: 'Ver reserva',
  3: 'Ver reserva',
  4: 'Ver deuda compartida'
};


// Balance title — numeric keys
export const BALANCE_TITLE_MAP: Record<number, string> = {
  [DebtStatus.PAID]:    'Saldo cobrado',
  [DebtStatus.OVERDUE]: 'Saldo a cobrar',
  [DebtStatus.PENDING]: 'Saldo a cobrar',
};

// Filter options — ids are numeric DebtStatus values
export const STATUS_FILTER_OPTIONS: Array<{ id: number; name: string }> = [
  { id: DebtStatus.PENDING,         name: 'Por cobrar' },
  { id: DebtStatus.PAID,            name: 'Cobrado' },
  { id: DebtStatus.SUBMITTED,       name: 'Por confirmar' },
  { id: DebtStatus.OVERDUE,         name: 'En mora' },
  { id: DebtStatus.CANCELLED,       name: 'Anulada' },
  { id: DebtStatus.FORGIVEN,        name: 'Condonada' },
  { id: DebtStatus.PARTIAL,         name: 'Pago parcial' },
  { id: DebtStatus.AWAITING_VOUCHER,name: 'Por subir comprobante' },
  { id: DebtStatus.REJECTED,        name: 'Rechazado' },
  { id: DebtStatus.WORKFLOW_PENDING,name: 'En flujo externo' },
];

export const DISTRIBUTION_FILTER_OPTIONS = [
  { id: 'F', name: 'Fijo' },
  { id: 'V', name: 'Variable' },
  { id: 'P', name: 'Porcentual' },
  { id: 'M', name: 'Por m²' },
  { id: 'A', name: 'Promedio' }
];

export const PAYMENT_TYPE_OPTIONS = [
  { id: 'T', name: 'Transferencia bancaria' },
  { id: 'E', name: 'Efectivo' },
  { id: 'C', name: 'Cheque' },
  { id: 'Q', name: 'Pago QR' },
  { id: 'O', name: 'Pago en oficina' }
];


export const getStatusText = (status: number): string => {
  return DEBT_STATUS_MAP[status] ?? String(status);
};


// Overdue rule: PENDING + past dueDate => treat as OVERDUE for display
export const getStatusConfig = (status: number, dueDate?: string): { color: string; bgColor: string } => {
  let finalStatus = status;
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const due = dueDate ?? null;

  if (due && due < todayString && status === DebtStatus.PENDING) {
    finalStatus = DebtStatus.OVERDUE;
  }

  return DEBT_STATUS_CONFIG[finalStatus] ?? DEBT_STATUS_CONFIG[DebtStatus.PENDING];
};


export const getPaymentTypeText = (type: string): string => {
  return PAYMENT_TYPE_MAP[type] || type;
};


export const getAmountTypeText = (amountType: string): string => {
  return AMOUNT_TYPE_MAP[amountType] || '-/-';
};


export const getBalanceTitle = (status: number): string => {
  return BALANCE_TITLE_MAP[status] || 'Saldo a cobrar';
};


export const getDetailButtonText = (type: number, hideSharedDebtButton: boolean = false): string | null => {
  if (type === 4 && hideSharedDebtButton) {
    return null;
  }
  return DEBT_TYPE_BUTTON_TEXT[type] || null;
};


// ---------------------------------------------------------------------------
// getAvailableActions — numeric DebtStatus
//
// String→numeric mapping used here (for reviewer reference):
//   'A' → PENDING(1)    'M' → OVERDUE(2)   'I' → PARTIAL(3)
//   'S' → SUBMITTED(4)  'P' → PAID(5)       'F' → FORGIVEN(6)
//   'W' → WORKFLOW_PENDING(7)  'X' → CANCELLED(8)
//   'E' → AWAITING_VOUCHER(9)  'R' → REJECTED(10)
//
// Business logic is IDENTICAL to the string version — only comparisons flipped.
// ---------------------------------------------------------------------------

export const getAvailableActions = (status: number, type: number) => {
  const isPaid       = status === DebtStatus.PAID;
  const isPartial    = status === DebtStatus.PARTIAL;
  const isSubmitted  = status === DebtStatus.SUBMITTED;
  const isForgiven   = status === DebtStatus.FORGIVEN;

  if (type !== 0) {
    return {
      showAnular: false,
      showEditar: false,
      showRegistrarPago: !(isPaid || isSubmitted || isPartial || isForgiven),
      showVerPago: isPaid || isSubmitted || isPartial,
    };
  }

  switch (status) {
    case DebtStatus.PAID:
      return {
        showAnular: false,
        showEditar: false,
        showRegistrarPago: false,
        showVerPago: true,
      };
    case DebtStatus.PARTIAL:
      return {
        showAnular: false,
        showEditar: false,
        showRegistrarPago: false,
        showVerPago: true,
      };
    case DebtStatus.FORGIVEN:
      return {
        showAnular: false,
        showEditar: false,
        showRegistrarPago: false,
        showVerPago: false,
      };
    case DebtStatus.PENDING:
    case DebtStatus.OVERDUE:
      return {
        showAnular: true,
        showEditar: true,
        showRegistrarPago: true,
        showVerPago: false,
      };
    default:
      return {
        showAnular: true,
        showEditar: true,
        showRegistrarPago: true,
        showVerPago: false,
      };
  }
};


export const DEFAULT_VALUES = {
  PAYMENT_TYPE: 'T',
  AMOUNT_TYPE: 'F',
  STATUS: DebtStatus.PENDING,
  INTEREST: 0,
  DISTRIBUTION_DEFAULT: 'Dividido por igual'
};


export const COMMON_LABELS = {
  UNIT: 'Unidad',
  CATEGORY: 'Categoría',
  SUBCATEGORY: 'Subcategoría',
  DEBT: 'Deuda',
  PENALTY: 'Multa',
  MAINTENANCE: 'Mant. de valor',
  BALANCE: 'Saldo a cobrar',
  STATUS: 'Estado',
  DUE_DATE: 'Vencimiento',
  START_DATE: 'Fecha de inicio',
  PAYMENT_DATE: 'Fecha de pago',
  PAYMENT_METHOD: 'Método de pago',
  OWNER: 'Propietario',
  HOLDER: 'Titular',
  DISTRIBUTION: 'Distribución',
  DETAILS: 'Detalles',
  DESCRIPTION: 'Descripción',
  AMOUNT: 'Monto',
  TOTAL: 'Total'
};

export const COMMON_MESSAGES = {
  NO_DATA: '-/-',
  DEFAULT_DESCRIPTION: 'Cobro del servicio básico de agua del mes de agosto',
  PAYMENT_SUCCESS: 'Pago agregado con éxito',
  DEBT_SUCCESS: 'Deuda creada con éxito',
  UPDATE_SUCCESS: 'Actualizado con éxito',
  DELETE_SUCCESS: 'Eliminado con éxito',
  ERROR_GENERIC: 'Ha ocurrido un error',
  REQUIRED_FIELD: 'Este campo es requerido',
  NO_FUTURE_DATES: 'No se permiten fechas futuras'
};
