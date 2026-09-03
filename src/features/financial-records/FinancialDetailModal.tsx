"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { FinancialHistory } from "./FinancialHistory";
import { FinancialRecordActions } from "./FinancialRecordActions";
import { useFinancialWorkspace } from "./useFinancialWorkspace";
import styles from "./FinancialDetail.module.css";
import type {
  FinancialMenuAction,
  FinancialRecordReference,
  FinancialStatusTone,
  FinancialSummary,
  FinancialWorkspace,
} from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  record?: FinancialRecordReference;
  summary?: FinancialSummary;
  children: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  customActions?: FinancialMenuAction[];
  onRecordChanged?: () => void | Promise<void>;
  className?: string;
  workspaceOverride?: FinancialWorkspace;
  previewMode?: boolean;
};

type DetailTab = "detail" | "history";

const STATUS_CLASSES: Record<FinancialStatusTone, string> = {
  success: styles.statusSuccess,
  warning: styles.statusWarning,
  danger: styles.statusDanger,
  info: styles.statusInfo,
  neutral: styles.statusNeutral,
};

export const FinancialDetailModal = ({
  open,
  onClose,
  title,
  description,
  record,
  summary,
  children,
  footer,
  loading = false,
  customActions = [],
  onRecordChanged,
  className = "",
  workspaceOverride,
  previewMode = false,
}: Props) => {
  const [tab, setTab] = useState<DetailTab>("detail");
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const {
    workspace: remoteWorkspace,
    loading: remoteWorkspaceLoading,
    error: remoteWorkspaceError,
    refresh,
  } = useFinancialWorkspace(record, open && !workspaceOverride);
  const remoteWorkspaceMatchesRecord = Boolean(
    remoteWorkspace &&
      record &&
      remoteWorkspace.record.type === record.type &&
      String(remoteWorkspace.record.id) === String(record.id),
  );
  const workspace =
    workspaceOverride ||
    (remoteWorkspaceMatchesRecord ? remoteWorkspace : null);
  const workspaceLoading = workspaceOverride ? false : remoteWorkspaceLoading;
  const error = workspaceOverride ? "" : remoteWorkspaceError;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setTab("detail");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, record?.id, record?.type]);

  const handleRecordChanged = async () => {
    if (!workspaceOverride) await refresh();
    if (onRecordChanged) await onRecordChanged();
  };

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") onClose();
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={handleBackdrop}>
      <div
        ref={dialogRef}
        className={`${styles.modal} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headingGroup}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              ) : null}
            </div>

            <div className={styles.headerActions}>
              {record ? (
                <FinancialRecordActions
                  record={record}
                  capabilities={workspace?.capabilities}
                  customActions={customActions}
                  onChanged={handleRecordChanged}
                  previewMode={previewMode}
                />
              ) : null}
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Cerrar detalle"
                onClick={onClose}
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Vista del registro">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "detail"}
              className={`${styles.tab} ${tab === "detail" ? styles.tabActive : ""}`}
              onClick={() => setTab("detail")}
            >
              Detalle
            </button>
            {record ? (
              <button
                type="button"
                role="tab"
                aria-selected={tab === "history"}
                className={`${styles.tab} ${tab === "history" ? styles.tabActive : ""}`}
                onClick={() => setTab("history")}
              >
                Historial
                {workspace?.history?.length ? (
                  <span className={styles.historyCount}>{workspace.history.length}</span>
                ) : null}
              </button>
            ) : null}
          </div>
        </header>

        <main className={styles.scrollBody}>
          {tab === "detail" ? (
            <>
              {summary ? <SummaryRow summary={summary} /> : null}
              <div className={styles.detailContent}>
                {loading ? <DetailSkeleton /> : children}
              </div>
            </>
          ) : (
            <FinancialHistory
              events={workspace?.history || []}
              loading={workspaceLoading}
              error={error}
              notice={workspace?.history_notice}
            />
          )}
        </main>

        {footer && tab === "detail" ? (
          <footer className={styles.footer}>{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};

const SummaryRow = ({ summary }: { summary: FinancialSummary }) => {
  const tone = summary.status?.tone || "neutral";
  return (
    <section className={styles.summary} aria-label="Resumen del registro">
      <div className={styles.summaryAmountGroup}>
        {summary.eyebrow ? (
          <p className={styles.summaryEyebrow}>{summary.eyebrow}</p>
        ) : null}
        <strong className={styles.summaryAmount}>{summary.amount}</strong>
      </div>
      {summary.date ? <p className={styles.summaryDate}>{summary.date}</p> : null}
      {summary.status ? (
        <span className={`${styles.statusBadge} ${STATUS_CLASSES[tone]}`}>
          {summary.status.label}
        </span>
      ) : null}
    </section>
  );
};

const DetailSkeleton = () => (
  <div className={styles.skeletonGrid} aria-label="Cargando detalle">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className={styles.skeletonItem} />
    ))}
  </div>
);
