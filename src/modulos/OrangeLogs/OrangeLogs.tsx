'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/mk/contexts/AuthProvider';
import useAxios from '@/mk/hooks/useAxios';
import NotAccess from '@/components/auth/NotAccess/NotAccess';
import styles from './OrangeLogs.module.css';
import {
  ACTION_COLOR,
  DEBT_STATUS_LABEL,
  OrangeLogAction,
  OrangeLogFilters,
  OrangeLogMeta,
  OrangeLogRow,
} from './types';

/**
 * El log del webhook de Orange.
 *
 * Solo lectura: cada fila es un paso que una notificacion de Orange produjo
 * sobre una expensa — que unidad, que periodo, que monto la afecto y como quedo
 * la deuda despues. Es lo que administracion abre cuando un residente pregunta
 * por que su expensa figura de una manera.
 *
 * La integracion es exclusiva del condominio Urubo Village, y que filas se ven
 * lo decide la configuracion del servidor, no la sesion. Un usuario que no sea
 * administracion de ese condominio recibe 403 del API, y aca se muestra el
 * mensaje que el API devuelve en vez de una lista vacia: una lista vacia se
 * leeria como «Orange no mando nada», que es la conclusion opuesta.
 */

const POR_PAGINA = 50;

const FILTROS_VACIOS: OrangeLogFilters = { per_page: POR_PAGINA, page: 1 };

const fecha = (valor: string | null) => {
  if (!valor) return '—';
  return valor.replace('T', ' ').slice(0, 19);
};

const monto = (valor: number | null) => {
  if (valor === null || valor === undefined) return '—';
  return valor.toFixed(2);
};

const ActionBadge = ({ action, label }: { action: string; label: string }) => {
  const cfg = ACTION_COLOR[action] ?? { color: '#4A5568', bg: '#EDF2F7' };
  return (
    <span className={styles.badge} style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {label}
    </span>
  );
};

