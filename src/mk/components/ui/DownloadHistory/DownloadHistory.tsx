"use client";
/**
 * S116b front — DownloadHistory component
 *
 * Lista los reports generados por el user autenticado. Consome
 * `GET /api/v3/reports?status=...&type=...&page=...&perPage=...` (pineado en
 * S116b back, PR #204). Replica el patrón de S113/S115/S117 de
 * `useAsyncExport.ts` para construir URLs absolutas al back con
 * `API_BASE_URL` + `getAuthToken()` + `buildBackendUrl()`.
 *
 * S119 — Extendido con:
 * - Filtro por `type` (módulo) en el dropdown. Pineá el
 *   `?type=payments` del back (PR #207 → fix/s120 → S119).
 * - Botón "Limpiar historial" que llama a `DELETE /api/v3/reports`
 *   con confirm modal. Pineá el `ReportController::destroy()` del back
 *   (S119) que borra SOLO completed/failed del user autenticado
 *   + archivos físicos del storage. NO toca pending/processing.
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
 * HALLAZGO-NEW-26 (S116b front, binding cross-project): modal de flow
 * async debe pinear salida explícita. Principio: el Clear flow es
 * destructivo → confirm modal obligatorio antes de pinear DELETE.
 *
 * Uso:
 *
 *     <DownloadHistory onDownload={(url, type) => downloadReport(url, type)} />
 *
 *     // o envuelto en modal:
 *
 *     <DownloadHistoryModal ... />
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Inbox,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import Button from "../../forms/Button/Button";
import { nombreDeArchivoDelHeader } from "@/mk/utils/contentDisposition";
import NewModal from "../NewModal/NewModal";
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

export type DownloadHistoryStatus =
  "completed" | "failed" | "pending" | "processing" | "all";

export type DownloadHistoryItem = {
  id: number;
  uuid: string;
  type: string;
  /**
   * S139 (HALLAZGO-NEW-48): displayName del ReportType pineado según
   * params (e.g. "Deuda Individual", "Deudas Compartidas", "Condonaciones",
   * "Reporte de Expensas"). Si el back retorna `name`, se pineá en el
   * render del item + en el filename del download. Si NO se pineá
   * (ReportType legacy sin override), fallback a `humanizeType(type)`.
   *
   * Multi-branch pineado: el mismo `type` (e.g. "debt-dptos") pinea
   * 4 vistas distintas — el `name` permite distinguir en el dropdown
   * del histórico y en el filename del archivo bajado.
   */
  name?: string | null;
  format: string;
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
  /**
   * S119b: type inicial (módulo) para el filtro. Útil cuando el modal
   * se abre desde un módulo específico (e.g. Outlays.tsx) y queremos
   * que el dropdown "Módulo" ya esté pre-seleccionado en "outlays".
   * Default: null ("Todos"). Si se pasa, el filtro del GET inicial
   * pinea `?type=<value>`.
   */
  initialType?: string | null;
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
  /**
   * S119: si se pasa, oculta el botón "Limpiar historial". Útil cuando
   * el parent quiere pinear el Clear desde otro lado (e.g. un menú
   * de "Más opciones"). Default: false (botón visible si hay items).
   */
  hideClearButton?: boolean;
  /**
   * S119: callback cuando el Clear se completa exitosamente. Útil
   * para que el parent muestre un toast o haga algo más. Si no se
   * pineá, no se notifica al parent.
   */
  onClearCompleted?: (deletedReports: number, deletedFiles: number) => void;
};

export type { DownloadHistoryProps };

const DEFAULT_STATUS: DownloadHistoryStatus = "completed";
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_POLL_MS = 5000;

/**
 * S123: lista de tipos con labels humanizados. S123b pineó `initialType`
 * (pre-selecciona en dropdown). Pero los VALUES de esta lista se usan
 * SOLO como mapa de LABELS — los VALUES reales del dropdown vienen
 * del endpoint back `/v3/reports/types` (HALLAZGO-NEW-32).
 *
 * Esta lista es solo un fallback + label map. El dropdown principal
 * pineá los types del back vía `availableTypes` state.
 *
 * Mantener sincronizado con `App\Reports\ReportTypeRegistry::availableTypes()`
 * del back (php artisan tinker). El back es la SSoT — esta lista es
 * solo para humanizar.
 */
