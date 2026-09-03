"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, History as HistoryIcon, ShieldCheck } from "lucide-react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import Table from "@/mk/components/ui/Table/Table";
import Button from "@/mk/components/forms/Button/Button";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { financialIntegrityApi } from "@/modulos/FinancialIntegrity/api";
import styles from "./FinancialHistory.module.css";

type Client = { id: string; name: string };
type HistoryItem = {
  id: string;
  type: string;
  label: string;
  client: string;
  record: { title: string; subtitle?: string | null };
  before: { status?: string | null };
  after: { status?: string | null };
  actor: { name: string };
  reason?: string | null;
  occurred_at: string;
};

type HistoryPayload = {
  items: HistoryItem[];
  pagination: { page: number; per_page: number; total: number; last_page: number };
  available_types: { id: string; label: string }[];
  notice: string;
};

const STATE_LABELS: Record<string, string> = {
  A: "Por cobrar", M: "En mora", I: "Pago parcial", S: "Por confirmar",
  P: "Pagado", R: "Rechazado", F: "Condonado", L: "Reserva pagada", Q: "Reserva por confirmar",
};

const stateLabel = (value?: string | null) => STATE_LABELS[String(value || "")] || value || "Sin estado";

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
};

export default function FinancialHistory() {
  const { userCan, showToast } = useAuth();
  const { execute } = useAxios();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState("all");
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const canView = userCan("superadmins", "R");

  const loadClients = async () => {
    const { data, error } = await execute(financialIntegrityApi.clients, "GET");
    if (data?.success) setClients(data.data || []);
    else showToast(error?.data?.message || data?.message || "No se pudieron cargar los condominios.", "error");
  };

  const loadHistory = async (page = 1) => {
    setLoading(true);
    const { data, error } = await execute(financialIntegrityApi.history, "GET", {
      ...(clientId ? { client_id: clientId } : {}),
      type,
      page,
      per_page: 25,
    });
    setLoading(false);
    if (data?.success) setHistory(data.data);
    else showToast(error?.data?.message || data?.message || "No se pudo cargar el historial.", "error");
  };

  useEffect(() => {
    if (!canView) return;
    void loadClients();
    // useAxios returns an unstable execute function; loading is intentionally
    // tied to permission availability instead of every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  useEffect(() => {
    if (!canView) return;
    void loadHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, clientId, type]);

  if (!canView) return <NotAccess />;

  const pagination = history?.pagination;
  const types = history?.available_types || [
    { id: "all", label: "Todos los tipos" },
    { id: "payment_state_repair", label: "Correcciones de estados de pago" },
  ];

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}><HistoryIcon size={16} /> Backoffice</span>
          <h1>Historial</h1>
          <p>Registro inmutable de acciones de mantenimiento. Cada tipo se incorpora cuando tiene contexto suficiente para poder auditarlo correctamente.</p>
        </div>
      </header>

      <section className={styles.filterCard}>
        <label>
          <span>Condominio</span>
          <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">Todos los condominios</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label>
          <span>Tipo de historial</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {types.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <Button variant="secondary" onClick={() => void loadHistory(1)} disabled={loading}>
          {loading ? "Actualizando…" : "Actualizar"}
        </Button>
      </section>

      {history?.notice ? <div className={styles.notice}><ShieldCheck size={18} />{history.notice}</div> : null}

      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div><h2>Acciones registradas</h2><p>{pagination ? `${pagination.total} registro${pagination.total === 1 ? "" : "s"}` : "Cargando registros…"}</p></div>
        </div>
        {!loading && (history?.items?.length || 0) === 0 ? (
          <div className={styles.emptyState}><HistoryIcon size={22} /><div><strong>Aún no hay correcciones registradas.</strong><span>El historial se poblará cuando se aplique una corrección desde Integridad financiera.</span></div></div>
        ) : (
          <Table
            data={history?.items || []}
            showSkeletonRows={loading}
            skeletonRowCount={6}
            header={[
              { key: "occurred_at", label: "Fecha", responsive: "onlyDesktop", width: "185", onRender: ({ value }: any) => formatDate(value) },
              { key: "label", label: "Acción", responsive: "onlyDesktop", width: "225", onRender: ({ item }: any) => <div className={styles.actionCell}><strong>{item.label}</strong><span>{item.client}</span></div> },
              { key: "record", label: "Registro", responsive: "onlyDesktop", width: "100%", onRender: ({ value }: any) => <div className={styles.recordCell}><strong>{value?.title || "Registro financiero"}</strong>{value?.subtitle ? <span>{value.subtitle}</span> : null}</div> },
              { key: "before", label: "Cambio", responsive: "onlyDesktop", width: "190", onRender: ({ item }: any) => <span className={styles.stateChange}><b>{stateLabel(item.before?.status)}</b><ArrowRight size={14} /><strong>{stateLabel(item.after?.status)}</strong></span> },
              { key: "actor", label: "Administrador", responsive: "onlyDesktop", width: "190", onRender: ({ value }: any) => value?.name || "Administrador" },
            ]}
          />
        )}
        {pagination && pagination.last_page > 1 ? (
          <footer className={styles.pagination}>
            <span>Página {pagination.page} de {pagination.last_page}</span>
            <div>
              <Button variant="secondary" small onClick={() => void loadHistory(pagination.page - 1)} disabled={loading || pagination.page <= 1}><ArrowLeft size={15} /> Anterior</Button>
              <Button variant="secondary" small onClick={() => void loadHistory(pagination.page + 1)} disabled={loading || pagination.page >= pagination.last_page}>Siguiente <ArrowRight size={15} /></Button>
            </div>
          </footer>
        ) : null}
      </section>
    </section>
  );
}
