"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import Button from "@/mk/components/forms/Button/Button";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { financialIntegrityApi } from "./api";
import styles from "./FinancialIntegrity.module.css";

type Client = { id: string; name: string };

type Finding = {
  id: string;
  unit: string;
  period?: string | null;
  description?: string | null;
  total_amount: number;
  payment_code?: string | null;
  before: { status?: string | null };
  expected: { status?: string | null };
  changes: Record<string, { from: unknown; to: unknown }>;
};

type ScanResult = {
  client: Client;
  summary: {
    scanned: number;
    debt_dptos_found: number;
    debt_dptos_fixed: number;
    parent_debts_found: number;
    parent_debts_fixed: number;
    reservations_found: number;
    reservations_fixed: number;
    amount_affected: number;
  };
  findings: Finding[];
  applied: boolean;
};

const STATE_LABELS: Record<string, string> = {
  A: "Por cobrar",
  M: "En mora",
  I: "Pago parcial",
  S: "Por confirmar",
  P: "Pagado",
  R: "Rechazado",
  F: "Condonado",
};

const statusLabel = (value?: string | null) =>
  STATE_LABELS[String(value || "")] || value || "Sin estado";

const CHANGE_LABELS: Record<string, string> = {
  status: "Estado",
  payment_id: "Pago vinculado",
  paid_at: "Fecha de pago",
  is_partial: "Tipo de pago",
  remaining_amount: "Saldo pendiente",
};

const changeSummary = (finding: Finding) =>
  Object.keys(finding.changes || {})
    .map((field) => CHANGE_LABELS[field] || field.replaceAll("_", " "))
    .join(" · ");

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

