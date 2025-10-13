'use client';
import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import styles from './RenderForm.module.css';
import { checkRules } from '@/mk/utils/validate/Rules';
import { CategoryFormProps, InputEvent, CategoryItem } from '../Type/CategoryType';

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
        set_Item(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error for this field when user starts typing
        if (_errors[name]) {
          set_Errors(prev => ({
            ...prev,
            [name]: '',
          }));
        }
      },
      [_errors]
    );

    const validar = useCallback(() => {
      let errs: { [key: string]: string } = {};

      const addError = (result: string | Record<string, string> | null, key: string) => {
        if (typeof result === 'string' && result) {
          errs[key] = result;
        } else if (result && typeof result === 'object') {
          Object.entries(result).forEach(([k, v]) => {
            if (v) errs[k] = v;
          });
        }
      };

      addError(
        checkRules({
          value: _Item.name,
          rules: ['required'],
          key: 'name',
          errors: errs,
        }),
        'name'
      );

      const filteredErrs = Object.fromEntries(
        Object.entries(errs).filter(([_, v]) => typeof v === 'string' && v !== undefined)
      );
      set_Errors(filteredErrs);

      if (Object.keys(errs).length > 0) {
        setTimeout(() => {
          const firstErrorElement =
            document.querySelector(`.${styles.error}`) || document.querySelector('.error');
          if (firstErrorElement) {
            (firstErrorElement as HTMLElement).scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          } else {
            const modalBody = document.querySelector('.data-modal-body');
            if (modalBody) (modalBody as HTMLElement).scrollTop = 0;
          }
        }, 100);
      }
      return Object.keys(errs).length === 0;
    }, [_Item]);

    const handleSave = useCallback(() => {
      if (!validar()) return;

      const cleanItem = {
        ..._Item,
        type: categoryType === 'I' ? 'I' : 'E',
        category_id: isSubcategoryMode ? _Item.category_id : null,
      };

      // Remove unnecessary properties
      const propsToDelete = [
        'hijos',
        '_initItem',
        'category',
        ...(action === 'edit' ? ['fixed'] : []),
      ];
      propsToDelete.forEach(prop => delete cleanItem[prop as keyof typeof cleanItem]);

      setItem?.(cleanItem);
      onSave(cleanItem);
      getExtraData?.();
    }, [_Item, onSave, setItem, action, categoryType, getExtraData, isSubcategoryMode, validar]);
    const { modalTitle, buttonText } = useMemo(() => {
      const itemType = isSubcategoryMode ? 'subcategoría' : 'categoría';
      const actionText = action === 'edit' ? 'Editar' : 'Crear';

      return {
        modalTitle: `${actionText} ${itemType}`,
        buttonText: 'Guardar',
      };
    }, [action, isSubcategoryMode]);
    const parentCategory = useMemo(
      () => extraData?.categories?.find((cat: any) => String(cat.id) === String(_Item.category_id)),
      [extraData?.categories, _Item.category_id]
    );

    const onCloseModal = useCallback(() => {
      set_Errors({});
      onClose();
    }, [onClose]);

    if (!open) return null;

    return (
      <DataModal
        id="CategoriaFormModal"
        title={modalTitle}
        open={open}
        onClose={onCloseModal}
        buttonText={buttonText}
        buttonCancel="Cancelar"
        onSave={handleSave}
        className={styles.formModalContent}
        variant={"mini"}
      >
        <div className={styles.formContainer2}>
          {isSubcategoryMode && (
            <>
              <Input
                name="category_id_name"
                label="Categoría padre"
                value={parentCategory?.name || ''}
                onChange={() => {}}
                required
                className={styles.customSelect}
                disabled
              />
              <input type="hidden" name="category_id" value={_Item.category_id || ''} />
            </>
          )}
          <Input
            type="text"
            name="name"
            value={_Item.name || ''}
            onChange={handleChange}
            label={`Nombre`}
            error={_errors}
            required
            className={_errors.name ? styles.error : ''}
          />
          <TextArea
            name="description"
            value={_Item.description || ''}
            onChange={handleChange}
            label={`Descripción`}
            error={_errors}
            className={_errors.description ? styles.error : ''}
          />
          <input type="hidden" name="type" value={categoryType === 'I' ? 'I' : 'E'} />
        </div>
      </DataModal>
    );
  }
);

CategoryForm.displayName = 'CategoryForm';
export default CategoryForm;
