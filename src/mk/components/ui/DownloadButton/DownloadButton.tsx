"use client";
/**
 * DownloadButton (S143e — HALLAZGO-NEW-54, binding, cross-project)
 *
 * Reemplaza el patrón "Exportar PDF" con un ícono Download + menú.
 *
 * Patrón de uso (S143e — HALLAZGO-NEW-54):
 *
 *     // Modo multi-format (PDF + XLSX + CSV): el botón pineá un ícono Download.
 *     // Al click, se abre un dropdown con las opciones de format.
 *     <DownloadButton
 *       type="payments"
 *       params={{ startDate: '2026-01-01', endDate: '2026-07-29' }}
 *       supportedFormats={['pdf', 'xlsx', 'csv']}
 *     />
 *
 *     // Modo single-format (CustomReport): el botón pineá un ícono Download
 *     // directo (sin menú). El single click dispatcha el export.
 *     <DownloadButton
 *       type="balance"
 *       params={{ from: '2026-01-01', to: '2026-07-29' }}
 *       supportedFormats={['pdf']}
 *     />
 *
 * Características:
 *   - Solo ícono (sin texto "Exportar PDF"). Tooltip via `title` HTML.
 *   - Si `supportedFormats.length > 1`: dropdown con PDF / XLS / CSV.
 *   - Si `supportedFormats.length === 1`: single click directo.
 *   - Reusa `useAsyncExport` (mismo flow async que `AsyncExportButton`).
 *   - `useExtraData` y `requiredRelations` se pinean en params (S143e).
 *
 * Cross-project: el patrón "ícono + menú" es replicable a TODO proyecto
 * con useCrud. Reemplaza el patrón "Exportar PDF / Exportar XLSX" duplicado
 * en cada módulo.
 */
import { useState } from "react";
import { Download, ChevronDown, LoaderCircle } from "lucide-react";
import {
  useAsyncExport,
  type AsyncExportState,
} from "../../../hooks/useAsyncExport/useAsyncExport";
import ExportProgressModal from "../ExportProgressModal/ExportProgressModal";
import { DownloadHistoryModal } from "../DownloadHistory";
import styles from "./DownloadButton.module.css";

export type DownloadFormat = "pdf" | "xlsx" | "csv";

type PropsType = {
  /** Identificador del módulo (e.g. "payments", "outlays"). */
  type: string;
  /** Parámetros del reporte (filterBy, searchBy, fechas, etc.). */
  params: Record<string, any>;
  /**
   * S143e (HALLAZGO-NEW-54): formats soportados por el ExportConfig del
   * módulo. Si pineá 1 solo format → single click directo. Si pineá 2-3 →
   * dropdown.
   *
   * Default: ['pdf'] (compat con consumers legacy que solo pineán PDF).
   */
  supportedFormats?: DownloadFormat[];
  /**
   * S143e (HALLAZGO-NEW-54): URL del endpoint de lista del módulo (e.g.
   * `/api/v3/payments`). Si se pineá, el flow consume este endpoint
   * con `?_export=pdf|xls|csv` en vez del endpoint BC layer
   * `POST /api/v3/reports/{type}/export`.
   *
   * Default: null (usa el flow BC layer legacy).
   */
  endpoint?: string | null;
  /**
   * S143e (HALLAZGO-NEW-54): si `true`, el Controller pineá `extraData`
   * antes del export (metadata adicional: totales, categorías, etc.).
   */
  useExtraData?: boolean;
  /**
   * S143e (HALLAZGO-NEW-54): relations que el Controller debe eager-load
   * antes del export (e.g. ['paymentMethod', 'category', 'bankAccount']).
   */
  requiredRelations?: string[];
  /** Callback cuando el export completa exitosamente. */
  onCompleted?: (state: AsyncExportState) => void;
  /** Callback cuando hay error. */
  onError?: (error: string) => void;
  /** Clases CSS adicionales. */
  className?: string;
  /** title HTML para tooltip. Default: "Exportar". */
  title?: string;
};

const formatLabel: Record<DownloadFormat, string> = {
  pdf: "PDF",
  xlsx: "Excel (XLSX)",
  csv: "CSV",
};

export default function DownloadButton({
  type,
  params,
  supportedFormats = ["pdf"],
  endpoint = null,
  useExtraData = false,
  requiredRelations = [],
  onCompleted,
  onError,
  className,
  title = "Exportar",
}: PropsType) {
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const hasMultipleFormats = supportedFormats.length > 1;

  const { state, start, download, reset } = useAsyncExport({
    type,
    endpoint, // S143e: si se pineá, useAsyncExport lo consume.
    onCompleted: (s) => {
      onCompleted?.(s);
      setModalOpen(true);
    },
    onError: (msg) => {
      onError?.(msg);
      setModalOpen(true);
    },
  });

  /**
   * S143e (HALLAZGO-NEW-54): dispatcha el export con el format pineado.
   * Si el ExportConfig pineá `useExtraData` o `requiredRelations`, los
   * pasamos en params (el back los consume).
   */
  const handleExport = async (format: DownloadFormat) => {
    setMenuOpen(false);
    setModalOpen(true);
    const exportParams: Record<string, any> = {
      ...params,
      format: format === "xlsx" ? "xlsx" : format,
    };
    if (useExtraData) {
      exportParams._useExtraData = "1";
    }
    if (requiredRelations.length > 0) {
      exportParams._requiredRelations = requiredRelations.join(",");
    }
    await start(exportParams);
  };

  const handleDirectClick = () => {
    if (hasMultipleFormats) {
      setMenuOpen((v) => !v);
      return;
    }
    handleExport(supportedFormats[0] ?? "pdf");
  };

  const handleClose = () => {
    setModalOpen(false);
    reset();
  };

  return (
    <>
      <span className={styles.wrapper}>
        <button
          type="button"
          onClick={handleDirectClick}
          disabled={state.isExporting}
          className={`${styles.iconButton} ${className ?? ""}`.trim()}
          data-testid={`download-btn-${type}`}
          title={title}
          aria-label={title}
        >
          {state.isExporting ? (
            <LoaderCircle size={16} className={styles.spinner} />
          ) : (
            <Download size={16} />
          )}
          {hasMultipleFormats && (
            <ChevronDown size={12} className={styles.chevron} />
          )}
        </button>

        {hasMultipleFormats && menuOpen && (
          <div
            className={styles.menu}
            data-testid={`download-menu-${type}`}
            role="menu"
          >
            {supportedFormats.map((fmt) => (
              <button
                key={fmt}
                type="button"
                role="menuitem"
                className={styles.menuItem}
                onClick={() => handleExport(fmt)}
                data-testid={`download-menuitem-${type}-${fmt}`}
              >
                {formatLabel[fmt]}
              </button>
            ))}
            <hr className={styles.menuDivider} />
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                setMenuOpen(false);
                setHistoryOpen(true);
              }}
              data-testid={`download-menuitem-${type}-history`}
            >
              Ver historial
            </button>
          </div>
        )}
      </span>

      <ExportProgressModal
        open={modalOpen}
        state={state}
        reportTypeLabel={title}
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
        initialType={type}
      />
    </>
  );
}
