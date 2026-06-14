import { useState, useEffect, useCallback, useMemo } from "react";
import { CategoryItem, CategoryFormProps, InputEvent } from "../Type/CategoryType";
import { checkRules } from "@/mk/utils/validate/Rules";
import { FORM_LABELS } from "../config/categories.constants";

export const useCategoryForm = ({
  item,
  setItem,
  onClose,
  onSave,
  extraData,
  action,
  categoryType,
  getExtraData,
}: Omit<CategoryFormProps, "open">) => {
  const [_Item, set_Item] = useState<Partial<CategoryItem>>({});
  const [_errors, set_Errors] = useState<{ [key: string]: string }>({});

  const isSubcategoryMode = !!_Item.category_id;

  useEffect(() => {
    const { _isAddingSubcategoryFlow, ...cleanItem } = item || {};
    set_Item(cleanItem);
    set_Errors({});
  }, [item]);

  const handleChange = useCallback(
    (e: InputEvent) => {
      const { name, value, type, checked } = e.target;
      set_Item((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));

      if (_errors[name]) {
        set_Errors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [_errors]
  );

  const validar = useCallback(() => {
    let errs: { [key: string]: string } = {};

    const addError = (
      result: string | Record<string, string> | null,
      key: string
    ) => {
      if (typeof result === "string" && result) {
        errs[key] = result;
      } else if (result && typeof result === "object") {
        Object.entries(result).forEach(([k, v]) => {
          if (v) errs[k] = v;
        });
      }
    };

    addError(
      checkRules({
        value: _Item.name,
        rules: ["required"],
        key: "name",
        errors: errs,
      }),
      "name"
    );

    const filteredErrs = Object.fromEntries(
      Object.entries(errs).filter(
        ([_, v]) => typeof v === "string" && v !== undefined
      )
    );
    set_Errors(filteredErrs);

    return Object.keys(errs).length === 0;
  }, [_Item]);

  const handleSave = useCallback(() => {
    if (!validar()) return;

    const cleanItem = {
      ..._Item,
      type: categoryType,
      category_id: isSubcategoryMode ? _Item.category_id : null,
      bank_account_id: _Item.bank_account_id || null,
    };

    const propsToDelete = [
      "hijos",
      "_initItem",
      "category",
      ...(action === "edit" ? ["fixed"] : []),
    ];

    propsToDelete.forEach(
      (prop) => delete cleanItem[prop as keyof typeof cleanItem]
    );
    setItem?.(cleanItem);
    onSave(cleanItem);
    getExtraData?.();
  }, [
    _Item,
    onSave,
    setItem,
    action,
    categoryType,
    getExtraData,
    isSubcategoryMode,
    validar,
  ]);

  const { modalTitle, buttonText } = useMemo(() => {
    const itemType = isSubcategoryMode ? "subcategoría" : "categoría";
    const actionText = action === "edit" ? "Editar" : "Crear";

    return {
      modalTitle: `${actionText} ${itemType}`,
      buttonText: FORM_LABELS.buttonSave,
    };
  }, [action, isSubcategoryMode]);

  const parentCategory = useMemo(
    () =>
      extraData?.categories?.find(
        (cat: any) => String(cat.id) === String(_Item.category_id)
      ),
    [extraData?.categories, _Item.category_id]
  );

  const onCloseModal = useCallback(() => {
    set_Errors({});
    onClose();
  }, [onClose]);

  const bankAccountOptions = useMemo(() => {
    return (
      extraData?.bankAccounts?.map((bank: any) => ({
        id: bank.id,
        name: `${bank.holder} - ${bank.alias_holder} - ${bank.account_number}`,
      })) || []
    );
  }, [extraData?.bankAccounts]);

  return {
    _Item,
    _errors,
    isSubcategoryMode,
    modalTitle,
    buttonText,
    parentCategory,
    bankAccountOptions,
    handleChange,
    handleSave,
    onCloseModal,
  };
};
export default useCategoryForm;
