"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import EmptyData from "@/components/NoData/EmptyData";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import Table from "@/mk/components/ui/Table/Table";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import { FinancialDetailGrid, FinancialDetailSection } from "@/features/financial-records/FinancialDetailPrimitives";
import { FinancialHistory } from "@/features/financial-records/FinancialHistory";
import type { FinancialAuditEvent } from "@/features/financial-records/types";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import useSubmissionGuard from "@/mk/hooks/useSubmissionGuard";
import crud from "@/mk/hooks/useCrud/useCrudStyle.module.css";
import { getRequestErrorMessage } from "@/mk/utils/axiosError";
import { formatBs } from "@/mk/utils/numbers";
import RenderForm from "@/modulos/Payments/RenderForm/RenderForm";
import PaymentDetail from "@/modulos/Payments/RenderView/RenderView";
import { getStatusText } from "@/modulos/DebtsManager/TabComponents/constants";
import { advanceApi, advanceStatus, distributionNames, type AdvanceGroup, type AdvanceRow } from "@/features/advance-payments/types";
import styles from "./AdvancePayments.module.css";

type Page = { data: AdvanceGroup[]; current_page: number; last_page: number; total: number };
export default function AdvancePayments() {
  const { user, userCan } = useAuth();
  return userCan("payments", "R") ? <AdvanceList key={user?.client_id} /> : <NotAccess />;
}

function AdvanceList() {
  const { userCan, showToast } = useAuth();
  const { execute } = useAxios();
  const run = useRef(execute); run.current = execute;
  const [filters, setFilters] = useState({ search: "", status: "all", from: "", to: "", page: 1 });
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [extra, setExtra] = useState<any>(null);
  const [opening, setOpening] = useState(false);
  const refresh = () => setRevision(value => value + 1);
  useEffect(() => {
    let active = true; setPage(null); setError("");
    void run.current(advanceApi, "GET", { search: filters.search, page: filters.page,
      ...(filters.status !== "all" ? { status: filters.status } : {}),
      ...(filters.from ? { from: filters.from } : {}), ...(filters.to ? { to: filters.to } : {}),
    }, false, true).then((response: any) => {
      if (!active) return;
      if (response.data?.success) setPage(response.data.data);
      else setError(response.data?.message || getRequestErrorMessage(response.error));
    }).catch(() => { if (active) setError("No se pudieron cargar las operaciones."); });
    return () => { active = false; };
  }, [filters, revision]);
  const openForm = async () => {
    if (opening) return; setOpening(true);
    try {
      const response = await execute("/payments", "GET", { fullType: "EXTRA", perPage: -1, page: 1 }, false, true);
      if (response.data?.success) setExtra(response.data.data);
      else showToast(response.data?.message || "No se pudo abrir el formulario.", "error");
    } catch { showToast("No se pudo abrir el formulario.", "error"); }
    finally { setOpening(false); }
  };
  const header = [
    { key: "unit_label", label: "Unidad", responsive: "Unidad", width: "120px" },
    { key: "periods", label: "Períodos / deudas", responsive: "Períodos", width: "100%", onRender: ({ item }: { item: AdvanceGroup }) =>
      <span>{item.period_from} — {item.period_to}<small className={styles.note}>{item.debt_count} deudas</small></span> },
    { key: "discount_amount", label: "Descuento", responsive: "Descuento", width: "135px", onRender: ({ item }: { item: AdvanceGroup }) => formatBs(Number(item.discount_amount)) },
    { key: "paid_amount", label: "Dinero recibido", responsive: "Dinero recibido", width: "145px", onRender: ({ item }: { item: AdvanceGroup }) => formatBs(Number(item.paid_amount)) },
    { key: "status", label: "Estado", responsive: "Estado", width: "170px", onRender: ({ item }: { item: AdvanceGroup }) => advanceStatus(item) },
    { key: "actor_label", label: "Registrado por", responsive: "Registrado por", width: "160px" },
    { key: "created_at", label: "Fecha", responsive: "Fecha", width: "130px", onRender: ({ item }: { item: AdvanceGroup }) => new Date(item.created_at).toLocaleDateString("es-BO", { timeZone: "America/La_Paz" }) },
    { key: "actions", label: "Acciones", responsive: "Acciones", width: "125px", onRender: ({ item }: { item: AdvanceGroup }) =>
      <Button small variant="secondary" onClick={() => setSelected(item.id)}>Ver detalle</Button> },
  ];
  return <section className={`${crud.useCrud} ${crud.mobileContentFlow}`}>
    <header className={crud.titleRow}><h1 className={crud.titleText}>Pagos anticipados</h1></header>
    <div className={crud.toolbarRow}>
      <div className={crud.toolbarSearch}><DataSearch name="advance-search" placeholder="Buscar unidad" value={filters.search}
        setSearch={(search: string) => setFilters(old => ({ ...old, search, page: 1 }))} /></div>
      <div className={crud.toolbarControls}><div className={crud.toolbarFilters}>
        <Select name="advance-status" label="Estado" value={filters.status} options={[{ id: "all", name: "Todos los estados" }, { id: "applied", name: "Aplicadas" }, { id: "cancelled", name: "Anuladas" }]}
          onChange={event => setFilters(old => ({ ...old, status: event.target.value, page: 1 }))} />
        <Input type="month" name="advance-from" label="Desde el período" value={filters.from} onChange={event => setFilters(old => ({ ...old, from: event.target.value, page: 1 }))} />
        <Input type="month" name="advance-to" label="Hasta el período" value={filters.to} onChange={event => setFilters(old => ({ ...old, to: event.target.value, page: 1 }))} />
      </div>{userCan("payments", "C") && <div className={crud.toolbarActions}><Button disabled={opening} onClick={openForm}><Plus size={17} /> Registrar pago anticipado</Button></div>}</div>
    </div>
    <div className={crud.contentRow}><div className={crud.contentMain}>
      {error ? <div><p role="alert">{error}</p><Button variant="secondary" onClick={refresh}>Reintentar</Button></div> : !page ? <p role="status">Cargando operaciones…</p> : page.data.length
        ? <Table id="advance-payments" className="striped" height="100%" header={header} data={page.data} />
        : <EmptyData icon={<CalendarClock size={56} />} message="No se encontraron pagos anticipados ni operaciones de descuento." />}
    </div></div>
    {page && page.last_page > 1 && <Pagination currentPage={page.current_page} totalPages={page.last_page} total={page.total}
      params={filters} setParams={setFilters} onPageChange={value => setFilters(old => ({ ...old, page: value }))} />}
    {selected && <AdvanceDetail id={selected} onClose={() => setSelected(null)} onChanged={refresh} />}
    {extra && <RenderForm open item={{ type: "E" }} extraData={extra} execute={(...args: any[]) => execute(...args)} showToast={(message, type) => showToast(message, type)}
      onClose={() => setExtra(null)} reLoad={refresh} />}
  </section>;
}

function AdvanceDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { userCan, showToast } = useAuth();
  const { data, error, reLoad, execute } = useAxios(advanceApi + "/" + id, "GET", {}, true);
  const detail = data?.data as { operation: AdvanceGroup; items: AdvanceRow[]; history: FinancialAuditEvent[] } | undefined;
  const [tab, setTab] = useState("detail");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [revert, setRevert] = useState("no");
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { begin, finish, submitting } = useSubmissionGuard();
  const cancel = async () => {
    if (reason.trim().length < 3 || !begin()) return;
    try {
      const response = await execute(advanceApi + "/" + id + "/cancel", "POST", { reason: reason.trim(), revert_discounts: revert === "yes" });
      if (!response.data?.success) { setFailure(response.data?.message || getRequestErrorMessage(response.error)); return; }
      setCancelOpen(false); showToast("Operación anulada.", "success"); reLoad(null, true); onChanged();
    } catch { setFailure("No se pudo confirmar la anulación. Actualiza el detalle antes de reintentar."); }
    finally { finish(); }
  };
  const group = detail?.operation;
  const cols = [
    { key: "title", label: "Concepto", responsive: "Concepto", width: "100%" },
    { key: "debt_id", label: "ID deuda", responsive: "ID deuda", width: "100px" },
    { key: "gross", label: "Capital original", responsive: "Capital original", width: "140px", onRender: ({ item }: { item: AdvanceRow }) => formatBs(item.gross / 100) },
    { key: "discount", label: "Descuento aplicado", responsive: "Descuento aplicado", width: "160px", onRender: ({ item }: { item: AdvanceRow }) =>
      <span>{formatBs((item.discount ?? 0) / 100)}<small className={styles.note}>{item.discount_percent}%</small></span> },
    { key: "net", label: "Importe del ingreso", responsive: "Importe del ingreso", width: "145px", onRender: ({ item }: { item: AdvanceRow }) => item.net === 0 ? "Saldada por descuento" : formatBs((item.net ?? 0) / 100) },
    { key: "current_discount", label: "Descuento actual", responsive: "Descuento actual", width: "140px", onRender: ({ item }: { item: AdvanceRow }) => formatBs(Number(item.current_discount ?? 0)) },
    { key: "current_status", label: "Estado actual", responsive: "Estado actual", width: "130px", onRender: ({ item }: { item: AdvanceRow }) => getStatusText(item.current_status ?? "") },
  ];
  return <>
    <DetailModal open title="Detalle del pago anticipado" subtitle={group ? `Unidad ${group.unit_label} · ${advanceStatus(group)}` : ""} onClose={onClose} maxWidth={1050}
      buttonExtra={group && group.status !== "cancelled" && userCan("payments", "D") ? <Button variant="secondary" onClick={() => setCancelOpen(true)}>Anular operación</Button> : undefined}>
      {!detail ? <p role={error ? "alert" : "status"}>{error ? "No se pudo cargar la operación." : "Cargando detalle…"}</p> : <div className={styles.detail}>
        <TabsButtons sel={tab} setSel={setTab} tabs={[{ value: "detail", text: "Detalle" }, { value: "history", text: "Historial" }]} />
        {tab === "history" ? <FinancialHistory events={detail.history} /> : <>
          <FinancialDetailSection title="Importes y estado"><FinancialDetailGrid fields={[
            { id: "original", label: "Total original", value: formatBs(Number(detail.operation.original_amount)) },
            { id: "discount", label: "Descuento total", value: formatBs(Number(detail.operation.discount_amount)) },
            { id: "paid", label: "Dinero registrado", value: formatBs(Number(detail.operation.paid_amount)) },
            { id: "current-paid", label: "Monto actual del ingreso", value: formatBs(Number(detail.operation.payment?.amount ?? 0)) },
            { id: "mode", label: "Distribución", value: distributionNames[detail.operation.distribution.mode] },
            { id: "actor", label: "Registrado por", value: detail.operation.actor_label },
            { id: "reason", label: "Motivo", value: detail.operation.reason },
          ]} /></FinancialDetailSection>
          <FinancialDetailSection title="Deudas afectadas"><p className={styles.note}>El desglose conserva los importes de la operación. El descuento actual refleja las modificaciones posteriores.</p>
            <div className={styles.table}><Table id="advance-payment-debts" header={cols} data={detail.items} height="100%" /></div>
          </FinancialDetailSection>
          {group?.payment_id && <Button variant="secondary" onClick={() => setPaymentOpen(true)}>Ver ingreso {group.payment?.code ?? ""}</Button>}
        </>}
      </div>}
    </DetailModal>
    {group?.payment_id && paymentOpen && <PaymentDetail open payment_id={group.payment_id} onClose={() => setPaymentOpen(false)}
      reLoad={() => { reLoad(null, true); onChanged(); }} />}
    {cancelOpen && <DataModal open title="Anular operación" onClose={() => { if (!submitting) setCancelOpen(false); }} onSave={cancel}
      buttonText={submitting ? "Anulando…" : "Anular operación"} buttonCancel="Volver" disabled={submitting || reason.trim().length < 3} maxWidth={560}>
      <div className={styles.detail}>
        <p>Se anulará el ingreso vinculado. Las expensas emitidas conservarán su historial.</p>
        <Select name="advance-revert" label="Descuentos de esta operación" value={revert} disabled={submitting}
          options={[{ id: "no", name: "Conservar descuentos" }, { id: "yes", name: "Revertir descuentos de esta operación" }]}
          onChange={event => setRevert(event.target.value)} />
        <TextArea name="advance-cancel-reason" label="Motivo de anulación" value={reason} disabled={submitting} required maxLength={500}
          onChange={event => setReason(event.target.value)} />
        {failure && <p role="alert">{failure}</p>}
      </div>
    </DataModal>}
  </>;
}
