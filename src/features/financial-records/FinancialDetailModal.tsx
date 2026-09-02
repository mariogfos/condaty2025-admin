"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialHistory } from "./FinancialHistory";
import { FinancialRecordActions } from "./FinancialRecordActions";
import { useFinancialWorkspace } from "./useFinancialWorkspace";
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

const STATUS_CLASSES: Record<FinancialStatusTone, string> = {
  success: "border-primary/25 bg-primary/10 text-primary",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  info: "border-blue-400/25 bg-blue-400/10 text-blue-200",
  neutral: "border-border bg-muted text-muted-foreground",
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
  className,
  workspaceOverride,
  previewMode = false,
}: Props) => {
  const [tab, setTab] = useState("detail");
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

  useEffect(() => {
    if (open) setTab("detail");
  }, [open, record?.id, record?.type]);

  const handleRecordChanged = async () => {
    if (!workspaceOverride) await refresh();
    if (onRecordChanged) await onRecordChanged();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "financial-ui max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-[1040px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 shadow-2xl sm:max-w-[1040px]",
          className,
        )}
      >
        <DialogHeader className="border-b border-border py-4 pl-5 pr-28 text-left sm:pl-6 sm:pr-28">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="mt-1 max-w-2xl text-sm leading-5">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
            {record ? (
              <FinancialRecordActions
                record={record}
                capabilities={workspace?.capabilities}
                customActions={customActions}
                onChanged={handleRecordChanged}
                previewMode={previewMode}
              />
            ) : null}
          </div>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(String(value))}
          className="min-h-0 gap-0 overflow-hidden"
        >
          <div className="border-b border-border px-5 sm:px-6">
            <TabsList variant="line" className="h-11 gap-5 p-0">
              <TabsTrigger value="detail" className="px-0">
                Detalle
              </TabsTrigger>
              {record ? (
                <TabsTrigger value="history" className="px-0">
                  Historial
                  {workspace?.history?.length ? (
                    <Badge variant="secondary" className="ml-1 min-w-5 justify-center px-1.5">
                      {workspace.history.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              ) : null}
            </TabsList>
          </div>

          <TabsContent
            value="detail"
            className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
          >
            {summary ? <SummaryCard summary={summary} /> : null}
            <div className={cn("space-y-4", summary ? "mt-4" : "")}>
              {loading ? <DetailSkeleton /> : children}
            </div>
          </TabsContent>

          {record ? (
            <TabsContent
              value="history"
              className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
            >
              <FinancialHistory
                events={workspace?.history || []}
                loading={workspaceLoading}
                error={error}
                notice={workspace?.history_notice}
              />
            </TabsContent>
          ) : null}
        </Tabs>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card/55 px-5 py-3 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const SummaryCard = ({ summary }: { summary: FinancialSummary }) => {
  const tone = summary.status?.tone || "neutral";
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <div className="flex flex-wrap items-start justify-between gap-4 pl-1">
        <div>
          {summary.eyebrow ? (
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {summary.eyebrow}
            </p>
          ) : null}
          <div className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {summary.amount}
          </div>
          {summary.date ? (
            <div className="mt-1.5 text-sm text-muted-foreground">{summary.date}</div>
          ) : null}
        </div>
        {summary.status ? (
          <Badge
            variant="outline"
            className={cn("rounded-full px-3 py-1", STATUS_CLASSES[tone])}
          >
            {summary.status.label}
          </Badge>
        ) : null}
      </div>
    </section>
  );
};

const DetailSkeleton = () => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando detalle">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
    ))}
  </div>
);
