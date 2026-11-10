"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import EmptyData from "@/components/NoData/EmptyData";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import Button from "@/mk/components/forms/Button/Button";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import Table from "@/mk/components/ui/Table/Table";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import crud from "@/mk/hooks/useCrud/useCrudStyle.module.css";
import { getRequestErrorMessage } from "@/mk/utils/axiosError";
import GuaranteeDetail from "./GuaranteeDetail";
import GuaranteeMovementForm from "./GuaranteeMovementForm";
import { formatCents, guaranteePath, type Guarantee } from "./guaranteeData";
import styles from "./Guarantees.module.css";

type Page = { data: Guarantee[]; current_page: number; last_page: number; total: number };
type Dialog = { kind: "deposit" } | { kind: "detail" | "refund"; row: Guarantee };

export default function Guarantees() {
  const { user, userCan } = useAuth();
  if (!userCan("settings", "R")) return <NotAccess />;

  return <GuaranteeList key={user?.client_id} canWrite={Boolean(user?.fosrole_id && userCan("settings", "U"))} />;
}

function GuaranteeList({ canWrite }: { canWrite: boolean }) {
  const { execute } = useAxios();
  const executeRef = useRef(execute);
  const [filters, setFilters] = useState({ search: "", page: 1 });
  const [result, setResult] = useState<Page | null>(null);
  const [failure, setFailure] = useState("");
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    let active = true;
    setResult(null);
    setFailure("");
    const load = async () => {
      try {
        const response = await executeRef.current(guaranteePath + "/accounts", "GET", filters, false, true);
        if (!active) return;
        if (response.data?.success) setResult(response.data.data);
        else setFailure(getRequestErrorMessage(response.error, "No se pudieron cargar las garantías."));
      } catch {
        if (active) setFailure("No se pudieron cargar las garantías.");
      }
    };
    void load();
    return () => { active = false; };
  }, [filters, revision]);

  const header = [
    { key: "unit", label: "Unidad", responsive: "Unidad", width: "125px" },
    { key: "owner", label: "Titular", responsive: "Titular", width: "100%" },
    { key: "bank", label: "Cuenta de custodia", responsive: "Cuenta de custodia", width: "185px" },
    { key: "balance_cents", label: "En custodia", responsive: "En custodia", width: "145px",
      onRender: ({ item }: { item: Guarantee }) => formatCents(item.balance_cents) },
    { key: "committed_cents", label: "Comprometido", responsive: "Comprometido", width: "145px",
      onRender: ({ item }: { item: Guarantee }) => formatCents(item.committed_cents) },
    { key: "available_cents", label: "Disponible", responsive: "Disponible", width: "145px",
      onRender: ({ item }: { item: Guarantee }) => formatCents(item.available_cents) },
    { key: "actions", label: "Acciones", responsive: "Acciones", width: "140px",
      onRender: ({ item }: { item: Guarantee }) => (
        <Button small variant="secondary" onClick={() => setDialog({ kind: "detail", row: item })}>Ver detalle</Button>
      ) },
  ];

  return (
    <section className={crud.useCrud}>
      <header className={crud.titleRow}><h1 className={crud.titleText}>Garantías</h1></header>
      <div className={`${crud.toolbarRow} ${styles.toolbar}`}>
        <div className={crud.toolbarSearch}>
          <DataSearch name="guarantee-search" placeholder="Buscar unidad o titular" value={filters.search}
            setSearch={(search: string) => setFilters({ search, page: 1 })} />
        </div>
        {canWrite && <div className={crud.toolbarActions}>
          <Button onClick={() => setDialog({ kind: "deposit" })}><Plus size={17} /> Registrar depósito</Button>
        </div>}
      </div>
      <div className={crud.contentRow}>
        <div className={crud.contentMain}>
          {failure ? <div className={styles.feedback}>
            <p role="alert">{failure}</p>
            <Button variant="secondary" onClick={refresh}>Reintentar</Button>
          </div> : !result ? <p className={styles.feedback} role="status">Cargando garantías…</p>
            : result.data.length ? <Table id="reservation-guarantees" className="striped" height="100%"
                header={header} data={result.data} />
              : <EmptyData icon={<ShieldCheck size={64} />}
                  message={filters.search ? "No se encontraron garantías." : "Aún no hay garantías registradas."} />}
        </div>
      </div>
      {result && result.last_page > 1 && (
        <Pagination currentPage={result.current_page} totalPages={result.last_page} total={result.total}
          params={filters} setParams={setFilters} onPageChange={page => setFilters(current => ({ ...current, page }))} />
      )}

      {dialog?.kind === "detail" && <GuaranteeDetail row={dialog.row} onClose={() => setDialog(null)}
        onRefund={canWrite && dialog.row.available_cents > 0 ? () => setDialog({ kind: "refund", row: dialog.row }) : undefined} />}
      {canWrite && dialog && dialog.kind !== "detail" && <GuaranteeMovementForm
        refund={dialog.kind === "refund" ? dialog.row : undefined} onClose={() => setDialog(null)}
        onSaved={() => { setDialog(null); refresh(); }} />}
    </section>
  );
}
