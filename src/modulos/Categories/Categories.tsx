"use client";
import { useMemo, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation"; // Agregar este import
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import styles from "./Categories.module.css";
import {
  IconArrowLeft,
  IconCategories,
} from "@/components/layout/icons/IconsBiblioteca";
import Link from "next/link";
import { CategoryItem } from "./Type/CategoryType";
import Button from "@/mk/components/forms/Button/Button";
import CategoryForm from "./RenderForm/RenderForm";
import CategoryCard from "./CategoryCard/CategoryCard";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import NotAccess from "@/components/layout/NotAccess/NotAccess";

const BackNavigation = ({ type }: { type: number | string }) => {
  const getBackLink = () => {
    if (String(type) === "D") return "/debts_manager";
    return Number(type) === 2 ? "/outlays" : "/payments";
  };

  const getBackText = () => {
    if (String(type) === "D") return "Volver a sección deudas";
    return Number(type) === 2 ? "Volver a sección egresos" : "Volver a sección ingresos";
  };

  return (
    <Link href={getBackLink()} className={styles.backLink}>
      <IconArrowLeft />
      <span>{getBackText()}</span>
    </Link>
  );
};

const Categories = ({ type: propType = "" }) => {
  // Obtener el parámetro type de la URL
  const searchParams = useSearchParams();
  const urlType = searchParams?.get("type") || "";

  // Usar el tipo de la URL si existe, sino el prop
  const type = urlType || propType;

  // En Categories v3, type siempre es numérico (1 = Ingresos, 2 = Egresos)
  const typeToUse = Number(type) === 2 ? 2 : 1;
  const originalType = type; // Para la navegación de regreso (puede ser 'D', 1 o 2)

  const getCategoryTypeText = () => {
    return typeToUse === 2 ? "egresos" : "ingresos";
  };

  const categoryTypeText = getCategoryTypeText();

  const [initialFormDataOverride, setInitialFormDataOverride] =
    useState<Partial<CategoryItem> | null>(null);
  const [forceOpenAccordions, setForceOpenAccordions] = useState(false);

  const mod = useMemo<ModCrudType>(
    () => ({
      modulo: "v3/categories",
      singular: "Categoría",
      plural: "Categorías",
      permiso: "categories",
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
        "¿Seguro que quieres eliminar esta categoría? Recuerda que si realizas esta acción ya no podrás recuperarla",
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
  );

  const {
    List,
    onEdit,
    onDel,
    onAdd,
    getExtraData,
    onSearch,
    searchs,
    userCan,
    extraData,
  } = useCrud({
    paramsInitial: useMemo(
      () => ({
        perPage: 20,
        page: 1,
        fullType: "L",
        searchBy: "",
        type: typeToUse,
      }),
      [typeToUse]
    ),
    mod: mod,

    fields: useMemo(
      () => ({
        id: { rules: [], api: "e" },
        name: {
          rules: ["required"],
          api: "ae",
          label: "Categoría",
          form: { type: "text" },
          list: {},
        },
        description: {
          rules: [],
          api: "ae",
          label: "Descripción",
          form: { type: "textarea" },
          list: {},
        },
        bank_account_id: {
          rules: [],
          api: "ae",
          label: "Cuenta bancaria",
          form: {
            type: "select",
            optionsExtra: "bank_accounts",
            placeholder: "Seleccione una cuenta bancaria",
          },
          list: {
            render: ({ item, extraData }: CategoryItem) => {
              console.log(item, extraData);
              const bankAccount = extraData?.bankAccounts?.find(
                (bank: any) => String(bank.id) === String(item.bank_account_id)
              );
              return bankAccount?.alias_holder || "-/-";
            },
          },
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
      }),
      [typeToUse]
    ),
  });

  const handleEdit = useCallback(
    (itemToEdit: CategoryItem) => {
      onEdit({
        ...itemToEdit,
        type: typeToUse,
        category_id: itemToEdit.category_id || null,
      });
    },
    [onEdit, typeToUse]
  );

  const handleDelete = useCallback(
    (itemToDelete: CategoryItem) => onDel(itemToDelete),
    [onDel]
  );

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
    (
      item: CategoryItem,
      index: number,
      baseOnRowClick: (item: CategoryItem) => void
    ) => (
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
    [
      handleEdit,
      handleDelete,
      typeToUse,
      handleAddSubcategory,
      forceOpenAccordions,
    ]
  );

  const handleSearch = useCallback(
    (value: string) => {
      onSearch(value);
      setForceOpenAccordions(!!value?.trim());
    },
    [onSearch]
  );

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      <BackNavigation type={originalType as "I" | "E" | "D"} />
      <p className={styles.headerTitle}>Categorías de {categoryTypeText}</p>
      <div className={styles.searchContainer}>
        <div className={styles.searchField}>
          <DataSearch
            value={searchs.searchBy || ""}
            name="categoriesSearch"
            setSearch={handleSearch}
            textButton="Buscar"
            className={styles.dataSearchCustom}
            style={{ width: "100%" }}
            searchMsg={extraData?.searchMsg || ""}
          />
        </div>
        <Button
          className={styles.createCategoryButton}
          onClick={handleAddPrincipalCategory}
          style={{
            padding: "8px 16px",
            width: "auto",
            height: 48,
            display: "flex",
            alignItems: "center",
          }}
        >
          Nueva categoría
        </Button>
      </div>
      <List
        onRenderBody={renderCardFunction}
        height={"100%"}
        emptyMsg="Sin categorías."
        emptyLine2="Crea categorías para organizar tus movimientos financieros."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        hideTitle
      />
    </div>
  );
};

export default Categories;