/** Opción del dropdown "Módulo": el `type` técnico + su nombre legible. */
type TypeOption = { value: string; label: string };

const KNOWN_TYPES: TypeOption[] = [
  { value: "payments", label: "Pagos" },
  { value: "payments-xlsx", label: "Pagos XLSX" },
  { value: "outlays", label: "Egresos" },
  { value: "expenses", label: "Expensas" },
  { value: "accesses", label: "Accesos" },
  { value: "defaulters", label: "Morosos" },
  // S139: `dpto-deudas` es el ReportType de Unidades (XLSX "estado de
  // cuentas"). `debt-dptos` es el ReportType de Deudas Individuales /
  // Compartidas / Condonaciones (PDF, multi-branch). Antes pinean el
  // mismo label "Deudas por Dpto" → duplicado en el dropdown. Fix:
  // pinear labels distintos.
  { value: "dpto-deudas", label: "Deudas por Dpto (XLSX)" },
  { value: "bank-accounts", label: "Cuentas Bancarias" },
  { value: "areas", label: "Áreas" },
  { value: "events", label: "Eventos" },
  { value: "guards", label: "Guardias" },
  // 'homeowners' salió el 2026-08-05 con su módulo. Esta lista es sólo el
  // mapa de etiquetas: los types reales los trae `/v3/reports/types`. Un
  // reporte viejo de ese type sobreviviría a lo sumo las 48h de retención,
  // y en ese lapso mostraría el nombre técnico en vez de "Propietarios".
  { value: "owners", label: "Owners" },
  { value: "reservations", label: "Reservas" },
  { value: "invitations", label: "Invitaciones" },
  { value: "budgets", label: "Presupuesto" },
  { value: "bank-entities", label: "Entidades Bancarias" },
  // S139 (HALLAZGO-NEW-48): `debt-dptos` pineá 4 vistas distintas según
  // params (Deuda Individual, Deudas Compartidas, Condonaciones, Todas).
  // El label del dropdown es el type técnico humanizado (legacy fallback);
  // el label de cada item del histórico pineá `name` (displayName dinámico
  // del ReportType) que se computa server-side. Multi-branch → label
  // genérico "Deudas — Detalles".
  { value: "debt-dptos", label: "Deudas — Detalles" },
  { value: "debt-groups", label: "Deudas — Grupos" },
  { value: "assemblies", label: "Asambleas" },
  { value: "assemblies-attendances", label: "Asistencia a Asambleas" },
  { value: "others", label: "Pedidos" },
  { value: "guard-news", label: "Guardias Nuevos" },
  { value: "array_chunked", label: "Reporte (genérico)" },
];

