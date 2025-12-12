"use client";
import { memo, useState, useCallback, useEffect } from "react";
import styles from "../Categories.module.css";
import {
  IconArrowDown,
  IconEdit,
  IconTrash,
  IconSimpleAdd,
} from "@/components/layout/icons/IconsBiblioteca";
import { CategoryCardProps, CategoryItem } from "../Type/CategoryType";

const CategoryCard = memo(
  ({
    item,
    onEdit,
    onDel,
    categoryType,
    onAddSubcategory,
    className = "",
    isSelected = false,
    onSelectCard,
    forceOpen = false,
  }: CategoryCardProps & { forceOpen?: boolean }) => {
    const hasSubcategories = item.hijos && item.hijos.length > 0;
    const [showSubcategories, setShowSubcategories] =
      useState<boolean>(forceOpen);

    useEffect(() => {
      setShowSubcategories(forceOpen);
    }, [forceOpen]);

    const toggleSubcategories = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!forceOpen) {
          setShowSubcategories((prev) => !prev);
        }
      },
      [forceOpen]
    );

    const handleMainCardClick = useCallback(() => {
      if (onSelectCard) {
        onSelectCard();
      }
    }, [onSelectCard]);
    const handleEditClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit({ ...item, type: categoryType });
      },
      [item, onEdit, categoryType]
    );

    const handleDeleteClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDel(item);
      },
      [item, onDel]
    );
    const parentBgColor = className.includes(styles.cardEven)
      ? "var(--cBlackV2)"
      : className.includes(styles.cardOdd)
      ? "var(--cWhiteV2)"
      : "";

    const isAccordionOpen = forceOpen || showSubcategories;
    const cardClasses = `${styles.categoryCard} ${className} ${
      isSelected ? styles.selectedCard : ""
    }${isAccordionOpen ? ` ${styles.accordionOpen}` : ""}`;
    return (
      <div
        className={cardClasses}
        onClick={toggleSubcategories}
        style={parentBgColor ? { backgroundColor: parentBgColor } : undefined}
      >
        <div className={styles.categoryHeader} onClick={handleMainCardClick}>
          <div className={styles.categoryTitle}>
            <IconArrowDown
              className={`${styles.arrowIcon} ${
                isAccordionOpen ? styles.expanded : ""
              }`}
              size={20}
            />
            <span
              className={`${styles.categoryNameText} ${
                isAccordionOpen ? styles.categoryNameTextOpen : ""
              }`}
            >
              {item.name || "-/-"}
            </span>
          </div>
          <div className={styles.categoryDescription}>
            {item.description || "-/-"}
          </div>
          <div className={styles.categoryDescription}>
            {(item?.bank_account?.account_number &&
              item?.bank_account?.account_number +
                " - " +
                item?.bank_account?.bank_entity?.name) ||
              "-/-"}
          </div>
          <div className={styles.categoryActions}>
            <button
              className={`${styles.actionButton} ${styles.editButton}`}
              onClick={handleEditClick}
              aria-label={`Editar ${item.name}`}
            >
              <IconEdit size={24} />
            </button>
            {!hasSubcategories && (
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={handleDeleteClick}
                aria-label={`Eliminar ${item.name}`}
              >
                <IconTrash size={24} />
              </button>
            )}
          </div>
        </div>
        {isAccordionOpen && (
          <div
            className={styles.subcategoriesContainer}
            style={parentBgColor ? { backgroundColor: parentBgColor } : {}}
          >
            <div className={styles.subcategoriesList}>
              {hasSubcategories &&
                item.hijos?.map((subcat: CategoryItem) => {
                  const handleSubcatEdit = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    onEdit({ ...subcat, type: categoryType });
                  };
                  const handleSubcatDelete = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDel(subcat);
                  };

                  return (
                    <div
                      key={subcat.id || `subcat-${Math.random()}`}
                      className={`${styles.subcategoryItem}`}
                      style={
                        parentBgColor
                          ? { backgroundColor: parentBgColor }
                          : undefined
                      }
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.subcategoryRow}>
                        <div className={styles.subcategoryNameContainer}>
                          <span className={styles.subcategoryName}>
                            {subcat.name || "-/-"}
                          </span>
                        </div>
                        <div className={styles.subcategoryDescContainer}>
                          <span className={styles.subcategoryDesc}>
                            {subcat.description || "-/-"}
                          </span>
                        </div>
                        <div className={styles.subcategoryDescContainer}>
                          <span className={styles.subcategoryDesc}>
                            {(subcat?.bank_account?.account_number &&
                              subcat?.bank_account?.account_number +
                                " - " +
                                subcat?.bank_account?.bank_entity?.name) ||
                              "-/-"}
                          </span>
                        </div>
                        <div className={styles.subcategoryActions}>
                          <button
                            className={`${styles.actionButtonSub} ${styles.editButtonSub}`}
                            onClick={handleSubcatEdit}
                            aria-label={`Editar subcategoría ${subcat.name}`}
                          >
                            <IconEdit size={20} />
                          </button>
                          <button
                            className={`${styles.actionButtonSub} ${styles.deleteButtonSub}`}
                            onClick={handleSubcatDelete}
                            aria-label={`Eliminar subcategoría ${subcat.name}`}
                          >
                            <IconTrash size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              <div className={styles.addSubcategoryContainer}>
                <button
                  className={styles.addSubcategoryButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.id) {
                      onAddSubcategory(item.id.toString());
                    }
                  }}
                >
                  <IconSimpleAdd size={16} />
                  <span>Agregar subcategoría</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CategoryCard.displayName = "CategoryCard";
export default CategoryCard;
