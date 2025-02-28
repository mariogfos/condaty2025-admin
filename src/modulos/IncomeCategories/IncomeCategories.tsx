"use client";
import { useMemo, useState, useEffect } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./IncomeCategories.module.css";
import { 
  IconArrowDown,
  IconEdit, 
  IconTrash,
  IconSimpleAdd
} from "@/components/layout/icons/IconsBiblioteca";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Check from "@/mk/components/forms/Check/Check";
import Select from "@/mk/components/forms/Select/Select";
import HeadTitle from "@/components/HeadTitle/HeadTitle";

// Interfaces para tipar correctamente
interface CategoryItem {
  id?: string | number;
  name?: string;
  description?: string;
  category_id?: string | number | null;
  category?: {
    id?: string | number;
    name?: string;
  };
  subcategories?: CategoryItem[];
  type?: string;
  [key: string]: any;
}

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  item: CategoryItem;
  setItem: (item: CategoryItem) => void;
  errors: Record<string, any>;
  setErrors: (errors: Record<string, any>) => void;
  onSave: (item: CategoryItem) => void;
  extraData: Record<string, any>;
  action: string;
}

interface InputEvent {
  target: {
    name: string;
    value: any;
  };
}

// Componente para el formulario personalizado
const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onClose,
  item,
  setItem,
  errors,
  setErrors,
  onSave,
  extraData,
  action
}) => {
  const [isCateg, setIsCateg] = useState<string>(item.category_id ? "S" : "C");

  // Cuando se carga el formulario, establecer isCateg según si tiene category_id
  useEffect(() => {
    setIsCateg(item.category_id ? "S" : "C");
  }, [item.category_id]);

  const handleChange = (e: InputEvent) => {
    const { name, value } = e.target;
    setItem({ ...item, [name]: value });
  };

  // Manejar cambio de tipo (categoría o subcategoría)
  const onSelItem = (e: InputEvent) => {
    const selValue = e.target.name; // "C" o "S"
    setIsCateg(selValue);
    
    // Si es categoría, eliminar category_id
    if (selValue === "C") {
      setItem({
        ...item,
        category_id: null,
      });
    }
  };

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
      onSave={() => onSave(item)}
    >
      {action === "add" && (
        <>
          <p className={styles.subtitle}>Indica lo que quieras crear hoy</p>
          <div className={styles.optionsContainer}>
            <div className={styles.optionRow}>
              <p className={styles.optionLabel}>Quiero crear una categoría nueva</p>
              <Check
                name="C"
                checked={isCateg === "C"}
                onChange={onSelItem}
                optionValue={["Y", "N"]}
                value={isCateg === "C" ? "Y" : "N"}
              />
            </div>
            
            <div className={styles.optionRow}>
              <p className={styles.optionLabel}>Quiero registrar una sub-categoría nueva</p>
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

      {/* Si es subcategoría, mostrar selector de categoría padre */}
      {isCateg === "S" && (
        <div className={styles.formGroup}>
          <Select
            name="category_id"
            label="Categoría"
            placeholder="Selecciona una categoría"
            options={extraData?.categories || []}
            value={item.category_id || ""}
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
          value={item.name || ""}
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
          value={item.description || ""}
          onChange={handleChange}
          placeholder="Ej: Pagos variados entre limpieza de las oficinas, compras de herramientas para la oficina sueldos y refrigerio de los trabajadores"
          error={errors}
        />
      </div>

      {/* Campo oculto para el tipo */}
      <input 
        type="hidden" 
        name="type" 
        value="I" 
      />
    </DataModal>
  );
};

// Componente para renderizar una categoría con sus subcategorías
interface CategoryCardProps {
  item: CategoryItem;
  onClick: (item: CategoryItem) => void;
  onEdit: (item: CategoryItem) => void;
  onDel: (item: CategoryItem) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ item, onClick, onEdit, onDel }) => {
  const hasSubcategories = item.subcategories && item.subcategories.length > 0;
  const [showSubcategories, setShowSubcategories] = useState<boolean>(false);
  
  const toggleSubcategories = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubcategories(!showSubcategories);
  };
  
  return (
    <div className={styles.categoryCard}>
      <div className={styles.categoryHeader} onClick={() => onClick(item)}>
        <div className={styles.categoryTitle}>
          {hasSubcategories && (
            <IconArrowDown 
              className={`${styles.arrowIcon} ${showSubcategories ? styles.expanded : ''}`}
              onClick={toggleSubcategories}
            />
          )}
          <h3>{item.name}</h3>
        </div>
        <div className={styles.categoryDescription}>
          {item.description || "Sin descripción"}
        </div>
        <div className={styles.categoryActions}>
          <button 
            className={styles.editButton}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <IconEdit />
          </button>
          <button 
            className={styles.deleteButton}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDel(item);
            }}
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
            {item.subcategories.map((subcat) => (
              <div 
                key={subcat.id} 
                className={styles.subcategoryItem}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onClick(subcat);
                }}
              >
                <div className={styles.subcategoryContent}>
                  <span className={styles.subcategoryName}>{subcat.name}</span>
                  <span className={styles.subcategoryDesc}>{subcat.description || "Sin descripción"}</span>
                </div>
                <div className={styles.subcategoryActions}>
                  <button 
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onEdit(subcat);
                    }}
                  >
                    <IconEdit size={16} />
                  </button>
                  <button 
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDel(subcat);
                    }}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const IncomeCategories: React.FC = () => {
  const mod = {
    modulo: "categories",
    singular: "Categoría",
    plural: "Categorías",
    permiso: "",
    extraData: true,
    hideActions: {
      view: false,
      add: false,
      edit: false,
      del: false
    },
    saveMsg: {
      add: "Categoría creada con éxito",
      edit: "Categoría actualizada con éxito",
      del: "Categoría eliminada con éxito"
    },
    // Usar el renderForm personalizado
    renderForm: (props: any) => <CategoryForm {...props} />
  };

  const paramsInitial = {
    perPage: 10,
    page: 1,
    fullType: "L",
    type: "I", // Tipo Ingreso
    searchBy: "",
  };

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
            return <div className={styles.categoryName}>{props.item.name}</div>;
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
              ? <div>{props.item.category.name}</div>
              : <div className={styles.mainCategory}>Categoría Principal</div>;
          }
        },
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
    extraData
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // Función para renderizar los elementos de la lista usando el componente CategoryCard
  const renderCard = (item: CategoryItem, index: number, onClick: (item: CategoryItem) => void) => {
    return (
      <CategoryCard 
            key={item.id}
            item={item}
            onClick={onClick} onEdit={function (item: CategoryItem): void {
                throw new Error("Function not implemented.");
            } } onDel={function (item: CategoryItem): void {
                throw new Error("Function not implemented.");
            } }   
      />
    );
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <HeadTitle className={styles.headerTitle} />
        <div className={styles.headerContent}>
          <h1>Categorías de ingreso</h1>
          <p>Administre, agregue, elimine y organice todas las categorías de sus ingresos</p>
        </div>
        <Button 
          className={styles.addButton} 
          onClick={() => onAdd()}
        >
          <IconSimpleAdd /> Agregar categoría
        </Button>
      </div>
      
      <List 
        onRenderCard={renderCard}
        onRowClick={onView}
      />
    </div>
  );
};

export default IncomeCategories;