/** Humaniza el `type` del report ("payments-xlsx" → "Pagos XLSX"). */
const humanizeType = (type: string): string => {
  const known = KNOWN_TYPES.find((t) => t.value === type);
  if (known) return known.label;
  // Fallback: humanizar el slug
  return type.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * S123 (HALLAZGO-NEW-32): fetcha los types disponibles del back vía
 * `GET /api/v3/reports/types`. El back devuelve los `type` strings
 * que el user realmente tiene generados (multi-tenant). Drift
 * imposible — si el back renombra/agrega un type, el dropdown
 * se actualiza solo.
 *
 * Si el endpoint falla (red, 500, etc.), retorna el fallback
 * hardcoded para que el dropdown no quede vacío. La defensa es
 * "best-effort": la lista puede no estar 100% sincronizada con el
 * back, pero el componente sigue funcionando.
 */
async function fetchAvailableTypes(): Promise<TypeOption[]> {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/v3/reports/types`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
    if (!res.ok) {
      // Fallback silencioso — el dropdown muestra los types del fallback.
      return KNOWN_TYPES.map((t) => ({ value: t.value, label: t.label }));
    }
    const body = await res.json();

    // El back manda `options: [{type, label}]`, donde el label es el TÍTULO
    // del reporte — el mismo que va en el header del PDF y en el nombre del
    // archivo. Ese es el SSoT: el front deja de inventar el nombre del módulo.
    const options = body?.options;
    if (Array.isArray(options) && options.length > 0) {
      return options.map((o: { type: string; label?: string }) => ({
        value: o.type,
        label: o.label || humanizeType(o.type),
      }));
    }

    // Back viejo (sólo `data: string[]`): humanizamos como antes. Se puede
    // retirar cuando todos los entornos estén en la versión nueva.
    const data = (body?.data ?? []) as string[];
    return Array.isArray(data)
      ? data.map((value) => ({ value, label: humanizeType(value) }))
      : [];
  } catch {
    // Fallback silencioso.
    return KNOWN_TYPES.map((t) => ({ value: t.value, label: t.label }));
  }
}

/**
 * El formato del archivo, en mayúsculas y con el nombre que el usuario
 * reconoce.
 *
 * ⚠️ `excel` y `xlsx` son el mismo archivo con dos nombres: el front manda
 * "excel" en algunos módulos y el back lo normaliza a "xlsx". En el historial
 * conviven los dos según cuándo se generó el reporte, así que se muestran
 * igual — si no, el mismo Excel aparecería con dos etiquetas distintas.
 */
const formatoLegible = (format: string | null | undefined): string => {
  const f = (format ?? "").toLowerCase();
  if (f === "excel" || f === "xlsx" || f === "xls") return "XLSX";
  if (f === "csv") return "CSV";
  if (f === "pdf") return "PDF";
  return f ? f.toUpperCase() : "—";
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
  initialType = null,
  pollIntervalMs = DEFAULT_POLL_MS,
  onDownload,
  emptyMessage = 'Aún no generaste ningún reporte. Probá exportar algo desde un módulo con botón "Exportar XLSX" o "Exportar PDF".',
  hideClearButton = false,
  onClearCompleted,
}: DownloadHistoryProps) {
  const [status, setStatus] = useState<DownloadHistoryStatus>(initialStatus);
  // S119: filtro por módulo/type. null = "Todos".
  // S119b: si el parent pinea `initialType` (e.g. AsyncExportButton
  // pasando su `type` prop), el dropdown arranca pre-seleccionado.
  const [type, setType] = useState<string | null>(initialType);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DownloadHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);
  // S119: estado del modal de confirmación de Clear.
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  // S123 (HALLAZGO-NEW-32): lista de types disponibles del back
  // (vía `GET /api/v3/reports/types`). Si el fetch falla, fallback
  // al hardcoded KNOWN_TYPES (defensa best-effort).
  const [availableTypes, setAvailableTypes] = useState<TypeOption[]>(
    KNOWN_TYPES.map((t) => ({ value: t.value, label: t.label })),
  );

  const perPage = DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // S119: cuando cambia type o status, reset page a 1 (no tiene sentido
  // quedarse en page=5 si el filtro cambió).
  useEffect(() => {
    setPage(1);
  }, [type, status]);

  const fetchPage = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        // S116b: pinea endpoint canónico `/v3/reports` (NO legacy alias
        // `/api/reports` HALLAZGO-NEW-22). Query params: status, type,
        // page, perPage. URL absoluta al back (HALLAZGO-NEW-21).
        const params = new URLSearchParams();
        params.set("status", status);
        params.set("page", String(page));
        params.set("perPage", String(perPage));
        if (type) params.set("type", type);

        const url = `${API_BASE_URL}/v3/reports?${params.toString()}`;
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
    [status, type, page, perPage],
  );

  // S123 (HALLAZGO-NEW-32): fetch available types del back en mount.
  // El dropdown usa estos values. Si el endpoint falla, fallback al
  // KNOWN_TYPES hardcoded (defensa best-effort — ver fetchAvailableTypes).
  // Solo se ejecuta UNA VEZ en mount (deps []) para no spammear el
  // endpoint en cada cambio de filtro.
  useEffect(() => {
    let cancelled = false;
    fetchAvailableTypes().then((types) => {
      if (!cancelled) {
        setAvailableTypes(types);
        // 🔴 2026-08-06 (lo reportó Mario): el historial se abría mostrando
        // "Todos" en el select y la lista VACÍA; había que elegir el módulo y
        // volver a "Todos" para que apareciera algo.
        //
        // La causa: el parent nos pasa su `mod.exportAsync.type`, y si ese
        // valor no es el que el back usa para guardar el reporte, quedábamos
        // filtrando por un type sin ninguna fila. Y como tampoco figura entre
        // las opciones —que vienen del back—, el `<select>` no tenía qué
        // marcar y caía en "Todos". O sea: el filtro decía una cosa y la
        // consulta hacía otra.
        //
        // Acá el estado se alinea con lo que el usuario VE. Un type que el
        // back no conoce se descarta y se muestran todos, que es lo que el
        // select estaba diciendo. Arregla la clase entera, no sólo el módulo
        // que la disparó.
        setType((actual) =>
          actual && !types.some((t) => t.value === actual) ? null : actual,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initial + when status/page/type changes
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
        // El nombre lo manda el back en `Content-Disposition`: título del
        // reporte + fecha y hora. Acá sólo se lee, así que el archivo baja
        // igual desde el historial que desde el botón de exportar.
        //
        // El fallback (nombre legible + uuid) queda por si el header no llega:
        // en un fetch cross-origin el navegador lo oculta salvo que el
        // servidor lo liste en `exposed_headers` del CORS.
        const downloadFormat =
          item.format === "excel" ? "xlsx" : item.format || "pdf";
        const downloadName = item.name || humanizeType(item.type);
        const sanitizedName = downloadName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9_\-]+/g, "_")
          .replace(/^_+|_+$/g, "");
        const delServidor = nombreDeArchivoDelHeader(
          res.headers?.get("Content-Disposition"),
        );
        link.download =
          delServidor ??
          `${sanitizedName || "reporte"}-${item.uuid}.${downloadFormat}`;
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

  // S119: handler del Clear. Llama DELETE /api/v3/reports (canónico,
  // NO legacy alias), con Bearer + buildBackendUrl pattern. Multi-tenant
  // viene del token — el back filtra por user_id automáticamente.
  const handleClear = useCallback(async () => {
    setClearing(true);
    setClearError(null);
    try {
      // HALLAZGO-NEW-20: pinear endpoint canónico `/v3/reports`.
      // HALLAZGO-NEW-21: URL absoluta via API_BASE_URL.
      //
      // 🔴 El `type` va SIEMPRE que haya un módulo seleccionado. El botón vive
      // al lado del dropdown "Módulo" y borraba todo igual: parado en Ingresos
      // te llevabas puestos los de Egresos. Sin módulo seleccionado (el
      // dropdown en "Todos") se borra todo, que es lo que corresponde.
      const url = type
        ? `${API_BASE_URL}/v3/reports?type=${encodeURIComponent(type)}`
        : `${API_BASE_URL}/v3/reports`;
      const token = getAuthToken();
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message ?? `Error al limpiar el historial (${res.status})`,
        );
      }
      const data = await res.json().catch(() => ({}));
      // Reset page + cerrar modal + refetch.
      setPage(1);
      setShowClearConfirm(false);
      await fetchPage(true);
      if (onClearCompleted) {
        onClearCompleted(data?.deleted_reports ?? 0, data?.deleted_files ?? 0);
      }
    } catch (err: any) {
      setClearError(err?.message ?? "Error de red al limpiar el historial");
    } finally {
      setClearing(false);
    }
  }, [fetchPage, onClearCompleted, type]);

  // S123 (HALLAZGO-NEW-32): el dropdown usa `availableTypes` (los
  // types reales del back) en vez de `KNOWN_TYPES` hardcoded. Cada
  // type se labela con KNOWN_TYPES si hay match, o con humanizeType
  // fallback. Así el dropdown está siempre sincronizado con el back
  // y nunca se "driftea" por rename de un ReportType.
  //
  // El useMemo deriva el array de `{value, label}[]` a partir de
  // availableTypes + KNOWN_TYPES map. Si availableTypes aún no
  // cargó (primer render), usa KNOWN_TYPES hardcoded como fallback.
  // El label ya viene resuelto de `fetchAvailableTypes` (título del back, o
  // el humanizado local si el módulo todavía no migró al motor nuevo).
  const typeOptions = availableTypes;

  // Lo que el modal de confirmación le promete al usuario tiene que ser lo que
  // el botón hace. Si hay un módulo seleccionado, se borra SÓLO ese.
  const moduloSeleccionado = type
    ? (typeOptions.find((t) => t.value === type)?.label ?? type)
    : null;

  return (
    <div className={styles.body} data-testid="download-history">
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h3 className={styles.title}>Historial de descargas</h3>
          <p className={styles.subtitle}>
            {total} {total === 1 ? "reporte" : "reportes"} · página {page} de{" "}
            {totalPages}
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

      {/* S119: filter bar con dropdown de Módulo + botón Limpiar. */}
      <div
        className={styles.filterBar}
        data-testid="download-history-filter-bar"
      >
        <label className={styles.filterLabel}>
          <span>Módulo:</span>
          <select
            value={type ?? ""}
            onChange={(e) => setType(e.target.value || null)}
            className={styles.select}
            data-testid="download-history-type-filter"
            disabled={loading}
          >
            <option value="">Todos</option>
            {typeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        {/* S143e (HALLAZGO-NEW-54): el botón "Limpiar historial" ahora es
            SOLO ícono (Trash2) + tooltip "Limpiar historial" + aria-label.
            El texto se pineó al `title` HTML para accesibilidad. */}
        {!hideClearButton && items.length > 0 && (
          <Button
            variant="primary"
            onClick={() => {
              setClearError(null);
              setShowClearConfirm(true);
            }}
            disabled={loading || clearing}
            data-testid="download-history-clear-btn"
            title="Limpiar historial"
            aria-label="Limpiar historial"
            className={styles.iconOnly}
          >
            <Trash2 size={14} />
          </Button>
        )}
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
            // S139 (HALLAZGO-NEW-48): pinea `item.name` (displayName del
            // ReportType según params) si está pineado. Fallback a
            // `humanizeType(item.type)` (legacy) para ReportTypes sin
            // override. Esto permite distinguir "Deuda Individual",
            // "Deudas Compartidas", "Condonaciones" — todos con type
            // "debt-dptos".
            const displayLabel = item.name || humanizeType(item.type);
            const isXlsx = item.format === "xlsx" || item.format === "excel";
            const Icon = isXlsx ? FileSpreadsheet : FileText;
            // 🔴 2026-08-06 (lo reportó Mario): dos reportes del mismo módulo
            // se veían idénticos —mismo nombre, misma fecha— y no había forma
            // de saber cuál era el PDF y cuál el Excel. El ícono distinguía
            // hoja de cálculo de documento, pero no separa PDF de CSV y hay
            // que saber leerlo. El formato va escrito.
            const formatLabel = formatoLegible(item.format);
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
                  <p
                    className={styles.itemTitle}
                    data-testid="download-history-item-title"
                  >
                    {displayLabel}
                  </p>
                  <p className={styles.itemMeta}>
                    <span data-testid="download-history-item-format">
                      {formatLabel}
                    </span>
                    <span>· {formatDate(item.created_at)}</span>
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

      {/* S119: confirm modal del Clear. PINEA el flow destructivo:
          user debe confirmar antes de pinear DELETE. Back-compat:
          si parent no pineá `hideClearButton`, se muestra el botón
          que abre este modal. */}
      <NewModal
        open={showClearConfirm}
        onClose={() => {
          if (!clearing) setShowClearConfirm(false);
        }}
        onSave={handleClear}
        title={
          moduloSeleccionado
            ? `¿Limpiar el historial de ${moduloSeleccionado}?`
            : "¿Limpiar historial?"
        }
        subtitle={
          moduloSeleccionado
            ? `Se eliminarán los reportes completados y fallidos de ${moduloSeleccionado}. Los de otros módulos no se tocan. Esta acción no se puede deshacer.`
            : "Se eliminarán los reportes completados y fallidos de TODOS los módulos. Esta acción no se puede deshacer."
        }
        buttonText={clearing ? "Limpiando…" : "Sí, limpiar"}
        buttonCancel="Cancelar"
        disabled={clearing}
      >
        {clearError && (
          <div className={styles.error} style={{ padding: 0 }}>
            <AlertCircle size={20} />
            <p style={{ fontSize: 13 }}>{clearError}</p>
          </div>
        )}
      </NewModal>
    </div>
  );
}
