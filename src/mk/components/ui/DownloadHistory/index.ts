/**
 * S116b front — Public API del DownloadHistory
 *
 * Re-export del componente standalone + el modal envoltorio.
 * Importar así:
 *
 *     import { DownloadHistory, DownloadHistoryModal } from "@/mk/components/ui/DownloadHistory";
 */
export { default as DownloadHistory } from "./DownloadHistory";
export { default as DownloadHistoryModal } from "./DownloadHistoryModal";
export type {
  DownloadHistoryItem,
  DownloadHistoryStatus,
  DownloadHistoryResponse,
  DownloadHistoryProps,
} from "./DownloadHistory";
