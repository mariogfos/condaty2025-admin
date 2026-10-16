"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import GateRecordsPage from "./GateRecordsPage";
import { GATE_STATUS_EVENT, useGateStatus } from "./useGateStatus";

export default function GateSection({ section, children }: { section: "accesses" | "devices" | "alerts" | "logbooks"; children: ReactNode }) {
  const { user } = useAuth();
  const status = useGateStatus(user?.client_id);
  if (status === null) return <div role="status" aria-label="Cargando módulo">Cargando…</div>;
  if (status.error) return <div role="alert"><p>{status.error}</p><button type="button" onClick={() => window.dispatchEvent(new Event(GATE_STATUS_EVENT))}>Reintentar</button></div>;
  return status.enabled ? <GateRecordsPage section={section} active /> : children;
}
