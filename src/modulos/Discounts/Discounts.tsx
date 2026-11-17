"use client";

import { useEffect, useRef, useState } from "react";
import { Percent } from "lucide-react";
import EmptyData from "@/components/NoData/EmptyData";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import { financialRecordsApi } from "@/features/financial-records/api";
import { debtDiscountLabel, discountTypes } from "@/features/financial-records/debtDiscountFields";
import type { DebtDiscountFields } from "@/features/financial-records/types";
import Button from "@/mk/components/forms/Button/Button";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Select from "@/mk/components/forms/Select/Select";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import Table from "@/mk/components/ui/Table/Table";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import crud from "@/mk/hooks/useCrud/useCrudStyle.module.css";
import { getRequestErrorMessage } from "@/mk/utils/axiosError";
import { formatBs } from "@/mk/utils/numbers";
import { getStatusText } from "@/modulos/DebtsManager/TabComponents/constants";
import DebtDetail from "@/modulos/DebtsManager/TabComponents/AllDebts/RenderView/RenderView";
import PartialDebtDetail from "@/modulos/PartialPayments/RenderView/RenderView";

type DiscountedDebt = DebtDiscountFields & {
  id: number;
  amount: string | number;
  penalty_amount: string | number | null;
  maintenance_amount: string | number | null;
  status: string;
  dpto?: { nro: string } | null;
  description?: string | null;
  debt?: { description?: string | null; month?: number; year?: number } | null;
  shared?: { description?: string | null } | null;
  subcategory?: { name: string } | null;
};

type Page = { data: DiscountedDebt[]; current_page: number; last_page: number; total: number };
const all = "all";
const statuses = ["A", "M", "I", "E", "S", "P", "F", "X"];
const statusOptions = [{ id: all, name: "Todos los estados" },
  ...statuses.map(id => ({ id, name: getStatusText(id) }))];
const typeOptions = [{ id: all, name: "Todos los tipos" }, ...discountTypes];

function total(debt: DiscountedDebt) {
  return Number(debt.amount) + Number(debt.penalty_amount ?? 0) + Number(debt.maintenance_amount ?? 0);
}

export default function Discounts() {
  const { user, userCan } = useAuth();
  if (!userCan("debts_manager", "R") && !userCan("debts", "R")) return <NotAccess />;
  return <DiscountList key={user?.client_id} />;
}

function DiscountList() {
  const { user, showToast, userCan } = useAuth();
  const { execute } = useAxios();
  const executeRef = useRef(execute);
  const [filters, setFilters] = useState({ search: "", status: all, type: all, page: 1 });
  const [result, setResult] = useState<Page | null>(null);
  const [failure, setFailure] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<DiscountedDebt | null>(null);
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => { executeRef.current = execute; }, [execute]);
  useEffect(() => {
    let active = true;
    setResult(null);
    setFailure("");
    const load = async () => {
      try {
        const response = await executeRef.current(financialRecordsApi.discounts, "GET", {
          search: filters.search.trim(),
          status: filters.status === all ? undefined : filters.status,
          type: filters.type === all ? undefined : filters.type,
          page: filters.page,
        }, false, true);
        if (!active) return;
        if (!response.data?.success) {
          setFailure(getRequestErrorMessage(response.error, "No se pudieron cargar los descuentos."));
          return;
        }
        const page: Page = response.data.data;
        if (page.last_page < filters.page) {
          setFilters(current => ({ ...current, page: page.last_page }));
          return;
        }
        setResult(page);
      } catch {
        if (active) setFailure("No se pudieron cargar los descuentos.");
      }
    };
    void load();
    return () => { active = false; };
  }, [filters, revision]);

  const header = [
    { key: "unit", label: "Unidad", responsive: "Unidad", width: "108px",
      onRender: ({ item }: { item: DiscountedDebt }) => item.dpto?.nro ?? "—" },
    { key: "description", label: "Concepto", responsive: "Concepto", width: "100%",
      onRender: ({ item }: { item: DiscountedDebt }) => item.description || item.debt?.description
        || item.shared?.description || item.subcategory?.name || "Deuda" },
    { key: "discount_amount", label: "Descuento", responsive: "Descuento", width: "165px",
      onRender: ({ item }: { item: DiscountedDebt }) => debtDiscountLabel(item) },
    { key: "amount", label: "Total con descuento", responsive: "Total con descuento", width: "157px",
      onRender: ({ item }: { item: DiscountedDebt }) => formatBs(total(item)) },
    { key: "status", label: "Estado", responsive: "Estado", width: "168px",
      onRender: ({ item }: { item: DiscountedDebt }) => item.status === "P" && total(item) === 0
        ? "Saldada por descuento" : getStatusText(item.status) },
    { key: "actions", label: "Acciones", responsive: "Acciones", width: "126px",
      onRender: ({ item }: { item: DiscountedDebt }) => (
        <Button small variant="secondary" onClick={() => setSelected(item)}>Ver detalle</Button>
      ) },
  ];

  return (
    <section className={`${crud.useCrud} ${crud.mobileContentFlow}`}>
      <header className={crud.titleRow}><h1 className={crud.titleText}>Descuentos</h1></header>
      <div className={crud.toolbarRow}>
        <div className={crud.toolbarSearch}>
          <DataSearch name="discount-search" placeholder="Buscar unidad o concepto" value={filters.search}
            setSearch={(search: string) => setFilters(current => ({ ...current, search, page: 1 }))} />
        </div>
        <div className={crud.toolbarControls}>
          <div className={crud.toolbarFilters}>
            <Select name="discount-status" label="Estado" options={statusOptions} value={filters.status}
              onChange={event => setFilters(current => ({ ...current, status: event.target.value, page: 1 }))} />
            <Select name="discount-type" label="Tipo" options={typeOptions} value={filters.type}
              onChange={event => setFilters(current => ({ ...current, type: event.target.value, page: 1 }))} />
          </div>
        </div>
      </div>
      <div className={crud.contentRow}>
        <div className={crud.contentMain}>
          {failure ? <div>
            <p role="alert">{failure}</p>
            <Button variant="secondary" onClick={refresh}>Reintentar</Button>
          </div> : !result ? <p role="status">Cargando descuentos…</p>
            : result.data.length ? <Table id="debt-discounts" className="striped" height="100%" header={header} data={result.data} />
              : <EmptyData icon={<Percent size={56} />} message="No se encontraron deudas con descuento." />}
        </div>
      </div>
      {result && result.last_page > 1 && (
        <Pagination currentPage={result.current_page} totalPages={result.last_page} total={result.total}
          params={filters} setParams={setFilters} onPageChange={page => setFilters(current => ({ ...current, page }))} />
      )}
      {selected && (selected.status === "I" && userCan("payments", "R")
        ? <PartialDebtDetail open item={selected} onClose={() => setSelected(null)}
            execute={execute} showToast={showToast} reLoad={refresh} />
        : <DebtDetail open item={selected} user={user} onClose={() => setSelected(null)}
            onReload={refresh} hideEditAndDeleteButtons />)}
    </section>
  );
}
