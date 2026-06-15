import React from "react";
import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import CategoryForm from "../RenderForm/RenderForm";
import { CategoryItem } from "../Type/CategoryType";
import { categoriesApi } from "../api";

export const getCategoryConfig = (
  typeToUse: number,
  categoryTypeText: string,
  initialFormDataOverride: Partial<CategoryItem> | null,
  setInitialFormDataOverride: (item: Partial<CategoryItem> | null) => void,
  getExtraDataRef: React.MutableRefObject<any>
): { mod: ModCrudType; fields: any } => {
  const mod: ModCrudType = {
    modulo: categoriesApi.modulo,
    singular: "Categoría",
    plural: "Categorías",
    permiso: "categories",
    search: { hide: true },
    extraData: { params: { type: typeToUse } } as any,
    hideActions: {
      add: true,
    },
    saveMsg: {
      add: `Categoría de ${categoryTypeText} creada con éxito`,
      edit: `Categoría de ${categoryTypeText} actualizada con éxito`,
      del: `Categoría de ${categoryTypeText} eliminada con éxito`,
    },
    messageDel:
      "¿Seguro que quieres eliminar esta categoría? Recuerda que si realizas esta acción ya no podrás recuperarla",
    renderForm: (propsFromCrud: any) => (
      <CategoryForm
        {...propsFromCrud}
        item={
          initialFormDataOverride
            ? { ...propsFromCrud.item, ...initialFormDataOverride }
            : propsFromCrud.item
        }
        onClose={() => {
          setInitialFormDataOverride(null);
          propsFromCrud.onClose();
        }}
        categoryType={typeToUse}
        getExtraData={() => getExtraDataRef.current?.()}
      />
    ),
  };

  const fields = {
    id: { rules: [], api: "e" },
    name: {
      rules: ["required"],
      api: "ae",
      label: "Categoría",
      form: { type: "text" },
      list: {},
    },
    description: {
      rules: [],
      api: "ae",
      label: "Descripción",
      form: { type: "textarea" },
      list: {},
    },
    bank_account_id: {
      rules: [],
      api: "ae",
      label: "Cuenta bancaria",
      form: {
        type: "select",
        optionsExtra: "bank_accounts",
        placeholder: "Seleccione una cuenta bancaria",
      },
      list: {
        render: ({ item, extraData }: CategoryItem) => {
          const bankAccount = extraData?.bankAccounts?.find(
            (bank: any) => String(bank.id) === String(item.bank_account_id)
          );
          return bankAccount?.alias_holder || "-/-";
        },
      },
    },
    category_id: {
      rules: [],
      api: "ae",
      label: "Categoría Padre",
      form: {
        type: "select",
        optionsExtra: "categories",
        placeholder: "Seleccione una categoría",
      },
    },
    hijos: { rules: [], api: "", label: "Subcategorías" },
    type: {
      rules: ["required"],
      api: "ae",
      label: "Tipo",
      form: { type: "hidden", precarga: typeToUse },
    },
  };

  return { mod, fields };
};
