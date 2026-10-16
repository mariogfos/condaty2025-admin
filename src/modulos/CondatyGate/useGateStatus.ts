"use client";
import { useEffect, useRef, useState } from "react";
import useGateApi from "./useGateApi";
export type GateConnection = { id: string; entity_id: string; entity_name: string; entity_handle: string; status: string; desired_version: number; sent_version: number; last_error: string | null; last_sync_at: string | null; history_status?: string; history_sequence?: number; history_revision?: number; history_error?: string | null; history_synced_at?: string | null; access_error?: string | null; access_synced_at?: string | null };
export type GateStatus = { enabled: boolean; configured: boolean; connection: GateConnection | null; source_condominium?: { id: string; name: string }; error?: string };
export const GATE_STATUS_EVENT = "condaty-gate-status";
export function useGateStatus(clientId?: string) {
  const api = useGateApi(); const execute = useRef(api.execute); execute.current = api.execute;
  const [value, setValue] = useState<{ client: string; status: GateStatus } | null>(null);
  useEffect(() => {
    if (!clientId) return;
    let current = true; let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const { data } = await execute.current("/gate-plugin", "GET", {}, false, true);
        if (current) setValue({ client: clientId, status: data?.success ? data.data : { enabled: false, configured: false, connection: null, error: "No pudimos consultar el estado de Condaty Gate. Vuelve a intentarlo." } });
      } catch { if (current) setValue({ client: clientId, status: { enabled: false, configured: false, connection: null, error: "No pudimos consultar el estado de Condaty Gate. Vuelve a intentarlo." } }); }
      finally { inFlight = false; }
    };
    void load(); window.addEventListener(GATE_STATUS_EVENT, load);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    return () => { current = false; window.clearInterval(timer); window.removeEventListener(GATE_STATUS_EVENT, load); };
  }, [clientId]);
  return value && value.client === clientId ? value.status : null;
}
