/**
 * Un `Intl.DateTimeFormat` en la zona que dice el API.
 *
 * ⚠️ El API valida la zona contra la lista de PHP, pero el ICU del navegador
 * puede no conocer una que PHP sí: `Intl` lanza `RangeError` en el render y se
 * cae el tablero entero. Ante eso, la hora sale en la zona del navegador.
 */
export function presenceDateFormat(options: Intl.DateTimeFormatOptions, timeZone?: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("es-BO", { ...options, timeZone });
  } catch {
    return new Intl.DateTimeFormat("es-BO", options);
  }
}
