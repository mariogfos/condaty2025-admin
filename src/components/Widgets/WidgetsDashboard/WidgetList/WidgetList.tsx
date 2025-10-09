import React, { Fragment } from "react";
import styles from "./WidgetList.module.css"; // Asegúrate que el path sea correcto

interface PropsType {
  data: any[]; // Considera tipar 'any' de forma más específica si es posible
  renderItem: (item: any, index: number) => React.ReactNode;
  keyExtractor?: (item: any) => string | number;
  title: string;
  className?: string;
  emptyListMessage?: string; // Mensaje para cuando no hay datos
  viewAllText?: string; // Texto para el enlace "Ver todas" (opcional)
  onViewAllClick?: () => void; // Handler para el clic en "Ver todas" (opcional)
}

export const WidgetList = ({
  data,
  renderItem,
  keyExtractor,
  title,
  className = "",
  emptyListMessage = "No hay elementos para mostrar.",
  viewAllText,
  onViewAllClick,
}: PropsType) => {
  // Determinar los elementos a mostrar (máximo 2)
  const itemsToDisplay = data && data.length > 0 ? data.slice(0, 2) : [];

  return (
    <div className={`${styles.widgetList} ${className}`}>
      <div className={styles.widgetListHeader}>
        <span className={styles.widgetListTitle}>{title}</span>
        {/* El botón "Ver todas" es aún más relevante si se muestran menos items de los totales */}
        {viewAllText && onViewAllClick && (
          <button
            type="button"
            onClick={onViewAllClick}
            className={styles.widgetListViewAll}
          >
            {viewAllText}
          </button>
        )}
      </div>
      <div className={styles.widgetListContent}>
        {itemsToDisplay.length > 0 ? ( // Usar itemsToDisplay aquí
          itemsToDisplay.map((item: any, idx: number) => (
            <Fragment key={keyExtractor ? keyExtractor(item) : item.id || idx}>
              {renderItem(item, idx)}
            </Fragment>
          ))
        ) : (
          <p className={styles.widgetListEmptyMessage}>{emptyListMessage}</p>
        )}
      </div>
    </div>
  );
};