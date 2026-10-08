"use client";

import { useMemo } from "react";
import { CarFront } from "lucide-react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { type ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import VehicleForm from "./VehicleForm";
import VehicleView from "./VehicleView";

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
  saveMsg: { add: "Vehículo registrado" },
};

export default function Vehicles() {
  const fields = useMemo(() => ({
    id: { rules: [], api: "e" },
    plate: { rules: ["required"], api: "ae", label: "Placa", list: { order: 1, width: 170 } },
    kind: {
      rules: ["required"], api: "ae", label: "Vínculo",
      list: { order: 2, onRender: ({ item }: any) => item.kind === "visitor" ? "Visita" : "Residente" },
      filter: { label: "Vínculo", options: () => [
        { id: "ALL", name: "Todos" }, { id: "resident", name: "Residente" }, { id: "visitor", name: "Visita" },
      ] },
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
    visitor_name: { rules: [], api: "ae", label: "Visitante" },
    notes: { rules: [], api: "ae", label: "Notas" },
  }), []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud({
    paramsInitial: { fullType: "L", page: 1, perPage: 20, searchBy: "" }, mod, fields,
  });
  useCrudUtils({ onSearch, searchs, setStore, mod, onEdit, onDel, title: "Vehículos" });

  if (!userCan("units", "R")) return <NotAccess />;
  return <List height="100%" emptyMsg="Aún no hay vehículos registrados en este condominio."
    emptyLine2="Registra vehículos de residentes o visitas." emptyIcon={<CarFront size={80} color="var(--cWhiteV1)" />}
    filterBreakPoint={1700} />;
}
