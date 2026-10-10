"use client";

import { useMemo } from "react";
import { PawPrint } from "lucide-react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import useCrud, { type ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import PetForm from "./PetForm";
import PetView from "./PetView";

const mod: ModCrudType = {
  modulo: "administration/pets",
  idempotentCreate: true,
  singular: "mascota",
  plural: "mascotas",
  permiso: "owners",
  filter: true,
  extraData: true,
  titleAdd: "Nueva",
  hideActions: { edit: true, del: true },
  renderForm: PetForm,
  renderView: PetView,
  loadView: { fullType: "DET" },
  saveMsg: { add: "Mascota registrada" },
};

const fullName = (person: any) =>
  [person?.name, person?.middle_name, person?.last_name, person?.mother_last_name]
    .filter(Boolean).join(" ") || "—";

export default function Pets() {
  const fields = useMemo(() => ({
    id: { rules: [], api: "e" },
    name: { rules: ["required"], api: "ae", label: "Mascota", list: { order: 1, width: 230 } },
    owner_id: {
      rules: ["required"], api: "ae", label: "Residente",
      list: { order: 2, onRender: ({ item }: any) => fullName(item.owner) },
      filter: { label: "Residente", options: (extraData: any) => [
        { id: "ALL", name: "Todos" }, ...(extraData?.people || []),
      ] },
    },
    specie_id: {
      rules: ["required"], api: "ae", label: "Especie",
      list: { order: 3, onRender: ({ item }: any) => item.specie?.name || "—" },
      filter: { label: "Especie", options: (extraData: any) => [
        { id: "ALL", name: "Todas" }, ...(extraData?.species || []),
      ] },
    },
    breed: { rules: ["required"], api: "ae", label: "Raza", list: { order: 4 } },
    gender: {
      rules: ["required"], api: "ae", label: "Sexo",
      list: { order: 5, onRender: ({ item }: any) => item.gender === "F" ? "Hembra" : "Macho" },
      filter: { label: "Sexo", options: () => [
        { id: "ALL", name: "Todos" }, { id: "M", name: "Macho" }, { id: "F", name: "Hembra" },
      ] },
    },
    color: { rules: ["required"], api: "ae", label: "Color" },
    age_year: { rules: ["required"], api: "a", label: "Años" },
    age_month: { rules: ["required"], api: "a", label: "Meses" },
    description: { rules: ["required"], api: "ae", label: "Descripción" },
    images: { rules: ["required"], api: "ae", label: "Fotografía" },
    is_lost: {
      rules: [], api: "", label: "Estado",
      list: { order: 6, onRender: ({ item }: any) => (
        <StatusBadge
          color={item.is_lost ? "var(--cError)" : "var(--cSuccess)"}
          backgroundColor={item.is_lost ? "var(--cHoverCompl1)" : "var(--cHoverCompl2)"}
        >{item.is_lost ? "Extraviada" : "En casa"}</StatusBadge>
      ) },
      filter: { label: "Estado", options: () => [
        { id: "ALL", name: "Todas" }, { id: "0", name: "En casa" }, { id: "1", name: "Extraviada" },
      ] },
    },
  }), []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud({
    paramsInitial: { fullType: "L", page: 1, perPage: 20, searchBy: "" }, mod, fields,
  });
  useCrudUtils({ onSearch, searchs, setStore, mod, onEdit, onDel, title: "Mascotas" });

  if (!userCan("owners", "R")) return <NotAccess />;
  return <List height="100%" emptyMsg="Aún no hay mascotas registradas en este condominio."
    emptyLine2="Registra una mascota para verla en el padrón." emptyIcon={<PawPrint size={80} color="var(--cWhiteV1)" />}
    filterBreakPoint={1700} />;
}
