"use client";
import { useEffect, useState } from "react";
import {
  LoaderCircle,
  CheckCircle2,
  XCircle,
  Download,
  History,
} from "lucide-react";
import NewModal from "../NewModal/NewModal";
import Button from "../../forms/Button/Button";
import type { AsyncExportState } from "../../../hooks/useAsyncExport/useAsyncExport";
import styles from "./ExportProgressModal.module.css";

/**
 * ExportProgressModal (S33 — NEW-NEW-43 PDF Reports Async + Chunking)
 *
 * Modal que pineá el flow del useAsyncExport. Muestra:
 * - "Generando reporte..." + spinner mientras pending|processing
 * - Progress bar con percent + currentChunk/totalChunks si están disponibles
 * - "Reporte listo" + botón Descargar cuando completed
 * - Mensaje de error + botón Cerrar cuando failed
 *
 * S116b front: pinea botón "Ver historial" en estado completed y
 * failed. El user puede revisar el historial completo de downloads
 * (incluyendo reports viejos pineados por otros módulos) sin perder
 * el contexto del modal actual. Resuelve el bug "se queda pensando":
 * el user ya no está trapped esperando el botón Descargar — siempre
 * puede ver otros reports finalizados en paralelo.
 *
 * Uso:
 *
 *     <ExportProgressModal
 *       open={isExporting || state.status === 'completed' || state.status === 'failed'}
 *       state={state}
 *       reportTypeLabel="Pagos"  // opcional, para el título
 *       onDownload={download}
 *       onClose={reset}
 *       onShowHistory={() => setHistoryOpen(true)}  // S116b
 *     />
 */
type PropsType = {
  open: boolean;
  state: AsyncExportState;
  reportTypeLabel?: string;
  onDownload: () => void;
  onClose: () => void;
  /**
   * S116b: callback para abrir el DownloadHistory modal. Si se pineá,
   * aparece un botón "Ver historial" en los estados completed y failed.
   * Si NO se pineá, no se muestra el botón (back-compat con consumers
   * viejos).
   */
  onShowHistory?: () => void;
};

export default function ExportProgressModal({
  open,
  state,
  reportTypeLabel = "reporte",
  onDownload,
  onClose,
  onShowHistory,
}: PropsType) {
  // Si el reporte está completado, dejamos el modal abierto hasta que
  // el usuario descargue o cierre. El parent controla `open`.
  // Auto-close solo si está procesando Y el componente se está ocultando.

  const showProgress =
    state.status === "pending" || state.status === "processing";
  const showCompleted = state.status === "completed";
  const showFailed = state.status === "failed";

  const title = showCompleted
    ? "Reporte listo"
    : showFailed
      ? "Error al generar el reporte"
      : `Generando ${reportTypeLabel}…`;

  // Auto-foco en el botón Descargar cuando completa (mejora UX)
  const [downloadBtnRef] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (showCompleted && downloadBtnRef) {
      downloadBtnRef.focus();
    }
  }, [showCompleted, downloadBtnRef]);

  return (
    <NewModal
      open={open}
      onClose={onClose}
      onSave={() => {}}
      title={title}
      iconClose={!showProgress}
      buttonText=""
      buttonCancel=""
      duration={200}
      minWidth={"min(420px, 92vw)"}
      maxWidth={"min(560px, 95vw)"}
    >
      <div className={styles.body}>
        {showProgress && (
          <div className={styles.progressContainer}>
            <div className={styles.iconRow}>
              <LoaderCircle
                size={36}
                className={styles.spinner}
                aria-hidden="true"
              />
              <p className={styles.message}>
                {state.status === "pending"
                  ? "Encolando reporte…"
                  : "Generando PDF en chunks pequeños para no saturar el server."}
              </p>
            </div>

            {state.progress > 0 && (
              <div className={styles.progressBar} aria-label="Progreso">
                <div
                  className={styles.progressFill}
                  style={{ width: `${state.progress}%` }}
                />
                <span className={styles.progressLabel}>
                  {state.progress}%
                </span>
              </div>
            )}

            {state.currentChunk !== null && state.totalChunks !== null && (
              <p className={styles.chunks}>
                Chunk {state.currentChunk} de {state.totalChunks}
              </p>
            )}

            <p className={styles.hint}>
              Podés cerrar este modal y volver más tarde — el reporte
              quedará disponible en tu historial de descargas.
            </p>
          </div>
        )}

        {showCompleted && (
          <div className={styles.completedContainer}>
            <CheckCircle2
              size={48}
              className={styles.successIcon}
              aria-hidden="true"
            />
            <p className={styles.message}>
              El {reportTypeLabel} está listo para descargar.
            </p>
            {state.totalChunks !== null && (
              <p className={styles.chunks}>
                Generado en {state.totalChunks} chunks · {state.progress}%
              </p>
            )}
            <div className={styles.actions}>
              <Button
                onClick={onDownload}
                variant="primary"
                data-testid="export-download-btn"
              >
                <Download size={18} />
                Descargar
              </Button>
              {onShowHistory && (
                <Button
                  onClick={onShowHistory}
                  variant="terciary"
                  data-testid="export-show-history-btn"
                >
                  <History size={18} />
                  Ver historial
                </Button>
              )}
              <Button onClick={onClose} variant="secondary">
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {showFailed && (
          <div className={styles.failedContainer}>
            <XCircle
              size={48}
              className={styles.errorIcon}
              aria-hidden="true"
            />
            <p className={styles.errorMessage}>
              {state.errorMessage ?? "Error desconocido"}
            </p>
            <div className={styles.actions}>
              {onShowHistory && (
                <Button
                  onClick={onShowHistory}
                  variant="terciary"
                  data-testid="export-show-history-btn"
                >
                  <History size={18} />
                  Ver historial
                </Button>
              )}
              <Button onClick={onClose} variant="primary">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </NewModal>
  );
}
