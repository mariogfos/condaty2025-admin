"use client";

import { useMemo, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import Button from "@/mk/components/forms/Button/Button";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import useCrud, { type ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import { formatBs } from "@/mk/utils/numbers";
import { useAuth } from "@/mk/contexts/AuthProvider";
import ChequeBookForm from "./ChequeBookForm";
import ChequeView, { chequeStatus } from "./ChequeView";

const mod: ModCrudType = {
  modulo: "cheques",
  singular: "cheque",
  plural: "cheques",
  permiso: "outlays",
  filter: true,
  extraData: true,
  hideActions: { add: true, edit: true, del: true },
  renderView: ChequeView,
  loadView: { fullType: "DET" },
};

const statuses = ["free", "filled", "in_transit", "cashed", "void"];
const statusColors: Record<string, [string, string]> = {
  free: ["var(--cSuccess)", "var(--cHoverCompl2)"],
  filled: ["var(--cAccent)", "var(--cHoverCompl1)"],
  in_transit: ["var(--cAccent)", "var(--cHoverCompl1)"],
  cashed: ["var(--cSuccess)", "var(--cHoverCompl2)"],
  void: ["var(--cWhiteV1)", "var(--cHoverCompl1)"],
};

export default function Cheques() {
  const { userCan: canAccess, showToast } = useAuth();
  const [bookFormOpen, setBookFormOpen] = useState(false);
  const fields = useMemo(() => ({
    id: { rules: [], api: "e" },
    number: { rules: [], api: "e", label: "Número", list: { order: 1, width: 120 } },
    cheque_book_id: {
      rules: [], api: "e", label: "Talonario",
      list: { order: 2, onRender: ({ item }: any) => item.book?.name || `${item.book?.first_number || ""} – ${item.book?.last_number || ""}` },
      filter: { label: "Talonario", options: (extra: any) => [
        { id: "ALL", name: "Todos" },
        ...(extra?.books || []).map((book: any) => ({ id: book.id, name: `${book.name || `${book.first_number} – ${book.last_number}`} · ${book.free_count} libres` })),
      ] },
    },
    bank_account_id: {
      rules: [], api: "e", label: "Cuenta",
      list: { order: 3, onRender: ({ item }: any) => item.bank_account?.alias_holder || "—" },
      filter: { label: "Cuenta", options: (extra: any) => [
        { id: "ALL", name: "Todas" },
        ...(extra?.bankAccounts || []).map((account: any) => ({ id: account.id, name: `${account.alias_holder} · ${account.account_number}` })),
      ] },
    },
    payee: { rules: [], api: "e", label: "Beneficiario", list: { order: 4, onRender: ({ item }: any) => item.payee || "—" } },
    amount: { rules: [], api: "e", label: "Monto", list: { order: 5, onRender: ({ item }: any) => item.amount !== null ? formatBs(item.amount) : "—" } },
    status: {
      rules: [], api: "e", label: "Estado",
      list: { order: 6, onRender: ({ item }: any) => {
        const [color, backgroundColor] = statusColors[item.status] || statusColors.void;
        return <StatusBadge color={color} backgroundColor={backgroundColor}>{chequeStatus[item.status] || item.status}</StatusBadge>;
      } },
      filter: { label: "Estado", options: () => [
        { id: "ALL", name: "Todos" },
        ...statuses.map((id) => ({ id, name: chequeStatus[id] })),
      ] },
    },
  }), []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel, extraData, execute, reLoad, getExtraData } = useCrud({
    paramsInitial: { fullType: "L", page: 1, perPage: 20, searchBy: "" },
    mod, fields,
    extraButtons: canAccess("outlays", "C") ? [<Button key="new-book" onClick={() => setBookFormOpen(true)}>Nuevo talonario</Button>] : [],
  });
  useCrudUtils({ onSearch, searchs, setStore, mod, onEdit, onDel, title: "Cheques" });

  if (!userCan("outlays", "R")) return <NotAccess />;

  return <>
    <List height="100%" emptyMsg="Aún no hay cheques registrados en este condominio." emptyLine2="Crea un talonario desde una cuenta corriente para comenzar." emptyIcon={<BookOpenCheck size={80} color="var(--cWhiteV1)" />} filterBreakPoint={1700} />
    {userCan("outlays", "C") ? <ChequeBookForm open={bookFormOpen} onClose={() => setBookFormOpen(false)}
      accounts={extraData?.bankAccounts || []} execute={execute} reLoad={reLoad} getExtraData={getExtraData} showToast={showToast} /> : null}
  </>;
}
