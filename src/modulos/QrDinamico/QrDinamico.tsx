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
import GenerateQrModal from './GenerateQrModal/GenerateQrModal';
import RenderView from './RenderView/RenderView';
import Conciliation from './Conciliation/Conciliation';

// ─── Tabs ────────────────────────────────────────────────────────────────────
type ActiveTab = 'orders' | 'conciliation';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatAmount = (amount: string, currency: string) => (
  <span className={styles.amount}>
    {parseFloat(amount).toFixed(2)}
    <span className={styles.currency}>{currency}</span>
  </span>
);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<QrOrder | null>(null);
  const ordersLoadSentinelRef = React.useRef<HTMLDivElement | null>(null);

  // ─── API calls ──────────────────────────────────────────────────────────────
  const { execute: fetchOrders, loaded: ordersLoaded } = useAxios();
  const { execute: cancelOrder } = useAxios();

  const buildQueryString = useCallback((f: QrOrderFilters) => {
    const params = new URLSearchParams();
    if (f.order_state !== undefined && f.order_state !== '') params.set('order_state', String(f.order_state));
    if (f.payment_type) params.set('payment_type', f.payment_type);
    if (f.date_from) params.set('date_from', f.date_from);
    if (f.date_to) params.set('date_to', f.date_to);
    params.set('per_page', String(f.per_page ?? QR_BATCH_SIZE));
    params.set('page', String(f.page ?? 1));
    return params.toString();
  }, []);

  const loadOrders = useCallback(async (
    f: QrOrderFilters = filters,
    options: { append?: boolean } = {},
  ) => {
    const append = Boolean(options.append && Number(f.page || 1) > 1);
    const qs = buildQueryString(f);
    if (append) {
      setLoadingMoreOrders(true);
    }
    const response = await fetchOrders(`qr-dynamic/orders?${qs}`, 'GET');
    const payload = response?.data;

    if (payload?.success) {
      setOrders((old) =>
        append ? mergeOrders(old, payload.data.items ?? []) : (payload.data.items ?? []),
      );
      setPagination({
        current_page: payload.data.pagination.current_page,
        last_page: payload.data.pagination.last_page,
        total: payload.data.pagination.total,
      });
    }
    setLoadingMoreOrders(false);
  }, [fetchOrders, buildQueryString, filters]);

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

  const handleCancel = async (order: QrOrder) => {
    if (!confirm(`¿Anular el QR ${order.reference}? Esta acción no se puede deshacer.`)) return;
    const res = await cancelOrder(`qr-dynamic/orders/${order.id}/cancel`, 'POST');
    if (res?.data?.success) {
      const freshFilters = { ...filters, page: 1, per_page: QR_BATCH_SIZE };
      setFilters(freshFilters);
      loadOrders(freshFilters);
    }
  };

  const handleGenerateSuccess = () => {
    setShowGenerate(false);
    const freshFilters = { ...filters, page: 1, per_page: QR_BATCH_SIZE };
    setFilters(freshFilters);
    loadOrders(freshFilters);
  };

  useEffect(() => {
    if (activeTab !== 'orders') return;
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
        <div className={styles.headerActions}>
          {activeTab === 'orders' && (
            <button
              id="btn-generate-qr"
              className={styles.generateBtn}
              onClick={() => setShowGenerate(true)}
            >
              + Generar QR
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          id="tab-orders"
          className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Órdenes QR
        </button>
        <button
          id="tab-conciliation"
          className={`${styles.tab} ${activeTab === 'conciliation' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('conciliation')}
        >
          Conciliación
        </button>
      </div>

      {/* ── Tab: Orders ──────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <>
          {/* Filters */}
          <div className={styles.filters}>
            <select
              id="filter-state"
              className={styles.filterSelect}
              value={filters.order_state ?? ''}
              onChange={(e) => handleFilterChange('order_state', e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Todos los estados</option>
              <option value={QrOrderState.REGISTERED}>Registrado</option>
              <option value={QrOrderState.PAID}>Pagado</option>
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
                    <td colSpan={8}>
                      <div className={styles.emptyState}><p>Cargando...</p></div>
                    </td>
                  </tr>
                )}
                {ordersLoaded && orders.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className={styles.emptyState}>
                        <p>No hay órdenes QR registradas.</p>
                        <p>Usa el botón <strong>Generar QR</strong> para crear una nueva.</p>
                      </div>
                    </td>
                  </tr>
                )}
	                {orders.map((order) => (
	                  <tr key={order.id} onClick={() => setSelectedOrder(order)}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.reference}</td>
                    <td>{order.payment_type ? PAYMENT_TYPE_LABEL[order.payment_type] : '—'}</td>
                    <td>{formatDate(order.order_date)}</td>
                    <td>{formatDate(order.pay_date)}</td>
                    <td>{formatDate(order.expiration_date)}</td>
                    <td>{formatAmount(order.amount, order.currency)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <StateBadge state={order.order_state} />
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
                        {order.order_state === QrOrderState.REGISTERED && (
                          <button
                            id={`btn-cancel-${order.id}`}
                            className={`${styles.actionBtn} ${styles.btnCancel}`}
                            onClick={() => handleCancel(order)}
                          >
                            Anular
                          </button>
                        )}
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
	                        <td colSpan={8}>
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

      {/* ── Tab: Conciliation ────────────────────────────────────────────────── */}
      {activeTab === 'conciliation' && <Conciliation />}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {showGenerate && (
        <GenerateQrModal
          open={showGenerate}
          onClose={() => setShowGenerate(false)}
          onSuccess={handleGenerateSuccess}
        />
      )}

      {selectedOrder && (
        <RenderView
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={() => {
            setSelectedOrder(null);
            loadOrders();
          }}
        />
      )}
    </div>
  );
};

export default QrDinamico;
