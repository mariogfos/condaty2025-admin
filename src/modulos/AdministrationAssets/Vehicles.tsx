"use client";

import { useMemo } from "react";
import { Car, Pencil, Trash2 } from "lucide-react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import EmptyData from "@/components/NoData/EmptyData";
import useCrud, { type ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import VehicleForm from "./VehicleForm";
import VehicleView from "./VehicleView";
import styles from "./AdministrationAssets.module.css";

const vehicleTypes = [
  { id: "car", name: "Automóvil" },
  { id: "motorcycle", name: "Motocicleta" },
  { id: "truck", name: "Camioneta / camión" },
  { id: "other", name: "Otro" },
];

const fullName = (person: any) =>
  [person?.name, person?.middle_name, person?.last_name, person?.mother_last_name]
    .filter(Boolean).join(" ") || "—";

const mod: ModCrudType = {
  modulo: "administration/vehicles",
  singular: "vehículo",
  plural: "vehículos",
  permiso: "units",
  filter: true,
  extraData: true,
  titleAdd: "Nuevo",
  hideActions: { edit: true, del: true },
  renderForm: VehicleForm,
  renderView: VehicleView,
  loadView: { fullType: "DET" },
  saveMsg: { add: "Vehículo registrado", edit: "Vehículo actualizado", del: "Vehículo eliminado" },
};

export default function Vehicles() {
  const fields = useMemo(() => ({
    id: { rules: [], api: "e" },
    plate: { rules: ["required"], api: "ae", label: "Placa", list: { order: 1, width: 170 } },
    kind: {
      rules: ["required"], api: "ae", label: "Vínculo",
      list: { order: 2, onRender: ({ item }: any) => item.kind === "visitor" ? "Visita" : "Residente" },
    },
    vehicle_type: {
      rules: ["required"], api: "ae", label: "Tipo",
      list: { order: 3, onRender: ({ item }: any) => vehicleTypes.find((type) => type.id === item.vehicle_type)?.name || "—" },
      filter: { label: "Tipo", options: () => [{ id: "ALL", name: "Todos" }, ...vehicleTypes] },
    },
    dpto_id: {
      rules: [], api: "ae", label: "Unidad",
      list: { order: 4, onRender: ({ item }: any) => item.dpto?.nro || "—" },
      filter: { label: "Unidad", options: (extraData: any) => [
        { id: "ALL", name: "Todas" }, ...(extraData?.units || []),
      ] },
    },
    owner_id: {
      rules: [], api: "ae", label: "Persona",
      list: { order: 5, onRender: ({ item }: any) => item.kind === "visitor"
        ? (item.visitor_name || "Visita") : fullName(item.owner) },
    },
    brand: { rules: [], api: "ae", label: "Marca", list: { order: 6, onRender: ({ item }: any) => item.brand || "—" } },
    model: { rules: [], api: "ae", label: "Modelo" },
    color: { rules: [], api: "ae", label: "Color" },
    images: {
      rules: [], api: "ae", label: "Fotografías",
      list: { order: 7, onRender: ({ item }: any) => {
        if (item.kind === "visitor") return "—";
        const count = Array.isArray(item.images) ? item.images.length : 0;
        return count ? `${count} ${count === 1 ? "Foto" : "Fotos"}` : "Sin fotos";
      } },
    },
    access_count: {
      rules: [], api: "", label: "Ingresos",
      list: { order: 8, onRender: ({ item }: any) => item.kind === "visitor" ? item.access_count : "—" },
    },
    visitor_name: { rules: [], api: "ae", label: "Visitante" },
    notes: { rules: [], api: "ae", label: "Notas" },
  }), []);

  const getFilter = (field: string, value: string, previous: any) => {
    return { filterBy: { ...(previous?.filterBy || {}), [field]: value, kind: "resident" } };
  };

  // Discard any visitor selection saved by the previous version of this screen.
  if (typeof window !== "undefined") localStorage.removeItem(`${mod.modulo}Params`);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud({
    paramsInitial: { fullType: "L", page: 1, perPage: 20, searchBy: "", filterBy: "kind:resident" }, mod, fields, getFilter,
  });
  useCrudUtils({ onSearch, searchs, setStore, mod, onEdit, onDel, title: "Vehículos" });

  if (!userCan("units", "R")) return <NotAccess />;
  const canEdit = userCan("units", "U");
  const canDelete = userCan("units", "D");
  const renderActions = (item: any) => (
    <div className={styles.vehicleActions}>
      {item.kind === "resident" ? <>
      {canEdit ? <button type="button" className={styles.vehicleAction} title="Editar vehículo"
        aria-label={`Editar vehículo ${item.plate}`} onClick={(event) => { event.stopPropagation(); onEdit(item); }}>
        <Pencil size={18} />
      </button> : null}
      {canDelete ? <button type="button" className={`${styles.vehicleAction} ${styles.deleteAction}`}
        title="Eliminar vehículo" aria-label={`Eliminar vehículo ${item.plate}`}
        onClick={(event) => { event.stopPropagation(); onDel(item); }}>
        <Trash2 size={18} />
      </button> : null}
      </> : null}
    </div>
  );
  const emptyMessage = searchs.searchBy ? "No se encontraron vehículos con esa búsqueda."
    : "Aún no hay vehículos de residentes registrados.";
  const showActions = canEdit || canDelete;

  return <List height="100%" filterBreakPoint={1700}
    actionsWidth={showActions ? (canEdit && canDelete ? "116px" : "64px") : undefined}
    onButtonActions={showActions ? renderActions : undefined}
    onRenderEmpty={() => <EmptyData h="100%" message={emptyMessage}
      line2="Puedes cambiar los filtros o registrar un vehículo."
      icon={<span className={styles.vehicleEmptyIcon}><Car size={58} strokeWidth={1.7} /></span>} />} />;
}
