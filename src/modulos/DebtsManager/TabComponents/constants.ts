import {
  AmountType,
  DebtForgivable,
  DebtStatus,
  DebtType,
} from "@/types/PaymentType";
import { maintenanceAmountFor } from "@/mk/utils/utils";
import { getNow } from "@/mk/utils/date";

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
 *
 * ⚠️ Desde el 2026-08-22 la columna es {@link AmountType}: la clave es el
 * número del enum, no la letra.
 */
export const AMOUNT_TYPE_MAP: { [key in AmountType]: string } = {
  [AmountType.FIJO]: 'Fijo',
  [AmountType.PROMEDIO]: 'Promedio',
  [AmountType.POR_M2]: 'Por m²'
};


/**
 * Cómo se llama cada tipo de deuda en esta pantalla.
 *
 * 🔴 Le faltaban DOS casos —la condonación y el plan de pago— y una tabla
 * parcial no falla: cae al `||` del consumidor y muestra el número pelado o un
 * guion. Entran los siete.
 *
 * ⚠️ Las palabras NO son las mismas que las de `getDebtTypeLabel` en
 * `DashDptos/UnitFinanceHistory` ("Deuda individual" acá, "Otras deudas" allá)
 * ni las del API ("Individual"). Eso es una decisión de producto, no un bug de
 * tipos, y se deja como está: acá se unifican las CLAVES.
 */
export const DEBT_TYPE_MAP: { [key in DebtType]?: string } = {
  [DebtType.NORMAL]: 'Deuda individual',
  [DebtType.EXPENSE]: 'Expensa',
  [DebtType.RESERVATION]: 'Reserva',
  [DebtType.PENALTY_RESERVATION]: 'Reserva con multa',
  [DebtType.SHARED]: 'Deuda compartida',
  [DebtType.FORGIVENESS]: 'Condonación',
  [DebtType.PAYMENT_PLAN]: 'Plan de pago'
};

/**
 * El texto del botón que abre el ORIGEN de la deuda.
 *
 * ⚠️ `NORMAL` no está a propósito: una deuda individual no tiene otra pantalla
 * adonde ir, y `getDetailButtonText` devuelve `null` para que el botón no se
 * dibuje. Lo mismo la condonación y el plan de pago.
 */
export const DEBT_TYPE_BUTTON_TEXT: { [key in DebtType]?: string } = {
  [DebtType.EXPENSE]: 'Ver expensa',
  [DebtType.RESERVATION]: 'Ver reserva',
  [DebtType.PENALTY_RESERVATION]: 'Ver reserva',
  [DebtType.SHARED]: 'Ver deuda compartida'
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

// La QUINTA tabla de `amount_type`, también sin usar y también con `V` y `P`.
// El filtro de la pestaña de compartidas se deriva hoy de `AMOUNT_TYPE_MAP`.

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
  const todayString = getNow();
  const due = dueDate ?? null;

  if (due && due < todayString && status === DebtStatus.PENDING) {
    finalStatus = DebtStatus.OVERDUE;
  }

  return DEBT_STATUS_CONFIG[finalStatus] ?? DEBT_STATUS_CONFIG[DebtStatus.PENDING];
};


export const getPaymentTypeText = (type: string): string => {
  return PAYMENT_TYPE_MAP[type] || type;
};


export const getAmountTypeText = (amountType: number | null | undefined): string => {
  // ⚠️ La letra vieja o un número que no es case caen en el placeholder, no en
  // una etiqueta inventada. Y NULL es legítimo: significa «no aplica».
  return AMOUNT_TYPE_MAP[Number(amountType) as AmountType] || '-/-';
};


export const getBalanceTitle = (status: number): string => {
  return BALANCE_TITLE_MAP[status] || 'Saldo a cobrar';
};


