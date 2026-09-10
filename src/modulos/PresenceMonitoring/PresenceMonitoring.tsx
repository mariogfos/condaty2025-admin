"use client";

import {
  Building2,
  Clock3,
  MonitorSmartphone,
  RefreshCw,
  Search,
  Smartphone,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import PresenceMap from "./PresenceMap";
import styles from "./PresenceMonitoring.module.css";
import {
  Coordinate,
  PresenceConnection,
  PresenceOverview,
  PresenceProduct,
  PresenceSessionRecord,
  productLabels,
} from "./types";

const API_ROOT = "/backoffice/presence-monitoring";
const REFRESH_MS = 2 * 60_000;
const EMPTY_STATS = {
  known_connections: 0,
  active_connections: 0,
  recent_connections: 0,
  offline_connections: 0,
  active_users: 0,
  active_guards: 0,
  active_scopes: 0,
  unlocated_connections: 0,
};

type FilterProduct = PresenceProduct | "all";
type FilterState = "all" | "active" | "recent" | "offline";

export default function PresenceMonitoring() {
  const { user, setStore, showToast } = useAuth();
  const { execute } = useAxios();
  const executeRef = useRef(execute);
  const requestSequenceRef = useRef(0);
  const [overview, setOverview] = useState<PresenceOverview | null>(null);
  const [range, setRange] = useState<"hours" | "days">("hours");
  const [product, setProduct] = useState<FilterProduct>("all");
  const [state, setState] = useState<FilterState>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapSelected, setMapSelected] = useState<PresenceConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyConnection, setHistoryConnection] = useState<PresenceConnection | null>(null);
  const [sessionHistory, setSessionHistory] = useState<PresenceSessionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const canView = Boolean(user?.fosrole_id);

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    setStore({ title: "Monitoreo de conexiones", right: null });
  }, [setStore]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, product, state]);

  const loadOverview = useCallback(async (selectedRange: "hours" | "days", silent = false) => {
    const requestSequence = ++requestSequenceRef.current;
    if (!silent) setLoading(true);

    const { data, error: requestError } = await executeRef.current(
      `${API_ROOT}/overview`,
      "GET",
      {
        range: selectedRange,
        product,
        state,
        query: debouncedQuery,
        page,
        per_page: 50,
      },
      false,
      true,
    );
    if (requestSequence !== requestSequenceRef.current) return;

    if (data?.success && data?.data) {
      setOverview(data.data);
      setError(null);
    } else {
      setError(apiMessage(requestError, data, "No se pudo actualizar el monitoreo."));
    }
    if (!silent) setLoading(false);
  }, [debouncedQuery, page, product, state]);

  useEffect(() => {
    if (!canView) return;
    void loadOverview(range);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadOverview(range, true);
    };
    const interval = window.setInterval(refreshWhenVisible, REFRESH_MS);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      requestSequenceRef.current += 1;
    };
  }, [canView, loadOverview, range]);

  const filteredConnections = overview?.connections || [];
  const mapConnections = useMemo(
    () => (overview?.map_connections || []).filter((connection) => (
      (product === "all" || connection.product === product)
      && (state === "all" || connection.state === state)
    )),
    [overview?.map_connections, product, state],
  );

  const selected = filteredConnections.find((item) => item.id === selectedId)
    || (mapSelected?.id === selectedId ? mapSelected : null)
    || filteredConnections[0]
    || null;

  const mutatePlace = useCallback(async (
    method: "POST" | "PUT" | "DELETE",
    path: string,
    payload: Record<string, unknown> = {},
  ) => {
    const { data, error: requestError } = await executeRef.current(
      `${API_ROOT}${path}`,
      method,
      payload,
      false,
      true,
    );
    if (!data?.success) {
      throw new Error(apiMessage(requestError, data, "No se pudo guardar el lugar."));
    }
    await loadOverview(range, true);
    return data.data;
  }, [loadOverview, range]);

  const createPlace = useCallback(async (clientId: string, boundary: Coordinate[]) => {
    await mutatePlace("POST", "/places", { client_id: clientId, boundary });
    showToast("El área del condominio se guardó correctamente.", "success");
  }, [mutatePlace, showToast]);

  const updatePlace = useCallback(async (id: number, boundary: Coordinate[]) => {
    await mutatePlace("PUT", `/places/${id}`, { boundary });
    showToast("El perímetro se actualizó correctamente.", "success");
  }, [mutatePlace, showToast]);

  const deletePlace = useCallback(async (id: number) => {
    await mutatePlace("DELETE", `/places/${id}`);
    showToast("El lugar se quitó del mapa.", "success");
  }, [mutatePlace, showToast]);

  const openHistory = useCallback(async (connection: PresenceConnection) => {
    if (!connection.installation_id) return;
    setHistoryConnection(connection);
    setSessionHistory([]);
    setHistoryLoading(true);
    const { data, error: requestError } = await executeRef.current(
      `${API_ROOT}/installations/${connection.installation_id}/sessions`,
      "GET",
      { product: connection.product },
      false,
      true,
    );
    if (data?.success && Array.isArray(data?.data)) {
      setSessionHistory(data.data);
    } else {
      showToast(apiMessage(requestError, data, "No se pudo cargar el historial de sesiones."), "error");
    }
    setHistoryLoading(false);
  }, [showToast]);

  if (!canView) return <NotAccess />;

  const stats = overview?.stats || EMPTY_STATS;

  return (
    <main className={styles.workspace}>
      <PresenceMap
        connections={mapConnections}
        selected={selected}
        places={overview?.places || []}
        scopes={overview?.scopes || []}
        onSelect={(connection) => {
          setSelectedId(connection?.id || null);
          setMapSelected(connection);
        }}
        onCreatePlace={createPlace}
        onUpdatePlace={updatePlace}
        onDeletePlace={deletePlace}
        onOpenHistory={openHistory}
      />

      <aside className={styles.activityPanel}>
        <header className={styles.activityHeader}>
          <div>
            <span className={styles.eyebrow}>Backoffice</span>
            <h1>Dispositivos y sesiones</h1>
          </div>
          <button
            className={`${styles.iconButton} ${loading ? styles.spinning : ""}`}
            type="button"
            aria-label="Actualizar conexiones"
            disabled={loading}
            onClick={() => void loadOverview(range)}
          >
            <RefreshCw size={17} />
          </button>
        </header>

        <label className={styles.searchField}>
          <Search size={16} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Usuario, equipo o condominio"
            aria-label="Buscar conexiones"
          />
        </label>

        <div className={styles.segments} role="group" aria-label="Filtrar por producto">
          {(["all", "admin", "resident", "guard"] as FilterProduct[]).map((item) => (
            <button
              key={item}
              type="button"
              className={product === item ? styles.segmentSelected : ""}
              onClick={() => setProduct(item)}
            >
              {item === "all" ? "Todo" : productLabels[item]}
            </button>
          ))}
        </div>

        <div className={`${styles.segments} ${styles.stateSegments}`} role="group" aria-label="Filtrar por estado">
          {(["all", "active", "recent", "offline"] as FilterState[]).map((item) => (
            <button
              key={item}
              type="button"
              className={state === item ? styles.segmentSelected : ""}
              onClick={() => setState(item)}
            >
              {stateLabels[item]}
            </button>
          ))}
        </div>

        <div className={styles.activitySummary}>
          <span>{overview?.pagination.total || 0} dispositivos</span>
          <span><i aria-hidden="true" /> {overview ? relativeTime(overview.generated_at) : "Actualizando"}</span>
        </div>

        <div className={styles.connectionList}>
          {filteredConnections.map((connection) => (
            <ConnectionRow
              key={connection.id}
              connection={connection}
              selected={connection.id === selected?.id}
              onSelect={setSelectedId}
            />
          ))}
          {!loading && filteredConnections.length === 0 ? (
            <div className={styles.emptyState}>
              <MonitorSmartphone size={22} />
              <strong>No hay conexiones para estos filtros.</strong>
              <span>Prueba otro producto, estado o término de búsqueda.</span>
            </div>
          ) : null}
          {loading && !overview ? <ConnectionSkeleton /> : null}
        </div>
        {overview && overview.pagination.last_page > 1 ? (
          <nav className={styles.pagination} aria-label="Páginas de dispositivos">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button>
            <span>{overview.pagination.page} / {overview.pagination.last_page}</span>
            <button type="button" disabled={page >= overview.pagination.last_page || loading} onClick={() => setPage((value) => value + 1)}>Siguiente</button>
          </nav>
        ) : null}
      </aside>

      <section className={styles.metrics} aria-label="Resumen de actividad">
        <MetricCard label="Registrados" value={stats.known_connections} detail="dispositivos" icon={<Smartphone size={17} />} />
        <MetricCard label="En línea" value={stats.active_connections} detail="ahora" icon={<UsersRound size={17} />} accent="resident" />
        <MetricCard label="Recientes" value={stats.recent_connections} detail="últimos 15 min" icon={<Clock3 size={17} />} accent="guard" />
        <MetricCard label="Desconectados" value={stats.offline_connections} detail="sin conexión" icon={<Building2 size={17} />} accent="admin" />
      </section>

      <Timeline
        points={overview?.timeline || []}
        range={range}
        onRangeChange={setRange}
      />

      {error ? (
        <button className={`${styles.notice} ${styles.noticeError}`} type="button" onClick={() => void loadOverview(range)}>
          {error} <strong>Reintentar</strong>
        </button>
      ) : null}
      {overview?.truncated ? (
        <div className={styles.notice}>El inventario heredado supera 15.000 tokens; usa los filtros para acotar la consulta.</div>
      ) : null}

      {historyConnection ? (
        <div className={styles.sessionBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setHistoryConnection(null);
        }}>
          <section className={styles.sessionDialog} role="dialog" aria-modal="true" aria-labelledby="session-history-title">
            <header>
              <div>
                <span className={styles.eyebrow}>Historial de sesiones</span>
                <h2 id="session-history-title">{historyConnection.device}</h2>
                <p>{historyConnection.name} · {historyConnection.scope_name}</p>
              </div>
              <button type="button" aria-label="Cerrar historial" onClick={() => setHistoryConnection(null)}><X size={18} /></button>
            </header>
            <div className={styles.sessionList}>
              {sessionHistory.map((session) => (
                <article key={session.id}>
                  <div>
                    <strong>{formatDateTime(session.started_at)}</strong>
                    <span>{session.ended_at ? formatDateTime(session.ended_at) : "Sesión abierta"}</span>
                  </div>
                  <dl>
                    <div><dt>Tiempo activo</dt><dd>{formatDuration(session.active_seconds)}</dd></div>
                    <div><dt>Cierre</dt><dd>{endReasonLabel(session.end_reason, session.end_quality)}</dd></div>
                    <div><dt>Equipo</dt><dd>{[session.manufacturer, session.model].filter(Boolean).join(" ") || session.platform || "No identificado"}</dd></div>
                    <div><dt>Versión</dt><dd>{session.app_version ? `${session.app_version}${session.app_build ? ` (${session.app_build})` : ""}` : "No identificada"}</dd></div>
                    <div><dt>Sistema</dt><dd>{[session.os_name, session.os_version].filter(Boolean).join(" ") || "No identificado"}</dd></div>
                    {session.browser_name ? <div><dt>Navegador</dt><dd>{[session.browser_name, session.browser_version].filter(Boolean).join(" ")}</dd></div> : null}
                  </dl>
                </article>
              ))}
              {historyLoading ? <ConnectionSkeleton /> : null}
              {!historyLoading && sessionHistory.length === 0 ? <div className={styles.emptyState}>No hay sesiones instrumentadas todavía.</div> : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function ConnectionRow({
  connection,
  selected,
  onSelect,
}: {
  connection: PresenceConnection;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.connectionRow} ${selected ? styles.connectionSelected : ""}`}
      onClick={() => onSelect(connection.id)}
    >
      <span className={`${styles.connectionState} ${stateClass(connection.state)}`} />
      <span className={styles.connectionContent}>
        <span className={styles.connectionHeadline}>
          <strong>{connection.name}</strong>
          <small>{relativeTime(connection.last_seen_at)}</small>
        </span>
        <span className={styles.connectionMeta}>
          <ProductBadge product={connection.product} compact />
          <span><MonitorSmartphone size={12} /> {connection.device}</span>
        </span>
        <span className={styles.connectionScope}>{connection.scope_name}</span>
        <span className={styles.connectionVersion}>
          {connection.source === "instrumented"
            ? [connection.os, connection.app_version ? `App ${connection.app_version}${connection.app_build ? ` (${connection.app_build})` : ""}` : null]
              .filter(Boolean).join(" · ")
            : "Actividad heredada · duración no disponible"}
        </span>
      </span>
    </button>
  );
}

function ProductBadge({ product, compact = false }: { product: PresenceProduct; compact?: boolean }) {
  return (
    <span className={`${styles.productBadge} ${styles[`product${capitalize(product)}`]}`}>
      <i aria-hidden="true" />
      {compact ? productLabels[product].slice(0, 3) : productLabels[product]}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = "brand",
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  accent?: "brand" | "admin" | "resident" | "guard";
}) {
  return (
    <article className={`${styles.metricCard} ${styles[`metric${capitalize(accent)}`]}`}>
      <span className={styles.metricIcon}>{icon}</span>
      <div>
        <p>{label}</p>
        <span><strong>{value}</strong><small>{detail}</small></span>
      </div>
    </article>
  );
}

function Timeline({
  points,
  range,
  onRangeChange,
}: {
  points: PresenceOverview["timeline"];
  range: "hours" | "days";
  onRangeChange: (range: "hours" | "days") => void;
}) {
  const max = Math.max(...points.map((point) => point.admin + point.resident + point.guard), 1);
  return (
    <section className={styles.timeline} aria-label="Historial agregado de conexiones">
      <header>
        <div className={styles.timelineTitle}>
          <span>Actividad</span>
          <strong>{range === "hours" ? "Últimas 12 horas" : "Últimos 14 días"}</strong>
          <div className={styles.rangeSelector}>
            <button type="button" className={range === "hours" ? styles.rangeSelected : ""} onClick={() => onRangeChange("hours")}>Horas</button>
            <button type="button" className={range === "days" ? styles.rangeSelected : ""} onClick={() => onRangeChange("days")}>Días</button>
          </div>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendAdmin}>Administración</span>
          <span className={styles.legendResident}>Residentes</span>
          <span className={styles.legendGuard}>Guardias</span>
        </div>
      </header>
      <div className={styles.timelineChart} style={{ gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(8px, 1fr))` }}>
        {points.map((point) => {
          const total = point.admin + point.resident + point.guard;
          return (
            <div className={styles.timelineColumn} key={point.at} title={`${timelineLabel(point.at, range)} · ${total} conexiones`}>
              <div className={styles.timelineBar} style={{ height: `${Math.max(8, (total / max) * 100)}%` }}>
                <span className={styles.barAdmin} style={{ flex: point.admin }} />
                <span className={styles.barResident} style={{ flex: point.resident }} />
                <span className={styles.barGuard} style={{ flex: point.guard }} />
              </div>
              <small>{timelineLabel(point.at, range)}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ConnectionSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Cargando conexiones">
      {Array.from({ length: 5 }).map((_, index) => <span key={index} />)}
    </div>
  );
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 15) return "Ahora";
  if (seconds < 60) return `Hace ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} d`;
  return new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/La_Paz" }).format(new Date(value)).replaceAll(".", "");
}

const stateLabels: Record<FilterState, string> = {
  all: "Todos",
  active: "En línea",
  recent: "Recientes",
  offline: "Desconectados",
};

function stateClass(state: PresenceConnection["state"]) {
  if (state === "active") return styles.stateActive;
  if (state === "recent") return styles.stateRecent;
  return styles.stateOffline;
}

function timelineLabel(value: string, range: "hours" | "days") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-BO", range === "hours"
    ? { hour: "2-digit", hour12: false, timeZone: "America/La_Paz" }
    : { day: "2-digit", month: "short", timeZone: "America/La_Paz" })
    .format(date)
    .replace(".", "");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/La_Paz",
  }).format(new Date(value)).replaceAll(".", "");
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = Math.max(0, seconds % 60);
  if (hours) return `${hours} h ${minutes} min`;
  if (minutes) return `${minutes} min ${remaining} s`;
  return `${remaining} s`;
}

function endReasonLabel(reason: string | null, quality: PresenceSessionRecord["end_quality"]) {
  if (!reason) return "En curso";
  const labels: Record<string, string> = {
    logout: "Cierre de sesión",
    idle_rollover: "Inactividad",
    context_changed: "Cambio de condominio",
    client_ended: "Aplicación cerrada",
    signal_timeout: "Se perdió la señal",
    background_timeout: "Quedó en segundo plano",
  };
  const label = labels[reason] || "Finalizada";
  return quality === "inferred" ? `${label} · inferido` : label;
}

function apiMessage(requestError: any, data: any, fallback: string) {
  const errors = requestError?.data?.errors || data?.errors;
  const firstValidation = errors && typeof errors === "object"
    ? Object.values(errors).flat().find((value) => typeof value === "string")
    : null;
  return String(firstValidation || requestError?.data?.message || data?.message || requestError?.message || fallback);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
