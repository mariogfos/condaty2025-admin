'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/mk/contexts/AuthProvider';
import useAxios from '@/mk/hooks/useAxios';
import NotAccess from '@/components/auth/NotAccess/NotAccess';
import styles from './QrDinamico.module.css';
import {
  QrOrder,
  QrOrderState,
  PaymentType,
  QrOrderFilters,
  QR_STATE_LABEL,
  QR_STATE_COLOR,
  PAYMENT_TYPE_LABEL,
} from './types';
import { apiMessage, formatQrDate } from './shared';
import RenderView from './RenderView/RenderView';
import QrMetrics from './QrMetrics/QrMetrics';

// ─── Tabs ────────────────────────────────────────────────────────────────────
type ActiveTab = 'orders' | 'incidents' | 'metrics';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatAmount = (amount: string, currency: string) => (
  <span className={styles.amount}>
    {parseFloat(amount).toFixed(2)}
    <span className={styles.currency}>{currency}</span>
  </span>
);

const StateBadge = ({ state }: { state: QrOrderState }) => {
  const cfg = QR_STATE_COLOR[state];
  return (
    <span
      className={styles.badge}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {QR_STATE_LABEL[state] ?? state}
    </span>
  );
};

const QR_BATCH_SIZE = 40;
const QR_PREFETCH_ROWS = 20;

