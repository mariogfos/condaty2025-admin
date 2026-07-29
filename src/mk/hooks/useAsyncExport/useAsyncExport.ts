"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from "react";
import useToast from "../useToast";

/**
 * S113: el bug original pineaba `fetch("/api/v3/reports/...")` con RUTA
 * RELATIVA — el navegador la resolvía contra `window.location.origin` (el
 * front en :3000), no contra el back en :8000. Resultado: 404 silencioso
 * en TODOS los exports. El fix pinea el baseURL via
 * `process.env.NEXT_PUBLIC_API_URL` + replica el patrón del token del
 * localStorage que el axiosInterceptors pinea.
 */
const API_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "";

/**
 * S117: helper que construye la URL absoluta al back pineando API_BASE_URL
 * (que termina en `/api`) y un path del back. El bug original S115
 * pineaba `${API_BASE_URL}${path}` directo, pero los paths de reports
 * (status, download_url) que vienen del back ya empiezan con `/api/...`
 * (vía `route()`), entonces la concatenación pineá DOBLE `/api/`
 * (e.g. `http://localhost:8000/api/api/v3/reports/...`) → 404 del front
 * proxy → front recibe HTML de Next.js como PDF → "PDF ilegible" con
 * basura.
 *
 * Estrategia: si el path empieza con `/api/`, strip el `/api` y concatenar
 * con API_BASE_URL (que ya lo tiene). Si no, concatenar tal cual
 * (e.g. paths hardcoded como `/v3/reports/...` que S113 pineó).
 */
const buildBackendUrl = (path: string): string => {
  if (path.startsWith("http")) return path;
  // Path del back que ya incluye `/api/...` (vía route()).
  if (path.startsWith("/api/")) {
    return `${API_BASE_URL}${path.substring(4)}`;  // strip leading "/api"
  }
  // Path sin prefix /api (e.g. `/v3/reports/...` pineado por S113).
  return `${API_BASE_URL}${path}`;
};

/**
 * Lee el token de localStorage pineado por el flow de auth.
 * Replica el patrón de `src/mk/interceptors/axiosInterceptors.tsx`.
 * Retorna null si no hay token (caller decide cómo manejar).
 */
const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem(
      (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
    );
    if (!raw) return null;
    return JSON.parse(raw + "").token ?? null;
  } catch {
    return null;
  }
};

/**
 * useAsyncExport (S33 — NEW-NEW-43 PDF Reports Async + Chunking)
 *
 * Hook que pineá el flow async de export PDF introducido en S32:
 * 1. POST /api/v3/reports/{type}/export con params → 202 + job_id
 * 2. Polling GET /api/v3/reports/{job_id}/status cada N ms
 * 3. Cuando completed → fetch download_url → blob → <a> download
 *
 * Por qué este hook: el flow viejo (useCrud.onExport) llama al endpoint
 * del módulo con `fullType=L&_export=pdf` que renderiza el PDF
 * SÍNCRONAMENTE en el request → si el reporte es grande, se cae el server
 * con memory_limit o timeout 60s. El flow async mueve el render al queue
 * worker (chunked + Dompdf cleanup per chunk).
 *
 * Patrón de uso en un componente:
 *
 *     const { state, start, download, reset } = useAsyncExport({
 *       type: 'payments',
 *       onCompleted: (s) => showToast('Reporte listo', 'success'),
 *       onError: (msg) => showToast(msg, 'error'),
 *     });
 *
 *     <button onClick={() => start(params)} disabled={state.isExporting}>
 *       Exportar PDF
 *     </button>
 *
 *     <ExportProgressModal
 *       open={state.isExporting || state.status === 'completed' || state.status === 'failed'}
 *       status={state.status}
 *       progress={state.progress}
 *       currentChunk={state.currentChunk}
 *       totalChunks={state.totalChunks}
 *       errorMessage={state.errorMessage}
 *       onDownload={download}
 *       onClose={reset}
 *     />
 */
