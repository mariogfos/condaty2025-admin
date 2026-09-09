"use client";

import {
  Building2,
  MonitorSmartphone,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  UsersRound,
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
  productLabels,
} from "./types";

const API_ROOT = "/backoffice/presence-monitoring";
const EMPTY_STATS = {
  active_connections: 0,
  recent_connections: 0,
  active_users: 0,
  active_guards: 0,
  active_scopes: 0,
  unlocated_connections: 0,
};

type FilterProduct = PresenceProduct | "all";

export default function PresenceMonitoring() {
  const { user, setStore, showToast } = useAuth();
  const { execute } = useAxios();
  const executeRef = useRef(execute);
  const requestSequenceRef = useRef(0);
  const [overview, setOverview] = useState<PresenceOverview | null>(null);
  const [range, setRange] = useState<"hours" | "days">("hours");
  const [product, setProduct] = useState<FilterProduct>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canView = Boolean(user?.fosrole_id);

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    setStore({ title: "Monitoreo en vivo", right: null });
  }, [setStore]);

  const loadOverview = useCallback(async (selectedRange: "hours" | "days", silent = false) => {
    const requestSequence = ++requestSequenceRef.current;
    if (!silent) setLoading(true);

    const { data, error: requestError } = await executeRef.current(
      `${API_ROOT}/overview`,
      "GET",
      { range: selectedRange },
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
  }, []);

  useEffect(() => {
    if (!canView) return;
    void loadOverview(range);
    const interval = window.setInterval(() => void loadOverview(range, true), 30_000);
    return () => {
      window.clearInterval(interval);
      requestSequenceRef.current += 1;
    };
  }, [canView, loadOverview, range]);

  const filteredConnections = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return (overview?.connections || []).filter((connection) => {
      const matchesProduct = product === "all" || connection.product === product;
      const matchesQuery = !normalized || [
        connection.name,
        connection.device,
        connection.scope_name,
        connection.role,
      ].some((value) => value.toLocaleLowerCase("es").includes(normalized));
      return matchesProduct && matchesQuery;
    });
  }, [overview?.connections, product, query]);

  const selected = filteredConnections.find((item) => item.id === selectedId)
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

  if (!canView) return <NotAccess />;

  const stats = overview?.stats || EMPTY_STATS;

  return (
    <main className={styles.workspace}>
      <PresenceMap
        connections={filteredConnections}
        selected={selected}
        places={overview?.places || []}
        scopes={overview?.scopes || []}
        onSelect={(connection) => setSelectedId(connection?.id || null)}
        onCreatePlace={createPlace}
        onUpdatePlace={updatePlace}
        onDeletePlace={deletePlace}
      />

      <aside className={styles.activityPanel}>
        <header className={styles.activityHeader}>
          <div>
            <span className={styles.eyebrow}>Backoffice</span>
            <h1>Conexiones activas</h1>
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

        <div className={styles.activitySummary}>
          <span>{filteredConnections.length} conexiones</span>
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
              <span>La vista incluye actividad de los últimos 15 minutos.</span>
            </div>
          ) : null}
          {loading && !overview ? <ConnectionSkeleton /> : null}
        </div>
      </aside>

      <section className={styles.metrics} aria-label="Resumen de actividad">
        <MetricCard label="Activos ahora" value={stats.active_users} detail="usuarios" icon={<UsersRound size={17} />} />
        <MetricCard label="Conexiones" value={stats.active_connections} detail="sesiones" icon={<Smartphone size={17} />} accent="resident" />
        <MetricCard label="Guardias" value={stats.active_guards} detail="en línea" icon={<ShieldCheck size={17} />} accent="guard" />
        <MetricCard label="Condominios" value={stats.active_scopes} detail="con actividad" icon={<Building2 size={17} />} accent="admin" />
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
        <div className={styles.notice}>Se muestran las 2.500 conexiones más recientes.</div>
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
      <span className={`${styles.connectionState} ${connection.state === "active" ? styles.stateActive : styles.stateRecent}`} />
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
  return `Hace ${minutes} min`;
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
