/**
 * Los cuatro enums de tareas, en número.
 *
 * El API los pasó de `enum(...)` de MySQL a `TINYINT` el 2026-09-24, con el
 * corte 4 de la migración del módulo:
 * `App\Modules\Tasks\Enums\{TaskStatus,TaskPriority,TaskVisibility,TaskCommentType}`.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 POR QUÉ HAY NORMALIZADORES Y NO SÓLO CONSTANTES
 * ────────────────────────────────────────────────────────────────────────
 *
 * El API y el admin se despliegan juntos, pero:
 *
 * - una pestaña abierta con la pantalla **vieja** sigue mandando `"pending"`, y
 *   el API lo acepta durante la ventana;
 * - lo que el API **devuelve** ya es el número, siempre;
 * - y el número llega a veces como **string** — el query string y algunos
 *   `JSON.parse` no distinguen `2` de `"2"`.
 *
 * Así que todo lo que entra se normaliza en un solo lugar.
 *
 * 🔴 **Todos empiezan en 1**, y no es un detalle de estilo: este admin tiene un
 * `Select` compartido que auto-elige la opción con `id` 0, porque en JS
 * `0 == ""` es `true`. Un enum que empezara en 0 haría que el formulario
 * pre-seleccione ese valor sin que nadie lo toque.
 */

export const TASK_STATUS = {
  REQUESTED: 1,
  PENDING: 2,
  IN_PROGRESS: 3,
  REVIEW: 4,
  COMPLETED: 5,
  CANCELLED: 6,
} as const;

/**
 * 🔴 El número es el PESO: urgente es el más alto.
 *
 * El API ordena el listado con `ORDER BY priority DESC`, que antes era un
 * `FIELD(priority,'urgent','high','medium','low')`. Si acá se invirtiera el
 * sentido, la pantalla pintaría «urgente» donde el API puso «baja».
 */
export const TASK_PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
} as const;

/**
 * ⚠️ `INHERIT` es el default y **no significa «sin valor»**: significa «lo que
 * diga el condominio». Por eso vale 1 y no 0.
 */
export const TASK_VISIBILITY = {
  INHERIT: 1,
  PUBLIC: 2,
  PRIVATE: 3,
} as const;

/**
 * 🔴 `AUDIT` es el caso NUEVO del corte 4: lo que el sistema anota cuando
 * alguien cambia un campo (título, descripción, categoría, vencimiento).
 *
 * Antes esas cuatro filas se guardaban como `COMMENT`, o sea **igual que un
 * comentario escrito por una persona**, y quedaban mezcladas en el hilo sin forma
 * de distinguirlas.
 *
 * ⚠️ El admin **no lo manda nunca**: lo escribe el servidor. El API lo rechaza si
 * viaja en el cuerpo.
 */
export const TASK_COMMENT_TYPE = {
  COMMENT: 1,
  STATUS_CHANGE: 2,
  ASSIGNMENT: 3,
  RESOLUTION: 4,
  AUDIT: 5,
} as const;

export type TaskStatusValue = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
export type TaskPriorityValue = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];
export type TaskVisibilityValue = (typeof TASK_VISIBILITY)[keyof typeof TASK_VISIBILITY];
export type TaskCommentTypeValue =
  (typeof TASK_COMMENT_TYPE)[keyof typeof TASK_COMMENT_TYPE];

/** Los estados en el orden en que el tablero pinta sus columnas. */
export const STATUS_EN_ORDEN: TaskStatusValue[] = [
  TASK_STATUS.REQUESTED,
  TASK_STATUS.PENDING,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.REVIEW,
  TASK_STATUS.COMPLETED,
  TASK_STATUS.CANCELLED,
];

/** El nombre que la columna guardaba antes del flip. */
const NOMBRES_VIEJOS = {
  status: {
    requested: TASK_STATUS.REQUESTED,
    pending: TASK_STATUS.PENDING,
    in_progress: TASK_STATUS.IN_PROGRESS,
    review: TASK_STATUS.REVIEW,
    completed: TASK_STATUS.COMPLETED,
    cancelled: TASK_STATUS.CANCELLED,
  },
  priority: {
    low: TASK_PRIORITY.LOW,
    medium: TASK_PRIORITY.MEDIUM,
    high: TASK_PRIORITY.HIGH,
    urgent: TASK_PRIORITY.URGENT,
  },
  visibility: {
    inherit: TASK_VISIBILITY.INHERIT,
    public: TASK_VISIBILITY.PUBLIC,
    private: TASK_VISIBILITY.PRIVATE,
  },
  type: {
    comment: TASK_COMMENT_TYPE.COMMENT,
    status_change: TASK_COMMENT_TYPE.STATUS_CHANGE,
    assignment: TASK_COMMENT_TYPE.ASSIGNMENT,
    resolution: TASK_COMMENT_TYPE.RESOLUTION,
    audit: TASK_COMMENT_TYPE.AUDIT,
  },
} as const;

/**
 * El número, venga como número, como string numérico o como el nombre viejo.
 *
 * 🔴 Devuelve `null` y **no** un default cuando no reconoce el valor. Un default
 * silencioso acá pintaría «solicitada» sobre una tarea completada.
 */
const normalizar = <T extends number>(
  valor: unknown,
  validos: readonly T[],
  nombresViejos: Record<string, number>,
): T | null => {
  if (typeof valor === "number" && validos.includes(valor as T)) {
    return valor as T;
  }

  if (typeof valor === "string") {
    const comoNumero = Number(valor);

    if (Number.isInteger(comoNumero) && validos.includes(comoNumero as T)) {
      return comoNumero as T;
    }

    const delNombre = nombresViejos[valor.toLowerCase()];

    if (delNombre !== undefined) {
      return delNombre as T;
    }
  }

  return null;
};

export const normalizarEstado = (valor: unknown): TaskStatusValue | null =>
  normalizar(valor, Object.values(TASK_STATUS), NOMBRES_VIEJOS.status);

export const normalizarPrioridad = (valor: unknown): TaskPriorityValue | null =>
  normalizar(valor, Object.values(TASK_PRIORITY), NOMBRES_VIEJOS.priority);

export const normalizarVisibilidad = (valor: unknown): TaskVisibilityValue | null =>
  normalizar(valor, Object.values(TASK_VISIBILITY), NOMBRES_VIEJOS.visibility);

export const normalizarTipoDeComentario = (
  valor: unknown,
): TaskCommentTypeValue | null =>
  normalizar(valor, Object.values(TASK_COMMENT_TYPE), NOMBRES_VIEJOS.type);

/**
 * ¿Esta fila del hilo la escribió el SISTEMA?
 *
 * 🔴 Existe por el corte 4: antes la bitácora se guardaba como `COMMENT` y no
 * había forma de distinguirla de lo que escribió una persona.
 */
export const loEscribioElSistema = (valor: unknown): boolean => {
  const tipo = normalizarTipoDeComentario(valor);

  return tipo !== null && tipo !== TASK_COMMENT_TYPE.COMMENT;
};
