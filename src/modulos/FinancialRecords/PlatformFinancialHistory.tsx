"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, History as HistoryIcon, ShieldCheck } from "lucide-react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import Table from "@/mk/components/ui/Table/Table";
import Button from "@/mk/components/forms/Button/Button";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { financialRecordsApi } from "./api";
import { flattenChanges } from "./FinancialHistory";
import styles from "./PlatformFinancialHistory.module.css";

/**
 * `/history`: las correcciones de plata de TODOS los condominios, para el
 * superadmin. Viene de `modulos/FinancialHistory` de producción, con tres
 * diferencias:
 *
 * - el cambio se describe con `flattenChanges` del historial del registro. El
 *   de producción traducía estados de una letra (`P`, `M`…) que en `dev` no
 *   existen —la bitácora guarda el NOMBRE del enum— y no mostraba la fecha de
 *   pago: una corrección de `paid_at` salía como «Datos derivados sincronizados»;
 * - se muestra el motivo, que es obligatorio en cada corrección;
 * - no hay selector de tipo: el API tiene un solo tipo y el filtro no cambia nada.
 *
 * Se abre con el mismo criterio que el API (`fosrole_id`): el menú sólo puede
 * expresar una habilidad (`superadmins`), no la pertenencia a la plataforma.
 */
type Client = { id: string; name: string };
type HistoryItem = {
  id: string;
  label: string;
  client: string;
  record: { title: string; subtitle?: string | null };
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  actor?: { name?: string | null } | null;
  reason?: string | null;
  occurred_at: string;
};

type HistoryPayload = {
  items: HistoryItem[];
  pagination: { page: number; per_page: number; total: number; last_page: number };
  notice?: string;
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
};

export default function PlatformFinancialHistory() {
  const { user, setStore, showToast } = useAuth();
  const { execute } = useAxios();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const canView = Boolean(user?.fosrole_id);

  const loadClients = async () => {
    const { data, error } = await execute(financialRecordsApi.platformHistoryClients, "GET", {}, false, true);
    if (data?.success) setClients(data.data || []);
    else showToast(error?.data?.message || data?.message || "No se pudieron cargar los condominios.", "error");
  };

  const loadHistory = async (page = 1) => {
    setLoading(true);
    const { data, error } = await execute(
      financialRecordsApi.platformHistory,
      "GET",
      { ...(clientId ? { client_id: clientId } : {}), page, per_page: 25 },
      false,
      true,
    );
    setLoading(false);
    if (data?.success) setHistory(data.data);
    else showToast(error?.data?.message || data?.message || "No se pudo cargar el historial.", "error");
  };

  useEffect(() => {
    setStore({ title: "Historial financiero", right: null });
  }, [setStore]);

  useEffect(() => {
    if (!canView) return;
    void loadClients();
    // `execute` cambia en cada render: la carga depende sólo del permiso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  useEffect(() => {
    if (!canView) return;
    void loadHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, clientId]);

  if (!canView) return <NotAccess />;

  const pagination = history?.pagination;

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.eyebrow}><HistoryIcon size={16} /> Backoffice</span>
        <h1>Historial financiero</h1>
        <p>Registro inmutable de las correcciones sobre deudas, ingresos y egresos de todos los condominios.</p>
      </header>

      <section className={styles.filterCard}>
        <label>
          <span>Condominio</span>
          <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">Todos los condominios</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <Button variant="secondary" onClick={() => void loadHistory(pagination?.page || 1)} disabled={loading}>
          {loading ? "Actualizando…" : "Actualizar"}
        </Button>
      </section>

      {history?.notice ? <div className={styles.notice}><ShieldCheck size={18} />{history.notice}</div> : null}

      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Correcciones registradas</h2>
          <p>{pagination ? `${pagination.total} registro${pagination.total === 1 ? "" : "s"}` : "Cargando registros…"}</p>
        </div>
        {!loading && (history?.items?.length || 0) === 0 ? (
          <div className={styles.emptyState}>
            <HistoryIcon size={22} />
            <div>
              <strong>Aún no hay correcciones registradas.</strong>
              <span>Aquí aparecerán las correcciones financieras con su motivo.</span>
            </div>
          </div>
        ) : (
          <Table
            data={history?.items || []}
            height="min(56dvh, 620px)"
            showSkeletonRows={loading}
            skeletonRowCount={6}
            header={[
              { key: "occurred_at", label: "Fecha", responsive: "onlyDesktop", width: "170", onRender: ({ value }: any) => formatDate(value) },
              {
                key: "label",
                label: "Acción",
                responsive: "onlyDesktop",
                width: "220",
                onRender: ({ item }: { item: HistoryItem }) => (
                  <div className={styles.stackCell}><strong>{item.label}</strong><span>{item.client}</span></div>
                ),
              },
              {
                key: "record",
                label: "Registro",
                responsive: "onlyDesktop",
                width: "100%",
                onRender: ({ item }: { item: HistoryItem }) => (
                  <div className={styles.stackCell}>
                    <strong>{item.record?.title || "Registro financiero"}</strong>
                    {item.record?.subtitle ? <span>{item.record.subtitle}</span> : null}
                    {item.reason ? <span title={item.reason}>Motivo: {item.reason}</span> : null}
                  </div>
                ),
              },
              {
                key: "before",
                label: "Cambio",
                responsive: "onlyDesktop",
                width: "260",
                onRender: ({ item }: { item: HistoryItem }) => {
                  const changes = flattenChanges(item).slice(0, 2);
                  return (
                    <span className={styles.changeCell}>
                      {changes.length
                        ? changes.map((change) => (
                            <span key={change.field} className={styles.change}>
                              {change.label}: <b>{change.before}</b>
                              <ArrowRight size={14} aria-label="pasó a" />
                              <strong>{change.after}</strong>
                            </span>
                          ))
                        : "Sin cambio de valores"}
                    </span>
                  );
                },
              },
              { key: "actor", label: "Responsable", responsive: "onlyDesktop", width: "180", onRender: ({ value }: any) => value?.name || "Sistema" },
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
