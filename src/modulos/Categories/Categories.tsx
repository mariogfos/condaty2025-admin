"use client";
import React, { useCallback } from "react";
import styles from "./Categories.module.css";
import {
  IconArrowLeft,
  IconCategories,
} from "@/components/layout/icons/IconsBiblioteca";
import Link from "next/link";
import { CategoryItem, CategoryType } from "./Type/CategoryType";
import Button from "@/mk/components/forms/Button/Button";
import CategoryCard from "./CategoryCard/CategoryCard";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCategories from "./hooks/useCategories";

const BackNavigation = ({ type }: { type: number | string }) => {
  const getBackLink = () => {
    if (String(type) === "D") return "/debts_manager";
    return Number(type) === CategoryType.EXPENSE ? "/outlays" : "/payments";
  };

  const getBackText = () => {
    if (String(type) === "D") return "Volver a sección deudas";
    return Number(type) === CategoryType.EXPENSE ? "Volver a sección egresos" : "Volver a sección ingresos";
  };

  return (
    <Link href={getBackLink()} className={styles.backLink}>
      <IconArrowLeft />
      <span>{getBackText()}</span>
    </Link>
  );
};

const Categories = ({ type: propType = "" }) => {
  const {
    List,
    searchs,
    userCan,
    extraData,
    modPermission,
    originalType,
    categoryTypeText,
    typeToUse,
    forceOpenAccordions,
    handleEdit,
    handleDelete,
    handleAddSubcategory,
    handleAddPrincipalCategory,
    handleSearch,
  } = useCategories(propType);

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

  if (!userCan(modPermission, "R")) return <NotAccess />;

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
