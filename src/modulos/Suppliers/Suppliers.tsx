"use client";

import { useMemo } from "react";
import { Truck } from "lucide-react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import useCrud, { type ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import SupplierForm from "./SupplierForm";
import SupplierView from "./SupplierView";

const mod: ModCrudType = {
  modulo: "suppliers",
  singular: "proveedor",
  plural: "proveedores",
  permiso: "outlays",
  filter: true,
  extraData: true,
  titleAdd: "Nuevo",
  hideActions: { edit: true, del: true },
  renderForm: SupplierForm,
  renderView: SupplierView,
  loadView: { fullType: "DET" },
  saveMsg: {
    add: "Proveedor creado",
    edit: "Proveedor actualizado",
  },
};

const typeOptions = [
  { id: "ALL", name: "Todos" },
  { id: "company", name: "Empresa" },
  { id: "person", name: "Persona" },
];

const statusOptions = [
  { id: "ALL", name: "Todos" },
  { id: "A", name: "Activo" },
  { id: "I", name: "Inactivo" },
];

export default function Suppliers() {
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Proveedor",
        list: { order: 1, width: 260 },
      },
      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo",
        list: {
          order: 2,
          onRender: ({ item }: any) =>
            item.type === "company" ? "Empresa" : "Persona",
        },
        filter: { label: "Tipo", options: () => typeOptions },
      },
      service_category: {
        rules: [],
        api: "ae",
        label: "Rubro",
        list: { order: 3, onRender: ({ item }: any) => item.service_category || "—" },
        filter: {
          label: "Rubro",
          options: (extraData: any) => [
            { id: "ALL", name: "Todos" },
            ...(extraData?.serviceCategories || []),
          ],
        },
      },
      document_number: {
        rules: [],
        api: "ae",
        label: "CI / NIT",
        list: { order: 4, onRender: ({ item }: any) => item.document_number || "—" },
      },
      contact_name: { rules: [], api: "ae", label: "Contacto" },
      phone: {
        rules: [],
        api: "ae",
        label: "Teléfono",
        list: { order: 5, onRender: ({ item }: any) => item.phone || "—" },
      },
      email: { rules: [], api: "ae", label: "Correo" },
      address: { rules: [], api: "ae", label: "Dirección" },
      notes: { rules: [], api: "ae", label: "Notas" },
      status: {
        rules: [],
        api: "e",
        label: "Estado",
        list: {
          order: 6,
          onRender: ({ item }: any) => (
            <StatusBadge
              color={item.status === "A" ? "var(--cSuccess)" : "var(--cWhiteV1)"}
              backgroundColor={item.status === "A" ? "var(--cHoverCompl2)" : "var(--cHoverCompl1)"}
            >
              {item.status === "A" ? "Activo" : "Inactivo"}
            </StatusBadge>
          ),
        },
        filter: { label: "Estado", options: () => statusOptions },
      },
    }),
    [],
  );

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud({
    paramsInitial: { fullType: "L", page: 1, perPage: 20, searchBy: "" },
    mod,
    fields,
  });
  useCrudUtils({ onSearch, searchs, setStore, mod, onEdit, onDel, title: "Proveedores" });

  if (!userCan("outlays", "R")) return <NotAccess />;

  return (
    <List
      height="100%"
      emptyMsg="Aún no hay proveedores registrados en este condominio."
      emptyLine2="Crea uno para asociarlo opcionalmente a los egresos."
      emptyIcon={<Truck size={80} color="var(--cWhiteV1)" />}
      filterBreakPoint={1700}
    />
  );
}
