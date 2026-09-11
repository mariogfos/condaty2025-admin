/**
 * El log auditable del webhook de Orange, tal como lo devuelve
 * `GET /api/orange-webhook-logs`.
 *
 * Es un log de solo lectura: administracion lo abre cuando un residente
 * pregunta por que su expensa figura de una manera. Nada de esta pantalla
 * escribe.
 */

/** Una linea del log. Un paso de una notificacion sobre una expensa. */
export interface OrangeLogRow {
  id: number;
  received_at: string | null;
  transaction_id: string;
  /** 'pago' | 'anulacion' */
  event: string;
  action: string;
  action_label: string;

  dpto_id: number | null;
  dpto_nro: string | null;

  debt_dpto_id: number | null;
  /** 'YYYY-MM' cuando la linea corresponde a una cuota. */
  periodo: string | null;
  period_year: number | null;
  period_month: number | null;

  fee_code: string | null;
  fee_amount: number | null;
  overdue_amount: number | null;
  amount: number | null;

  debt_amount_before: number | null;
  debt_penalty_before: number | null;
  debt_amount_after: number | null;
  debt_penalty_after: number | null;
  debt_status_after: string | null;
  debt_remaining_after: number | null;

  payment_id: string | null;
  /**
   * La escritura que esta linea describe se deshizo por un rollback. La linea
   * sobrevive; la expensa creada o el monto sincronizado, no.
   */
  reverted: boolean;
  detail: string | null;
  /**
   * El JSON crudo de Orange. Solo lo trae la fila que ABRE cada notificacion;
   * en el resto es null, porque son el desglose del mismo documento.
   */
  payload: Record<string, unknown> | null;
}

export interface OrangeLogAction {
  value: string;
  label: string;
}

export interface OrangeLogFilters {
  desde?: string;
  hasta?: string;
  nro?: string;
  transaction_id?: string;
  action?: string;
  reverted?: string;
  per_page?: number;
  page?: number;
}

export interface OrangeLogMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

/** Los estados de una deuda, para la columna «como quedo». */
export const DEBT_STATUS_LABEL: Record<string, string> = {
  A: 'Por cobrar',
  M: 'En mora',
  I: 'Parcial',
  S: 'Por confirmar',
  P: 'Cobrada',
  F: 'Condonada',
  W: 'Esperando a un tercero',
  X: 'Anulada',
};

/**
 * El color de cada accion. Verde lo que acredito, ambar lo que ajusto algo,
 * rojo lo que se rechazo o se deshizo.
 */
export const ACTION_COLOR: Record<string, { color: string; bg: string }> = {
  recibida:            { color: '#4A5568', bg: '#EDF2F7' },
  pago_total:          { color: '#22683F', bg: '#DCF5E5' },
  pago_parcial:        { color: '#8A5A00', bg: '#FDF0D5' },
  pago_actualizado:    { color: '#8A5A00', bg: '#FDF0D5' },
  expensa_creada:      { color: '#1B4F8A', bg: '#DDEBFA' },
  monto_sincronizado:  { color: '#1B4F8A', bg: '#DDEBFA' },
  anulada:             { color: '#8A2020', bg: '#FBE0E0' },
  rechazada:           { color: '#8A2020', bg: '#FBE0E0' },
};
