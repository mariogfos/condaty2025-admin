import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { CategoryItem, CategoryType } from "../Type/CategoryType";
import { getCategoryConfig } from "../config/categories.config";

export const useCategories = (propType: string = "") => {
  const searchParams = useSearchParams();
  const urlType = searchParams?.get("type") || "";
  const type = urlType || propType;

  const typeToUse = useMemo(() => {
    return type === "E" || Number(type) === CategoryType.EXPENSE
      ? CategoryType.EXPENSE
      : CategoryType.INCOME;
  }, [type]);

  const originalType = type;

  const categoryTypeText = useMemo(() => {
    return typeToUse === CategoryType.EXPENSE ? "egresos" : "ingresos";
  }, [typeToUse]);

  const [initialFormDataOverride, setInitialFormDataOverride] =
    useState<Partial<CategoryItem> | null>(null);
  const [forceOpenAccordions, setForceOpenAccordions] = useState(false);

  // Ref to bypass circular dependency between getCategoryConfig and useCrud
  const getExtraDataRef = useRef<any>(null);

  const { mod, fields } = useMemo(
    () =>
      getCategoryConfig(
        typeToUse,
        categoryTypeText,
        initialFormDataOverride,
        setInitialFormDataOverride,
        getExtraDataRef
      ),
    [typeToUse, categoryTypeText, initialFormDataOverride]
  );

  const paramsInitial = useMemo(
    () => ({
      perPage: 20,
      page: 1,
      fullType: "L",
      searchBy: "",
      type: typeToUse,
    }),
    [typeToUse]
  );

  const crud = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // Assign the real function to the ref
  getExtraDataRef.current = crud.getExtraData;

  const handleEdit = useCallback(
    (itemToEdit: CategoryItem) => {
      crud.onEdit({
        ...itemToEdit,
        type: typeToUse,
        category_id: itemToEdit.category_id || null,
      });
    },
    [crud.onEdit, typeToUse]
  );

  const handleDelete = useCallback(
    (itemToDelete: CategoryItem) => crud.onDel(itemToDelete),
    [crud.onDel]
  );

  const handleAddSubcategory = useCallback(
    (parentCategoryId: string) => {
      setInitialFormDataOverride({
        category_id: parentCategoryId,
        type: typeToUse,
        _isAddingSubcategoryFlow: true,
      });
      crud.onAdd({ type: typeToUse });
    },
    [crud.onAdd, typeToUse]
  );

  const handleAddPrincipalCategory = useCallback(() => {
    setInitialFormDataOverride({ type: typeToUse });
    crud.onAdd({ type: typeToUse });
  }, [crud.onAdd, typeToUse]);

  const handleSearch = useCallback(
    (value: string) => {
      crud.onSearch(value);
      setForceOpenAccordions(!!value?.trim());
    },
    [crud.onSearch]
  );

  return {
    // Crud variables
    List: crud.List,
    searchs: crud.searchs,
    userCan: crud.userCan,
    extraData: crud.extraData,
    modPermission: mod.permiso,

    // Navigation and Texts
    originalType,
    categoryTypeText,
    typeToUse,

    // Accordions and details state
    forceOpenAccordions,

    // Actions
    handleEdit,
    handleDelete,
    handleAddSubcategory,
    handleAddPrincipalCategory,
    handleSearch,
  };
};
export default useCategories;
