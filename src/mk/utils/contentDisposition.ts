/**
 * Nombre de archivo que manda el servidor en `Content-Disposition`.
 *
 * El back arma el nombre del reporte con su título y la fecha
 * ("Reporte_de_Pagos_2026-08-04_20-31.pdf"). El front lo tiene que USAR, no
 * reinventar: cuando lo reinventaba salía "payments-cb3411e1-5bec-....pdf",
 * con el uuid pegado, que no le dice nada a quien lo recibe y ordena pésimo
 * en la carpeta de descargas.
 *
 * 🔴 Para que `res.headers.get("Content-Disposition")` devuelva algo en un
 * fetch cross-origin (front en :3000, API en :8000), el servidor tiene que
 * exponerlo: `config/cors.php` → `exposed_headers`. Sin eso el navegador lo
 * oculta y devuelve `null` — sin error y sin aviso.
 *
 * Se contemplan las dos formas del header porque los dos aparecen:
 *   Content-Disposition: attachment; filename="Reporte_de_Pagos.pdf"
 *   Content-Disposition: attachment; filename*=UTF-8''Reporte%20de%20Pagos.pdf
 * `filename*` gana cuando está: es el que conserva los acentos.
 */
export const nombreDeArchivoDelHeader = (
  contentDisposition: string | null | undefined
): string | null => {
  if (!contentDisposition) return null;

  const conCodificacion = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(
    contentDisposition
  );
  if (conCodificacion?.[2]) {
    try {
      return decodeURIComponent(conCodificacion[2].trim()) || null;
    } catch {
      // Un `filename*` mal codificado no puede tumbar la descarga: se sigue
      // de largo y se prueba con el `filename` simple.
    }
  }

  const simple = /filename\s*=\s*"?([^";]+)"?/i.exec(contentDisposition);
  const nombre = simple?.[1]?.trim();

  return nombre ? nombre : null;
};
