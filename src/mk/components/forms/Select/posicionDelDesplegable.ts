/**
 * Dónde se dibuja el desplegable de `Select`.
 *
 * El contenedor es `position: fixed` (`select.module.css:179`), así que estas
 * coordenadas son de VIEWPORT: lo que queda fuera no se alcanza scrolleando.
 *
 * 🔴 Lo que había antes:
 *
 * ```ts
 * let up = 57;
 * if (childPosition && parent.top + 57 + childPosition.height > window.innerHeight) {
 *   up = childPosition.height * -1;
 * }
 * setPosition({ top: parent.top + up, left: parent.left, width: parent.width });
 * ```
 *
 * Tres agujeros, los tres medidos:
 *
 * 1. **`top` podía quedar NEGATIVO.** Al abrir hacia arriba, `top = parent.top -
 *    alto`. El desplegable llega a ~376px (`max-height: min(320px, 100vh -
 *    140px)` de la lista más el buscador), así que cualquier `Select` con su
 *    borde superior entre ~267px y ~376px abría hacia arriba **y se cortaba**:
 *    el buscador y las primeras opciones quedaban sobre el borde de la
 *    pantalla, sin forma de llegar.
 * 2. **`left` no se acotaba nunca.** El desplegable puede ser más ancho que su
 *    `Select` (`width: max-content`, hasta 420px), así que uno pegado al borde
 *    derecho se salía de la pantalla.
 * 3. **`up = 57` era el alto del `Select` asumido a mano.** Con un multiselect
 *    con chips, o con etiqueta, el alto real es otro y el desplegable quedaba
 *    montado sobre el campo o separado de él.
 */

export type Rectangulo = {
  top: number;
  bottom: number;
  left: number;
  width: number;
};

export type Ventana = { width: number; height: number };

export type PosicionDelDesplegable = { top: number; left: number; width: number };

/** Lo que se deja libre contra cada borde de la pantalla. */
const MARGEN = 12;
/** Aire entre el campo y su desplegable. */
const SEPARACION = 8;

export const calcularPosicionDelDesplegable = (
  campo: Rectangulo,
  ventana: Ventana,
  /** Alto real del desplegable ya renderizado. En la primera apertura no lo hay. */
  altoDelDesplegable?: number,
  /** Ancho real del desplegable. Si no hay, se acota con el del campo. */
  anchoDelDesplegable?: number,
): PosicionDelDesplegable => {
  const alto = altoDelDesplegable ?? 0;
  const ancho = anchoDelDesplegable || campo.width;

  const libreAbajo = ventana.height - campo.bottom - MARGEN;
  const libreArriba = campo.top - MARGEN;
  const arriba = alto > 0 && libreAbajo < alto && libreArriba > libreAbajo;

  // 🔴 El `Math.max(MARGEN, …)` es el arreglo del `top` negativo: preferimos
  // que se corte ABAJO —donde la lista scrollea sola— antes que arriba, donde
  // no hay forma de llegar.
  const top = arriba
    ? Math.max(MARGEN, campo.top - alto - SEPARACION)
    : Math.max(
        MARGEN,
        Math.min(campo.bottom + SEPARACION, ventana.height - alto - MARGEN),
      );

  const left = Math.max(
    MARGEN,
    Math.min(campo.left, ventana.width - ancho - MARGEN),
  );

  return { top, left, width: campo.width };
};
