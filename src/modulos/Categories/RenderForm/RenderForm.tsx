"use client";
import { memo, useState, useEffect, useCallback, useMemo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import styles from "./RenderForm.module.css";
import {
  CategoryFormProps,
  InputEvent,
  CategoryItem,
} from "../Type/CategoryType";

const CategoryForm = memo(
  ({
    open,
    onClose,
    item,
    setItem,
    errors,
    onSave,
    extraData,
    getExtraData,
    action,
    categoryType,
  }: CategoryFormProps) => {
    const [_Item, set_Item] = useState<Partial<CategoryItem>>({});

    const isSubcategoryMode = !!_Item.category_id;

    useEffect(() => {
      const { _isAddingSubcategoryFlow, ...cleanItem } = item || {};
      set_Item(cleanItem);
    }, [item]);

    const handleChange = useCallback((e: InputEvent) => {
      const { name, value, type, checked } = e.target;
      set_Item((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }, []);

    const handleSave = useCallback(() => {
      if (!_Item.name?.trim()) return;

      const cleanItem = {
        ..._Item,
        type: categoryType === "I" ? "I" : "E",
        category_id: isSubcategoryMode ? _Item.category_id : null,
      };

      // Remove unnecessary properties
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
    ]);
    const { modalTitle, buttonText } = useMemo(() => {
      const itemType = isSubcategoryMode ? "subcategoría" : "categoría";
      const actionText = action === "edit" ? "Editar" : "Registrar";

      return {
        modalTitle: `${actionText} ${itemType}`,
        buttonText: "Guardar",
      };
    }, [action, isSubcategoryMode]);
    const parentCategory = useMemo(
      () =>
        extraData?.categories?.find(
          (cat: any) => String(cat.id) === String(_Item.category_id)
        ),
      [extraData?.categories, _Item.category_id]
    );

    if (!open) return null;

    return (
      <DataModal
        id="CategoriaFormModal"
        title={modalTitle}
        open={open}
        onClose={onClose}
        buttonText={buttonText}
        buttonCancel="Cancelar"
        onSave={handleSave}
        className={styles.formModalContent}
      >
        <div className={styles.formContainer2}>
          {isSubcategoryMode && (
            <>
              <Input
                name="category_id_name"
                label="Categoría padre"
                value={parentCategory?.name || ""}
                onChange={() => {}}
                required
                className={styles.customSelect}
                disabled
              />
              <input
                type="hidden"
                name="category_id"
                value={_Item.category_id || ""}
              />
            </>
          )}
          <Input
            type="text"
            name="name"
            value={_Item.name || ""}
            onChange={handleChange}
            label={`Nombre de la ${
              isSubcategoryMode ? "subcategoría" : "categoría"
            }`}
            error={errors?.name}
            required
          />
          <TextArea
            name="description"
            value={_Item.description || ""}
            onChange={handleChange}
            label={`Descripción de la nueva ${
              isSubcategoryMode ? "subcategoría" : "categoría"
            }`}
            error={errors?.description}
          />
          <input
            type="hidden"
            name="type"
            value={categoryType === "I" ? "I" : "E"}
          />
        </div>
      </DataModal>
    );
  }
);

CategoryForm.displayName = "CategoryForm";
export default CategoryForm;
