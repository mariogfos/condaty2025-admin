"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { financialRecordsApi } from "./api";
import type {
  FinancialRecordReference,
  FinancialWorkspace,
} from "./types";

const getErrorMessage = (data: any, error: any) =>
  data?.message ||
  error?.data?.message ||
  error?.message ||
  "No se pudo cargar el historial del registro.";

export const useFinancialWorkspace = (
  record: FinancialRecordReference | undefined,
  open: boolean,
) => {
  const { execute } = useAxios();
  const executeRef = useRef(execute);
  const requestSequence = useRef(0);
  const [workspace, setWorkspace] = useState<FinancialWorkspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  const refresh = useCallback(async () => {
    const requestId = ++requestSequence.current;

    if (!record?.id) {
      setWorkspace(null);
      setError("");
      return null;
    }

    setWorkspace(null);
    setLoading(true);
    setError("");
    const { data, error: requestError } = await executeRef.current(
      financialRecordsApi.workspace(record),
      "GET",
      {},
      false,
      true,
    );

    if (requestId !== requestSequence.current) return null;

    if (data?.success && data?.data) {
      setWorkspace(data.data);
      setLoading(false);
      return data.data as FinancialWorkspace;
    }

    setWorkspace(null);
    setError(getErrorMessage(data, requestError));
    setLoading(false);
    return null;
  }, [record?.id, record?.type]);

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