export default function FinancialIntegrity() {
  const router = useRouter();
  const { userCan, showToast } = useAuth();
  const { execute } = useAxios();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loadingClients, setLoadingClients] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canView = userCan("superadmins", "R");

  const loadClients = async () => {
    setLoadingClients(true);
    const { data, error } = await execute(financialIntegrityApi.clients, "GET");
    if (data?.success) {
      setClients(data.data || []);
    } else {
      showToast(error?.data?.message || data?.message || "No se pudieron cargar los condominios.", "error");
    }
    setLoadingClients(false);
  };

  useEffect(() => {
    if (canView) {
      void loadClients();
    }
    // useAxios exposes a new execute closure every render; this screen loads
    // its selector once when the permission becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const scan = async () => {
    if (!selectedClientId) {
      showToast("Selecciona un condominio antes de escanear.", "warning");
      return;
    }

    setScanning(true);
    setResult(null);
    const { data, error } = await execute(
      financialIntegrityApi.scanDebtPaymentState,
      "GET",
      { client_id: selectedClientId },
    );
    setScanning(false);

    if (!data?.success) {
      showToast(error?.data?.message || data?.message || "No se pudo completar el escaneo.", "error");
      return;
    }

    setResult(data.data);
    const count = Number(data.data?.summary?.debt_dptos_found || 0);
    showToast(
      count > 0
        ? `Se encontraron ${count} estados que requieren revisión.`
        : "No se encontraron inconsistencias en este condominio.",
      count > 0 ? "warning" : "success",
    );
  };

  const fix = async () => {
    setFixing(true);
    const { data, error } = await execute(
      financialIntegrityApi.fixDebtPaymentState,
      "POST",
      { client_id: selectedClientId },
    );
    setFixing(false);
    setConfirmOpen(false);

    if (!data?.success) {
      showToast(error?.data?.message || data?.message || "No se pudo aplicar la corrección.", "error");
      return;
    }

    setResult(data.data);
    const count = Number(data.data?.summary?.debt_dptos_fixed || 0);
    showToast(
      count > 0
        ? `Se corrigieron ${count} estados y se registró el historial.`
        : "Los hallazgos ya no requerían una corrección.",
      count > 0 ? "success" : "info",
    );
  };

  if (!canView) return <NotAccess />;

  const summary = result?.summary;
  const hasFindings = Boolean(summary && summary.debt_dptos_found > 0 && !result?.applied);

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}><ShieldCheck size={16} /> Backoffice</span>
          <h1>Integridad financiera</h1>
          <p>
            Revisa estados de deudas con pagos registrados. El escaneo no modifica datos;
            la corrección vuelve a validar cada caso y deja un historial inmutable.
          </p>
        </div>
        <button className={styles.historyLink} onClick={() => router.push("/history")}>
          Ver historial <ArrowRight size={16} />
        </button>
      </header>

      <section className={styles.controlCard}>
        <div className={styles.controlCopy}>
          <h2>Escanear estados de cobro</h2>
          <p>Selecciona un único condominio para mantener la revisión focalizada y trazable.</p>
        </div>
        <div className={styles.controlActions}>
          <label className={styles.selectLabel}>
            <span>Condominio</span>
            <select
              value={selectedClientId}
              onChange={(event) => {
                setSelectedClientId(event.target.value);
                setResult(null);
              }}
              disabled={loadingClients || scanning || fixing}
            >
              <option value="">{loadingClients ? "Cargando condominios…" : "Seleccionar condominio"}</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <Button variant="primary" onClick={scan} disabled={!selectedClientId || scanning || fixing}>
            <RefreshCw size={17} className={scanning ? styles.spin : ""} />
            {scanning ? "Escaneando…" : "Escanear"}
          </Button>
        </div>
      </section>

      {result ? (
        <>
          <section className={styles.summaryGrid} aria-label="Resultado del escaneo">
            <article><span>Registros revisados</span><strong>{summary?.scanned || 0}</strong></article>
            <article className={hasFindings ? styles.warningSummary : ""}><span>Inconsistencias</span><strong>{summary?.debt_dptos_found || 0}</strong></article>
            <article><span>Monto involucrado</span><strong>{formatAmount(summary?.amount_affected || 0)}</strong></article>
            <article><span>Dependencias</span><strong>{(summary?.parent_debts_found || 0) + (summary?.reservations_found || 0)}</strong></article>
          </section>

          {result.applied ? (
            <section className={styles.successNotice}>
              <CheckCircle2 size={20} />
              <div><strong>Corrección finalizada.</strong><span>Se registró cada cambio con el administrador que lo aprobó.</span></div>
              <button onClick={() => router.push("/history")}>Abrir historial</button>
            </section>
          ) : null}

          <section className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <div>
                <h2>{hasFindings ? "Hallazgos para revisar" : "Resultado del escaneo"}</h2>
                <p>{hasFindings ? "Los estados esperados se calculan desde pagos y comprobantes activos." : "No hay estados de deuda pendientes de corrección."}</p>
              </div>
              {hasFindings ? (
                <Button variant="accent" onClick={() => setConfirmOpen(true)} disabled={fixing}>
                  <AlertTriangle size={17} /> Corregir {summary?.debt_dptos_found} hallazgos
                </Button>
              ) : null}
            </div>

            {hasFindings ? (
              <Table
                data={result.findings}
                header={[
                  { key: "unit", label: "Unidad", responsive: "onlyDesktop", width: "190" },
                  { key: "description", label: "Detalle", responsive: "onlyDesktop", width: "100%", onRender: ({ item }: any) => <div className={styles.detailCell}><strong>{item.description || "Deuda"}</strong><span>{item.period || "Sin periodo"}</span></div> },
                  { key: "total_amount", label: "Monto", responsive: "onlyDesktop", width: "145", onRender: ({ value }: any) => <span className={styles.amount}>{formatAmount(value)}</span> },
                  { key: "before", label: "Corrección", responsive: "onlyDesktop", width: "190", onRender: ({ item }: { item: Finding }) => item.changes?.status ? <span className={styles.statePair}><b>{statusLabel(item.before?.status)}</b><ArrowRight size={14} /><strong>{statusLabel(item.expected?.status)}</strong></span> : <span className={styles.changeSummary}>{changeSummary(item)}</span> },
                  { key: "payment_code", label: "Comprobante", responsive: "onlyDesktop", width: "155", onRender: ({ value }: any) => value || "Pago confirmado" },
                ]}
              />
            ) : <div className={styles.emptyState}><CheckCircle2 size={22} /> Estados consistentes para el alcance revisado.</div>}
          </section>
        </>
      ) : (
        <section className={styles.emptyScan}><ShieldCheck size={24} /><div><strong>Escaneo seguro y explícito</strong><span>No se analizará ningún condominio hasta que lo selecciones.</span></div></section>
      )}

      <DataModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onSave={fix}
        title="Confirmar corrección"
        buttonText={fixing ? "Corrigiendo…" : "Sí, corregir y registrar"}
        buttonCancel="Cancelar"
        disabled={fixing}
        minWidth={520}
        maxWidth={560}
      >
        <div className={styles.confirmBody}>
          <AlertTriangle size={28} />
          <p>
            Se volverán a calcular los <strong>{summary?.debt_dptos_found || 0} hallazgos</strong> de {result?.client.name} antes de escribir. Sólo se actualizarán los que sigan siendo inconsistentes.
          </p>
          <p>Cada corrección quedará registrada con tu usuario, el estado anterior y el resultado esperado.</p>
        </div>
      </DataModal>
    </section>
  );
}