const mergeOrders = (currentOrders: QrOrder[], incomingOrders: QrOrder[]) => {
  if (!currentOrders.length) return incomingOrders;
  if (!incomingOrders.length) return currentOrders;

  const merged = [...currentOrders];
  const indexById = new Map<string, number>();

  merged.forEach((order, index) => {
    indexById.set(String(order.id), index);
  });

  incomingOrders.forEach((order) => {
    const existingIndex = indexById.get(String(order.id));
    if (existingIndex === undefined) {
      indexById.set(String(order.id), merged.length);
      merged.push(order);
      return;
    }

    merged[existingIndex] = order;
  });

  return merged;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const QrDinamico = () => {
  const { userCan, setStore, store } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [filters, setFilters] = useState<QrOrderFilters>({ per_page: QR_BATCH_SIZE, page: 1 });
  const [orders, setOrders] = useState<QrOrder[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [openIncidentsCount, setOpenIncidentsCount] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<QrOrder | null>(null);
  const ordersLoadSentinelRef = React.useRef<HTMLDivElement | null>(null);
  const latestOrdersRequestRef = React.useRef(0);

  // ─── API calls ──────────────────────────────────────────────────────────────
  const { execute: fetchOrders, loaded: ordersLoaded } = useAxios();
  const { execute: verifyOrder } = useAxios();

  // QR-13: filters travel as the payload — useAxios already appends the query
  // string on every GET. Building the URL by hand duplicates the "?" and
  // corrupts the last parameter (…&page=1?_debug=1).
  const buildParams = useCallback((f: QrOrderFilters) => {
    const params: Record<string, string> = {};
    if (f.order_state !== undefined && f.order_state !== '') params.order_state = String(f.order_state);
    if (f.payment_type) params.payment_type = f.payment_type;
    if (f.date_from) params.date_from = f.date_from;
    if (f.date_to) params.date_to = f.date_to;
    if (f.reconciliation) params.reconciliation = f.reconciliation;
    params.per_page = String(f.per_page ?? QR_BATCH_SIZE);
    params.page = String(f.page ?? 1);
    return params;
  }, []);

  const loadOrders = useCallback(async (
    f: QrOrderFilters = filters,
    options: { append?: boolean } = {},
  ) => {
    const requestId = ++latestOrdersRequestRef.current;
    const append = Boolean(options.append && Number(f.page || 1) > 1);
    if (append) {
      setLoadingMoreOrders(true);
    }
    const response = await fetchOrders('qr-dynamic/orders', 'GET', buildParams(f));
    const payload = response?.data;

    if (requestId !== latestOrdersRequestRef.current) return;

    if (payload?.success) {
      setSelectedOrder((current) => current
        ? (payload.data.items ?? []).find((order: QrOrder) => order.id === current.id) ?? current
        : null);
      setOrders((old) =>
        append ? mergeOrders(old, payload.data.items ?? []) : (payload.data.items ?? []),
      );
      setPagination({
        current_page: payload.data.pagination.current_page,
        last_page: payload.data.pagination.last_page,
        total: payload.data.pagination.total,
      });
      if (typeof payload.data.open_incidents_count === 'number') {
        setOpenIncidentsCount(payload.data.open_incidents_count);
      }
    }
    setLoadingMoreOrders(false);
  }, [fetchOrders, buildParams, filters]);

  useEffect(() => {
    setStore({ ...store, title: 'QR Dinámico' });
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleFilterChange = (key: keyof QrOrderFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1, per_page: QR_BATCH_SIZE };
    setFilters(newFilters);
    loadOrders(newFilters);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'metrics') return;

    const nextFilters: QrOrderFilters = {
      ...filters,
      reconciliation: tab === 'incidents' ? 'open' : undefined,
      page: 1,
    };
    setFilters(nextFilters);
    setOrders([]);
    setPagination({ current_page: 1, last_page: 1, total: 0 });
    void loadOrders(nextFilters);
  };

  const handleVerify = async (order: QrOrder): Promise<{ success: boolean; message: string }> => {
    const response = await verifyOrder(
      `/qr-dynamic/debts/orders/${order.id}/verify`, 'POST', {}, false, true,
    );
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    await loadOrders(nextFilters);

    if (response?.data?.success && Number(response.data.data?.order_state) === QrOrderState.PAID) {
      setSelectedOrder(null);
      return { success: true, message: 'El pago quedó acreditado por completo.' };
    }

    return {
      success: Boolean(response?.data?.success),
      message: apiMessage(response) ?? 'No se pudo reverificar el QR. La incidencia sigue abierta.',
    };
  };

  const loadMoreOrders = useCallback(() => {
    if (loadingMoreOrders || !ordersLoaded) return;
    if (pagination.current_page >= pagination.last_page) return;

    const nextFilters = {
      ...filters,
      page: pagination.current_page + 1,
      per_page: QR_BATCH_SIZE,
    };

    setFilters(nextFilters);
    void loadOrders(nextFilters, { append: true });
  }, [filters, loadOrders, loadingMoreOrders, ordersLoaded, pagination.current_page, pagination.last_page]);

  useEffect(() => {
    if (activeTab === 'metrics') return;
    if (!ordersLoadSentinelRef.current) return;
    if (!ordersLoaded || loadingMoreOrders || pagination.current_page >= pagination.last_page) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreOrders();
        }
      },
      {
        root: null,
        rootMargin: `0px 0px ${QR_PREFETCH_ROWS * 52}px 0px`,
        threshold: 0.01,
      },
    );

    observer.observe(ordersLoadSentinelRef.current);

    return () => observer.disconnect();
  }, [
    activeTab,
    loadMoreOrders,
    loadingMoreOrders,
    ordersLoaded,
    pagination.current_page,
    pagination.last_page,
  ]);

  // ─── Perms ──────────────────────────────────────────────────────────────────
  if (!userCan('payments', 'R')) return <NotAccess />;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>QR Dinámico</h1>
        </div>
        {/* RN-ADM-04: el admin no genera ni anula QR dinámicos */}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          id="tab-orders"
          className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          Órdenes QR
        </button>
        <button
          id="tab-incidents"
          className={`${styles.tab} ${activeTab === 'incidents' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('incidents')}
        >
          Por conciliar {openIncidentsCount > 0 ? `(${openIncidentsCount})` : ''}
        </button>
        <button
          id="tab-metrics"
          className={`${styles.tab} ${activeTab === 'metrics' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('metrics')}
        >
          Métricas
        </button>
      </div>

      {/* ── Tab: Orders ──────────────────────────────────────────────────────── */}
      {activeTab !== 'metrics' && (
        <>
          {activeTab === 'incidents' && (
            <div className={styles.incidentNotice} role="status">
              El banco reportó un cobro, pero no se pudo aplicar íntegramente. Estas órdenes requieren conciliación; no anule el QR ni registre otro cobro.
            </div>
          )}
          {/* Filters */}
          <div className={styles.filters}>
            <select
              id="filter-state"
              className={styles.filterSelect}
              value={filters.order_state ?? ''}
              onChange={(e) => handleFilterChange('order_state', e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Todos los estados</option>
              <option value={QrOrderState.PENDING}>Pendiente</option>
              <option value={QrOrderState.PAID}>Pagado</option>
              <option value={QrOrderState.REPLACED}>Reemplazado</option>
              <option value={QrOrderState.EXPIRED}>Expirado</option>
              <option value={QrOrderState.CANCELLED}>Anulado</option>
            </select>

            <select
              id="filter-type"
              className={styles.filterSelect}
              value={filters.payment_type ?? ''}
              onChange={(e) => handleFilterChange('payment_type', e.target.value as PaymentType | '')}
            >
              <option value="">Todos los tipos</option>
              <option value={PaymentType.EXPENSE}>Expensas</option>
              <option value={PaymentType.RESERVATION}>Reservas</option>
              <option value={PaymentType.OUTLAY}>Egresos</option>
              <option value={PaymentType.OTHER}>Otras deudas</option>
            </select>

            <input
              id="filter-date-from"
              type="date"
              className={styles.filterSelect}
              value={filters.date_from ?? ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
            <input
              id="filter-date-to"
              type="date"
              className={styles.filterSelect}
              value={filters.date_to ?? ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Tipo</th>
                  <th>Unidad</th>
                  <th>Concepto</th>
                  <th>Fecha orden</th>
                  <th>Fecha pago</th>
                  <th>Vencimiento</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
	              <tbody>
	                {!ordersLoaded && orders.length === 0 && (
	                  <tr>
                    <td colSpan={10}>
                      <div className={styles.emptyState}><p>Cargando...</p></div>
                    </td>
                  </tr>
                )}
                {ordersLoaded && orders.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className={styles.emptyState}>
                        <p>{activeTab === 'incidents' ? 'No hay cobros pendientes de conciliación.' : 'No hay órdenes QR registradas.'}</p>
                        {activeTab === 'orders' && <p>Los QR dinámicos se generan desde la App Residente.</p>}
                      </div>
                    </td>
                  </tr>
                )}
	                {orders.map((order) => (
	                  <tr key={order.id} onClick={() => setSelectedOrder(order)}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.reference}</td>
                    <td>{order.payment_type ? PAYMENT_TYPE_LABEL[order.payment_type] : '—'}</td>
                    <td>{order.unit || '—'}</td>
                    <td className={styles.concept} title={order.concept ?? undefined}>
                      {order.concept || '—'}
                    </td>
                    <td>{formatQrDate(order.order_date)}</td>
                    <td>{formatQrDate(order.pay_date)}</td>
                    <td>{formatQrDate(order.expiration_date)}</td>
                    <td>{formatAmount(order.amount, order.currency)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <StateBadge state={order.order_state} />
                      {order.reconciliation_incident && !order.reconciliation_incident.resolved_at && (
                        <span className={styles.incidentBadge}>Requiere conciliación</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          id={`btn-view-${order.id}`}
                          className={`${styles.actionBtn} ${styles.btnView}`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          Ver
                        </button>
                      </div>
	                    </td>
	                  </tr>
	                ))}
	                {loadingMoreOrders
	                  ? Array.from({ length: QR_BATCH_SIZE }, (_, index) => (
	                      <tr
	                        key={`qr-order-skeleton-${pagination.current_page}-${index}`}
	                        className={styles.loadingRow}
	                      >
	                        <td colSpan={10}>
	                          <div className={styles.loadingRowInner}>
	                            <div className={styles.loadingLineLong} />
	                            <div className={styles.loadingLineShort} />
	                          </div>
	                        </td>
	                      </tr>
	                    ))
	                  : null}
	              </tbody>
	            </table>
	          </div>
              <div ref={ordersLoadSentinelRef} className={styles.loadMoreSentinel} />
	        </>
	      )}

      {/* ── Tab: Metrics (DES-28) ────────────────────────────────────────────── */}
      {activeTab === 'metrics' && <QrMetrics />}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {selectedOrder && (
        <RenderView
          order={selectedOrder}
          onVerify={selectedOrder.reconciliation_incident && !selectedOrder.reconciliation_incident.resolved_at
            && ![QrOrderState.CANCELLED, QrOrderState.REPLACED].includes(selectedOrder.order_state)
            ? () => handleVerify(selectedOrder) : undefined}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default QrDinamico;
