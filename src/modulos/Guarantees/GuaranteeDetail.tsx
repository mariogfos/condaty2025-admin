"use client";

import { useRef, useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import Table from "@/mk/components/ui/Table/Table";
import useAxios from "@/mk/hooks/useAxios";
import { formatCents, guaranteePath, type Guarantee, type Movement, type MovementPage } from "./guaranteeData";
import styles from "./Guarantees.module.css";

const movementLabels = { deposit: "Depósito registrado", refund: "Devolución", payment: "Abono por pago" };
const movementDate = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/La_Paz",
});
const columns = [
  { key: "kind", label: "Movimiento", responsive: "Movimiento", width: "155px",
    onRender: ({ item }: { item: Movement }) => movementLabels[item.kind] },
  { key: "reference", label: "Referencia", responsive: "Referencia", width: "100%" },
  { key: "registered_by", label: "Responsable", responsive: "Responsable", width: "160px",
    onRender: ({ item }: { item: Movement }) => item.registered_by || (item.kind === "payment" ? "Sistema" : "Admin") },
  { key: "created_at", label: "Fecha", responsive: "Fecha", width: "150px",
    onRender: ({ item }: { item: Movement }) => item.created_at ? movementDate.format(new Date(item.created_at)) : "—" },
  { key: "amount_cents", label: "Importe", responsive: "Importe", width: "125px",
    onRender: ({ item }: { item: Movement }) => formatCents(item.kind === "refund" ? -item.amount_cents : item.amount_cents) },
];

export default function GuaranteeDetail({ row, onClose, onRefund }: {
  row: Guarantee; onClose: () => void; onRefund?: () => void;
}) {
  const url = guaranteePath + "/units/" + row.unit_id + "/movements";
  const { data, error, execute, reLoad } = useAxios(url, "GET", { account_id: row.id }, true);
  const initial = data?.data as MovementPage | undefined;
  const [additional, setAdditional] = useState<MovementPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const request = useRef(false);
  const nextId = (additional ?? initial)?.next_before_id;
  const movements = [...(initial?.items ?? []), ...(additional?.items ?? [])];

  const loadMore = async () => {
    if (!nextId || request.current) return;
    request.current = true;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const response = await execute(url, "GET", { account_id: row.id, before_id: nextId }, false, true);
      if (!response.data?.success) throw new Error("history");
      const page: MovementPage = response.data.data;
      setAdditional(previous => ({ ...page, items: [...(previous?.items ?? []), ...page.items] }));
    } catch {
      setMoreError(true);
    } finally {
      request.current = false;
      setLoadingMore(false);
    }
  };

  return (
    <DetailModal open title={`Garantía · ${row.unit}`} subtitle={`${row.owner} · ${row.bank}`} maxWidth={920}
      onClose={onClose} buttonText={onRefund ? "Registrar devolución" : ""} onSave={onRefund}>
      <div className={styles.detail}>
        <dl className={styles.balances}>
          <div><dt>En custodia</dt><dd>{formatCents(row.balance_cents)}</dd></div>
          <div><dt>Comprometido</dt><dd>{formatCents(row.committed_cents)}</dd></div>
          <div><dt>Disponible</dt><dd>{formatCents(row.available_cents)}</dd></div>
        </dl>
        <h3>Historial de movimientos</h3>
        {!initial && (error ? <div className={styles.feedback}>
          <p role="alert">No se pudo cargar el historial.</p>
          <Button variant="secondary" onClick={() => reLoad(null, true)}>Reintentar</Button>
        </div> : <p role="status">Cargando movimientos…</p>)}
        {initial && (movements.length ? <div className={styles.historyTable}>
          <Table id="reservation-guarantee-movements" className="striped" data={movements} header={columns} height="100%" />
        </div> : <p>Esta garantía aún no tiene movimientos.</p>)}
        {moreError && <p role="alert">No se pudo cargar la siguiente página.</p>}
        {nextId && <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? "Cargando…" : moreError ? "Reintentar" : "Cargar más movimientos"}
        </Button>}
      </div>
    </DetailModal>
  );
}
