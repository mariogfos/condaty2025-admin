"use client";
/**
 * S116b front — DownloadHistoryModal
 *
 * Envoltorio en `<NewModal>` del componente `DownloadHistory`. Pensado
 * para pinear como "Ver historial" en el `ExportProgressModal` y
 * `AsyncExportButton`. Mantiene el contrato del `NewModal` que el
 * proyecto ya pineá en 30+ lugares.
 */
import NewModal from "../NewModal/NewModal";
import DownloadHistory, {
  type DownloadHistoryProps,
  type DownloadHistoryItem,
} from "./DownloadHistory";

type DownloadHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  /** Se ejecuta cuando el user hace click en Descargar dentro del modal. */
  onDownload?: (item: DownloadHistoryItem) => void | Promise<void>;
  /** Status inicial. Default "completed". */
  initialStatus?: DownloadHistoryProps["initialStatus"];
  /** Polling opcional para reports pending/processing. */
  pollIntervalMs?: number;
};

export default function DownloadHistoryModal({
  open,
  onClose,
  onDownload,
  initialStatus,
  pollIntervalMs,
}: DownloadHistoryModalProps) {
  return (
    <NewModal
      open={open}
      onClose={onClose}
      onSave={() => {}}
      title="Historial de descargas"
      iconClose={true}
      buttonText=""
      buttonCancel=""
      duration={200}
      minWidth={"min(520px, 94vw)"}
      maxWidth={"min(720px, 96vw)"}
    >
      <DownloadHistory
        onDownload={onDownload}
        initialStatus={initialStatus}
        pollIntervalMs={pollIntervalMs}
      />
    </NewModal>
  );
}
