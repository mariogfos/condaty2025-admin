"use client";
import { useState } from "react";
import { Download, LoaderCircle, History } from "lucide-react";
import Button from "../../forms/Button/Button";
import ExportProgressModal from "../ExportProgressModal/ExportProgressModal";
import { DownloadHistoryModal } from "../DownloadHistory";
import {
  useAsyncExport,
  type AsyncExportState,
} from "../../../hooks/useAsyncExport/useAsyncExport";
import styles from "./AsyncExportButton.module.css";

/**
 * AsyncExportButton (S33 — NEW-NEW-43 PDF Reports Async + Chunking)
 *
 * Componente standalone que pineá el flow async de export PDF.
 * Combina useAsyncExport + ExportProgressModal en una unidad lista
 * para migrar cualquier botón de export existente.
 *
 * S116b front: pineá un botón "Ver historial" + DownloadHistoryModal
 * para que el user pueda revisar el historial completo de downloads
 * en cualquier momento. Resuelve el bug "Ingresos XLS se queda
 * pensando" — el user ya no necesita esperar a que aparezca el botón
 * "Descargar" del report actual; puede ver otros reports completed
 * o disparar uno nuevo mientras el actual sigue procesándose.
 *
 * Uso básico:
 *
 *     <AsyncExportButton
 *       type="payments"
 *       params={{ filterBy: 'in_at:m', exportTitulos: 'Nombre,Monto' }}
 *       label="Exportar PDF"
 *     />
 *
 * El componente:
 * - Muestra un botón con icono Download
 * - Al hacer click, dispara POST /api/v3/reports/{type}/export
 * - Abre un modal con progress mientras se procesa
 * - Cuando completa, el modal muestra botón "Descargar PDF" + "Ver historial"
 *
 * Requisitos del backend (S32):
 * - El `type` debe estar registrado en ReportTypeRegistry
 * - Por ahora solo `array_chunked` está disponible (test + simple types)
 * - Módulos reales (payments, accesses, etc.) requieren su propio
 *   ReportType (sub-sprint S34+)
 *
 * Por qué este componente existe: minimiza el refactor para migrar
 * un módulo del flow viejo (GET con fullType=L&_export=pdf) al nuevo
 * flow async. Solo reemplazar el botón existente por AsyncExportButton
 * y adaptar `params` al formato del backend.
 */
type PropsType = {
  type: string;
  params: Record<string, any>;
  label?: string;
  format?: "pdf" | "excel";
  className?: string;
  variant?: "primary" | "secondary" | "terciary";
  onCompleted?: (state: AsyncExportState) => void;
  onError?: (error: string) => void;
  /**
   * S116b: si es `true`, pineá un segundo botón "Ver historial" al
   * lado del de export. Default: `true`. Si `false`, el user solo
   * puede ver el historial desde el modal (botón "Ver historial"
   * que aparece cuando completa/falla).
   */
  showHistoryShortcut?: boolean;
};

export default function AsyncExportButton({
  type,
  params,
  label = "Exportar",
  format = "pdf",
  className,
  variant = "terciary",
  onCompleted,
  onError,
  showHistoryShortcut = true,
}: PropsType) {
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { state, start, download, reset } = useAsyncExport({
    type,
    onCompleted: (s) => {
      onCompleted?.(s);
      setModalOpen(true);
    },
    onError: (msg) => {
      onError?.(msg);
      setModalOpen(true);
    },
  });

  const handleClick = async () => {
    setModalOpen(true);
    await start({ ...params, format });
  };

  const handleClose = () => {
    setModalOpen(false);
    reset();
  };

  return (
    <>
      <span className={styles.buttonGroup}>
        <Button
          onClick={handleClick}
          disabled={state.isExporting}
          variant={variant}
          className={className}
          data-testid={`async-export-btn-${type}`}
        >
          {state.isExporting ? (
            <LoaderCircle size={16} className={styles.spinner} />
          ) : (
            <Download size={16} />
          )}
          {label}
        </Button>
        {showHistoryShortcut && (
          <Button
            onClick={() => setHistoryOpen(true)}
            variant={variant === "primary" ? "secondary" : "terciary"}
            data-testid={`async-history-btn-${type}`}
          >
            <History size={16} />
            Historial
          </Button>
        )}
      </span>

      <ExportProgressModal
        open={modalOpen}
        state={state}
        reportTypeLabel={label.replace(/^Exportar\s*/i, "").toLowerCase() || "reporte"}
        onDownload={async () => {
          await download();
          setModalOpen(false);
          reset();
        }}
        onClose={handleClose}
        onShowHistory={() => {
          setModalOpen(false);
          setHistoryOpen(true);
        }}
      />

      <DownloadHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
