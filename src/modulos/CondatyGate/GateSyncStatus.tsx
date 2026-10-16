import { AlertTriangle, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import type { GateConnection } from "./useGateStatus";
import { date } from "./gateFormat";
import styles from "./gate.module.css";

type SyncPhase = {
  name: string;
  message: string;
  state: "ready" | "pending" | "working" | "error";
  error?: string | null;
  updatedAt?: string | null;
};

const historyMessages: Record<string, string> = {
  starting: "Preparando la copia",
  copying: "Copiando el historial en segundo plano",
  catching_up: "Conciliando movimientos y cambios pendientes",
  ready: "Sincronizando los últimos cambios",
};

export default function GateSyncStatus({ connection }: { connection: GateConnection }) {
  const directoryPending = connection.sent_version < connection.desired_version;
  const historyReady = connection.history_status === "ready" && (connection.history_sequence ?? 0) >= (connection.history_revision ?? 0);
  const historyMessage = historyReady ? "Actualizado" : historyMessages[connection.history_status ?? ""] ?? "La copia comenzará en segundo plano";
  const phases: SyncPhase[] = [
    { name: "Unidades y personas", message: directoryPending ? "Sincronización pendiente" : "Directorio sincronizado", state: directoryPending ? "working" : "ready", error: connection.last_error, updatedAt: connection.last_sync_at },
    { name: "Historial de accesos", message: historyMessage, state: historyReady ? "ready" : connection.history_status && connection.history_status !== "idle" ? "working" : "pending", error: connection.history_error, updatedAt: connection.history_synced_at },
    { name: "Ingresos y salidas nuevos", message: connection.access_synced_at ? "Sincronización activa" : "Esperando la primera sincronización", state: connection.access_synced_at ? "ready" : "pending", error: connection.access_error, updatedAt: connection.access_synced_at },
  ];

  return <section className={styles.syncStatus} aria-label="Estado de sincronización" role="status" aria-live="polite">
    {phases.map(phase => {
      const Icon = phase.error ? AlertTriangle : phase.state === "ready" ? CheckCircle2 : phase.state === "working" ? RefreshCw : Clock3;
      return <div className={styles.syncPhase} key={phase.name}>
        <Icon size={16} aria-hidden="true" className={phase.error ? styles.error : phase.state === "ready" ? styles.syncReady : styles.muted} />
        <div><strong>{phase.name}</strong><span className={phase.error ? styles.error : styles.muted}>{phase.error || phase.message}</span>{phase.updatedAt && <small>Última confirmación: {date(phase.updatedAt)}</small>}</div>
      </div>;
    })}
  </section>;
}
