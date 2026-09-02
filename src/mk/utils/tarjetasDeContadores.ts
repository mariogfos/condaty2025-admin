/**
 * Las tarjetas de contadores que abren los listados de Unidades y de Personal.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 SALTEAR UNA CLAVE POR POSICIÓN
 * ────────────────────────────────────────────────────────────────────────
 *
 * Las dos pantallas hacían lo mismo, cada una en su archivo:
 *
 * ```ts
 * Object.keys(extraData?.units || {}).map((c, i) => {
 *   if (i !== 0) { untis.push({ id: c, name: c, value: extraData.units[c] }); }
 * });
 * ```
 *
 * El `i !== 0` está salteando una clave CON NOMBRE —`total_units` en Unidades,
 * `total_users` en Personal—, y funciona sólo porque el API la deja primera:
 * `array_merge(['total_units' => $totalUnits], $units)`. Es una dependencia de
 * ORDEN entre dos repos que no se compilan juntos, que nada mide y que nadie
 * escribió: reordenar ese `array_merge` haría aparecer una tarjeta «total_units»
 * y desaparecer un tipo de unidad, sin un solo error.
 *
 * Se saltea por NOMBRE.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 Y EN PERSONAL, ADEMÁS, EL CONTADOR PERDÍA GENTE
 * ────────────────────────────────────────────────────────────────────────
 *
 * `data.users` venía keyeado por el NOMBRE del rol. El nombre lo escribe el
 * admin y nada le impide repetirlo — no hay índice único sobre
 * `(client_id, name)`. Medido el 2026-09-02: un condominio tiene DOS roles
 * llamados «Director de Seguridad»; el segundo pisaba al primero y la tarjeta
 * mostraba **0 en vez de 1**.
 *
 * Desde api#503 llega keyeado por ID, y el título sale de `roles`, que viaja en
 * la misma respuesta. Por eso `contadoresPorId` recibe el catálogo aparte.
 */

/** Una tarjeta: qué dice y qué número muestra. */
export interface TarjetaDeContador {
  id: string;
  name: string;
  value: number;
}

/**
 * Los contadores cuya clave YA es la etiqueta — hoy, los tipos de unidad.
 *
 * `total` es la clave del gran total, que tiene su propia tarjeta y no va en la
 * lista.
 */
export const contadoresPorNombre = (
  contadores: Record<string, unknown> | null | undefined,
  total: string,
): TarjetaDeContador[] =>
  Object.entries(contadores || {})
    .filter(([clave]) => clave !== total)
    .map(([clave, valor]) => ({
      id: clave,
      name: clave,
      value: Number(valor) || 0,
    }));

/**
 * Los contadores keyeados por id, titulados con un catálogo aparte.
 *
 * ⚠️ Un contador sin entrada en el catálogo **se descarta**. Una tarjeta sin
 * título es peor que una tarjeta de menos: se dibuja vacía y parece un dato
 * roto del condominio, no un desajuste entre dos respuestas.
 */
export const contadoresPorId = (
  contadores: Record<string, unknown> | null | undefined,
  catalogo: Array<{ id: string | number; name?: string }> | null | undefined,
  total: string,
): TarjetaDeContador[] => {
  const nombrePorId = new Map(
    (catalogo || []).map((item) => [String(item.id), item.name || ""]),
  );

  return Object.entries(contadores || {})
    .filter(([clave]) => clave !== total && nombrePorId.get(clave))
    .map(([clave, valor]) => ({
      id: clave,
      name: nombrePorId.get(clave) as string,
      value: Number(valor) || 0,
    }));
};
