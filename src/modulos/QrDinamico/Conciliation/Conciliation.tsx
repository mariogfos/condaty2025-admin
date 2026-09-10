'use client';
import React, { useState, useEffect } from 'react';
import useAxios from '@/mk/hooks/useAxios';
import { ConciliationData } from '../types';
import { apiMessage } from '../shared';
import styles from './Conciliation.module.css';

const Conciliation = () => {
  const { execute, loaded } = useAxios();
  const [data, setData] = useState<ConciliationData | null>(null);
  const [selectedClients, setSelectedClients] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    // useAxios resolves with { data, error }: the backend body lives in
    // res.data, so `res.success` was always undefined and this screen never
    // rendered anything, not even its own errors.
    const res = await execute('qr-dynamic/conciliation/summary', 'GET');
    if (res?.data?.success) {
      setData(res.data.data);
      setErrorMsg(null);
      return;
    }
    setData(null);
    setErrorMsg(apiMessage(res) || 'No se pudo cargar la conciliación.');
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
      setErrorMsg('Selecciona al menos un condominio para conciliar sus órdenes.');
      return;
    }

    if (!confirm('¿Marcar como depositadas TODAS las órdenes pendientes de los condominios seleccionados?')) return;

    // "all" marks the whole pending set of that condominium, not only the page
    // the table is showing: the summary paginates and collecting ids from
    // data.items left every order past the first page unconciliated.
    let updated = 0;
    const failed: string[] = [];

    for (const clientId of clientsToConciliate) {
      const res = await execute('qr-dynamic/conciliation/mark-deposited', 'POST', {
        all: true,
        client_id: clientId,
      });
      if (res?.data?.success) {
        updated += Number(res.data.data?.updated ?? 0);
      } else {
        failed.push(apiMessage(res) || `Condominio ${clientId}: error al conciliar.`);
      }
    }

    setSelectedClients({});
    setErrorMsg(failed.length > 0 ? failed.join(' · ') : null);
    if (updated > 0) {
      await loadData();
    }
  };

  if (!loaded && !data) return <div className={styles.loading}>Cargando conciliación...</div>;

  return (
    <div className={styles.container}>
      {errorMsg && <div className={styles.error}>{errorMsg}</div>}

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
                  <span className={styles.clientId}>Condominio: {sum.client_id}</span>
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
