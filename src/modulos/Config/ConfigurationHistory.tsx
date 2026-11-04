"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Clock3, LockKeyhole, Pencil, Plus, Trash2 } from "lucide-react";
import useAxios from "@/mk/hooks/useAxios";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import Button from "@/mk/components/forms/Button/Button";
import { changesFor, historyDate, historyDay, historyTime, type AuditEntry } from "./configurationHistoryPresentation";
import styles from "./Config.module.css";

type HistoryPage = { items: AuditEntry[]; current_page: number; last_page: number };
const events = {
  created: { Icon: Plus, label: "creó", tone: styles.historySuccess },
  deleted: { Icon: Trash2, label: "eliminó", tone: styles.historyDanger },
  updated: { Icon: Pencil, label: "actualizó", tone: styles.historyInfo },
};

const ConfigurationHistory = () => {
  const { data, loaded, execute, error } = useAxios("/client-config-history", "GET", { per_page: 30 });
  const [older, setOlder] = useState<AuditEntry[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const firstNewItem = useRef<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const moreButton = useRef<HTMLDivElement>(null);
  const result = data?.data as HistoryPage | undefined;
  const page = nextPage ?? result?.current_page ?? 1;
  const lastPage = result?.last_page ?? 1;
  const groups = useMemo(() => {
    const grouped = new Map<string, { entry: AuditEntry; changes: ReturnType<typeof changesFor> }[]>();
    const seen = new Set<number>();
    for (const entry of [...(result?.items || []), ...older]) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      const changes = changesFor(entry);
      if (!changes.length) continue;
      const day = historyDay(entry.created_at);
      const group = grouped.get(day) || [];
      group.push({ entry, changes });
      grouped.set(day, group);
    }
    return grouped;
  }, [result?.items, older]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (firstNewItem.current === null) return;
    root.current?.querySelector<HTMLElement>(`[data-activity-id="${firstNewItem.current}"]`)?.focus({ preventScroll: true });
    firstNewItem.current = null;
  }, [older]);

  const loadMore = async () => {
    if (inFlight.current || page >= lastPage) return;
    inFlight.current = true;
    setLoadingMore(true);
    setMoreError(false);
    const restoreFocus = moreButton.current?.contains(document.activeElement);
    try {
      const response = await execute("/client-config-history", "GET", { per_page: 30, page: page + 1 }, false, true);
      if (!mounted.current) return;
      if (!response?.data?.success) throw new Error("history_unavailable");
      const fetched = response.data.data as HistoryPage;
      const firstVisible = fetched.items.find(entry => changesFor(entry).length > 0);
      if (restoreFocus && firstVisible) firstNewItem.current = firstVisible.id;
      setOlder(current => [...current, ...fetched.items]);
      setNextPage(fetched.current_page);
      setAnnouncement("Se cargaron más cambios del historial.");
    } catch {
      if (mounted.current) setMoreError(true);
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoadingMore(false);
    }
  };

  return (
    <section className={styles.historyPanel} aria-label="Historial de configuración" ref={root}>
      {!loaded && !result ? (
        <div className={styles.historyLoading} role="status">Cargando historial…</div>
      ) : (error || data?.success === false) && !result ? (
        <div className={styles.historyEmpty} role="alert">No se pudo cargar el historial.</div>
      ) : (
        <>
          {groups.size === 0 ? (
            <div className={styles.historyEmpty}>
              <Clock3 size={24} aria-hidden="true" />
              <strong>Todavía no hay cambios</strong>
              <p>Los cambios de configuración quedarán registrados aquí.</p>
            </div>
          ) : Array.from(groups, ([day, entries]) => (
            <section className={styles.historyDay} key={day}>
              <h2 className={styles.historyDayLabel}>{day}</h2>
              <ol className={styles.historyTimeline} aria-label={`Cambios del ${day}`}>
                {entries.map(({ entry, changes }) => {
                  const event = events[entry.event as keyof typeof events] || events.updated;
                  const { Icon } = event;
                  const actor = entry.actor_name || "Sin autor registrado";
                  return (
                    <li className={styles.historyEntry} key={entry.id} data-activity-id={entry.id} tabIndex={-1}>
                      <span className={`${styles.historyMarker} ${event.tone}`}><Icon size={14} strokeWidth={1.8} aria-hidden="true" /></span>
                      <div className={styles.historyContent}>
                        <div className={styles.historySummary}>
                          <p>
                            <Avatar name={actor} w={20} h={20} className={styles.historyAvatar} styleText={{ color: "var(--cPrimary)", background: "color-mix(in srgb, var(--cPrimary) 8%, var(--cModalSection))" }} />
                            <strong>{actor}</strong>{" "}{event.label}{" "}
                            <strong>{entry.subject_label || "la configuración del condominio"}</strong>.
                            <time dateTime={historyDate(entry.created_at)?.toISOString()} title={`${day}, ${historyTime(entry.created_at)}`}>{historyTime(entry.created_at)}</time>
                          </p>
                        </div>
                        <dl className={styles.historyChanges}>
                          {changes.map(change => (
                            <div className={styles.historyChange} key={change.field}>
                              <dt>{change.label}</dt>
                              <dd>
                                {change.protected ? (
                                  <span className={styles.historyProtected}><LockKeyhole size={13} aria-hidden="true" />Valor protegido actualizado</span>
                                ) : (
                                  <>
                                    <span className={styles.historyBefore}><span className={styles.historySrOnly}>Antes: </span>{change.before}</span>
                                    <ArrowRight size={14} aria-hidden="true" />
                                    <span className={styles.historyAfter}><span className={styles.historySrOnly}>Ahora: </span>{change.after}</span>
                                  </>
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          {page < lastPage && (
            <div className={styles.historyMore} ref={moreButton}>
              {moreError && <p role="alert">No pudimos cargar más actividad. Inténtalo de nuevo.</p>}
              <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                <ChevronDown size={16} aria-hidden="true" />{loadingMore ? "Cargando…" : moreError ? "Reintentar" : "Ver más"}
              </Button>
            </div>
          )}
        </>
      )}
      <span className={styles.historySrOnly} role="status" aria-live="polite">{announcement}</span>
    </section>
  );
};

export default ConfigurationHistory;
