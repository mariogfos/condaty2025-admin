/**
 * Constantes comunes para los componentes de DebtsManager
 * Contiene mapeos de estados, tipos de pago, distribución, tipos de deuda, etc.
 */

// ============================================================================
// ESTADOS DE DEUDA
// ============================================================================

export const DEBT_STATUS_MAP: { [key: string]: string } = {
  'A': 'Por cobrar',
  'P': 'Cobrado',
  'S': 'Por confirmar',
  'M': 'En mora',
  'C': 'Cancelada',
  'X': 'Anulada'
};

export const DEBT_STATUS_CONFIG: { [key: string]: { color: string; bgColor: string } } = {
  A: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl8)' },
  P: { color: 'var(--cSuccess)', bgColor: 'var(--cHoverCompl2)' },
  S: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl4)' },
  R: { color: 'var(--cMediumAlert)', bgColor: 'var(--cMediumAlertHover)' },
  E: { color: 'var(--cWhite)', bgColor: 'var(--cHoverCompl1)' },
  M: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
  C: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
  X: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
};

// ============================================================================
// TIPOS DE PAGO
// ============================================================================

export const PAYMENT_TYPE_MAP: { [key: string]: string } = {
  T: "Transferencia bancaria",
  E: "Efectivo",
  C: "Cheque",
  Q: "Pago QR",
  O: "Pago en oficina",
};

// ============================================================================
// TIPOS DE DISTRIBUCIÓN/MONTO
// ============================================================================

export const DISTRIBUTION_TYPE_MAP: { [key: string]: string } = {
  M: 'Por m²',
  P: 'Promedio',
  F: 'Fijo',
  V: 'Variable',
  A: 'Promedio'
};

export const AMOUNT_TYPE_MAP: { [key: string]: string } = {
  F: 'Fijo',
  V: 'Variable',
  P: 'Porcentual',
  M: 'Por m²',
  A: 'Promedio'
};

// ============================================================================
// TIPOS DE DEUDA
// ============================================================================

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

// ============================================================================
// TÍTULOS DE BALANCE SEGÚN ESTADO
// ============================================================================

export const BALANCE_TITLE_MAP: { [key: string]: string } = {
  'P': 'Saldo cobrado',
  'M': 'Saldo a cobrar',
  'A': 'Saldo a cobrar'
};

// ============================================================================
// OPCIONES PARA FILTROS
// ============================================================================

export const STATUS_FILTER_OPTIONS = [
  { id: 'A', name: 'Por cobrar' },
  { id: 'P', name: 'Cobrado' },
  { id: 'S', name: 'Por confirmar' },
  { id: 'M', name: 'En mora' },
  { id: 'C', name: 'Cancelada' },
  { id: 'X', name: 'Anulada' }
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

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Obtiene el texto del estado de una deuda
 */
export const getStatusText = (status: string): string => {
  return DEBT_STATUS_MAP[status] || status;
};

/**
 * Obtiene la configuración de colores para un estado
 */
export const getStatusConfig = (status: string, dueDate?: string): { color: string; bgColor: string } => {
  // Verificar si está en mora por fecha vencida
  let finalStatus = status;
  const today = new Date();
  const due = dueDate ? new Date(dueDate) : null;

  // Si la fecha de vencimiento es menor a hoy y el estado es 'A' (Por cobrar), cambiar a 'M' (En mora)
  if (due && due < today && status === 'A') {
    finalStatus = 'M';
  }

  return DEBT_STATUS_CONFIG[finalStatus] || DEBT_STATUS_CONFIG.E;
};

/**
 * Obtiene el texto del tipo de pago
 */
export const getPaymentTypeText = (type: string): string => {
  return PAYMENT_TYPE_MAP[type] || type;
};

/**
 * Obtiene el texto del tipo de distribución
 */
export const getDistributionText = (amountType: string): string => {
  return DISTRIBUTION_TYPE_MAP[amountType] || '-/-';
};

/**
 * Obtiene el texto del tipo de monto
 */
export const getAmountTypeText = (amountType: string): string => {
  return AMOUNT_TYPE_MAP[amountType] || '-/-';
};

/**
 * Obtiene el título del balance según el estado
 */
export const getBalanceTitle = (status: string): string => {
  return BALANCE_TITLE_MAP[status] || 'Saldo a cobrar';
};

/**
 * Obtiene el texto del botón de detalle según el tipo de deuda
 */
export const getDetailButtonText = (type: number, hideSharedDebtButton: boolean = false): string | null => {
  if (type === 4 && hideSharedDebtButton) {
    return null;
  }
  return DEBT_TYPE_BUTTON_TEXT[type] || null;
};

/**
 * Obtiene las acciones disponibles según el estado y tipo de deuda
 */
export const getAvailableActions = (status: string, type: number) => {
  // Solo el tipo 0 puede editar y anular
  if (type !== 0) {
    return {
      showAnular: false,
      showEditar: false,
      showRegistrarPago: status !== 'P',
      showVerPago: status === 'P'
    };
  }

  // Para tipo 0, comportamiento normal según el status
  switch (status) {
    case 'P':
      return {
        showAnular: false,
        showEditar: false,
        showRegistrarPago: false,
        showVerPago: true
      };
    case 'M':
    case 'A':
      return {
        showAnular: true,
        showEditar: true,
        showRegistrarPago: true,
        showVerPago: false
      };
    default:
      return {
        showAnular: true,
        showEditar: true,
        showRegistrarPago: true,
        showVerPago: false
      };
  }
};

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

export const DEFAULT_VALUES = {
  PAYMENT_TYPE: 'T', // Transferencia bancaria por defecto
  AMOUNT_TYPE: 'F',  // Fijo por defecto
  STATUS: 'A',       // Por cobrar por defecto
  INTEREST: 0,       // Sin interés por defecto
  DISTRIBUTION_DEFAULT: 'Dividido por igual'
};

// ============================================================================
// LABELS COMUNES
// ============================================================================

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

// ============================================================================
// MENSAJES COMUNES
// ============================================================================

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
