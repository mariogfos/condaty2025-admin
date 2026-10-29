"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Filter, KeyRound, Pencil, Plus, Power, RefreshCw } from "lucide-react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import Button from "@/mk/components/forms/Button/Button";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import useSubmissionGuard from "@/mk/hooks/useSubmissionGuard";
import crudStyles from "@/mk/hooks/useCrud/useCrudStyle.module.css";
import IntegrationEditor from "./IntegrationEditor";
import AutomationsPanel from "./AutomationsPanel";
import { AuditDetail, CredentialDetail, LogDetail } from "./IntegrationDetail";
import { actionLabels, dateLabel, ROOT, type AuditEntry, type Catalogs, type Filters, type Integration,
  type PaginationData, type RequestLog, type Row, type Tab } from "./types";
import styles from "./ApiIntegrations.module.css";

const tabs = [{ value: "connections", text: "Integraciones" }, { value: "logs", text: "Actividad API" }, { value: "events", text: "Historial de cambios" }, { value: "automations", text: "Automatizaciones" }];
const initialFilters: Filters = { client_id: "", integration_id: "", query: "", outcome: "", method: "", status: "", from: "", to: "" };
const emptyCatalogs: Catalogs = { clients: [], integrations: [], scopes: [], notice: "" };
const messageOf = (response: { data?: { message?: string }; error?: { data?: { message?: string } } }, fallback: string) => response.error?.data?.message || response.data?.message || fallback;

