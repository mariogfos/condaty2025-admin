'use client';
import React, { useState, useEffect } from 'react';
import useAxios from '@/mk/hooks/useAxios';
import { ConciliationData, QrOrder } from '../types';
import styles from './Conciliation.module.css';

const Conciliation = () => {
  const { execute, loaded } = useAxios();
  const [data, setData] = useState<ConciliationData | null>(null);
  const [selectedClients, setSelectedClients] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    const res = await execute('qr-dynamic/conciliation/summary', 'GET');
    if (res?.success) {
      setData(res.data);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  const handleMarkDeposited = async () => {
    const clientsToConciliate = Object.keys(selectedClients).filter(k => selectedClients[k]);
    if (clientsToConciliate.length === 0) {
      alert('Selecciona al menos un cliente para conciliar sus órdenes.');
      return;
    }

    if (!confirm('¿Marcar las órdenes de los clientes seleccionados como depositadas/conciliadas?')) return;

    // Collect all order IDs for selected clients
    const orderIdsToConciliate: string[] = [];
    if (data?.items) {
      data.items.forEach(order => {
        if (order.client_id && selectedClients[order.client_id]) {
          orderIdsToConciliate.push(order.id);
        }
      });
    }

    if (orderIdsToConciliate.length === 0) {
      alert('No se encontraron órdenes para los clientes seleccionados.');
      return;
    }

    const res = await execute('qr-dynamic/conciliation/mark-deposited', 'POST', {
      order_ids: orderIdsToConciliate
    });

    if (res?.success) {
      setSelectedClients({});
      loadData();
    } else {
      alert(res?.message || 'Error al conciliar');
    }
  };

  if (!loaded && !data) return <div className={styles.loading}>Cargando conciliación...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.summarySection}>
        <h3 className={styles.sectionTitle}>Resumen de Conciliación Pendiente</h3>
        <p className={styles.sectionDesc}>
          Agrupa todos los cobros por cliente que ya fueron pagados pero aún no han sido transferidos (depositados).
        </p>
        
        {data?.summary && data.summary.length > 0 ? (
          <div className={styles.grid}>
            {data.summary.map(sum => (
              <div 
                key={`${sum.client_id}-${sum.currency}`} 
                className={`${styles.card} ${selectedClients[sum.client_id] ? styles.cardSelected : ''}`}
                onClick={() => handleSelectClient(sum.client_id)}
              >
                <div className={styles.cardHeader}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedClients[sum.client_id]}
                    onChange={() => handleSelectClient(sum.client_id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={styles.clientId}>Cliente ID: {sum.client_id}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Total a depositar</span>
                    <span className={styles.statValue}>
                      {parseFloat(sum.total).toFixed(2)} {sum.currency}
                    </span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Cant. órdenes</span>
                    <span className={styles.statValue}>{sum.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>No hay conciliaciones pendientes.</div>
        )}

        {data?.summary && data.summary.length > 0 && (
          <div className={styles.actions}>
            <button 
              className={styles.btnConciliate}
              onClick={handleMarkDeposited}
              disabled={!loaded || Object.values(selectedClients).filter(Boolean).length === 0}
            >
              Marcar Depositado ({Object.values(selectedClients).filter(Boolean).length} seleccionados)
            </button>
          </div>
        )}
      </div>

      <div className={styles.detailsSection}>
        <h3 className={styles.sectionTitle}>Desglose de Órdenes Pendientes</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente ID</th>
                <th>Referencia</th>
                <th>Fecha Pago</th>
                <th style={{textAlign: 'right'}}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {data?.items && data.items.length > 0 ? (
                data.items.map(order => (
                  <tr key={order.id}>
                    <td>{order.client_id}</td>
                    <td style={{fontFamily: 'monospace'}}>{order.reference}</td>
                    <td>{order.pay_date ? new Date(order.pay_date).toLocaleDateString('es-BO') : '—'}</td>
                    <td style={{textAlign: 'right'}}>{parseFloat(order.amount).toFixed(2)} {order.currency}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.empty}>Sin órdenes pendientes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Conciliation;
