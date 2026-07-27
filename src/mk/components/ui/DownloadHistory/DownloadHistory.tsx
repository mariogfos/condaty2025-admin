"use client";
/**
 * S116b front — DownloadHistory component
 *
 * Lista los reports generados por el user autenticado. Consume
 * `GET /api/v3/reports?status=...&page=...&perPage=...` (pineado en
 * S116b back, PR #204). Replica el patrón de S113/S115/S117 de
 * `useAsyncExport.ts` para construir URLs absolutas al back con
 * `API_BASE_URL` + `getAuthToken()` + `buildBackendUrl()`.
 *
 * HALLAZGO-NEW-21 (binding, cross-project): cualquier `fetch()` que
 * pineá una URL del BACK debe pinear el baseURL del back
 * (`process.env.NEXT_PUBLIC_API_URL`), NO ruta relativa.
 *
 * HALLAZGO-NEW-24 (binding, cross-project): cuando `API_BASE_URL`
 * termina en `/api` y el back pineá `route()` con `/api/...`,
 * pinear helper `buildBackendUrl()` que strip `/api` para evitar
 * doble `/api/`.
 *
 * HALLAZGO-NEW-20 (binding, cross-project): pinear endpoint canónico
 * `/v3/reports` (NO legacy alias `/api/reports` con Controller roto
 * HALLAZGO-NEW-22).
 *
 * Uso:
 *
 *     <DownloadHistory onDownload={(url, type) => downloadReport(url, type)} />
 *
 *     // o envuelto en modal:
 *
 *     <DownloadHistoryModal ... />
 */
import { useCallback, useEffect, useState } from "react";
import {
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Inbox,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Button from "../../forms/Button/Button";
import styles from "./DownloadHistory.module.css";

/**
 * URL base del back (S113 pattern). Termina en `/api` en producción
 * (e.g. `http://127.0.0.1:8000/api`). Vacío si no está pineado
 * (legacy fallback a misma-origin).
 */
const API_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "";

/**
 * S117 helper: cuando el path del back (vía `route()`) empieza con
 * `/api/...`, strip el `/api` y concatenar con API_BASE_URL (que ya
 * lo tiene). Si el path empieza con `/v3/...`, concatenar tal cual.
 * Si el path ya es absoluto (`http...`), retornar tal cual.
 */
const buildBackendUrl = (path: string): string => {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/")) {
    return `${API_BASE_URL}${path.substring(4)}`;
  }
  return `${API_BASE_URL}${path}`;
};

/**
 * Lee el token de localStorage pineado por el flow de auth.
 * Replica el patrón de `src/mk/interceptors/axiosInterceptors.tsx`.
 */
const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem(
      (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
    );
    if (!raw) return null;
    return JSON.parse(raw + "").token ?? null;
  } catch {
    return null;
  }
};

export type DownloadHistoryStatus = "completed" | "failed" | "pending" | "processing" | "all";

export type DownloadHistoryItem = {
  id: number;
  uuid: string;
  type: string;
  status: DownloadHistoryStatus;
  created_at: string | null;
  download_url: string | null;
  size_bytes: number | null;
};

export type DownloadHistoryResponse = {
  data: DownloadHistoryItem[];
  meta: {
    page: number;
    per_page: number;
    total: number;
  };
};

type DownloadHistoryProps = {
  /** Status inicial. Default "completed" (lo que el user normalmente quiere). */
  initialStatus?: DownloadHistoryStatus;
  /** Polling automático para reports pending/processing (cada N ms). 0 = off. */
  pollIntervalMs?: number;
  /**
   * Callback cuando el user hace click en Descargar. El parent decide
   * cómo pineá el download (e.g. pineando useAsyncExport.download
   * o custom flow con Bearer + Blob). Si no se pineá, hace el
   * download directo con fetch + Bearer + Blob (S115/S117 pattern).
   */
  onDownload?: (item: DownloadHistoryItem) => void | Promise<void>;
  /** Custom render para mensajes vacíos / errores. */
  emptyMessage?: string;
};

export type { DownloadHistoryProps };

const DEFAULT_STATUS: DownloadHistoryStatus = "completed";
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_POLL_MS = 5000;

