'use client';
import { memo, useState, useCallback, useEffect } from 'react';
import styles from '../Categories.module.css';
import {
  IconArrowDown,
  IconEdit,
  IconTrash,
  IconSimpleAdd,
} from '@/components/layout/icons/IconsBiblioteca';
import { CategoryCardProps, CategoryItem } from '../Type/CategoryType';
const CategoryCard = memo(
  ({
    item,
    onClick,
    onEdit,
    onDel,
    categoryType,
    onAddSubcategory,
    className = '',
    isSelected = false,
    onSelectCard,
    forceOpen = false, 
  }: CategoryCardProps & { forceOpen?: boolean }) => {
    const hasSubcategories = item.hijos && item.hijos.length > 0;
    const [showSubcategories, setShowSubcategories] = useState<boolean>(forceOpen);

    useEffect(() => {
      if (forceOpen) setShowSubcategories(true);
    }, [forceOpen]);
    useEffect(() => {
      if (forceOpen && !showSubcategories) setShowSubcategories(true);
    }, [forceOpen, showSubcategories]);

    const toggleSubcategories = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (!forceOpen) {
        setShowSubcategories(prev => !prev);
      }
    }, [forceOpen]);

    const handleMainCardClick = useCallback(() => {
      if (onSelectCard) {
        onSelectCard();
      }
    }, [onSelectCard]);
    const handleEditClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        const editableItem = { ...item };
        if (!editableItem.category_id) {
          editableItem.category_id = null;
        }
        editableItem.type = categoryType;
        onEdit(editableItem);
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
    let parentBgColor = '';
    if (className.includes(styles.cardEven)) {
      parentBgColor = 'var(--cBlackV2)';
    } else if (className.includes(styles.cardOdd)) {
      parentBgColor = 'var(--cWhiteV2)';
    }
    const isAccordionOpen = forceOpen ? true : showSubcategories;
    const cardClasses = `${styles.categoryCard} ${className} ${isSelected ? styles.selectedCard : ''}${isAccordionOpen ? ' ' + styles.accordionOpen : ''}`;
    return (
      <div
        className={cardClasses}
        style={parentBgColor ? { backgroundColor: parentBgColor } : {}}
      >
        <div className={styles.categoryHeader} onClick={handleMainCardClick}>
          <div className={styles.categoryTitle}>
            <IconArrowDown
              className={`${styles.arrowIcon} ${isAccordionOpen ? styles.expanded : ''}`}
              onClick={toggleSubcategories}
              size={20}
            />
            <span
              className={
                styles.categoryNameText +
                (isAccordionOpen ? ' ' + styles.categoryNameTextOpen : '')
              }
            >
              {item.name || 'Sin nombre'}
            </span>
          </div>
          <div className={styles.categoryDescription}>
            {item.description || 'Sin descripción'}
          </div>
          <div className={styles.categoryActions}>
            <button
              className={`${styles.actionButton} ${styles.editButton}`}
              onClick={handleEditClick}
              aria-label={`Editar ${item.name}`}
            >
              <IconEdit size={24} />
            </button>
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDeleteClick}
              aria-label={`Eliminar ${item.name}`}
            >
              <IconTrash size={24} />
            </button>
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
                    const editableSubcat = { ...subcat };
                    editableSubcat.type = categoryType;
                    onEdit(editableSubcat);
                  };
                  const handleSubcatDelete = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDel(subcat);
                  };
                  const handleSubcatClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (onClick) onClick(subcat);
                  };

                  return (
                    <div
                      key={subcat.id || `subcat-${Math.random()}`}
                      className={`${styles.subcategoryItem}`}
                      style={
                        parentBgColor ? { backgroundColor: parentBgColor } : {}
                      }
                      onClick={handleSubcatClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ')
                          handleSubcatClick(e as any);
                      }}
                    >
                      <span className={styles.subcategoryName}>
                        {subcat.name || 'Sin nombre'}
                      </span>
                      <span className={styles.subcategoryDesc}>
                        {subcat.description || 'Sin descripción'}
                      </span>
                      <div className={styles.subcategoryActions}>
                        <button
                          className={`${styles.actionButtonSub} ${styles.editButtonSub}`}
                          onClick={handleSubcatEdit}
                          aria-label={`Editar subcategoría ${subcat.name}`}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          className={`${styles.actionButtonSub} ${styles.deleteButtonSub}`}
                          onClick={handleSubcatDelete}
                          aria-label={`Eliminar subcategoría ${subcat.name}`}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              <div className={styles.addSubcategoryContainer}>
                <button
                  className={styles.addSubcategoryButton}
                  onClick={e => {
                    e.stopPropagation();
                    if (item.id !== undefined) {
                      onAddSubcategory(item.id.toString());
                    } else {
                      console.error('Error: La categoría padre no tiene ID.');
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

CategoryCard.displayName = 'CategoryCard';
export default CategoryCard;
