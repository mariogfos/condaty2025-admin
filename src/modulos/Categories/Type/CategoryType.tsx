export enum CategoryType {
  INCOME = 1,
  EXPENSE = 2,
}

export enum CategoryStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  VOID = 2,
}

export enum CategoryFixed {
  NO = 0,
  YES = 1,
}

export const CATEGORY_TYPE_LABELS = {
  [CategoryType.INCOME]: "Ingreso",
  [CategoryType.EXPENSE]: "Egreso",
} as const;

export const CATEGORY_STATUS_LABELS = {
  [CategoryStatus.INACTIVE]: "Inactivo",
  [CategoryStatus.ACTIVE]: "Activo",
  [CategoryStatus.VOID]: "Anulado",
} as const;

export const CATEGORY_FIXED_LABELS = {
  [CategoryFixed.NO]: "No",
  [CategoryFixed.YES]: "Sí",
} as const;

export interface CategoryItem {
  id?: string | number;
  name?: string;
  description?: string;
  category_id?: string | number | null;
  category?: {
    id?: string | number;
    name?: string;
  };
  hijos?: CategoryItem[];
  type?: CategoryType | number;
  status?: CategoryStatus | number;
  fixed?: CategoryFixed | number;
  _isAddingSubcategoryFlow?: boolean;
  [key: string]: any;
}

export interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  item: Partial<CategoryItem>;
  setItem: (
    item:
      | Partial<CategoryItem>
      | ((prev: Partial<CategoryItem>) => Partial<CategoryItem>)
  ) => void;
  errors: Record<string, any>;
  onSave: (item: Partial<CategoryItem>) => void;
  extraData?: Record<string, any>;
  getExtraData?: () => void;
  action: "add" | "edit" | string;
  categoryType: CategoryType | number;
  data?: any[];
}

export interface CategoryCardProps {
  item: CategoryItem;
  onClick?: (item: CategoryItem) => void;
  onEdit: (item: CategoryItem) => void;
  onDel: (item: CategoryItem) => void;
  categoryType: CategoryType | number;
  onAddSubcategory: (parentCategoryId: string) => void;
  className?: string;
  isSelected?: boolean;
  onSelectCard?: () => void;
}

export interface InputEvent {
  target: {
    name: string;
    value: any;
    type?: string;
    checked?: boolean;
  };
}
