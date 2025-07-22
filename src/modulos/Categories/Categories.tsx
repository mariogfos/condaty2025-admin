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
const BackNavigation = ({ type }: { type: 'I' | 'E' }) => {
  const isIncome = type === 'I';
  const routePath = isIncome ? '/payments' : '/outlays';
  const linkText = isIncome ? 'Volver a sección ingresos' : 'Volver a sección egresos';
  return (
    <Link href={routePath} className={styles.backLink}>
      <IconArrowLeft />
      <span>{linkText}</span>
    </Link>
  );
};
const Categories = ({ type = '' }) => {
  const isIncome = type === 'I';
  const categoryTypeText = isIncome ? 'ingresos' : 'egresos';
  const typeToUse = isIncome ? 'I' : 'E';
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
          view: false,
          add: true,
          edit: false,
          del: false,
        },
        saveMsg: {
          add: `Categoría de ${categoryTypeText} creada con éxito`,
          edit: `Categoría de ${categoryTypeText} actualizada con éxito`,
          del: `Categoría de ${categoryTypeText} eliminada con éxito`,
        },
        messageDel:
          '¿Seguro que quieres eliminar esta categoría? Recuerda que si realizas esta acción ya no verás esta categoría reflejada en tu balance y no podrás recuperarla',
        renderForm: (propsFromCrud: any) => {
          const itemParaForm = initialFormDataOverride
            ? { ...propsFromCrud.item, ...initialFormDataOverride }
            : propsFromCrud.item;

          const handleCloseWrapper = () => {
            setInitialFormDataOverride(null);
            propsFromCrud.onClose();
          };
          return (
            <CategoryForm
              {...propsFromCrud}
              item={itemParaForm}
              setItem={propsFromCrud.setItem}
              onClose={handleCloseWrapper}
              categoryType={typeToUse}
              getExtraData={getExtraData}
            />
          );
        },
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
    (itemToEdit: CategoryItem): void => {
      const editableItem = { ...itemToEdit };
      if (!editableItem.category_id) {
        editableItem.category_id = null;
      }
      editableItem.type = typeToUse;
      onEdit(editableItem);
    },
    [onEdit, typeToUse]
  );
  const handleDelete = useCallback(
    (itemToDelete: CategoryItem): void => {
      onDel(itemToDelete);
    },
    [onDel]
  );
  const handleAddSubcategory = useCallback(
    (parentCategoryId: string) => {
      const initialData: Partial<CategoryItem> = {
        category_id: parentCategoryId,
        type: typeToUse,
        _isAddingSubcategoryFlow: true,
      };
      setInitialFormDataOverride(initialData);
      onAdd({ type: typeToUse });
    },
    [onAdd, typeToUse]
  );
  const handleAddPrincipalCategory = useCallback(
    () => {
      const initialData: Partial<CategoryItem> = {
        type: typeToUse,
      };
      setInitialFormDataOverride(initialData);
      onAdd({ type: typeToUse });
    },
    [onAdd, typeToUse]
  );
  const renderCardFunction = useCallback(
    (item: CategoryItem, index: number, baseOnRowClick: (item: CategoryItem) => void) => {
      const cardClassName = index % 2 === 0 ? styles.cardEven : styles.cardOdd;

      const forceOpen = forceOpenAccordions;
      console.log('CategoryCard:', { searchBy: searchs.searchBy, forceOpen, item: item.name });
      return (
        <CategoryCard
          key={item.id ?? `category-${index}`}
          item={item}
          className={cardClassName}
          onClick={subCategoryItem => {
            baseOnRowClick(subCategoryItem);
          }}
          onEdit={handleEdit}
          onDel={handleDelete}
          categoryType={typeToUse}
          onAddSubcategory={handleAddSubcategory}
          forceOpen={forceOpen}
        />
      );
    },
    [handleEdit, handleDelete, typeToUse, handleAddSubcategory, forceOpenAccordions]
  );
  const handleSearch = (value: string) => {
    onSearch(value);
    setForceOpenAccordions(Boolean(value && value.trim()));
  };
  return (
    <div className={styles.container}>
      <BackNavigation type={typeToUse} />
      <p className={styles.headerTitle} style={{ marginBottom: 16 }}>
        Categorías de {categoryTypeText}
      </p>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <DataSearch
            value={searchs.searchBy || ''}
            name="categoriesSearch"
            setSearch={handleSearch}
            textButton="Buscar"
            className={styles.dataSearchCustom}
            style={{ width: '100%' }}
          />
        </div>
        <Button
          onClick={handleAddPrincipalCategory}
          style={{ padding: '8px 16px', width: 'auto', height: 48, display: 'flex', alignItems: 'center' }}
        >
          Nueva categoría
        </Button>
      </div>
      <List
        onRenderBody={renderCardFunction}
        height={'calc(100vh - 330px)'}
        onRowClick={() => { }}
        emptyMsg="Sin categorías."
        emptyLine2="Crea categorías para organizar tus movimientos financieros."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        hideTitle
      />
    </div>
  );
};
export default Categories;
