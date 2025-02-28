"use client";
import { useMemo, useState, useEffect, memo, useCallback } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./IncomeCategories.module.css";
import {
  IconArrowDown,
  IconEdit,
  IconTrash,
  IconSimpleAdd,
} from "@/components/layout/icons/IconsBiblioteca";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Check from "@/mk/components/forms/Check/Check";
import Select from "@/mk/components/forms/Select/Select";

import {
  CategoryCardProps,
  CategoryFormProps,
  CategoryItem,
  InputEvent,
} from "./IncomeCategoriesTypes";

const CategoryForm = memo(
  ({
    open,
    onClose,
    item,
    setItem,
    errors,
    setErrors,
    onSave,
    extraData,
    action,
  }: CategoryFormProps) => {
    const [isCateg, setIsCateg] = useState<string>(
      item.category_id ? "S" : "C"
    );

    const [_Item, set_Item] = useState(item);

    // Actualizar el estado local cuando cambia el item prop
    useEffect(() => {
      // Asegurarnos de que tenemos una copia limpia
      set_Item(item);
      setIsCateg(item.category_id ? "S" : "C");
    }, [item]);

    const handleChange = useCallback((e: InputEvent) => {
      const { name, value } = e.target;
      set_Item((prevItem: any) => ({ ...prevItem, [name]: value }));
    }, []);

    const onSelItem = useCallback((e: InputEvent) => {
      const selValue = e.target.name; // "C" o "S"
      setIsCateg(selValue);

      if (selValue === "C") {
        set_Item((prevItem: any) => ({
          ...prevItem,
          category_id: null,
        }));
      }
    }, []);

    const handleSave = useCallback(() => {
      // Preparar el objeto para guardar - Eliminar propiedades que pueden causar problemas
      const cleanItem = { ..._Item };
      
      // Eliminar subcategorías para evitar conflictos
      if (cleanItem.hijos) {
        delete cleanItem.hijos;
      }
      
      // Asegurar que category_id sea null para categorías padre
      if (isCateg === "C") {
        cleanItem.category_id = null;
      }
      
      // Remover propiedades que no necesitamos enviar al backend
      if (cleanItem._initItem) delete cleanItem._initItem;
      if (cleanItem.category) delete cleanItem.category;
      if (cleanItem.fixed && action === "edit") delete cleanItem.fixed;
      
      // Para debugging
      console.log("Guardando:", cleanItem);
      
      setItem(cleanItem);
      onSave(cleanItem);
    }, [_Item, onSave, setItem, isCateg, action]);

    // Formatear categorías para el select
    const formattedCategories = useMemo(() => {
      const cats = extraData?.categories || [];
      if (!Array.isArray(cats)) return [];
      
      return cats.map((cat: any) => ({
        id: cat.id || '',
        name: cat.name || 'Sin nombre'
      }));
    }, [extraData?.categories]);

    // Log para debugging
    useEffect(() => {
      console.log("Formulario abierto con:", item);
      console.log("Acción:", action);
      console.log("Es categoría:", isCateg);
    }, [item, action, isCateg]);

    // Evitar renderizados durante cambios de estado local
    if (!open) return null;

    return (
      <DataModal
        id="CategoriaForm"
        title="Registro de categorías y sub-categorías de ingresos"
        open={open}
        onClose={onClose}
        buttonText={
          action === "add"
            ? isCateg === "C"
              ? "Crear categoría"
              : "Crear sub-categoría"
            : "Guardar cambios"
        }
        buttonCancel=""
        onSave={handleSave}
      >
        {action === "add" && (
          <>
            <p className={styles.subtitle}>Indica lo que quieras crear hoy</p>
            <div className={styles.optionsContainer}>
              <div className={styles.optionRow}>
                <p className={styles.optionLabel}>
                  Quiero crear una categoría nueva
                </p>
                <Check
                  name="C"
                  checked={isCateg === "C"}
                  onChange={onSelItem}
                  optionValue={["Y", "N"]}
                  value={isCateg === "C" ? "Y" : "N"}
                />
              </div>

              <div className={styles.optionRow}>
                <p className={styles.optionLabel}>
                  Quiero registrar una sub-categoría nueva
                </p>
                <Check
                  name="S"
                  checked={isCateg === "S"}
                  onChange={onSelItem}
                  optionValue={["Y", "N"]}
                  value={isCateg === "S" ? "Y" : "N"}
                />
              </div>
            </div>
          </>
        )}

        {isCateg === "S" && (
          <div className={styles.formGroup}>
            <Select
              name="category_id"
              label="Categoría"
              placeholder="Selecciona una categoría"
              options={formattedCategories}
              value={_Item.category_id || ""}
              onChange={handleChange}
              error={errors}
              required
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <p className={styles.fieldLabel}>
            {isCateg === "C" 
              ? "Indica el nombre de tu categoría" 
              : "Indica el nombre de tu sub-categoría"}
          </p>
          <Input
            type="text"
            name="name"
            value={_Item.name || ""}
            onChange={handleChange}
            placeholder="Ej: Pagos al dpto. de administración"
            error={errors}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <p className={styles.fieldLabel}>
            {isCateg === "C" 
              ? "Indica una descripción para tu categoría (opcional)" 
              : "Indica una descripción para tu sub-categoría (opcional)"}
          </p>
          <TextArea
            name="description"
            value={_Item.description || ""}
            onChange={handleChange}
            placeholder="Ej: Pagos variados entre limpieza de las oficinas, compras de herramientas para la oficina sueldos y refrigerio de los trabajadores"
            error={errors}
          />
        </div>

        <input 
          type="hidden" 
          name="type" 
          value="I" 
        />
      </DataModal>
    );
  }
);

CategoryForm.displayName = "CategoryForm";

// Componente para renderizar una categoría con sus subcategorías
const CategoryCard = memo(
  ({ item, onClick, onEdit, onDel }: CategoryCardProps) => {
    // Usar el array 'hijos' en lugar de 'subcategories'
    const hasSubcategories = item.hijos && item.hijos.length > 0;
    const [showSubcategories, setShowSubcategories] = useState<boolean>(false);

    const toggleSubcategories = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setShowSubcategories((prev) => !prev);
    }, []);

    // Simplificar el manejo de eventos
    const handleItemClick = useCallback(() => {
      // Removemos la función onClick para categorías padre
    }, []);

    // Funciones específicas para editar y eliminar
    const handleEditClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Preparar el ítem antes de enviarlo a editar (para categorías padre)
      const editableItem = { ...item };
      
      // Asegúrate de que category_id sea null para categorías padre
      if (!editableItem.category_id) {
        editableItem.category_id = null;
      }
      
      // Si es una categoría padre, asegúrate de que type="I" esté establecido
      if (!editableItem.type) {
        editableItem.type = "I";
      }
      
      // Log para debug
      console.log("Editando:", editableItem);
      
      onEdit(editableItem);
    }, [item, onEdit]);

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onDel(item);
    }, [item, onDel]);

    return (
      <div className={styles.categoryCard}>
        <div className={styles.categoryHeader} onClick={handleItemClick}>
          <div className={styles.categoryTitle}>
            {hasSubcategories && (
              <IconArrowDown 
                className={`${styles.arrowIcon} ${showSubcategories ? styles.expanded : ''}`}
                onClick={toggleSubcategories}
              />
            )}
            <h3>{item.name || "Sin nombre"}</h3>
          </div>
          <div className={styles.categoryDescription}>
            {item.description || "Sin descripción"}
          </div>
          <div className={styles.categoryActions}>
            <button 
              className={styles.editButton}
              onClick={handleEditClick}
            >
              <IconEdit />
            </button>
            <button 
              className={styles.deleteButton}
              onClick={handleDeleteClick}
            >
              <IconTrash />
            </button>
          </div>
        </div>
        
        {/* Mostrar subcategorías si existen y están expandidas */}
        {hasSubcategories && showSubcategories && (
          <div className={styles.subcategoriesContainer}>
            <h4 className={styles.subcategoriesTitle}>Sub-categorías</h4>
            <div className={styles.subcategoriesList}>
              {item.hijos?.map((subcat) => {
                // Crear handlers específicos para cada subcategoría
                const handleSubcatEdit = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  
                  // Asegurar que el objeto subcategoría tiene los campos requeridos
                  const editableSubcat = { ...subcat };
                  
                  // Asegurar que type="I" está establecido
                  if (!editableSubcat.type) {
                    editableSubcat.type = "I";
                  }
                  
                  console.log("Editando subcategoría:", editableSubcat);
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
                    className={styles.subcategoryItem}
                    onClick={handleSubcatClick}
                  >
                    <div className={styles.subcategoryContent}>
                      <span className={styles.subcategoryName}>{subcat.name || "Sin nombre"}</span>
                      <span className={styles.subcategoryDesc}>{subcat.description || "Sin descripción"}</span>
                    </div>
                    <div className={styles.subcategoryActions}>
                      <button onClick={handleSubcatEdit}>
                        <IconEdit size={16} />
                      </button>
                      <button onClick={handleSubcatDelete}>
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

CategoryCard.displayName = "CategoryCard";

// Configuración para useCrud
const mod: ModCrudType = {
  modulo: "categories",
  singular: "Categoría",
  plural: "Categorías",
  permiso: "",
  extraData: { params: { type: "I" } },
  hideActions: {
    view: false,
    add: false,
    edit: false,
    del: false,
  },
  saveMsg: {
    add: "Categoría creada con éxito",
    edit: "Categoría actualizada con éxito",
    del: "Categoría eliminada con éxito",
  },
  renderForm: (props: any) => <CategoryForm {...props} />,
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  type: "I", // Tipo Ingreso
  searchBy: "",
};

const IncomeCategories: React.FC = () => {
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { type: "text" },
        list: { 
          onRender: (props: { item: CategoryItem }) => {
            return <div className={styles.categoryName}>{props.item.name || "Sin nombre"}</div>;
          }
        },
      },
      
      description: {
        rules: [],
        api: "ae",
        label: "Descripción",
        form: { type: "textarea" },
        list: { 
          width: "300px",
          onRender: (props: { item: CategoryItem }) => {
            return <div className={styles.categoryDescription}>
              {props.item.description || "Sin descripción"}
            </div>;
          }
        },
      },

      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo",
        form: {
          type: "hidden",
          precarga: "I" // Tipo Ingreso
        }
      },
      
      category_id: {
        rules: [],
        api: "ae",
        label: "Categoría Padre",
        form: {
          type: "select",
          optionsExtra: "categories",
          placeholder: "Seleccione una categoría"
        },
        list: { 
          width: "180px",
          onRender: (props: { item: CategoryItem }) => {
            return props.item.category 
              ? <div>{props.item.category.name || "Sin nombre"}</div>
              : <div className={styles.mainCategory}>Categoría Principal</div>;
          }
        },
      },

      // Campo para manejar los hijos/subcategorías
      hijos: {
        rules: [],
        api: "",
        label: "Subcategorías",
      },
    }),
    []
  );

  const {
    userCan,
    List,
    onEdit,
    onDel,
    onAdd,
    onView,
    extraData,
    execute
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // Funciones para manejar edición y eliminación
  const handleEdit = useCallback((item: CategoryItem): void => {
    // Preparar el objeto antes de editar
    const editableItem = { ...item };
    
    // Asegurar que se incluye el tipo (I para ingresos)
    if (!editableItem.type) {
      editableItem.type = "I";
    }
    
    // Para categorías padre, asegurar que category_id es null
    if (!editableItem.category_id) {
      editableItem.category_id = null;
    }
    
    // Log para debug
    console.log("Enviando a editar:", editableItem);
    
    onEdit(editableItem);
  }, [onEdit]);

  const handleDelete = useCallback((item: CategoryItem): void => {
    onDel(item);
  }, [onDel]);
  
  // Definir la función renderCard con callbacks memorizados
  const renderCardFunction = useCallback(
    (item: CategoryItem, index: number, onClick: (item: CategoryItem) => void) => {
      return (
        <div style={{ gridColumn: "1 / -1", width: "100%" }}>
          <CategoryCard 
            key={item.id || `category-${index}`}
            item={item}
            // No pasamos onClick para categorías padre para evitar el error
            // onClick={onClick}
            onEdit={handleEdit}
            onDel={handleDelete}
          />
        </div>
      );
    },
    [handleEdit, handleDelete]
  );
  
  // Memorizar la referencia a la función para evitar recreaciones
  const renderCard = useMemo(() => renderCardFunction, [renderCardFunction]);

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
      </div>
      
      <List 
        onRenderCard={renderCard}
        // Pasamos null o una función vacía para evitar el error
        onRowClick={() => {}} 
      />
    </div>
  );
};

export default IncomeCategories;