/** Humaniza el `type` del report ("payments-xlsx" → "Pagos XLSX"). */
const humanizeType = (type: string): string => {
  // Mapeo conocido (ReportTypeRegistry)
  const known: Record<string, string> = {
    payments: "Pagos",
    "payments-xlsx": "Pagos XLSX",
    accesses: "Accesos",
    defaulters: "Morosos",
    "dptos-deudas": "Deudas por Dpto",
    "bank-accounts": "Cuentas Bancarias",
    expenses: "Expensas",
    areas: "Áreas",
    "array_chunked": "Reporte (genérico)",
  };
  if (known[type]) return known[type];
  // Fallback: humanizar el slug
  return type
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatBytes = (bytes: number | null): string => {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const StatusPill = ({ status }: { status: DownloadHistoryStatus }) => {
  const className = (() => {
    switch (status) {
      case "completed":
        return styles.statusCompleted;
      case "failed":
        return styles.statusFailed;
      case "pending":
        return styles.statusPending;
      case "processing":
        return styles.statusProcessing;
      default:
        return "";
    }
  })();
  return <span className={`${styles.statusPill} ${className}`}>{status}</span>;
};

export default function DownloadHistory({
  initialStatus = DEFAULT_STATUS,
  pollIntervalMs = DEFAULT_POLL_MS,
  onDownload,
  emptyMessage = "Aún no generaste ningún reporte. Probá exportar algo desde un módulo con botón \"Exportar XLSX\" o \"Exportar PDF\".",
}: DownloadHistoryProps) {
  const [status, setStatus] = useState<DownloadHistoryStatus>(initialStatus);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DownloadHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);

  const perPage = DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const fetchPage = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        // S116b: pinea endpoint canónico `/v3/reports` (NO legacy alias
        // `/api/reports` HALLAZGO-NEW-22). Query params: status, page, perPage.
        // URL absoluta al back (HALLAZGO-NEW-21).
        const url = `${API_BASE_URL}/v3/reports?status=${status}&page=${page}&perPage=${perPage}`;
        const token = getAuthToken();
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (res.status === 401) {
          setError("No autenticado. Iniciá sesión para ver tu historial.");
          setItems([]);
          setTotal(0);
          return;
        }
        if (!res.ok) {
          setError(`Error al cargar el historial (${res.status})`);
          setItems([]);
          setTotal(0);
          return;
        }
        const body: DownloadHistoryResponse = await res.json();
        setItems(body.data ?? []);
        setTotal(body.meta?.total ?? 0);
      } catch (err: any) {
        setError(err?.message ?? "Error de red al cargar el historial");
        setItems([]);
        setTotal(0);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [status, page, perPage],
  );

  // Initial + when status/page changes
  useEffect(() => {
    fetchPage(true);
  }, [fetchPage]);

  // Polling: si hay reports pending/processing en la lista, polling
  // cada pollIntervalMs. Solo aplica si el filtro de status los incluye.
  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const hasPending = items.some(
      (i) => i.status === "pending" || i.status === "processing",
    );
    if (!hasPending) return;
    const id = setInterval(() => fetchPage(false), pollIntervalMs);
    return () => clearInterval(id);
  }, [items, pollIntervalMs, fetchPage]);

  const handleDownload = useCallback(
    async (item: DownloadHistoryItem) => {
      if (!item.download_url) {
        return;
      }
      if (onDownload) {
        await onDownload(item);
        return;
      }
      // Default download flow (S117 helper + S115 Bearer + Blob)
      setDownloadingUuid(item.uuid);
      try {
        const downloadUrl = buildBackendUrl(item.download_url);
        const token = getAuthToken();
        const res = await fetch(downloadUrl, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (!res.ok) {
          return;
        }
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${item.type}-${item.uuid}.${item.type.includes("xlsx") || item.type.includes("excel") ? "xlsx" : "pdf"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch {
        // silent — toast del parent si quiere
      } finally {
        setDownloadingUuid(null);
      }
    },
    [onDownload],
  );

  return (
    <div className={styles.body} data-testid="download-history">
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h3 className={styles.title}>Historial de descargas</h3>
          <p className={styles.subtitle}>
            {total} {total === 1 ? "reporte" : "reportes"} · página {page} de {totalPages}
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => fetchPage(true)}
          disabled={loading}
          aria-label="Refrescar"
        >
          {loading ? (
            <Loader2 size={14} className={styles.refreshSpinner} />
          ) : (
            <RefreshCw size={14} />
          )}
          Refrescar
        </button>
      </div>

      {error ? (
        <div className={styles.error}>
          <AlertCircle size={32} />
          <p>{error}</p>
          <Button onClick={() => fetchPage(true)} variant="terciary" small>
            Reintentar
          </Button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.refreshSpinner} />
          <p>Cargando historial…</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <Inbox size={48} className={styles.emptyIcon} />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <ul className={styles.list} data-testid="download-history-list">
          {items.map((item) => {
            const isXlsx =
              item.type.includes("xlsx") || item.type.includes("excel");
            const Icon = isXlsx ? FileSpreadsheet : FileText;
            const isCompleted = item.status === "completed";
            return (
              <li
                key={item.uuid}
                className={styles.item}
                data-testid="download-history-item"
              >
                <Icon
                  size={20}
                  className={styles.itemIcon}
                  aria-hidden="true"
                />
                <div className={styles.itemBody}>
                  <p className={styles.itemTitle}>{humanizeType(item.type)}</p>
                  <p className={styles.itemMeta}>
                    <span>{formatDate(item.created_at)}</span>
                    {item.size_bytes !== null && item.size_bytes > 0 && (
                      <span>· {formatBytes(item.size_bytes)}</span>
                    )}
                    <StatusPill status={item.status} />
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={() => handleDownload(item)}
                  disabled={!isCompleted || downloadingUuid === item.uuid}
                  data-testid="download-history-download-btn"
                >
                  {downloadingUuid === item.uuid ? (
                    <Loader2 size={14} className={styles.refreshSpinner} />
                  ) : (
                    <Download size={14} />
                  )}
                  {isCompleted ? "Descargar" : "—"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.paginationBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            ← Anterior
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.paginationBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
