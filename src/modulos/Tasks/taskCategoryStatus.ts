/**
 * El estado de una categoría de tareas.
 *
 * Era el char `'A'` / `'X'`. El API lo pasó a enum numérico el 2026-09-24
 * (`App\Modules\Tasks\Enums\TaskCategoryStatus`), con el corte 1 de la
 * migración del módulo.
 *
 * 🔴 `INACTIVE` vale 2 y no 0: los enums de este proyecto empiezan en 1, porque
 * un 0 no se distingue de «la columna está vacía».
 */
export const TASK_CATEGORY_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

export type TaskCategoryStatusValue =
  (typeof TASK_CATEGORY_STATUS)[keyof typeof TASK_CATEGORY_STATUS];

/**
 * Normaliza lo que llegue a uno de los dos números.
 *
 * ⚠️ Acepta el char viejo además del número **a propósito**: el API y el admin
 * se despliegan juntos, pero un cliente con la pantalla vieja abierta puede
 * seguir mandando `'A'`, y una fila que quedó sin migrar puede seguir
 * devolviéndolo. Un valor desconocido cae a `ACTIVE`, que es el default que la
 * columna ya tenía — apagar una categoría que nadie apagó la escondería de la
 * pantalla.
 */
export const normalizarEstadoDeCategoria = (
  valor: unknown,
): TaskCategoryStatusValue => {
  if (valor === TASK_CATEGORY_STATUS.INACTIVE || valor === "2") {
    return TASK_CATEGORY_STATUS.INACTIVE;
  }

  if (typeof valor === "string" && valor.toUpperCase() === "X") {
    return TASK_CATEGORY_STATUS.INACTIVE;
  }

  return TASK_CATEGORY_STATUS.ACTIVE;
};

/** ¿Está apagada? */
export const estaInactivaLaCategoria = (valor: unknown): boolean =>
  normalizarEstadoDeCategoria(valor) === TASK_CATEGORY_STATUS.INACTIVE;
