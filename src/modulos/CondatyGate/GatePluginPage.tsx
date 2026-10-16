"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronRight, DoorOpen, History } from "lucide-react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useGateApi from "./useGateApi";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import { GATE_STATUS_EVENT, useGateStatus } from "./useGateStatus";
import GateSyncStatus from "./GateSyncStatus";
import { date } from "./gateFormat";
import styles from "./gate.module.css";
type Target = { id: string; name: string; handle: string; connected: boolean };
type Preview = { preview_id: string; condominium: Target; source_condominium?: { id: string; name: string }; existing_units: number; existing_people: number; existing_history: number; incoming_units: number; incoming_people: number; requires_replacement: boolean; warnings: string[] };
type PluginEvent = { id: string; action: string; created_at: string; details: { target_name?: string; version?: number; units?: number; people?: number } };

export default function GatePluginPage({ view = "plugins" }: { view?: "plugins" | "detail" | "history" }) {
  const { user } = useAuth();
  return <GatePluginScreen key={`${user?.client_id ?? "none"}:${view}`} view={view} />;
}

function GatePluginScreen({ view }: { view: "plugins" | "detail" | "history" }) {
  const { user, showToast } = useAuth(); const status = useGateStatus(user?.client_id); const api = useGateApi(); const execute = useRef(api.execute); execute.current = api.execute;
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [targets, setTargets] = useState<Target[]>([]); const [selected, setSelected] = useState(""); const [preview, setPreview] = useState<Preview | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [events, setEvents] = useState<PluginEvent[]>([]); const [page, setPage] = useState(1); const [last, setLast] = useState(1); const flight = useRef(false);
  useEffect(() => { setTargets([]); setSelected(""); setPreview(null); setEvents([]); setError(""); if (!user?.fosrole_id) return; let active = true;
    const load = async () => {
      setBusy(true);
      try {
        const response = await execute.current(view === "history" ? "/gate-plugin/history" : "/gate-plugin/condominiums", "GET", {}, false, true);
        if (!active) return;
        if (!response.data?.success) throw new Error(response.error?.data?.message || response.data?.message || "No pudimos cargar la integración.");
        if (view === "history") { setEvents(response.data.data.data); setLast(response.data.data.last_page); setPage(1); }
        else setTargets(response.data.data);
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : "No pudimos cargar la integración.");
      } finally {
        if (active) setBusy(false);
      }
    };
    if (view === "history" || view === "detail" && status?.configured && !status.enabled) void load(); return () => { active = false; };
  }, [user?.client_id, user?.fosrole_id, view, status?.configured, status?.enabled]);
  async function inspect() {
    if (flight.current || !selected) return;
    flight.current = true; setBusy(true); setError("");
    try {
      const response = await execute.current("/gate-plugin/preview", "POST", { entity_id: selected }, false, false);
      if (!mounted.current) return;
      if (!response.data?.success) throw new Error(response.error?.data?.message || response.data?.message || "No pudimos preparar la sincronización.");
      setPreview(response.data.data.preview);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "No pudimos preparar la sincronización.");
    } finally {
      flight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function install() {
    if (flight.current || !preview) return;
    flight.current = true; setBusy(true); setError("");
    try {
      const response = await execute.current("/gate-plugin/install", "POST", { preview_id: preview.preview_id, confirm_replacement: preview.requires_replacement }, false, false);
      if (!mounted.current) return;
      if (!response.data?.success) throw new Error(response.error?.data?.message || response.data?.message || "No pudimos completar la instalación. Puedes reintentar el mismo intento.");
      setPreview(null);
      window.dispatchEvent(new Event(GATE_STATUS_EVENT));
      showToast("Condaty Gate instalado. El historial se copiará en segundo plano.", "success");
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "No pudimos completar la instalación.");
    } finally {
      flight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function more() {
    if (flight.current || page >= last) return;
    flight.current = true; setBusy(true); setError("");
    try {
      const response = await execute.current("/gate-plugin/history", "GET", { page: page + 1 }, false, true);
      if (!mounted.current) return;
      if (!response.data?.success) throw new Error(response.error?.data?.message || response.data?.message || "No pudimos cargar más cambios.");
      setEvents(value => [...value, ...response.data.data.data]); setPage(value => value + 1);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "No pudimos cargar más cambios.");
    } finally {
      flight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  if (!user?.fosrole_id) return <NotAccess />;
  if (status === null) return <main className={styles.main}><p role="status">Cargando integración…</p></main>;
  if (status.error) return <main className={styles.main}><p className={styles.error} role="alert">{status.error}</p><Button variant="secondary" onClick={() => window.dispatchEvent(new Event(GATE_STATUS_EVENT))}>Reintentar</Button></main>;
  return <main className={styles.main}>
    <header className={styles.header}><h1>{view === "history" ? "Historial de integraciones" : view === "detail" ? "Condaty Gate" : "Plugins"}</h1></header>
    {view === "plugins" ? <><p className={styles.muted}>Conecta herramientas para tu condominio.</p><Link className={styles.plugin} href="/integraciones/plugins/condaty-gate"><span className={styles.logo}><DoorOpen size={24} /></span><span><strong>Condaty Gate</strong><small>Portería, dispositivos, accesos, alertas y bitácora.</small></span><span className={styles.badge}>{status?.enabled ? "Instalado" : "Disponible"}</span><ChevronRight size={18} /></Link></> : view === "detail" ? <>
      <Link href="/integraciones/plugins" className={styles.link}><ArrowLeft size={16} /> Plugins</Link><div className={styles.hero}><DoorOpen size={36} /><div><h2>Condaty Gate</h2><p>Opera la portería desde la app Guard y consulta su información desde este panel.</p></div></div>
      <div className={styles.columns}><section className={styles.card}><h2>Incluye</h2>{["Guardias y dispositivos", "Historial de accesos", "Alertas", "Bitácora"].map(label => <div className={styles.row} key={label}><Check size={16} /> {label}</div>)}<p className={styles.muted}>El registro de ingresos y salidas se realiza desde la app Guard.</p></section><section className={styles.card}><h2>{status?.enabled ? "Integración instalada" : "Instalar integración"}</h2>{status.source_condominium && <p className={styles.muted}>Origen en Legacy: <strong>{status.source_condominium.name}</strong></p>}{!status?.configured ? <p>Condaty Gate necesita ser configurado para este entorno antes de instalarse.</p> : status.enabled ? <><strong>{status.connection?.entity_name}</strong><span className={styles.muted}>@{status.connection?.entity_handle}</span>{status.connection && <GateSyncStatus connection={status.connection} />}<p className={styles.muted}>Las unidades y personas se actualizan desde Condaty Legacy. Sus identificadores internos mantienen la relación aunque cambie el @usuario.</p><Link href="/activities" className={styles.link}>Abrir accesos <ArrowRight size={16} /></Link></> : <><label htmlFor="gate-target">Condominio en NewCondaty</label><select id="gate-target" value={selected} onChange={event => setSelected(event.target.value)} disabled={busy}><option value="">Seleccionar condominio activo</option>{targets.map(target => <option value={target.id} key={target.id} disabled={target.connected}>{target.name} · @{target.handle}{target.connected ? " · Ya conectado" : ""}</option>)}</select><Button disabled={!selected || busy} onClick={() => void inspect()}>{busy ? "Preparando…" : "Continuar"}</Button></>}</section></div>
    </> : <section className={styles.timeline}>{events.length === 0 && <p className={styles.muted} role={busy ? "status" : undefined}>{busy ? "Cargando cambios…" : "Todavía no hay cambios en las integraciones de este condominio."}</p>}{events.map(event => <article key={event.id} className={styles.event}><span className={styles.logo}><History size={16} /></span><div><p>{event.action === "installed" ? <>Se instaló Condaty Gate en <strong>{event.details.target_name}</strong>.</> : <>Se sincronizó el directorio con Condaty Gate · Versión {event.details.version}.</>}</p><small>{date(event.created_at)}</small><p className={styles.muted}>{event.details.units ?? 0} unidades · {event.details.people ?? 0} {(event.details.people ?? 0) === 1 ? "persona" : "personas"}</p></div></article>)}{page < last && <Button variant="secondary" disabled={busy} onClick={() => void more()}>Ver más</Button>}</section>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <DataModal open={Boolean(preview)} title={preview?.requires_replacement ? "Reemplazar datos del condominio" : "Instalar Condaty Gate"} onClose={() => { if (!busy) setPreview(null); }} onSave={() => void install()} buttonText={busy ? "Sincronizando…" : preview?.requires_replacement ? "Confirmar y reemplazar todo" : "Instalar y sincronizar"} buttonCancel="Cancelar" disabled={busy} maxWidth="640px" ignoreTranslation>
      {preview && <div className={styles.preview}>{preview.source_condominium && <p>Origen en Legacy: <strong>{preview.source_condominium.name}</strong></p>}{preview.requires_replacement ? <><h2>Se reemplazará todo</h2><p>Se eliminarán todas las unidades, las personas y los historiales de <strong>{preview.condominium.name}</strong> en NewCondaty. Luego se sincronizarán los datos de este condominio de Legacy y su historial de accesos se copiará en segundo plano.</p></> : <p>Se sincronizarán las unidades y personas de este condominio con <strong>{preview.condominium.name}</strong>. El historial de accesos se copiará en segundo plano.</p>}<div className={styles.counts}><div><small>Unidades a sincronizar</small><strong>{preview.incoming_units}</strong></div><div><small>Personas a sincronizar</small><strong>{preview.incoming_people}</strong></div></div>{preview.warnings?.length > 0 && <details><summary>{preview.warnings.length} ajustes automáticos del directorio</summary><ul>{preview.warnings.slice(0, 20).map(warning => <li key={warning}>{warning}</li>)}</ul></details>}{error && <p className={styles.error} role="alert">{error}</p>}</div>}
    </DataModal>
  </main>;
}
