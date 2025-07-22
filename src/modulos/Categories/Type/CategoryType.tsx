// src/components/Categories/Type/CategoryType.ts (o donde tengas tus tipos) //esto?? monton de comentarios superfluos

export interface CategoryItem {
  id?: string | number;
  name?: string;
  description?: string;
  category_id?: string | number | null;
  category?: {
    // Objeto de la categoría padre si se carga
    id?: string | number;
    name?: string;
  };
  hijos?: CategoryItem[]; // Para las subcategorías anidadas desde la API
  type?: "I" | "E" | string; // 'I' para Ingresos, 'E' para Egresos, o string genérico
  fixed?: string; // Si es una categoría fija y no editable/eliminable

  // Bandera temporal para el flujo de UI al agregar subcategorías desde una tarjeta padre.
  // No se guarda en el backend.
  _isAddingSubcategoryFlow?: boolean;

  // Permite otras propiedades que puedan venir de la API o del hook useCrud
  [key: string]: any;
}

export interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  item: Partial<CategoryItem>; // El item puede ser parcial al iniciar (ej. solo con category_id y la bandera)
  setItem: (
    item:
      | Partial<CategoryItem>
      | ((prev: Partial<CategoryItem>) => Partial<CategoryItem>)
  ) => void; // Permite actualizar el item del formulario
  errors: Record<string, any>; // Objeto para errores de validación
  // setErrors no es usualmente pasado directamente, useCrud lo maneja internamente o
  // los errores se reflejan en la prop 'errors'. Si CategoryForm necesita setear errores
  // específicos que useCrud no maneja, entonces sí se pasaría.
  // setErrors?: (errors: Record<string, any>) => void;
  onSave: (item: Partial<CategoryItem>) => void; // Función para guardar el item
  extraData?: Record<string, any>; // Datos adicionales como la lista de categorías padre
  getExtraData?: () => void; // Función para recargar extraData si es necesario
  action: "add" | "edit" | string; // Acción actual (agregar o editar)
  categoryType: "I" | "E"; // Tipo de categoría (Ingresos o Egresos)
}

export interface CategoryCardProps {
  item: CategoryItem; // El objeto de la categoría a mostrar
  onClick?: (item: CategoryItem) => void; // Click en una subcategoría
  onEdit: (item: CategoryItem) => void; // Acción de editar la categoría/subcategoría
  onDel: (item: CategoryItem) => void; // Acción de eliminar la categoría/subcategoría
  categoryType: "I" | "E"; // Para asegurar que el tipo se propague correctamente
  onAddSubcategory: (parentCategoryId: string) => void; // Acción para agregar una nueva subcategoría a esta categoría
  className?: string; // Clase opcional para la categoría/subcategoría
  isSelected?: boolean;
  onSelectCard?: () => void; // Clase opcional para la categoría/subcategoría
}

// Tipo genérico para eventos de input, si es necesario.
// React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> es más específico.
export interface InputEvent {
  target: {
    name: string;
    value: any;
    type?: string; // Para distinguir checkboxes, radios, etc.
    checked?: boolean; // Para checkboxes/radios
  };
}
