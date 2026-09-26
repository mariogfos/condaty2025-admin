"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useAxios, { type ApiEnvelope, type ApiError } from "@/mk/hooks/useAxios";
import { financialRecordsApi } from "./api";
import type { FinancialRecordReference, FinancialWorkspace } from "./types";

/**
 * Un rechazo de negocio llega con HTTP 200 y `success: false` (el mensaje en
 * `data`); un 403/404/422 llega como `error`, con el sobre del API en
 * `error.data`. Se lee el mensaje del API en los dos casos antes de caer al
 * genérico.
 */
const getErrorMessage = (
  data: ApiEnvelope | null,
  error: ApiError | null,
): string =>
  data?.message ||
  error?.data?.message ||
  error?.message ||
  "No se pudo cargar el historial del registro.";

export const useFinancialWorkspace = (
  record: FinancialRecordReference | undefined,
  open: boolean,
) => {
  // `execute` es estable (memoizada en useAxios): puede ir en las dependencias.
  const { execute } = useAxios<FinancialWorkspace>();
  const requestSequence = useRef(0);
  const [workspace, setWorkspace] = useState<FinancialWorkspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const requestId = ++requestSequence.current;

    if (!record?.id) {
      setWorkspace(null);
      setError("");
      return;
    }

    setWorkspace(null);
    setLoading(true);
    setError("");
    const { data, error: requestError } = await execute(
      financialRecordsApi.workspace(record),
      "GET",
      {},
      false,
      true,
    );

    // Una respuesta que llega tarde —el modal ya se cerró o cambió de
    // registro— no pisa la del registro actual.
    if (requestId !== requestSequence.current) return;

    if (data?.success && data?.data) {
      setWorkspace(data.data);
      setLoading(false);
      return;
    }

    setWorkspace(null);
    setError(getErrorMessage(data, requestError));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, record?.id, record?.type]);

  useEffect(() => {
    if (!open || !record?.id) {
      requestSequence.current += 1;
      setLoading(false);
      return;
    }
    void refresh();
  }, [open, record?.id, record?.type, refresh]);

  return { workspace, loading, error, refresh };
};
