// src/components/Categories/CategoryForm.tsx (o la ruta que corresponda)
"use client";

import { memo, useState, useEffect, useCallback, useMemo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Select from "@/mk/components/forms/Select/Select";
import styles from "../Categories.module.css";
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
    const [_Item, set_Item] = useState<Partial<CategoryItem>>(() => {
      const initialData = { ...item };
      if (action === "add" && initialData._isAddingSubcategoryFlow) {
        delete initialData._isAddingSubcategoryFlow;
      }
      return initialData;
    });

    const [isCateg, setIsCateg] = useState<string>(() => {
      return item?.category_id ? "S" : "C";
    });

    const [wantSubcategories, setWantSubcategories] = useState<boolean>(() => {
      return !!(
        action === "add" &&
        item?._isAddingSubcategoryFlow &&
        item?.category_id
      );
    });

    useEffect(() => {
      const initialData = { ...item };
      let wantsSub = false;
      let newIsCateg = "C";

      if (
        action === "add" &&
        initialData._isAddingSubcategoryFlow &&
        initialData.category_id
      ) {
        wantsSub = true;
        newIsCateg = "S";
        delete initialData._isAddingSubcategoryFlow;
      } else if (initialData.category_id) {
        newIsCateg = "S";
      }

      set_Item(initialData);
      setWantSubcategories(wantsSub);
      setIsCateg(newIsCateg);
    }, [item, action]);

    const handleChange = useCallback((e: InputEvent) => {
      const { name, value, type, checked } = e.target;
      set_Item((prevItem) => ({
        ...prevItem,
        [name]: type === "checkbox" ? checked : value,
      }));
    }, []);

    const handleSave = useCallback(() => {
      const cleanItem: Partial<CategoryItem> & { type?: string } = { ..._Item };

      if (cleanItem.hijos) {
        delete cleanItem.hijos;
      }

      if (wantSubcategories && cleanItem.category_id) {
      } else {
        cleanItem.category_id = null;
      }

      if ("_initItem" in cleanItem) delete cleanItem._initItem;
      if ("category" in cleanItem) delete cleanItem.category;
      if (action === "edit" && "fixed" in cleanItem) delete cleanItem.fixed;

      cleanItem.type = categoryType === "I" ? "I" : "E";

      console.log("Guardando desde CategoryForm:", cleanItem);

      if (setItem) {
        setItem(cleanItem);
      }
      onSave(cleanItem);
      if (getExtraData) {
        getExtraData();
      }
    }, [
      _Item,
      onSave,
      setItem,
      wantSubcategories,
      action,
      categoryType,
      getExtraData,
    ]);

    const formattedCategories = useMemo(() => {
      const cats = extraData?.categories || [];
      if (!Array.isArray(cats)) return [];
      return cats.map((cat: any) => ({
        id: cat.id || "",
        name: cat.name || "Sin nombre",
      }));
    }, [extraData?.categories]);

    const categoryTypeText = categoryType === "I" ? "ingresos" : "egresos";

    let dynamicModalTitle = `Editar categoría de ${categoryTypeText}`;
    let dynamicButtonText = "Guardar Cambios";

    if (action === "add") {
      const isSubcategoryMode =
        !!_Item.category_id || (isCateg === "C" && wantSubcategories);

      if (isSubcategoryMode) {
        dynamicModalTitle = `Registrar nueva subcategoría de ${categoryTypeText}`;
        dynamicButtonText = "Registrar Subcategoría";
      } else {
        dynamicModalTitle = `Registrar nueva categoría de ${categoryTypeText}`;
        dynamicButtonText = "Registrar Categoría";
      }
    }

    if (!open) return null;

    return (
      <DataModal
        id="CategoriaFormModal"
        title={dynamicModalTitle}
        open={open}
        onClose={onClose}
        buttonText={dynamicButtonText}
        buttonCancel="Cancelar"
        onSave={handleSave}
        className={styles.formModalContent}
      >
        <div className={styles.formContainer2}>
          {/* <div className={styles.formField}> */}
          {/* <div className={styles.fieldContent}> */}
          <Input
            type="text"
            name="name"
            value={_Item.name || ""}
            onChange={handleChange}
            label="Nombre de la categoría"
            error={errors?.name}
            required
            // className={styles.customInput}
          />
          {/* </div> */}
          {/* </div> */}

          {/* <div className={styles.formField}> */}
          {/* <div className={styles.fieldContent}> */}
          <TextArea
            name="description"
            value={_Item.description || ""}
            onChange={handleChange}
            label="Descripción de la nueva categoría"
            error={errors?.description}
            // className={styles.customTextarea}
          />
          {/* </div>
          </div> */}

          {action === "add" && isCateg === "C" && (
            <div className={styles.formField}>
              <div className={styles.subcategoryOption}>
                <div className={styles.subcategoryText}>
                  <span className={styles.subcategoryTitle}>
                    ¿Es una subcategoría?
                  </span>
                  <span className={styles.subcategoryDescription}>
                    Marca esto si la nueva categoría dependerá de otra categoría
                    padre.
                  </span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={wantSubcategories}
                    onChange={(e) => {
                      setWantSubcategories(e.target.checked);
                      if (!e.target.checked) {
                        set_Item((prev) => ({ ...prev, category_id: null }));
                      }
                    }}
                    name="wantSubcategoryToggle"
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          )}

          {(isCateg === "S" ||
            (action === "add" && isCateg === "C" && wantSubcategories)) && (
            // <div className={styles.formField}>
            // <div className={styles.fieldContent}>
            <Select
              name="category_id"
              label="Categoría Padre"
              options={formattedCategories}
              value={_Item.category_id || ""}
              onChange={handleChange}
              error={errors?.category_id}
              required
              className={styles.customSelect}
            />
            //   </div>
            // </div>
          )}

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
