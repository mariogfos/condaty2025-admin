"use client";
import { useMemo, useState, useEffect, memo, useCallback } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Categories.module.css";
import {
  IconArrowDown,
  IconEdit,
  IconTrash,
  IconSimpleAdd,
  IconArrowRight,
  IconArrowLeft,

} from "@/components/layout/icons/IconsBiblioteca";
import DataModal from "@/mk/components/ui/DataModal/DataModal";

import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Check from "@/mk/components/forms/Check/Check";
import Select from "@/mk/components/forms/Select/Select";
import Link from "next/link"; // Importar Link para la navegación


import {
  CategoryCardProps,
  CategoryFormProps,
  CategoryItem,
  InputEvent,
} from "./Type/CategoryType";
import Button from "@/mk/components/forms/Button/Button";

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
    categoryType,
  }: CategoryFormProps) => {
    const [isCateg, setIsCateg] = useState<string>(
      item.category_id ? "S" : "C"
    );

    const [_Item, set_Item] = useState(item);
    const [wantSubcategories, setWantSubcategories] = useState<boolean>(false);

    // Actualizar el estado local cuando cambia el item prop
    useEffect(() => {
      // Asegurarnos de que tenemos una copia limpia
      set_Item(item);
      
      // Si viene con category_id preestablecido, seleccionar automáticamente "S" (subcategoría)
      if (item.category_id) {
        setIsCateg("S");
      } else {
        setIsCateg("C");
      }
    }, [item]);

    const handleChange = useCallback((e: InputEvent) => {
      const { name, value } = e.target;
      set_Item((prevItem: any) => ({ ...prevItem, [name]: value }));
      console.log("name", name);
      console.log("value", value);
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
      const cleanItem = { ..._Item };
    
      // Eliminar subcategorías para evitar conflictos
      if (cleanItem.hijos) {
        delete cleanItem.hijos;
      }
    
      // Lógica simplificada para category_id
      if (wantSubcategories) {
        // Si quiere subcategorías, debe haber seleccionado una categoría padre
        if (!cleanItem.category_id) {
          console.error("Error: Se intenta crear una subcategoría sin categoría padre");
          return; // Detener envío del formulario
        }
      } else {
        // Si no quiere subcategorías, siempre es null
        cleanItem.category_id = null;
      }
    
      // Remover propiedades que no necesitamos enviar al backend
      if (cleanItem._initItem) delete cleanItem._initItem;
      if (cleanItem.category) delete cleanItem.category;
      if (cleanItem.fixed && action === "edit") delete cleanItem.fixed;
    
      // Establecer tipo según categoryType (I para ingresos, E para egresos)
      cleanItem.type = categoryType === "I" ? "I" : "E";
    
      console.log("Guardando:", cleanItem);
    
      setItem(cleanItem);
      onSave(cleanItem);
    }, [_Item, onSave, setItem, wantSubcategories, action, categoryType]);

    // Formatear categorías para el select
    const formattedCategories = useMemo(() => {
      const cats = extraData?.categories || [];
      if (!Array.isArray(cats)) return [];

      return cats.map((cat: any) => ({
        id: cat.id || "",
        name: cat.name || "Sin nombre",
      }));
    }, [extraData?.categories]);

    // Mostrar tipo de categoría según parámetro
    const categoryTypeText = categoryType === "I" ? "ingresos" : "egresos";

    // Evitar renderizados durante cambios de estado local
    if (!open) return null;

    // Modificar para usar el DataModal existente
    return (
      <DataModal
        id="CategoriaForm"
        title="Registrar categoría"
        open={open}
        onClose={onClose}
        buttonText={
          action === "add"
            ? "Registrar categoría"
            : "Guardar cambios"
        }
        buttonCancel="Cancelar"
        onSave={handleSave}
        style={{
          backgroundColor: "#212121",
          borderRadius: "12px",
          maxWidth: "883px",
          width: "100%"
        }}
        className={styles.formModalContent}
      >
        <div className={styles.formContainer}>
          {/* Input de Nombre */}
          <div className={styles.formField}>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Nombre de la categoría*</span>
              <Input
                type="text"
                name="name"
                value={_Item.name || ""}
                onChange={handleChange}
                placeholder="Ej: Pagos al dpto. de administración"
                error={errors}
                required
                className={styles.customInput}
              />
            </div>
          </div>
          
          {/* Textarea de Descripción */}
          <div className={styles.formField}>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Descripción de la nueva categoría</span>
              <TextArea
                name="description"
                value={_Item.description || ""}
                onChange={handleChange}
                placeholder="Ej: Pagos variados entre limpieza de las oficinas, compras de herramientas..."
                error={errors}
                className={styles.customTextarea}
              />
            </div>
          </div>
          
        {/* Opción de subcategoría */}
        {action === "add" && isCateg === "C" && (
          <div className={styles.formField}>
            <div className={styles.subcategoryOption}>
              <div className={styles.subcategoryText}>
                <span className={styles.subcategoryTitle}>¿Quieres agregar una subcategoría?</span>
                <span className={styles.subcategoryDescription}>
                  Las subcategorías te ayudan a clasificar en opciones una categoría
                </span>
              </div>
     
              <label className={styles.toggleSwitch}>
  <input
    type="checkbox"
    checked={wantSubcategories}
    onChange={() => {
      // Solo cambiamos el estado del checkbox, sin tocar isCateg
      setWantSubcategories(!wantSubcategories);
    }}
    name="wantSubcategory"
  />
  <span className={styles.toggleSlider}></span>
</label>

            </div>
          </div>
        )}
          {/* Selector de categoría padre si es subcategoría */}
          {(isCateg === "S" || wantSubcategories) && (
  <div className={styles.formField}>
    <div className={styles.fieldContent}>
      <span className={styles.fieldLabel}>Selecciona una categoría padre</span>
      <Select
        name="category_id"
        placeholder="Selecciona una categoría"
        options={formattedCategories}
        value={_Item.category_id || ""}
        onChange={handleChange}
        error={errors}
        required
        className={styles.customSelect}
      />
    </div>
  </div>
)}

          {/* Input oculto para el tipo */}
          <input 
            type="hidden" 
            name="type" 
            value={categoryType === "I" ? "I" : "E"} 
          />
        </div>
      </DataModal>
    );
  }
);
CategoryForm.displayName = "CategoryForm";