export type AsyncExportStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type AsyncExportState = {
  isExporting: boolean;
  status: AsyncExportStatus;
  progress: number;
  currentChunk: number | null;
  totalChunks: number | null;
  jobId: string | null;
  downloadUrl: string | null;
  errorMessage: string | null;
};

export type UseAsyncExportOptions = {
  type: string;
  pollIntervalMs?: number;
  onCompleted?: (state: AsyncExportState) => void;
  onError?: (errorMessage: string) => void;
  /**
   * S143e (HALLAZGO-NEW-54, binding, cross-project): si se pineá, el hook
   * dispatcha `GET {endpoint}?_export={format}` (flow nuevo inline del
   * Controller del módulo) en vez de `POST /v3/reports/{type}/export`
   * (flow BC layer legacy).
   *
   * Default: null (usa el flow BC layer legacy — mantiene back-compat).
   */
  endpoint?: string | null;
};

const INITIAL_STATE: AsyncExportState = {
  isExporting: false,
  status: "idle",
  progress: 0,
  currentChunk: null,
  totalChunks: null,
  jobId: null,
  downloadUrl: null,
  errorMessage: null,
};

export type UseAsyncExportReturn = {
  state: AsyncExportState;
  start: (params: Record<string, any>) => Promise<void>;
  reset: () => void;
  download: () => Promise<void>;
};

