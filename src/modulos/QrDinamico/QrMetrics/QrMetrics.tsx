"use client";
import React, { useCallback, useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { formatBs } from "@/mk/utils/numbers";
import { QR_STATE_LABEL, QrOrderState } from "../types";
import styles from "./QrMetrics.module.css";

/**
 * Métricas de QR dinámico (DES-28).
 *
 * Los números salen de qr-dynamic/debts/metrics: el backend limita al
 * condominio del administrador (RN-ADM-08); un usuario FOS puede filtrar
 * además por condominio. Filtros soportados: fechas, cuenta bancaria y
 * estado.
 */

interface Metrics {
  generados: number;
  monto_generado: number;
  monto_pagado: number;
  por_estado: Record<string, number>;
}

const STATE_ROWS: { key: string; state: QrOrderState }[] = [
  { key: "pending", state: QrOrderState.PENDING },
  { key: "paid", state: QrOrderState.PAID },
  { key: "replaced", state: QrOrderState.REPLACED },
  { key: "expired", state: QrOrderState.EXPIRED },
  { key: "cancelled", state: QrOrderState.CANCELLED },
];

const QrMetrics = () => {
  const { user } = useAuth();
  const { execute } = useAxios();
  const isFos = Boolean(user?.fosrole_id);

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    bank_account_id: "",
    order_state: "",
    client_id: "",
  });

  const load = useCallback(
    async (f: typeof filters) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (f.date_from) params.set("date_from", f.date_from);
      if (f.date_to) params.set("date_to", f.date_to);
      if (f.bank_account_id) params.set("bank_account_id", f.bank_account_id);
      if (f.order_state) params.set("order_state", f.order_state);
      if (isFos && f.client_id) params.set("client_id", f.client_id);
      const res = await execute(
        `/qr-dynamic/debts/metrics?${params.toString()}`,
        "GET",
        {},
        false,
        true,
      );
      setMetrics(res?.data?.success ? res.data.data : null);
      setLoading(false);
    },
    [execute, isFos],
  );

  useEffect(() => {
    load(filters);
    // Cuentas para el filtro; si el actor no puede listarlas, el select no
    // se muestra y el resto de la pantalla funciona igual
    (async () => {
      const res = await execute(
        "/bank-accounts",
        "GET",
        { perPage: -1, page: 1 },
        false,
        true,
      );
      if (res?.data?.success) setAccounts(res.data.data ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (name: string, value: string) => {
    const next = { ...filters, [name]: value };
    setFilters(next);
    load(next);
  };

  return (
    <div className={styles.container} id="qr-metrics">
      <div className={styles.filters}>
        <input
          id="metrics-date-from"
          type="date"
          className={styles.filterInput}
          value={filters.date_from}
          onChange={(e) => handleFilter("date_from", e.target.value)}
        />
        <input
          id="metrics-date-to"
          type="date"
          className={styles.filterInput}
          value={filters.date_to}
          onChange={(e) => handleFilter("date_to", e.target.value)}
        />
        {accounts.length > 0 && (
          <select
            id="metrics-account"
            className={styles.filterInput}
            value={filters.bank_account_id}
            onChange={(e) => handleFilter("bank_account_id", e.target.value)}
          >
            <option value="">Todas las cuentas</option>
            {accounts.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.alias_holder || a.account_number}
              </option>
            ))}
          </select>
        )}
        <select
          id="metrics-state"
          className={styles.filterInput}
          value={filters.order_state}
          onChange={(e) => handleFilter("order_state", e.target.value)}
        >
          <option value="">Todos los estados</option>
          {STATE_ROWS.map((r) => (
            <option key={r.key} value={r.state}>
              {QR_STATE_LABEL[r.state]}
            </option>
          ))}
        </select>
        {isFos && (user?.clients?.length ?? 0) > 0 && (
          <select
            id="metrics-client"
            className={styles.filterInput}
            value={filters.client_id}
            onChange={(e) => handleFilter("client_id", e.target.value)}
          >
            <option value="">Todos los condominios</option>
            {user.clients.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && <p className={styles.muted}>Cargando métricas…</p>}

      {!loading && metrics && (
        <>
          <div className={styles.cards}>
            <div className={styles.card}>
              <span className={styles.cardValue}>{metrics.generados}</span>
              <span className={styles.cardLabel}>QR generados</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardValue}>
                {formatBs(metrics.monto_generado)}
              </span>
              <span className={styles.cardLabel}>Monto generado</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardValue}>
                {formatBs(metrics.monto_pagado)}
              </span>
              <span className={styles.cardLabel}>Monto pagado</span>
            </div>
          </div>

          <div className={styles.stateGrid}>
            {STATE_ROWS.map((r) => (
              <div key={r.key} className={styles.stateItem}>
                <span className={styles.stateCount}>
                  {metrics.por_estado?.[r.key] ?? 0}
                </span>
                <span className={styles.stateLabel}>
                  {QR_STATE_LABEL[r.state]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !metrics && (
        <p className={styles.muted}>No se pudieron cargar las métricas.</p>
      )}
    </div>
  );
};

export default QrMetrics;
