import type { ReservationUnit } from "@/modulos/Reservas/Type/ReservaType";
import {
  buildReservationUnitChoicesForUnits,
  type ReservationUnitChoice,
} from "@/modulos/Reservas/utils/reservationUnitChoices";

/**
 * Las opciones del selector "Unidad y persona" de `/create-reservas`.
 *
 * Una opción por (unidad, persona): el propietario, el inquilino y los
 * dependientes de los dos, armadas por `buildReservationUnitChoices`, la misma
 * regla que usa el Calendario. La persona elegida es la que viaja como
 * `owner_id` y la que el API guarda como responsable de la reserva.
 *
 * Historia: hasta 2026-10-01 había UNA opción por unidad, rotulada con el
 * titular, porque el back pisaba el `owner_id` con el titular. Antes de eso la
 * etiqueta nombraba al inquilino y la reserva iba al titular — en producción
 * (2026-09-02) 168 unidades mostraban un nombre y reservaban para otra persona.
 *
 * Vive acá y no adentro del `useMemo` para que el test mida la función que la
 * pantalla llama, y no una copia parecida.
 */

// El API devuelve las unidades sin ordenar. `numeric` hace que "10" vaya
// después de "9" y no antes, que es lo que hace una comparación de texto.
const comparador = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

type SortableUnit = { id: string | number; nro?: string | number | null };

export const ordenarUnidades = <T extends SortableUnit>(unidades: T[] = []): T[] =>
  [...unidades].sort(
    (una, otra) =>
      comparador.compare(String(una?.nro ?? ""), String(otra?.nro ?? "")) ||
      comparador.compare(String(una?.id ?? ""), String(otra?.id ?? "")),
  );

/**
 * Cuando el área bloquea por deuda, sólo quedan las unidades con
 * `defaulter == 'X'` (sin mora); las personas de una unidad morosa no se
 * ofrecen.
 */
export const opcionesDeUnidades = (
  unidades: ReservationUnit[] = [],
  bloqueaConDeuda = false,
): ReservationUnitChoice[] =>
  buildReservationUnitChoicesForUnits(
    ordenarUnidades(unidades).filter(
      (unidad) => !bloqueaConDeuda || unidad?.defaulter == "X",
    ),
  );