export default function ApiIntegrations() {
  const { user, userCan, setStore } = useAuth();
  const canRead = Boolean(user?.fosrole_id) && userCan("superadmins", "R");
  const canCreate = Boolean(user?.fosrole_id) && userCan("superadmins", "C");
  const canUpdate = Boolean(user?.fosrole_id) && userCan("superadmins", "U");
  const { execute } = useAxios();
  const api = useRef(execute);
  useEffect(() => { api.current = execute; }, [execute]);
  const requestSequence = useRef(0);
  const detailSequence = useRef(0);
  const { begin, finish, submitting } = useSubmissionGuard();
  const [tab, setTab] = useState<Tab>("connections");
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, total: 0, last_page: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editor, setEditor] = useState<Integration | "new" | null>(null);
  const [editorError, setEditorError] = useState("");
  const [credential, setCredential] = useState<{ token: string | null; webhook: string | null } | null>(null);
  const [confirmation, setConfirmation] = useState<{ item: Integration; action: "rotate" | "toggle" } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<RequestLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [audit, setAudit] = useState<AuditEntry | null>(null);
  const [refresh, setRefresh] = useState(0);

  const loadCatalogs = useCallback(async () => {
    const result = await api.current(`${ROOT}/catalogs`, "GET", {}, false, true);
    if (result?.data?.success) setCatalogs(result.data.data);
    else setError(messageOf(result, "No se pudieron cargar los catálogos."));
  }, []);
  const load = useCallback(async () => {
    if (!canRead || tab === "automations") return;
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError("");
    const params = Object.fromEntries(Object.entries(filters).filter(([key, value]) => value && (tab === "logs" || ["client_id", "query", "integration_id"].includes(key))));
    const endpoint = tab === "connections" ? ROOT : `${ROOT}/${tab}`;
    try {
      const result = await api.current(endpoint, "GET", { ...params, page, per_page: 25 }, false, true);
      if (sequence !== requestSequence.current) return;
      if (result?.data?.success) {
        setRows(result.data.data.items ?? []);
        setPagination(result.data.data.pagination);
      } else { setRows([]); setError(messageOf(result, "No se pudo cargar la lista.")); }
    } catch { if (sequence === requestSequence.current) { setRows([]); setError("No se pudo cargar la lista."); } }
    finally { if (sequence === requestSequence.current) setLoading(false); }
  }, [canRead, filters, page, tab]);

  useEffect(() => {
    if (!canRead) return;
    setStore({ title: "Integraciones API", right: null });
    void loadCatalogs();
    // setStore is supplied by the legacy context and changes identity on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, loadCatalogs]);
  useEffect(() => {
    const sequenceRef = requestSequence;
    void load();
    return () => { sequenceRef.current++; };
  }, [load]);
  useEffect(() => () => { detailSequence.current++; }, []);

  const clientNames = useMemo(() => new Map(catalogs.clients.map((c) => [c.id, c.name])), [catalogs.clients]);
  const filter = (key: keyof Filters, value: string) => { setPage(1); setFilters((s) => ({ ...s, [key]: value, ...(key === "client_id" ? { integration_id: "" } : {}) })); };
  const changeTab = (next: Tab) => { setTab(next); setPage(1); setRows([]); setLoading(false); setFilters((s) => ({ ...initialFilters, client_id: s.client_id })); setError(""); };

  const save = async (draft: Parameters<React.ComponentProps<typeof IntegrationEditor>["onSave"]>[0]) => {
    if (!begin()) return;
    setEditorError("");
    try {
      const isNew = editor === "new";
      const { client_id, request_id, ...rest } = draft;
      const result = await api.current(isNew ? ROOT : `${ROOT}/${(editor as Integration).id}`, isNew ? "POST" : "PATCH",
        isNew ? draft : rest, false, true);
      if (!result?.data?.success) { setEditorError(messageOf(result, "No se pudo guardar la integración.")); return; }
      setEditor(null);
      if (result.data.data.credential || result.data.data.webhook_secret) setCredential({ token: result.data.data.credential ?? null, webhook: result.data.data.webhook_secret ?? null });
      setNotice(isNew ? "Integración creada. Guarda su credencial." : "Integración actualizada.");
      void loadCatalogs(); void load();
    } finally { finish(); }
  };
  const confirm = async () => {
    if (!confirmation || !begin()) return;
    setError("");
    try {
      const { item, action } = confirmation;
      const payload = action === "rotate" ? { version: item.version } : {
        name: item.name, scopes: item.scopes, is_active: !item.is_active, expires_at: item.expires_at, webhook_url: item.webhook_url, version: item.version,
      };
      const result = await api.current(action === "rotate" ? `${ROOT}/${item.id}/rotate-token` : `${ROOT}/${item.id}`,
        action === "rotate" ? "POST" : "PATCH", payload, false, true);
      if (!result?.data?.success) { setError(messageOf(result, "No se pudo completar la acción.")); setConfirmation(null); return; }
      setConfirmation(null);
      if (result.data.data.credential) setCredential({ token: result.data.data.credential, webhook: null });
      setNotice(action === "rotate" ? "Credencial anterior revocada." : "Estado actualizado.");
      void loadCatalogs(); void load();
    } finally { finish(); }
  };
  const openLog = async (row: RequestLog) => {
    const sequence = ++detailSequence.current;
    setDetailOpen(true); setDetail(null); setDetailError(""); setDetailLoading(true);
    try {
      const result = await api.current(`${ROOT}/logs/${row.id}`, "GET", {}, false, true);
      if (sequence !== detailSequence.current) return;
      if (result?.data?.success) setDetail(result.data.data);
      else setDetailError(messageOf(result, "No se pudo cargar el detalle."));
    } finally { if (sequence === detailSequence.current) setDetailLoading(false); }
  };
  const closeLog = () => { detailSequence.current++; setDetailOpen(false); setDetail(null); };
  const icon = (label: string, onClick: () => void, child: React.ReactNode) => <button type="button" className={styles.iconAction}
    title={label} aria-label={label} disabled={submitting} onClick={(e) => { e.stopPropagation(); onClick(); }}>{child}</button>;
  const connectionHeader = [
    { key: "name", label: "Integración", responsive: "Integración", width: "230px" },
    { key: "client_id", label: "Condominio", responsive: "Condominio", width: "220px", onRender: ({ item }: { item: Integration }) => clientNames.get(item.client_id) ?? item.client_id },
    { key: "scopes", label: "Permisos", responsive: "Permisos", width: "120px", onRender: ({ item }: { item: Integration }) => `${item.scopes.length} permisos` },
    { key: "token_hint", label: "Credencial", responsive: "Credencial", width: "145px", onRender: ({ item }: { item: Integration }) => `••••••${item.token_hint}` },
    { key: "is_active", label: "Estado", responsive: "Estado", width: "130px", onRender: ({ item }: { item: Integration }) => <StatusBadge>{item.is_active ? "Activa" : "Desactivada"}</StatusBadge> },
    { key: "expires_at", label: "Vence", responsive: "Vence", width: "180px", onRender: ({ item }: { item: Integration }) => item.expires_at ? dateLabel(item.expires_at) : "Sin vencimiento" },
    { key: "webhook_status", label: "Webhook", responsive: "Webhook", width: "150px", onRender: ({ item }: { item: Integration }) => !item.webhook_url ? "No configurado" : item.webhook_status ? `HTTP ${item.webhook_status}` : "Esperando entrega" },
    { key: "actions", label: "Acciones", responsive: "Acciones", width: "155px", onRender: ({ item }: { item: Integration }) => canUpdate ? <div className={styles.actions}>
      {icon(`Editar ${item.name}`, () => { setEditorError(""); setEditor(item); }, <Pencil size={17} />)}
      {icon(`${item.is_active ? "Desactivar" : "Activar"} ${item.name}`, () => setConfirmation({ item, action: "toggle" }), <Power size={17} />)}
      {icon(`Rotar credencial de ${item.name}`, () => setConfirmation({ item, action: "rotate" }), <KeyRound size={17} />)}
    </div> : "Sólo lectura" },
  ];
  const logHeader = [
    { key: "created_at", label: "Fecha", responsive: "Fecha", width: "180px", onRender: ({ item }: { item: RequestLog }) => dateLabel(item.created_at) },
    { key: "integration_name", label: "Integración", responsive: "Integración", width: "200px" },
    { key: "method", label: "Método", responsive: "Método", width: "100px" },
    { key: "path", label: "Endpoint", responsive: "Endpoint", width: "100%" },
    { key: "status", label: "HTTP", responsive: "HTTP", width: "95px", onRender: ({ item }: { item: RequestLog }) => <StatusBadge>{item.status}</StatusBadge> },
    { key: "duration_ms", label: "Duración", responsive: "Duración", width: "110px", onRender: ({ item }: { item: RequestLog }) => `${item.duration_ms} ms` },
    { key: "actions", label: "Detalle", responsive: "Detalle", width: "70px", onRender: ({ item }: { item: RequestLog }) => icon("Ver llamada " + item.id, () => void openLog(item), <Eye size={17} />) },
  ];
  const auditHeader = [
    { key: "created_at", label: "Fecha", responsive: "Fecha", width: "180px", onRender: ({ item }: { item: AuditEntry }) => dateLabel(item.created_at) },
    { key: "action", label: "Acción", responsive: "Acción", width: "260px", onRender: ({ item }: { item: AuditEntry }) => actionLabels[item.action] ?? item.action },
    { key: "actor_name", label: "Responsable", responsive: "Responsable", width: "230px" },
    { key: "record_type", label: "Registro", responsive: "Registro", width: "100%", onRender: ({ item }: { item: AuditEntry }) => `${item.record_type} · ${item.record_id}` },
    { key: "actions", label: "Detalle", responsive: "Detalle", width: "70px", onRender: ({ item }: { item: AuditEntry }) => icon("Ver cambio " + item.id, () => setAudit(item), <Eye size={17} />) },
  ];

  if (!canRead) return <NotAccess />;
  return <div className={styles.container}><section className={crudStyles.useCrud}>
    <header className={crudStyles.titleRow}><h1 className={crudStyles.titleText}>Integraciones API</h1></header>
    <nav className={styles.tabBar} aria-label="Secciones de integraciones"><TabsButtons tabs={tabs} sel={tab} setSel={changeTab} variant="pill" /></nav>
    <div className={crudStyles.toolbarRow}>
      <div className={styles.toolbarLeft}>
        {tab === "connections" || tab === "logs" ? <div className={crudStyles.toolbarSearch}><DataSearch name="integration-search" value={filters.query}
          placeholder={tab === "connections" ? "Buscar integración" : "Buscar endpoint o ID de llamada"} setSearch={(value: string) => filter("query", value)} /></div> : null}
        <Select name="client_id" label="Condominio" value={filters.client_id} options={[{ id: "", name: "Todos los condominios" }, ...catalogs.clients]}
          filter required={false} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => filter("client_id", e.target.value)} />
        {tab === "logs" || tab === "events" ? <Select name="integration_id" label="Integración" value={filters.integration_id}
          options={[{ id: "", name: "Todas las integraciones" }, ...catalogs.integrations.filter((c) => !filters.client_id || c.client_id === filters.client_id)]}
          required={false} filter onChange={(e: React.ChangeEvent<HTMLSelectElement>) => filter("integration_id", e.target.value)} /> : null}
      </div>
      <div className={crudStyles.toolbarActions}>
        {tab === "logs" ? <Button variant="secondary" onClick={() => setFilterOpen(true)}><Filter size={16} /> Filtros</Button> : null}
        <Button variant="secondary" disabled={loading} onClick={() => tab === "automations" ? setRefresh((value) => value + 1) : void load()}><RefreshCw size={16} /> Actualizar</Button>
        {tab === "connections" && canCreate ? <Button onClick={() => { setEditorError(""); setEditor("new"); }}><Plus size={17} /> Nueva integración</Button> : null}
      </div>
    </div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}{notice ? <p className={styles.success} role="status">{notice}</p> : null}
    {tab === "logs" ? <p className={styles.notice}>{catalogs.notice || "Actividad técnica de los últimos 7 días. Puedes ampliar el rango con los filtros."}</p> : null}
    {tab === "events" ? <p className={styles.notice}>Historial de negocio permanente. La limpieza de logs técnicos no elimina estas acciones.</p> : null}
    <div className={crudStyles.contentRow}><section className={crudStyles.contentMain} aria-label={tabs.find((t) => t.value === tab)?.text}>
      {tab === "automations" ? <AutomationsPanel key={filters.client_id} clientId={filters.client_id} canUpdate={canUpdate} refresh={refresh} /> : <><Table id="api-integrations-table" className="striped" data={rows} header={tab === "connections" ? connectionHeader : tab === "logs" ? logHeader : auditHeader}
        height="100%" showSkeletonRows={loading} skeletonRowCount={6} />
      {!loading && rows.length === 0 && !error ? <p className={styles.empty}>No hay registros con estos filtros.</p> : null}</>}
    </section></div>
    {tab !== "automations" ? <Pagination currentPage={pagination.page} totalPages={pagination.last_page} total={pagination.total}
      onPageChange={setPage} params={{ page }} setParams={(next: { page: number }) => setPage(next.page)} /> : null}
  </section>
    {editor ? <IntegrationEditor key={editor === "new" ? "new" : editor.id} item={editor === "new" ? null : editor} catalogs={catalogs}
      busy={submitting} error={editorError} onClose={() => setEditor(null)} onSave={(draft) => void save(draft)} /> : null}
    {credential ? <CredentialDetail credential={credential.token} webhookSecret={credential.webhook} onClose={() => setCredential(null)} /> : null}
    {detailOpen ? <LogDetail item={detail} loading={detailLoading} error={detailError} onClose={closeLog} /> : null}
    {audit ? <AuditDetail item={audit} onClose={() => setAudit(null)} /> : null}
    {confirmation ? <DataModal open title={confirmation.action === "rotate" ? "Rotar credencial" : confirmation.item.is_active ? "Desactivar integración" : "Activar integración"}
      onClose={() => { if (!submitting) setConfirmation(null); }} onSave={() => void confirm()} disabled={submitting}
      buttonText={submitting ? "Procesando…" : "Confirmar"} maxWidth={560}>
      <p className={styles.helper}>{confirmation.action === "rotate" ? "La credencial anterior dejará de funcionar inmediatamente. Entrega la nueva únicamente al sistema autorizado."
        : confirmation.item.is_active ? "El sistema dejará de poder consultar o modificar datos. No se elimina ningún registro ni historial."
          : "El sistema podrá usar los permisos concedidos, exclusivamente en este condominio."}</p></DataModal> : null}
    {filterOpen ? <DataModal open title="Filtros de actividad API" onClose={() => setFilterOpen(false)} onSave={() => setFilterOpen(false)} buttonText="Aplicar" maxWidth={620}>
      <div className={styles.formGrid}>
        <Select name="outcome" label="Resultado" value={filters.outcome} required={false}
          options={[{ id: "", name: "Todos" }, { id: "success", name: "Correctos" }, { id: "client_error", name: "Rechazos 4xx" }, { id: "server_error", name: "Errores 5xx" }]}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => filter("outcome", e.target.value)} />
        <Select name="method" label="Método HTTP" value={filters.method} required={false}
          options={[{ id: "", name: "Todos" }, ...["GET", "POST", "PATCH", "DELETE", "WEBHOOK"].map((id) => ({ id, name: id }))]}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => filter("method", e.target.value)} />
        <Select name="status" label="Código HTTP" value={filters.status} required={false}
          options={[{ id: "", name: "Todos" }, ...[200, 201, 400, 401, 403, 404, 409, 410, 412, 413, 422, 428, 429, 500, 502, 503, 504, 599].map((status) => ({ id: String(status), name: `HTTP ${status}` }))]}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => filter("status", e.target.value)} />
        <Input name="from" label="Desde" type="date" value={filters.from} onChange={(e: React.ChangeEvent<HTMLInputElement>) => filter("from", e.target.value)} />
        <Input name="to" label="Hasta" type="date" value={filters.to} onChange={(e: React.ChangeEvent<HTMLInputElement>) => filter("to", e.target.value)} />
        <Button variant="secondary" onClick={() => { setFilters(initialFilters); setPage(1); }}>Limpiar filtros</Button>
      </div></DataModal> : null}
  </div>;
}
