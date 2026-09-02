import { getFullName } from "@/mk/utils/string";

/**
 * Cómo se nombra una unidad en el selector de la reserva.
 *
 * 🔴 La etiqueta decía el nombre del INQUILINO y la reserva se creaba para el
 * TITULAR. No es lo mismo: `titular = holder === 'H' ? homeowner : tenant`, y
 * `ReservationController::beforeCreate` pisa el `owner_id` que manda el front
 * con el titular de la unidad — el back es el que decide, y el front mostraba
 * al otro.
 *
 * Medido en PRODUCCIÓN el 2026-09-02, sobre 2.891 unidades activas:
 *
 * | caso | unidades | qué veía el administrador |
 * |---|---|---|
 * | inquilino distinto del propietario | **168** | un nombre, y la reserva iba para otra persona |
 * | sin inquilino cargado | **112** | la opción salía SIN nombre (`getFullName(null)` es `""`) |
 * | inquilino = propietario | 2.604 | correcto por coincidencia |
 *
 * ⚠️ Las 2.891 tienen `holder = 'H'` sin una sola excepción: el titular es
 * siempre el propietario. La rama del inquilino se escribe igual porque es la
 * que define el titular si el dato aparece.
 */

type Persona = {
  id?: string | number | null;
  name?: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
} | null;

export type UnidadDelCombo = {
  id: string | number;
  nro?: string | number | null;
  holder?: string | null;
  homeowner?: Persona;
  tenant?: Persona;
};

/** La misma regla que `Dpto::getTitularAttribute()` en el API. */
export const titularDeLaUnidad = (unidad?: UnidadDelCombo | null): Persona =>
  (unidad?.holder === "H" ? unidad?.homeowner : unidad?.tenant) ?? null;

const nombreDe = (persona: Persona): string =>
  persona ? getFullName(persona).trim() : "";

const esLaMismaPersona = (una: Persona, otra: Persona): boolean => {
  if (!una || !otra) return false;
  if (una.id != null && otra.id != null) return String(una.id) === String(otra.id);
  return nombreDe(una) !== "" && nombreDe(una) === nombreDe(otra);
};

/**
 * Nombra a la persona para la que se va a crear la reserva, y sólo agrega al
 * ocupante cuando es otra: el administrador suele buscar por quien vive ahí.
 */
export const etiquetaDeUnidad = (unidad?: UnidadDelCombo | null): string => {
  const numero = String(unidad?.nro ?? "").trim();
  const unidadTexto = numero ? `Unidad: ${numero}` : "Unidad sin número";

  const titular = titularDeLaUnidad(unidad);
  const nombreTitular = nombreDe(titular);

  if (!nombreTitular) return `${unidadTexto} - Sin titular`;

  const inquilino = unidad?.tenant ?? null;
  const ocupanteEsOtro =
    Boolean(nombreDe(inquilino)) && !esLaMismaPersona(inquilino, titular);

  return ocupanteEsOtro
    ? `${unidadTexto} - ${nombreTitular} (titular) · vive ${nombreDe(inquilino)}`
    : `${unidadTexto} - ${nombreTitular} (titular)`;
};

// El API devuelve las unidades sin ordenar. `numeric` hace que "10" vaya
// después de "9" y no antes, que es lo que hace una comparación de texto.
const comparador = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

export const ordenarUnidades = <T extends UnidadDelCombo>(unidades: T[] = []): T[] =>
  [...unidades].sort(
    (una, otra) =>
      comparador.compare(String(una?.nro ?? ""), String(otra?.nro ?? "")) ||
      comparador.compare(String(una?.id ?? ""), String(otra?.id ?? "")),
  );

/**
 * Las opciones del selector, tal cual las pinta la pantalla.
 *
 * Vive acá y no adentro del `useMemo` para que el test mida la función que la
 * pantalla llama, y no una copia parecida.
 */
export const opcionesDeUnidades = (
  unidades: UnidadDelCombo[] = [],
  bloqueaConDeuda = false,
): Array<{ id: string; name: string }> =>
  ordenarUnidades(unidades)
    .filter(
      (unidad: UnidadDelCombo & { defaulter?: string }) =>
        !bloqueaConDeuda || unidad?.defaulter == "X",
    )
    .map((unidad) => ({ id: String(unidad.id), name: etiquetaDeUnidad(unidad) }));