export function useAsyncExport(
  options: UseAsyncExportOptions,
): UseAsyncExportReturn {
  const { type, pollIntervalMs = 2500, onCompleted, onError, endpoint } = options;
  const { showToast } = useToast();
  const [state, setState] = useState<AsyncExportState>(INITIAL_STATE);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isExportingRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  const onErrorRef = useRef(onError);
  onCompletedRef.current = onCompleted;
  onErrorRef.current = onError;

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    isExportingRef.current = false;
    setState(INITIAL_STATE);
  }, [stopPolling]);

  const pollStatus = useCallback(
    async (jobId: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/v3/reports/${jobId}/status`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
          },
          credentials: "include",
        });

        if (res.status === 404) {
          stopPolling();
          isExportingRef.current = false;
          setState((s) => ({
            ...s,
            status: "failed",
            errorMessage: "Reporte no encontrado",
            isExporting: false,
          }));
          onErrorRef.current?.("Reporte no encontrado");
          return;
        }
        if (res.status === 403) {
          stopPolling();
          isExportingRef.current = false;
          setState((s) => ({
            ...s,
            status: "failed",
            errorMessage: "Sin permisos para este reporte",
            isExporting: false,
          }));
          onErrorRef.current?.("Sin permisos para este reporte");
          return;
        }
        if (!res.ok) {
          // Errores transitorios (5xx, red) → sigue polling
          return;
        }

        const data = await res.json();
        setState((s) => ({
          ...s,
          status: data.status ?? s.status,
          progress: data.progress ?? s.progress,
          currentChunk: data.current_chunk ?? s.currentChunk,
          totalChunks: data.total_chunks ?? s.totalChunks,
          downloadUrl: data.download_url ?? s.downloadUrl,
          errorMessage: data.error_message ?? s.errorMessage,
        }));

        if (data.status === "completed") {
          stopPolling();
          isExportingRef.current = false;
          setState((s) => ({ ...s, isExporting: false }));
          onCompletedRef.current?.({
            ...state,
            status: "completed",
            downloadUrl: data.download_url ?? null,
          });
        } else if (data.status === "failed") {
          stopPolling();
          isExportingRef.current = false;
          setState((s) => ({ ...s, isExporting: false }));
          onErrorRef.current?.(
            data.error_message ?? "Error generando el reporte",
          );
        }
      } catch (err) {
        // Network error → sigue polling (transitorio)
        // eslint-disable-next-line no-console
        console.warn("useAsyncExport poll error:", err);
      }
    },
    [state, stopPolling],
  );

  const start = useCallback(
    async (params: Record<string, any>) => {
      if (isExportingRef.current) {
        return;
      }
      isExportingRef.current = true;
      stopPolling();
      setState({
        ...INITIAL_STATE,
        isExporting: true,
        status: "pending",
      });

      try {
        // S143e (HALLAZGO-NEW-54): si `endpoint` está pineado, dispatcha el
        // flow nuevo inline (GET {endpoint}?_export=...) del Controller del
        // módulo. Si NO, mantiene el flow BC layer legacy (POST /v3/reports/{type}/export).
        const res = endpoint
          ? await fetch(`${API_BASE_URL}${endpoint}?_export=${encodeURIComponent((params as any)?.format ?? "pdf")}`, {
              method: "GET",
              headers: {
                Accept: "application/json",
                ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
              },
              credentials: "include",
            })
          : await fetch(`${API_BASE_URL}/v3/reports/${type}/export`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
              },
              credentials: "include",
              body: JSON.stringify(params ?? {}),
            });

        if (res.status === 202) {
          const data = await res.json();
          setState((s) => ({
            ...s,
            jobId: data.job_id,
            status: "pending",
            downloadUrl: data.download_url ?? null,
          }));
          // Primer poll inmediato, después cada pollIntervalMs
          // (isExportingRef se resetea cuando el pollStatus detecta status terminal)
          await pollStatus(data.job_id);
          // Solo pinear setInterval si el polling sigue activo (pollStatus
          // puede haber detectado 404/403/failed y reseteado el ref).
          if (isExportingRef.current) {
            pollIntervalRef.current = setInterval(
              () => pollStatus(data.job_id),
              pollIntervalMs,
            );
          }
        } else if (res.status === 401) {
          isExportingRef.current = false;
          setState((s) => ({
            ...s,
            status: "failed",
            errorMessage: "No autenticado",
            isExporting: false,
          }));
          onErrorRef.current?.("No autenticado");
        } else if (res.status === 400) {
          const data = await res.json().catch(() => ({}));
          isExportingRef.current = false;
          setState((s) => ({
            ...s,
            status: "failed",
            errorMessage: data?.message ?? "Tipo de reporte no válido",
            isExporting: false,
          }));
          onErrorRef.current?.(data?.message ?? "Tipo de reporte no válido");
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data?.message ?? `Error ${res.status} al encolar el reporte`;
          isExportingRef.current = false;
          setState((s) => ({
            ...s,
            status: "failed",
            errorMessage: msg,
            isExporting: false,
          }));
          onErrorRef.current?.(msg);
        }
      } catch (err: any) {
        const msg = err?.message ?? "Error de red al encolar el reporte";
        isExportingRef.current = false;
        setState((s) => ({
          ...s,
          status: "failed",
          errorMessage: msg,
          isExporting: false,
        }));
        onErrorRef.current?.(msg);
      }
    },
    [type, pollIntervalMs, pollStatus, stopPolling],
  );

  const download = useCallback(async () => {
    if (!state.downloadUrl) {
      showToast("El reporte aún no está listo", "error");
      return;
    }
    try {
      // S115: el `downloadUrl` que viene del back es RELATIVO
      // (`/api/v3/reports/{uuid}/download` vía `route('reports.download', ...)`).
      // El navegador lo resuelve contra `window.location.origin` (el front en
      // :3000), no contra el back en :8000 → 404 + "No autenticado" del
      // proxy de Next.js. Fix: pinear API_BASE_URL + token del localStorage
      // (mismo patrón que S113 fix para export + status).
      const downloadUrl = buildBackendUrl(state.downloadUrl);
      const res = await fetch(downloadUrl, {
        headers: {
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 410) {
          showToast("El reporte expiró", "error");
        } else if (res.status === 425) {
          showToast("El reporte aún no está listo", "error");
        } else if (res.status === 404) {
          showToast("Archivo no encontrado en el servidor", "error");
        } else {
          showToast(`Error al descargar (${res.status})`, "error");
        }
        return;
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${type}-${state.jobId ?? "report"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("useAsyncExport download failed:", err);
      showToast("Error de red al descargar el archivo", "error");
    }
  }, [state.downloadUrl, state.jobId, type, showToast]);

  // Cleanup: stop polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { state, start, reset, download };
}
