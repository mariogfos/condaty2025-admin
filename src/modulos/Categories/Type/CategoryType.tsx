export interface CategoryItem {
  id?: string | number;
  name?: string;
  description?: string;
  category_id?: string | number | null;
  category?: {
    id?: string | number;
    name?: string;
  };
  hijos?: CategoryItem[]; // Para manejar las subcategorías según la API
  subcategories?: CategoryItem[]; // Mantenido para compatibilidad
  type?: string;
  fixed?: string;
  [key: string]: any;
}

export interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  item: CategoryItem;
  setItem: (
    item: CategoryItem | ((prev: CategoryItem) => CategoryItem)
  ) => void;
  errors: Record<string, any>;
  setErrors: (errors: Record<string, any>) => void;
  onSave: (item: CategoryItem) => void;
  extraData: Record<string, any>;
  getExtraData: Function;
  action: string;
  execute?: any;
  categoryType?: string; // Añadido para manejar el tipo de categoría (ingresos o egresos)
}

export interface CategoryCardProps {
  item: CategoryItem;
  onClick?: (item: CategoryItem) => void; // Opcional para permitir usarlo sin onClick
  onEdit: (item: CategoryItem) => void;
  onDel: (item: CategoryItem) => void;
  categoryType?: string; // Añadido para manejar el tipo de categoría (ingresos o egresos)
  onAddSubcategory: (categoryId: string) => void;
}

export interface InputEvent {
  target: {
    name: string;
    value: any;
  };
}
