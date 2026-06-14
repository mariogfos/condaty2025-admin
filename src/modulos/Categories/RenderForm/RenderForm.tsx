"use client";
import React, { memo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import styles from "./RenderForm.module.css";
import { CategoryFormProps } from "../Type/CategoryType";
import Select from "@/mk/components/forms/Select/Select";
import { FORM_LABELS } from "../config/categories.constants";
import useCategoryForm from "../hooks/useCategoryForm";

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
    const {
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
    } = useCategoryForm({
      item,
      setItem,
      onClose,
      onSave,
      extraData,
      getExtraData,
      action,
      categoryType,
    });

    if (!open) return null;

    return (
      <DataModal
        id="CategoriaFormModal"
        title={modalTitle}
        open={open}
        onClose={onCloseModal}
        buttonText={buttonText}
        buttonCancel={FORM_LABELS.buttonCancel}
        onSave={handleSave}
        className={styles.formModalContent}
        variant={"mini"}
      >
        <div className={styles.formContainer2}>
          {isSubcategoryMode && (
            <>
              <Input
                name="category_id_name"
                label={FORM_LABELS.parentCategory}
                value={parentCategory?.name || ""}
                onChange={undefined}
                required
                className={styles.customSelect}
                disabled
                error={_errors}
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
            label={FORM_LABELS.name}
            error={_errors}
            required
          />
          <Select
            name="bank_account_id"
            label={FORM_LABELS.bankAccount}
            value={_Item.bank_account_id || ""}
            onChange={handleChange}
            options={bankAccountOptions}
            error={_errors}
            required
          />
          <TextArea
            name="description"
            value={_Item.description || ""}
            onChange={handleChange}
            label={FORM_LABELS.description}
            error={_errors}
          />
          <input
            type="hidden"
            name="type"
            value={categoryType}
          />
        </div>
      </DataModal>
    );
  }
);

CategoryForm.displayName = "CategoryForm";
export default CategoryForm;
