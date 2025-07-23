'use client';
import { useMemo, useCallback, useState } from 'react';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import styles from './Categories.module.css';
import { IconArrowLeft, IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import Link from 'next/link';
import { CategoryItem } from './Type/CategoryType';
import Button from '@/mk/components/forms/Button/Button';
import CategoryForm from './RenderForm/RenderForm';
import CategoryCard from './CategoryCard/CategoryCard';
import DataSearch from '@/mk/components/forms/DataSearch/DataSearch';

const BackNavigation = ({ type }: { type: 'I' | 'E' }) => (
  <Link href={type === 'I' ? '/payments' : '/outlays'} className={styles.backLink}>
    <IconArrowLeft />
    <span>Volver a sección {type === 'I' ? 'ingresos' : 'egresos'}</span>
  </Link>
);
const Categories = ({ type = '' }) => {
  const typeToUse = type === 'I' ? 'I' : 'E';
  const categoryTypeText = typeToUse === 'I' ? 'ingresos' : 'egresos';

  const [initialFormDataOverride, setInitialFormDataOverride] =
    useState<Partial<CategoryItem> | null>(null);
  const [forceOpenAccordions, setForceOpenAccordions] = useState(false);

  const { List, onEdit, onDel, onAdd, getExtraData, onSearch, searchs } = useCrud({
    paramsInitial: useMemo(
      () => ({
        perPage: 20,
        page: 1,
        fullType: 'L',
        searchBy: '',
        type: typeToUse,
      }),
      [typeToUse]
    ),
    mod: useMemo<ModCrudType>(
      () => ({
        modulo: 'categories',
        singular: 'Categoría',
        plural: 'Categorías',
        permiso: '',
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
          '¿Seguro que quieres eliminar esta categoría? Recuerda que si realizas esta acción ya no verás esta categoría reflejada en tu balance y no podrás recuperarla',
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
            getExtraData={getExtraData}
          />
        ),
      }),
      [typeToUse, categoryTypeText, initialFormDataOverride]
    ),
    fields: useMemo(
      () => ({
        id: { rules: [], api: 'e' },
        name: {
          rules: ['required'],
          api: 'ae',
          label: 'Categoría',
          form: { type: 'text' },
          list: {},
        },
        description: {
          rules: [],
          api: 'ae',
          label: 'Descripción',
          form: { type: 'textarea' },
          list: {},
        },
        category_id: {
          rules: [],
          api: 'ae',
          label: 'Categoría Padre',
          form: {
            type: 'select',
            optionsExtra: 'categories',
            placeholder: 'Seleccione una categoría',
          },
        },
        hijos: { rules: [], api: '', label: 'Subcategorías' },
        type: {
          rules: ['required'],
          api: 'ae',
          label: 'Tipo',
          form: { type: 'hidden', precarga: typeToUse },
        },
      }),
      [typeToUse]
    ),
  });
  const handleEdit = useCallback(
    (itemToEdit: CategoryItem) => {
      onEdit({ ...itemToEdit, type: typeToUse, category_id: itemToEdit.category_id || null });
    },
    [onEdit, typeToUse]
  );

  const handleDelete = useCallback((itemToDelete: CategoryItem) => onDel(itemToDelete), [onDel]);
  const handleAddSubcategory = useCallback(
    (parentCategoryId: string) => {
      setInitialFormDataOverride({
        category_id: parentCategoryId,
        type: typeToUse,
        _isAddingSubcategoryFlow: true,
      });
      onAdd({ type: typeToUse });
    },
    [onAdd, typeToUse]
  );

  const handleAddPrincipalCategory = useCallback(() => {
    setInitialFormDataOverride({ type: typeToUse });
    onAdd({ type: typeToUse });
  }, [onAdd, typeToUse]);
  const renderCardFunction = useCallback(
    (item: CategoryItem, index: number, baseOnRowClick: (item: CategoryItem) => void) => (
      <CategoryCard
        key={item.id ?? `category-${index}`}
        item={item}
        className={index % 2 === 0 ? styles.cardEven : styles.cardOdd}
        onClick={baseOnRowClick}
        onEdit={handleEdit}
        onDel={handleDelete}
        categoryType={typeToUse}
        onAddSubcategory={handleAddSubcategory}
        forceOpen={forceOpenAccordions}
      />
    ),
    [handleEdit, handleDelete, typeToUse, handleAddSubcategory, forceOpenAccordions]
  );
  const handleSearch = useCallback(
    (value: string) => {
      onSearch(value);
      setForceOpenAccordions(!!value?.trim());
    },
    [onSearch]
  );
  return (
    <div className={styles.container}>
      <BackNavigation type={typeToUse} />
      <p className={styles.headerTitle} style={{ marginBottom: 16 }}>
        Categorías de {categoryTypeText}
      </p>
      <div className={styles.searchContainer}>
        <DataSearch
          value={searchs.searchBy || ''}
          name="categoriesSearch"
          setSearch={handleSearch}
          textButton="Buscar"
          className={styles.dataSearchCustom}
        />
        <Button onClick={handleAddPrincipalCategory} className={styles.addButton}>
          Nueva categoría
        </Button>
      </div>
      <List
        onRenderBody={renderCardFunction}
        height={'calc(100vh - 330px)'}
        emptyMsg="Sin categorías."
        emptyLine2="Crea categorías para organizar tus movimientos financieros."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        hideTitle
      />
    </div>
  );
};
export default Categories;
