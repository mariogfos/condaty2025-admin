/**
 * Los cuatro enums de `accesses`, sincronizados con el backend.
 *
 * 🔴 Estas columnas eran `char(1)` hasta el **2026-08-09**. Ese día pasaron a
 * `TINYINT` y el API dejó de mandar `type: 'C'` para mandar `type: 1`
 * (decisión de Mario, opción B: flip completo, se despliega todo junto).
 *
 * Backend: `App\Modules\Access\Enums\{TipoDeAcceso, EstadoGuardado,
 * Confirmacion, MarcaDeTaxi}`. El drift lo pinea `enumsSsotSync.test.ts`
 * contra `tests/__fixtures__/enums-ssot.json`.
 *
 * ⚠️ No hay lectura tolerante que acepte la letra vieja, a propósito. Un
 * `=== 1 || === 'C'` haría que un dato viejo colado siguiera funcionando, y ésa
 * es justamente la forma de no enterarse nunca.
 */

/** `accesses.type` */
export enum AccessType {
  WITHOUT_QR = 1,
  QR_INDIVIDUAL = 2,
  QR_GROUP = 3,
  QR_FREQUENT = 4,
  ORDER = 5,
  QR_KEY = 6,
}

/**
 * `accesses.status` — el estado GUARDADO.
 *
 * 🔴 No es el que muestra la pantalla. Ése se DERIVA de `in_at`/`out_at`/
 * `confirm_at` en `getAccessStatusInfo`. Confundirlos es lo que dejó 1.120
 * filas cerradas diciendo "adentro".
 */
export enum AccessStoredStatus {
  WAITING = 1,
  INSIDE = 2,
  OUTSIDE = 3,
  REJECTED = 4,
}

/** `accesses.confirm` — la RESPUESTA, no un estado. */
export enum AccessConfirmation {
  YES = 1,
  NO = 2,
}

/**
 * `accesses.taxi`.
 *
 * 🔴 No es un booleano. `IS_THE_DRIVER` es lo ÚNICO que distingue al taxista de
 * un acompañante común, y de eso dependen las listas de "acompañantes" y
 * "taxis" en las tres apps.
 */
export enum AccessTaxiMark {
  NO_TAXI = 1,
  CAME_BY_TAXI = 2,
  IS_THE_DRIVER = 3,
}

/** Los tipos que entran con un QR. `WITHOUT_QR` es el complemento. */
export const QR_ACCESS_TYPES: readonly AccessType[] = [
  AccessType.QR_INDIVIDUAL,
  AccessType.QR_GROUP,
  AccessType.QR_FREQUENT,
  AccessType.QR_KEY,
];

/** El taxista NO cuenta como acompañante. */
export const isCompanion = (taxi: unknown): boolean =>
  Number(taxi) !== AccessTaxiMark.IS_THE_DRIVER;

/** Si esta fila ES el taxista. */
export const isTheTaxiDriver = (taxi: unknown): boolean =>
  Number(taxi) === AccessTaxiMark.IS_THE_DRIVER;

export const ACCESS_TYPE_LABEL: Record<AccessType, string> = {
  [AccessType.WITHOUT_QR]: 'Sin QR',
  [AccessType.QR_INDIVIDUAL]: 'QR Individual',
  [AccessType.QR_GROUP]: 'QR Grupal',
  [AccessType.QR_FREQUENT]: 'QR frecuente',
  [AccessType.ORDER]: 'Pedido',
  [AccessType.QR_KEY]: 'Llave QR',
};

/**
 * Las opciones del filtro "Tipo de Acceso" del listado del admin.
 *
 * 🔴 Existe como constante —y no inline en la pantalla— porque su `id` VIAJA AL
 * BACKEND dentro de `filterBy` y termina en un `where('accesses.type', ...)`
 * contra un TINYINT. La lista estaba escrita a mano con las letras viejas
 * ('C', 'I', 'G'...): MariaDB convierte 'C' a 0 y el filtro devolvia la lista
 * vacia para TODAS las opciones, sin error y sin aviso.
 *
 * Ese es el char sobreviviendo como **valor que viaja al backend**: ni una
 * comparacion ni una clave de tabla, asi que no lo ve el compilador ni un grep
 * de `=== 'C'`. La unica defensa es que salga del enum.
 */
export const ACCESS_TYPE_FILTER_OPTIONS: { id: number; name: string }[] =
  Object.entries(ACCESS_TYPE_LABEL).map(([value, name]) => ({
    id: Number(value),
    name,
  }));
