"use client";

import { useCallback } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios, { type MethodType } from "@/mk/hooks/useAxios";

type GateUser = { client_id?: string; fosrole_id?: string | null } | null;

export function gateRequestScope(user: GateUser) {
  if (!user?.fosrole_id) return {};
  if (!user.client_id) throw new Error("Selecciona el condominio de origen en Legacy.");
  return { operfos: 1, client_id: user.client_id };
}

export default function useGateApi() {
  const { user } = useAuth();
  const api = useAxios();
  const request = api.execute;
  const execute = useCallback((url: string, method: MethodType = "GET", payload: Record<string, unknown> = {}, act = false, notWaiting = false) => {
    return request(url, method, { ...payload, ...gateRequestScope(user) }, act, notWaiting);
  }, [request, user]);

  return { ...api, execute };
}