export const getDetailButtonText = (type: number, hideSharedDebtButton: boolean = false): string | null => {
  if (type === DebtType.SHARED && hideSharedDebtButton) {
    return null;
  }
  // ⚠️ El `type` llega del sobre del API, así que es un `number` cualquiera y
  // no un `DebtType`. El cast es lo que hace de frontera: un tipo que el enum
  // no conoce no está en la tabla y devuelve `null`, que es lo que la pantalla
  // espera para no dibujar el botón.
  return DEBT_TYPE_BUTTON_TEXT[type as DebtType] || null;
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
  const isCancelled  = status === DebtStatus.CANCELLED;

  // 🔴 Acá había `type !== 0`, un literal pelado — y decide qué botones ve el
  // administrador sobre una deuda. Con la numeración vieja el 0 era la deuda
  // INDIVIDUAL, el único tipo que se puede editar y anular desde esta pantalla.
  // Desde el 2026-08-22 el 0 no es ningún tipo, así que la condición habría
  // sido cierta SIEMPRE: el `switch` de abajo —Anular, Editar y las reglas de
  // CDT-63 y CDT-89— dejaba de correr para todas las deudas, sin dar error.
  if (type !== DebtType.NORMAL) {
    return {
      showAnular: false,
      showEditar: false,
      showRegistrarPago: !(
        isPaid || isSubmitted || isPartial || isForgiven || isCancelled
      ),
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
    // 🔴 CDT-89: una deuda ANULADA no se cobra. El servidor ya lo rechaza
    // desde CDT-63 (`DebtDptoController::beforeCreate` del pago), pero la
    // pantalla seguía ofreciendo "Registrar Pago": el administrador cargaba el
    // cobro entero —con el comprobante en la mano y el vecino delante— y el
    // error llegaba recién al guardar. No es un problema de datos, es trabajo
    // perdido.
    //
    // Va oculto y no `disabled`: decisión de producto de Mario, un control
    // muerto en pantalla no explica nada. Lo que explica es el cartel de estado
    // de la cabecera del detalle (`AllDebts/RenderView`).
    //
    // ⚠️ Editar y Anular siguen ofreciéndose sobre una anulada. No es olvido:
    // está fuera del alcance de CDT-89 y anotado para producto.
    case DebtStatus.CANCELLED:
      return {
        showAnular: true,
        showEditar: true,
        showRegistrarPago: false,
        showVerPago: false,
      };
    // 🔴 CDT-52: estos seis estados devuelven lo mismo, pero antes cuatro de
    // ellos —SUBMITTED, WORKFLOW_PENDING, AWAITING_VOUCHER, REJECTED— llegaban
    // por el `default`, que era permisivo. O sea: un estado nuevo del enum
    // heredaba "editable y anulable" sin que nadie lo decidiera, y nadie se
    // enteraba hasta que alguien abría la pantalla.
    //
    // Ahora los diez del enum están nombrados y el `default` no ofrece nada:
    // un estado que no está acá no muestra acciones hasta que se decida qué
    // hace.
    case DebtStatus.PENDING:
    case DebtStatus.OVERDUE:
    case DebtStatus.SUBMITTED:
    case DebtStatus.WORKFLOW_PENDING:
    case DebtStatus.AWAITING_VOUCHER:
    case DebtStatus.REJECTED:
      return {
        showAnular: true,
        showEditar: true,
        showRegistrarPago: true,
        showVerPago: false,
      };
    default:
      return {
        showAnular: false,
        showEditar: false,
        showRegistrarPago: false,
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


/**
 * Lo que una deuda debe: deuda + mora + mantenimiento de valor.
 *
 * 🔴 El mantenimiento entra **sólo si el condominio lo habilita**, igual que en
 * todo el resto de la app. Regla de Mario, 2026-08-07: *"si no está habilitado,
 * ni muestra ni suma"*, y eso incluye el total de una condonación.
 *
 * ⚠️ Este número se PERSISTE al condonar, así que la pregunta no es decorativa:
 * es la que define cuánto se condona. Por eso vive acá, con nombre propio y con
 * test, y no como tres `Number()` sueltos adentro de un componente.
 */
export const montoACobrarDeLaDeuda = (iamData: any, debt: any): number =>
  (Number(debt?.amount) || 0) +
  (Number(debt?.penalty_amount) || 0) +
  maintenanceAmountFor(iamData, debt);

/**
 * ¿Está ENCENDIDA esta bandera de la deuda?
 *
 * ## 🔴🔴 Por qué no es un `if (debt.has_mv)` ni un `Number(x) === CASO`
 *
 * Las cuatro banderas —`has_mv`, `is_forgivable`, `has_pp`, `is_blocking`—
 * cambiaron de forma **tres veces**: `char(1)` `'Y'`/`'N'` → `tinyint(1)` con
 * cast booleano → enum desde 1 (2026-08-22). Y la tercera es la que **no da
 * error**: con el enum el `1` que significaba SÍ pasa a significar NO.
 *
 * Cada forma de leerlas falla distinto, y ninguna la encuentra el patrón de otra:
 *
 * | forma | por qué falla |
 * |---|---|
 * | `(item && item.flag) \|\| false` | `1` y `2` son los dos truthy: SIEMPRE encendida |
 * | `x === 1` | el `1` cambió de significado |
 * | `Number(x) === CASO` | `Number("Y")` es `NaN`: las filas viejas se leen apagadas |
 *
 * El primero es el que mordió: el formulario de deudas INDIVIDUALES leía así,
 * así que abrir una deuda para editarla mostraba las cuatro tildadas —fuera cual
 * fuera su valor— y guardarla las encendía de verdad. Incluida `is_blocking`,
 * que con `check_mora` le bloquea al residente el acceso físico al edificio.
 *
 * ⚠️ Sigue aceptando `true` y `"Y"` por el mismo motivo que {@link esCondonable}:
 * quedan filas viejas circulando por caches y snapshots, y una lectura que
 * entiende una sola forma es exactamente lo que produjo este bug. Lo que NO se
 * acepta es un número distinto del caso alto — el `1` pelado ya no significa sí.
 */
export const banderaEncendida = (valor: unknown, casoAlto: number): boolean =>
  valor === casoAlto ||
  valor === String(casoAlto) ||
  valor === true ||
  valor === "Y";

/**
 * ¿Es condonable el CAPITAL de esta deuda?
 *
 * ## 🔴🔴 Por qué esto no es un `=== "Y"`, ni un `=== 1`, ni un `if (debt.is_forgivable)`
 *
 * `debt_dptos.is_forgivable` cambió de forma **tres veces**: `char(1)`
 * `'Y'`/`'N'` → `tinyint(1)` con cast booleano (2026-06-30) → enum desde 1
 * (2026-08-22). Las dos primeras ya mordieron acá.
 *
 * ⚠️ La segunda se pagó en silencio y en el peor lugar: el formulario seguía
 * preguntando `=== "Y"` contra un `true`, o sea **siempre falso**. El capital
 * de las condonables no entraba en `amountForgiveness`, que es a la vez el
 * techo que valida el monto y la base con la que se convierte porcentaje ⇄
 * monto. El operador no podía condonar más que la mora, y el porcentaje que
 * veía estaba calculado sobre otro número. Medido el 2026-08-08: **689 deudas
 * condonables** de 15.210.
 *
 * 🔴 **La tercera es la que no da error, y por eso el `=== 1` se FUE.** Con el
 * enum, `1` es `NO_CONDONABLE`: el arreglo de la segunda mudanza —que aceptaba
 * `1` por las formas viejas— habría dicho que sí justo sobre las que no lo son.
 * Es la misma inversión, con otra ropa.
 *
 * Sigue aceptando `true` y `"Y"`: quedan filas viejas circulando por caches y
 * snapshots, y una lectura que sólo entiende una forma es exactamente lo que
 * produjo este bug. Lo que ya no se acepta es el `1` pelado, que ahora es
 * ambiguo.
 */
export const esCondonable = (debt: any): boolean =>
  debt?.is_forgivable === DebtForgivable.CONDONABLE ||
  debt?.is_forgivable === String(DebtForgivable.CONDONABLE) ||
  debt?.is_forgivable === true ||
  debt?.is_forgivable === "Y";
