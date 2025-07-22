'use client';
import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import styles from './RenderForm.module.css';
import {
  CategoryFormProps,
  InputEvent,
  CategoryItem,
} from '../Type/CategoryType';
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
      if (action === 'add' && initialData._isAddingSubcategoryFlow) {
        delete initialData._isAddingSubcategoryFlow;
      }
      return initialData;
    });
    const [formErrors, setFormErrors] = useState<any>({});
    const [isCateg, setIsCateg] = useState<string>(() => {
      return item?.category_id ? 'S' : 'C';
    });

    const [wantSubcategories, setWantSubcategories] = useState<boolean>(() => {
      return !!(
        action === 'add' &&
        item?._isAddingSubcategoryFlow &&
        item?.category_id
      );
    });
    useEffect(() => {
      const initialData = { ...item };
      let wantsSub = false;
      let newIsCateg = 'C';

      if (
        action === 'add' &&
        initialData._isAddingSubcategoryFlow &&
        initialData.category_id
      ) {
        wantsSub = true;
        newIsCateg = 'S';
        delete initialData._isAddingSubcategoryFlow;
      } else if (initialData.category_id) {
        newIsCateg = 'S';
      }
      set_Item(initialData);
      setWantSubcategories(wantsSub);
      setIsCateg(newIsCateg);
    }, [item, action]);

    const handleChange = useCallback((e: InputEvent) => {
      const { name, value, type, checked } = e.target;
      setFormErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });

      set_Item(prevItem => ({
        ...prevItem,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }, []);

    const handleSave = useCallback(() => {
      const newErrors: any = {};
      if (!_Item.name || _Item.name.trim() === '') {
        newErrors.name = 'El nombre de la categoría es obligatorio.';
      }
      if ((isCateg === 'S' || wantSubcategories) && !_Item.category_id) {
        newErrors.category_id = 'Debe seleccionar una Categoría Padre.';
      }
      if (Object.keys(newErrors).length > 0) {
        setFormErrors(newErrors);
        return;
      }
      setFormErrors({});
      const cleanItem: Partial<CategoryItem> & { type?: string } = { ..._Item };
      if (cleanItem.hijos) {
        delete cleanItem.hijos;
      }
      if (wantSubcategories && cleanItem.category_id) {
      } else {
        cleanItem.category_id = null;
      }
      if ('_initItem' in cleanItem) delete cleanItem._initItem;
      if ('category' in cleanItem) delete cleanItem.category;
      if (action === 'edit' && 'fixed' in cleanItem) delete cleanItem.fixed;
      cleanItem.type = categoryType === 'I' ? 'I' : 'E';
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
    const isSubcategoryMode =
      isCateg === 'S' || (isCateg === 'C' && wantSubcategories);
    const isAddSubcategoryFlow = action === 'add' && !!item?.category_id;
    let dynamicModalTitle = '';
    let dynamicButtonText = '';
    if (action === 'add') {
      if (isAddSubcategoryFlow) {
        dynamicModalTitle = `Registrar subcategoría `;
        dynamicButtonText = 'Guardar';
      } else {
        dynamicModalTitle = `Registrar categoría`;
        dynamicButtonText = 'Guardar';
      }
    } else if (action === 'edit' && isSubcategoryMode) {
      dynamicModalTitle = `Editar subcategoría`;
      dynamicButtonText = 'Guardar';
    } else {
      dynamicModalTitle = `Editar categoría`;
      dynamicButtonText = 'Guardar';
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
          {isAddSubcategoryFlow && (
            <Input
              name="category_id"
              label="Categoría padre"
              value={_Item.category_id || ''}
              onChange={() => { }}
              error={errors?.category_id}
              required
              className={styles.customSelect}
              disabled
            />
          )}
          {!isAddSubcategoryFlow && isSubcategoryMode && action !== 'add' && (
            <Input
              name="category_id"
              label="Categoría padre"
              value={_Item.category_id || ''}
              onChange={handleChange}
              error={errors?.category_id}
              required
              className={styles.customSelect}
              disabled
            />
          )}
          <Input
            type="text"
            name="name"
            value={_Item.name || ''}
            onChange={handleChange}
            label={
              isSubcategoryMode
                ? 'Nombre de la subcategoría'
                : 'Nombre de la categoría'
            }
            error={errors?.name}
            required
          />
          <TextArea
            name="description"
            value={_Item.description || ''}
            onChange={handleChange}
            label={
              isSubcategoryMode
                ? 'Descripción de la nueva subcategoría'
                : 'Descripción de la nueva categoría'
            }
            error={errors?.description}
          />
          <input
            type="hidden"
            name="type"
            value={categoryType === 'I' ? 'I' : 'E'}
          />
        </div>
      </DataModal>
    );
  }
);

CategoryForm.displayName = 'CategoryForm';
export default CategoryForm;
