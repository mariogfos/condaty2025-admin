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
  EXPENSE = "E",
  RESERVATION = "R",
  CONDONATION = "F",
  OTHER = "O",
  DIRECT = "I",
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

export enum FormPaymentMethod {
  QR = "Q",
  TRANSFER = "T",
  CASH = "E",
  CHEQUE = "C",
  OFFICE = "O",
}

export const FORM_PAYMENT_METHODS = [
  { id: FormPaymentMethod.QR, name: "Pago QR" },
  { id: FormPaymentMethod.TRANSFER, name: "Transferencia bancaria" },
  { id: FormPaymentMethod.CASH, name: "Efectivo" },
  { id: FormPaymentMethod.CHEQUE, name: "Cheque" },
  { id: FormPaymentMethod.OFFICE, name: "Pago en oficina" },
];

export const METHOD_MAP: Record<string | number, string> = {
  [PaymentMethod.TRANSFER]: "Transferencia bancaria",
  [PaymentMethod.OFFICE]: "Pago en oficina",
  [PaymentMethod.QR]: "Pago QR",
  [PaymentMethod.CASH]: "Efectivo",
  [PaymentMethod.CHEQUE]: "Cheque",
  [FormPaymentMethod.TRANSFER]: "Transferencia bancaria",
  [FormPaymentMethod.OFFICE]: "Pago en oficina",
  [FormPaymentMethod.QR]: "Pago QR",
  [FormPaymentMethod.CASH]: "Efectivo",
  [FormPaymentMethod.CHEQUE]: "Cheque",
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
