// src/components/Categories/CategoryForm.tsx (o la ruta que corresponda)
'use client';

import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import Select from '@/mk/components/forms/Select/Select';
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
    const combinedErrors = useMemo(() => {
      return { ...errors, ...formErrors };
    }, [errors, formErrors]);

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

      // Limpia el error del campo que se está editando para feedback instantáneo
      setFormErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });

      set_Item(prevItem => ({
        ...prevItem,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }, []); // El array de dependencias vacío es correcto aquí

    const handleSave = useCallback(() => {
      const newErrors: any = {};

      // 1. Lógica de validación
      if (!_Item.name || _Item.name.trim() === '') {
        newErrors.name = 'El nombre de la categoría es obligatorio.';
      }
      if ((isCateg === 'S' || wantSubcategories) && !_Item.category_id) {
        newErrors.category_id = 'Debe seleccionar una Categoría Padre.';
      }

      // 2. Si se encontraron errores, se actualiza el estado y se detiene
      if (Object.keys(newErrors).length > 0) {
        setFormErrors(newErrors);
        return; // Detiene la ejecución aquí
      }

      // 3. Si no hay errores, se limpia el estado y se procede a guardar
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

      console.log('Guardando desde CategoryForm:', cleanItem);

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
        id: cat.id || '',
        name: cat.name || 'Sin nombre',
      }));
    }, [extraData?.categories]);

    const categoryTypeText = categoryType === 'I' ? 'ingresos' : 'egresos';

    // Determinar si es subcategoría (tanto en add como en edit)
    const isSubcategoryMode =
      isCateg === 'S' || (isCateg === 'C' && wantSubcategories);

    // Nuevo: detectar si es flujo de agregar subcategoría
    const isAddSubcategoryFlow = action === 'add' && !!item?.category_id;

    // Corregir el título y botón según el flujo
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
          {/* Si es flujo de subcategoría, mostrar el select bloqueado arriba */}
          {isAddSubcategoryFlow && (
            <Input
              name="category_id"
              label="Categoría padre"
              value={_Item.category_id || ''}
              onChange={() => {}} // No editable
              error={errors?.category_id}
              required
              className={styles.customSelect}
              disabled
            />
          )}
          {/* Si es edición o creación de subcategoría desde otro flujo, mostrar el select editable (como antes) */}
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
            label="Nombre de la categoría"
            error={errors?.name}
            required
          />
          <TextArea
            name="description"
            value={_Item.description || ''}
            onChange={handleChange}
            label="Descripción de la nueva categoría"
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
