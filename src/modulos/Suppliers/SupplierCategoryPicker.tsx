"use client";

import type { ComponentProps } from "react";
import SearchCreatePicker, { searchKey } from "@/mk/components/forms/SearchCreatePicker/SearchCreatePicker";

export const categoryKey = searchKey;

type Props = Pick<ComponentProps<typeof SearchCreatePicker>, "value" | "options" | "error" | "creating" | "onChange" | "onCreate">;

export default function SupplierCategoryPicker(props: Props) {
  return <SearchCreatePicker {...props} fieldName="service_category" label="Rubro o servicio"
    placeholder="Busca o crea un rubro" optionsLabel="Rubros disponibles"
    emptyLabel="Escribe para crear un nuevo rubro." />;
}