const OrangeLogs = () => {
  const { userCan, setStore, store } = useAuth();

  const [filtros, setFiltros] = useState<OrangeLogFilters>(FILTROS_VACIOS);
  const [lineas, setLineas] = useState<OrangeLogRow[]>([]);
  const [acciones, setAcciones] = useState<OrangeLogAction[]>([]);
  const [meta, setMeta] = useState<OrangeLogMeta>({
    total: 0,
    per_page: POR_PAGINA,
    current_page: 1,
    last_page: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [copiada, setCopiada] = useState<number | null>(null);

  const { execute: pedirLog, loaded } = useAxios();
  const { execute: pedirAcciones } = useAxios();

  const armarParams = useCallback((f: OrangeLogFilters) => {
    const params: Record<string, string> = {};
    if (f.desde) params.desde = f.desde;
    if (f.hasta) params.hasta = f.hasta;
    if (f.nro) params.nro = f.nro;
    if (f.transaction_id) params.transaction_id = f.transaction_id;
    if (f.action) params.action = f.action;
    if (f.reverted) params.reverted = f.reverted;
    params.per_page = String(f.per_page ?? POR_PAGINA);
    params.page = String(f.page ?? 1);
    return params;
  }, []);

  const cargar = useCallback(
    async (f: OrangeLogFilters) => {
      const respuesta = await pedirLog('/orange-webhook-logs', 'GET', armarParams(f));
      const cuerpo = respuesta?.data;

      if (cuerpo?.success) {
        setError(null);
        setLineas(cuerpo.data?.data ?? []);
        if (cuerpo.data?.meta) setMeta(cuerpo.data.meta);
        return;
      }

      // El API distingue «no estas autorizado» de «la integracion no esta
      // configurada» de «la fecha esta mal escrita». Mostrar el mensaje que
      // manda es la unica forma de que el admin sepa cual de las tres es.
      setLineas([]);
      setError(cuerpo?.message ?? 'No se pudo leer el log de Orange.');
    },
    [pedirLog, armarParams],
  );

  useEffect(() => {
    setStore({ ...store, title: 'Log de Orange' });
    void cargar(FILTROS_VACIOS);

    void (async () => {
      const respuesta = await pedirAcciones('/orange-webhook-logs/actions', 'GET', {});
      const catalogo = respuesta?.data?.data;
      // El catalogo de acciones es un adorno del filtro: si viene con otra
      // forma, la pantalla sigue mostrando el log. Reventar el listado entero
      // por el desplegable seria cambiar un filtro roto por una pantalla en
      // blanco.
      if (respuesta?.data?.success && Array.isArray(catalogo)) setAcciones(catalogo);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Cambiar un filtro siempre vuelve a la pagina 1: la 7 puede no existir. */
  const cambiarFiltro = (clave: keyof OrangeLogFilters, valor: string) => {
    const nuevos = { ...filtros, [clave]: valor, page: 1 };
    setFiltros(nuevos);
    void cargar(nuevos);
  };

  const irAPagina = (pagina: number) => {
    if (pagina < 1 || pagina > meta.last_page) return;
    const nuevos = { ...filtros, page: pagina };
    setFiltros(nuevos);
    setExpandida(null);
    void cargar(nuevos);
  };

  const limpiar = () => {
    setFiltros(FILTROS_VACIOS);
    void cargar(FILTROS_VACIOS);
  };

  const copiarPayload = async (linea: OrangeLogRow) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(linea.payload, null, 2));
      setCopiada(linea.id);
      setTimeout(() => setCopiada(null), 2000);
    } catch {
      // Sin portapapeles (contexto no seguro): el JSON sigue visible y
      // seleccionable, que es lo que importa.
    }
  };

  if (!userCan('payments', 'R')) return <NotAccess />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Log de Orange</h1>
        <p className={styles.headerSubtitle}>
          Cada notificación de Orange, paso por paso: qué unidad, qué expensa, qué monto la
          afectó y cómo quedó la deuda. Solo lectura.
        </p>
      </div>

      <div className={styles.filters}>
        <label className={styles.filterField}>
          <span>Desde</span>
          <input
            id="orange-log-desde"
            type="date"
            className={styles.filterInput}
            value={filtros.desde ?? ''}
            onChange={(e) => cambiarFiltro('desde', e.target.value)}
          />
        </label>

        <label className={styles.filterField}>
          <span>Hasta</span>
          <input
            id="orange-log-hasta"
            type="date"
            className={styles.filterInput}
            value={filtros.hasta ?? ''}
            onChange={(e) => cambiarFiltro('hasta', e.target.value)}
          />
        </label>

        <label className={styles.filterField}>
          <span>Unidad</span>
          <input
            id="orange-log-nro"
            type="text"
            placeholder="M4-112-Mz07"
            className={styles.filterInput}
            value={filtros.nro ?? ''}
            onChange={(e) => cambiarFiltro('nro', e.target.value)}
          />
        </label>

        <label className={styles.filterField}>
          <span>Transacción</span>
          <input
            id="orange-log-transaction"
            type="text"
            placeholder="16479"
            className={styles.filterInput}
            value={filtros.transaction_id ?? ''}
            onChange={(e) => cambiarFiltro('transaction_id', e.target.value)}
          />
        </label>

        <label className={styles.filterField}>
          <span>Acción</span>
          <select
            id="orange-log-action"
            className={styles.filterInput}
            value={filtros.action ?? ''}
            onChange={(e) => cambiarFiltro('action', e.target.value)}
          >
            <option value="">Todas</option>
            {acciones.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span>Revertidas</span>
          <select
            id="orange-log-reverted"
            className={styles.filterInput}
            value={filtros.reverted ?? ''}
            onChange={(e) => cambiarFiltro('reverted', e.target.value)}
          >
            <option value="">Todas</option>
            <option value="1">Solo revertidas</option>
            <option value="0">Solo aplicadas</option>
          </select>
        </label>

        <button id="orange-log-limpiar" className={styles.clearBtn} onClick={limpiar}>
          Limpiar
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Transacción</th>
              <th>Acción</th>
              <th>Unidad</th>
              <th>Período</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th>Cómo quedó la deuda</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {!loaded && lineas.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className={styles.emptyState}>
                    <p>Cargando...</p>
                  </div>
                </td>
              </tr>
            )}

            {loaded && !error && lineas.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className={styles.emptyState}>
                    <p>No hay notificaciones de Orange registradas.</p>
                    <p>Cada pago que Orange nos avise va a aparecer acá.</p>
                  </div>
                </td>
              </tr>
            )}

            {lineas.map((linea) => (
              <React.Fragment key={linea.id}>
                <tr className={linea.reverted ? styles.rowReverted : undefined}>
                  <td className={styles.mono}>{fecha(linea.received_at)}</td>
                  <td className={styles.mono}>
                    {linea.transaction_id}
                    {linea.event === 'anulacion' && (
                      <span className={styles.eventTag}>anulación</span>
                    )}
                  </td>
                  <td>
                    <ActionBadge action={linea.action} label={linea.action_label} />
                    {linea.reverted && <span className={styles.revertedTag}>revertida</span>}
                  </td>
                  <td>{linea.dpto_nro ?? '—'}</td>
                  <td className={styles.mono}>{linea.periodo ?? '—'}</td>
                  <td style={{ textAlign: 'right' }} className={styles.mono}>
                    {monto(linea.amount)}
                  </td>
                  <td>
                    {linea.debt_status_after
                      ? DEBT_STATUS_LABEL[linea.debt_status_after] ?? linea.debt_status_after
                      : '—'}
                    {linea.debt_remaining_after !== null && (
                      <span className={styles.remaining}>
                        saldo {monto(linea.debt_remaining_after)}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.detailCell}>
                      <span title={linea.detail ?? ''}>{linea.detail ?? '—'}</span>
                      {linea.payload && (
                        <button
                          id={`orange-log-payload-${linea.id}`}
                          className={styles.payloadBtn}
                          onClick={() => setExpandida(expandida === linea.id ? null : linea.id)}
                        >
                          {expandida === linea.id ? 'Ocultar JSON' : 'Ver JSON'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {expandida === linea.id && linea.payload && (
                  <tr className={styles.payloadRow}>
                    <td colSpan={8}>
                      <div className={styles.payloadHeader}>
                        <span>Lo que Orange mandó, tal cual llegó</span>
                        <button
                          id={`orange-log-copiar-${linea.id}`}
                          className={styles.payloadBtn}
                          onClick={() => void copiarPayload(linea)}
                        >
                          {copiada === linea.id ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <pre className={styles.payloadJson}>
                        {JSON.stringify(linea.payload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {meta.total > 0 && (
        <div className={styles.pagination}>
          <button
            id="orange-log-anterior"
            className={styles.pageBtn}
            disabled={meta.current_page <= 1}
            onClick={() => irAPagina(meta.current_page - 1)}
          >
            Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {meta.current_page} de {meta.last_page} · {meta.total} líneas
          </span>
          <button
            id="orange-log-siguiente"
            className={styles.pageBtn}
            disabled={meta.current_page >= meta.last_page}
            onClick={() => irAPagina(meta.current_page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default OrangeLogs;
