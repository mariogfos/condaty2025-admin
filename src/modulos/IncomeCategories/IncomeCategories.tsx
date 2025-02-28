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
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Check from "@/mk/components/forms/Check/Check";
import Select from "@/mk/components/forms/Select/Select";
import HeadTitle from "@/components/HeadTitle/HeadTitle";
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

    // useEffect(() => {
    //   setIsCateg(item.category_id ? "S" : "C");
    // }, [item.category_id]);

    const handleChange = (e: InputEvent) => {
      const { name, value } = e.target;
      set_Item((prevItem: any) => ({ ...prevItem, [name]: value }));
      // setItem((prevItem) => ({ ...prevItem, [name]: value }));
    };

    const onSelItem = (e: InputEvent) => {
      const selValue = e.target.name; // "C" o "S"
      setIsCateg(selValue);

      if (selValue === "C") {
        set_Item((prevItem: any) => ({
          ...prevItem,
          category_id: null,
        }));
      }
    };

    const handleSave = (e?: string) => {
      setItem(_Item);
      onSave(_Item);
    };

    // Verificar que existan categorías disponibles
    const categories = extraData?.categories || [];

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
              options={categories}
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

        <input type="hidden" name="type" value="I" />
      </DataModal>
    );
  }
);

CategoryForm.displayName = "CategoryForm";

// Componente para renderizar una categoría con sus subcategorías

const CategoryCard = memo(
  ({ item, onClick, onEdit, onDel }: CategoryCardProps) => {
    const hasSubcategories =
      item.subcategories && item.subcategories.length > 0;
    const [showSubcategories, setShowSubcategories] = useState<boolean>(false);

    const toggleSubcategories = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Usar actualización funcional del estado
      setShowSubcategories((prev) => !prev);
    };

    return (
      <div className={styles.categoryCard}>
        <div className={styles.categoryHeader} onClick={() => onClick(item)}>
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
              {item.subcategories?.map((subcat) => (
                <div
                  key={subcat.id || `subcat-${Math.random()}`}
                  className={styles.subcategoryItem}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onClick(subcat);
                  }}
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
  }
);

CategoryCard.displayName = "CategoryCard";

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
  type: "I", // Tipo Ingres
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

      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo",
        form: {
          type: "hidden",
          precarga: "I", // Tipo Ingreso
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
    }),
    []
  );

  const { userCan, List, onEdit, onDel, onAdd, onView, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const handleEdit = useCallback(
    (item: CategoryItem): void => {
      onEdit(item);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (item: CategoryItem): void => {
      onDel(item);
    },
    [onDel]
  );

  const renderCardFunction = (
    item: CategoryItem,
    index: number,
    onClick: (item: CategoryItem) => void
  ) => {
    return (
      <CategoryCard
        key={item.id || `category-${index}`}
        item={item}
        onClick={onClick}
        onEdit={handleEdit}
        onDel={handleDelete}
      />
    );
  };

  const renderCard = useMemo(
    () => renderCardFunction,
    [handleEdit, handleDelete]
  );

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <HeadTitle className={styles.headerTitle} />

        <Button className={styles.addButton} onClick={() => onAdd()}>
          <IconSimpleAdd /> Agregar categoría
        </Button>
      </div>

      {/* <List onRenderCard={renderCard} onRowClick={onView} /> */}
      <List onRowClick={onView} />
    </div>
  );
};

export default IncomeCategories;
