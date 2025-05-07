// src/components/Categories/Categories.js (o la ruta que corresponda)
"use client";
import { useMemo, useCallback, useState } from "react"; // *** Añadido useState ***
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Categories.module.css";
import { IconArrowLeft } from "@/components/layout/icons/IconsBiblioteca";
import Link from "next/link";
import { CategoryItem } from "./Type/CategoryType";
import Button from "@/mk/components/forms/Button/Button";
import CategoryForm from "./RenderForm/RenderForm";
import CategoryCard from "./CategoryCard/CategoryCard";

const BackNavigation = ({ type }: { type: "I" | "E" }) => {
  const isIncome = type === "I";
  const routePath = isIncome ? "/payments" : "/outlays";
  const linkText = isIncome
    ? "Volver a sección ingresos"
    : "Volver a sección egresos";

  return (
    <Link href={routePath} className={styles.backLink}>
      <IconArrowLeft />
      <span>{linkText}</span>
    </Link>
  );
};

const Categories = ({ type = "" }) => {
  const isIncome = type === "I";
  const categoryTypeText = isIncome ? "ingresos" : "egresos";
  const typeToUse = isIncome ? "I" : "E";

  // *** PASO 1: Añadir Estado Local ***
  const [initialFormDataOverride, setInitialFormDataOverride] = useState<Partial<CategoryItem> | null>(null);

  const {
    userCan,
    List,
    onEdit,
    onDel,
    onAdd,
    getExtraData,
  } = useCrud({
    paramsInitial: useMemo(() => ({
      perPage: 20,
      page: 1,
      fullType: "L",
      searchBy: "",
      type: typeToUse,
    }), [typeToUse]),
    mod: useMemo<ModCrudType>(() => ({
      modulo: "categories",
      singular: "Categoría",
      plural: "Categorías",
      permiso: "", // Dejado como en tu código
      search: { hide: true },
      extraData: { params: { type: typeToUse } } as any,
      hideActions: {
        view: false, // Dejado como en tu código
        add: true,
        edit: false,
        del: false,
      },
      saveMsg: {
        add: `Categoría de ${categoryTypeText} creada con éxito`,
        edit: `Categoría de ${categoryTypeText} actualizada con éxito`,
        del: `Categoría de ${categoryTypeText} eliminada con éxito`,
      },
      // *** PASO 2: Modificar renderForm ***
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
            getExtraData={getExtraData} // Mantenido como lo tenías
          />
        );
      },
    }), [typeToUse, categoryTypeText, initialFormDataOverride]), // *** Dependencia añadida ***
    fields: useMemo(() => ({
      // Mantenido exactamente como lo tenías
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { type: "text" },
        list: { /* ... */ },
      },
      description: {
        rules: [],
        api: "ae",
        label: "Descripción",
        form: { type: "textarea" },
        list: { /* ... */ },
      },
      category_id: {
        rules: [],
        api: "ae",
        label: "Categoría Padre",
        form: {
          type: "select",
          optionsExtra: "categories",
          placeholder: "Seleccione una categoría",
        },
        
      },
      hijos: { rules: [], api: "", label: "Subcategorías" },
      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo",
        form: { type: "hidden", precarga: typeToUse },
      },
    }), [typeToUse]),
  });

  // Mantenido como lo tenías
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

  // Mantenido como lo tenías
  const handleDelete = useCallback(
    (itemToDelete: CategoryItem): void => {
      onDel(itemToDelete);
    },
    [onDel]
  );

  // *** PASO 3: Modificar handleAddSubcategory ***
  const handleAddSubcategory = useCallback(
    (parentCategoryId: string) => {
      const initialData: Partial<CategoryItem> = {
        category_id: parentCategoryId,
        type: typeToUse,
        _isAddingSubcategoryFlow: true,
      };
      setInitialFormDataOverride(initialData);
      onAdd({ type: typeToUse }); // Llamar a onAdd solo para abrir el modal
    },
    [onAdd, typeToUse] // Dependencias originales
  );

  // *** PASO 4: Modificar handleAddPrincipalCategory ***
  const handleAddPrincipalCategory = useCallback(() => {
    const initialData: Partial<CategoryItem> = {
      type: typeToUse,
    };
    setInitialFormDataOverride(initialData); // Guardar datos mínimos o null si prefieres
    onAdd({ type: typeToUse }); // Llamar a onAdd solo para abrir el modal
  }, [onAdd, typeToUse] // Dependencias originales
);

  // Mantenido como lo tenías
  const renderCardFunction = useCallback(
    (
      item: CategoryItem,
      index: number,
      baseOnRowClick: (item: CategoryItem) => void
      
    ) => {
      const cardClassName = index % 2 === 0 ? styles.cardEven : styles.cardOdd;

      return (
          <CategoryCard
            key={item.id || `category-${index}`}
            item={item}
            className={cardClassName}
            onClick={(subCategoryItem) => {
              baseOnRowClick(subCategoryItem);
            }}
            onEdit={handleEdit}
            onDel={handleDelete}
            categoryType={typeToUse}
            onAddSubcategory={handleAddSubcategory} // Pasa la función modificada
          />
      );
    },
    [handleEdit, handleDelete, typeToUse, handleAddSubcategory] // handleAddSubcategory añadida como dependencia
  );



  return (
    <div className={styles.container}>
      <BackNavigation type={typeToUse} />
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.headerTitle}>Categorías de {categoryTypeText}</p>
          <p className={styles.headerDescription}>
            Administre, agregue y elimine las categorías y subcategorías de los{" "}
            {categoryTypeText}
          </p>
        </div>
        <Button
          onClick={handleAddPrincipalCategory} // Llama a la función modificada
          style={{
            padding: "8px 16px",
            width: "auto",
          }}
        >
          Registrar Categoría Principal
        </Button>
      </div>

      <List
        onRenderBody={renderCardFunction} // Mantenido como lo tenías
        onRowClick={(itemClicked: CategoryItem) => { /* Mantenido como lo tenías */ }}
        // cardGap="0px" // Mantenido comentado como lo tenías
      />
    </div>
  );
};
export default Categories;