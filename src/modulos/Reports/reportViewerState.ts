export type ReportViewerState = {
  params?: Record<string, any>;
};

export const encodeReportViewerState = (state: ReportViewerState) => {
  try {
    return encodeURIComponent(JSON.stringify(state || {}));
  } catch (_error) {
    return "";
  }
};

export const decodeReportViewerState = (
  value: string | null | undefined,
): ReportViewerState => {
  if (!value) return {};

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (_error) {
    return {};
  }
};

/**
 * La fecha `Y-m-d` del reloj de quien mira.
 *
 * 🔴 `test` usaba `toISOString().slice(0, 10)`, que es la fecha en **UTC**: en
 * Bolivia, de las 20:00 a la medianoche, «hoy» salía como mañana. Y mezclada
 * con `getFullYear()`, que es local, el 31 de diciembre a las 21:00 armaba un
 * rango del 1 de enero del año VIEJO al 1 de enero del NUEVO.
 */
export const fechaLocalIso = (date: Date = new Date()) => {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