// Componente para renderizar una categoría con sus subcategorías

const CategoryCard = memo(
  ({ item, onClick, onEdit, onDel, categoryType, onAddSubcategory }: CategoryCardProps) => {
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
    const handleEditClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        // Preparar el ítem antes de enviarlo a editar (para categorías padre)
        const editableItem = { ...item };

        // Asegúrate de que category_id sea null para categorías padre
        if (!editableItem.category_id) {
          editableItem.category_id = null;
        }

        // Establecer tipo según categoryType (I para ingresos, E para egresos)
        editableItem.type = categoryType === "I" ? "I" : "E";

        // Log para debug
        console.log("Editando:", editableItem);

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

    return (
      <div className={styles.categoryCard}>
        <div className={styles.categoryHeader} onClick={handleItemClick}>
          <div className={styles.categoryTitle}>
            {hasSubcategories && (
              <IconArrowDown
                className={`${styles.arrowIcon} ${
                  showSubcategories ? styles.expanded : ""
                }`}
                onClick={toggleSubcategories}
              />
            )}
            <h3>{item.name || "Sin nombre"}</h3>
          </div>
          <div className={styles.categoryDescription}>
            {item.description || "Sin descripción"}
          </div>
          <div className={styles.categoryActions}>
            
            <button className={styles.editButton} onClick={handleEditClick}>
              <IconEdit />
            </button>
            <button className={styles.deleteButton} onClick={handleDeleteClick}>
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

                  // Establecer tipo según categoryType (I para ingresos, E para egresos)
                  editableSubcat.type = categoryType === "I" ? "I" : "E";

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
                      <span className={styles.subcategoryName}>
                        {subcat.name || "Sin nombre"}
                      </span>
                      <span className={styles.subcategoryDesc}>
                        {subcat.description || "Sin descripción"}
                      </span>
                    </div>
                    <div className={styles.subcategoryActions}>
                      <button onClick={handleSubcatDelete}>
                        <IconTrash size={16} />
                      </button>
                      <button onClick={handleSubcatEdit}>
                        <IconEdit size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
               {/* Botón para agregar nueva subcategoría */}
               <div className={styles.addSubcategoryContainer}>
                <button 
                  className={styles.addSubcategoryButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSubcategory(item.id?.toString() || '');
                  }}
                >
                  <IconSimpleAdd size={16} color="var(--cAccent, #4caf50)" />
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

const BackNavigation = ({ type }: { type: "I" | "E" }) => {
  const isIncome = type === "I";
  const routePath = isIncome ? "/payments" : "/outlays";
  const linkText = isIncome ? "Volver a sección ingresos" : "Volver a sección egresos";
  
  return (
    <Link href={routePath} className={styles.backLink}>
      <IconArrowLeft />
      <span>{linkText}</span>
    </Link>
  );
};

// Componente principal que acepta props
const Categories = ({ type = "" }) => {
  // Determinar si es ingresos o egresos basado en el parámetro
  const isIncome = type === "I";
  const categoryTypeText = isIncome ? "ingresos" : "egresos";

  // Asegurar que type siempre sea "I" o "E"
  const typeToUse = isIncome ? "I" : "E";

  // Configuración para useCrud
  const mod: ModCrudType = useMemo(
    () => {
      // Crear objeto base con tipado explícito para extraData
      const modConfig: ModCrudType = {
        modulo: "categories",
        singular: "Categoría",
        plural: "Categorías",
        permiso: "",
        search: { hide: true },
        // Inicializar extraData con params que incluye el tipo (I o E)
        extraData: {
          params: { type: typeToUse }
        } as { params: Record<string, any> },
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
        renderForm: (props: any) => (
          <CategoryForm {...props} categoryType={typeToUse} />
        ),
      };
      
      return modConfig;
    },
    [typeToUse, categoryTypeText]
  );

  const paramsInitial = useMemo(() => {
    const params: any = {
      perPage: 10,
      page: 1,
      fullType: "L",
      searchBy: "",
      type: typeToUse, // Siempre incluir type (I o E)
    };

    return params;
  }, [typeToUse]);

  const fields = useMemo(() => {
    const fieldsConfig: any = {
      id: { rules: [], api: "e" },

      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { type: "text" },
        list: {
          onRender: (props: { item: CategoryItem }) => {
            return (
              <div className={styles.categoryName}>
                {props.item.name || "Sin nombre"}
              </div>
            );
          },
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
            return (
              <div className={styles.categoryDescription}>
                {props.item.description || "Sin descripción"}
              </div>
            );
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
        list: {
          width: "180px",
          onRender: (props: { item: CategoryItem }) => {
            return props.item.category ? (
              <div>{props.item.category.name || "Sin nombre"}</div>
            ) : (
              <div className={styles.mainCategory}>Categoría Principal</div>
            );
          },
        },
      },

      // Campo para manejar los hijos/subcategorías
      hijos: {
        rules: [],
        api: "",
        label: "Subcategorías",
      },

      // Incluir siempre el campo type
      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo",
        form: {
          type: "hidden",
          precarga: typeToUse, // I para ingresos, E para egresos
        },
      },
    };

    return fieldsConfig;
  }, [typeToUse]);

  const { userCan, List, onEdit, onDel, onAdd, onView, extraData, execute } =
    useCrud({
      paramsInitial,
      mod,
      fields,
    });

  // Funciones para manejar edición y eliminación
  const handleEdit = useCallback(
    (item: CategoryItem): void => {
      // Preparar el objeto antes de editar
      const editableItem = { ...item };

      // Para categorías padre, asegurar que category_id es null
      if (!editableItem.category_id) {
        editableItem.category_id = null;
      }

      // Siempre establecer el type como I o E
      editableItem.type = typeToUse;

      // Log para debug
      console.log("Enviando a editar:", editableItem);

      onEdit(editableItem);
    },
    [onEdit, typeToUse]
  );

  const handleDelete = useCallback(
    (item: CategoryItem): void => {
      onDel(item);
    },
    [onDel]
  );
  
// En el componente Categories:
const handleAddSubcategory = useCallback((categoryId: string) => {
  // Crear un nuevo ítem para la subcategoría con la categoría padre seleccionada
  const newItem = {
    category_id: categoryId,
    type: typeToUse,
    // Es importante NO incluir estos campos para que el formulario inicie limpio
    // pero con la categoría padre establecida
  };
  
  // Llamar a onAdd con el ítem precargado
  onAdd(newItem);
}, [onAdd, typeToUse]);

  // Definir la función renderCard con callbacks memorizados
// MODIFICAR:
const renderCardFunction = useCallback(
  (
    item: CategoryItem,
    index: number,
    onClick: (item: CategoryItem) => void
  ) => {
    return (
      <div style={{ gridColumn: "1 / -1", width: "100%" }}>
        <CategoryCard
          key={item.id || `category-${index}`}
          item={item}
          // No pasamos onClick para categorías padre para evitar el error
          // onClick={onClick}
          onEdit={handleEdit}
          onDel={handleDelete}
          categoryType={typeToUse}
          onAddSubcategory={handleAddSubcategory}
        />
      </div>
    );
  },
  [handleEdit, handleDelete, typeToUse, handleAddSubcategory]
);
const renderCard = useMemo(() => renderCardFunction, [renderCardFunction]);

  // Memorizar la referencia a la función para evitar recreaciones

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      {/* Componente de navegación de regreso */}
      <BackNavigation type={typeToUse} />
      <div className={styles.header}>
        <div className={styles.headerLeft}>
        <p className={styles.headerTitle}>
          Categorías de {categoryTypeText}
        </p>
        <p className={styles.headerDescription}>
          Administre, agregue y elimine las categorías y subcategorías de los {categoryTypeText}
        </p>
        </div>
        
        {/* Botón para registrar nueva categoría */}
        <Button 
          onClick={() => onAdd()}
          style={{
            padding: "8px 16px",
            width: "auto",
          }}
        >

          Registrar categoría
        </Button>
      </div>
  
      <List
        onRenderCard={renderCard}
        // Pasamos null o una función vacía para evitar el error
        onRowClick={() => {}}
      />
    </div>
  );
};
export default Categories;
