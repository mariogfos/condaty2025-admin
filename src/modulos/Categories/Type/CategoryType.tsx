export enum CategoryType {
  INCOME = 1,
  EXPENSE = 2,
}

/**
 * Mirrors `App\Modules\Categories\Enums\CategoryStatus`. From 1 since
 * 2026-10-06: INACTIVE was 0.
 */
export enum CategoryStatus {
  ACTIVE = 1,
  VOID = 2,
  INACTIVE = 3,
}

/**
 * Mirrors `App\Modules\Categories\Enums\CategoryFixed`.
 *
 * 🔴 From 1 since 2026-10-06: it was the boolean 0/1, and the `1` that meant
 * YES now means NO. Ask with {@link isSystemCategory}, never with the truth of
 * the value. Ships together with the API migration
 * `2026_10_06_110000_category_status_and_fixed_start_at_one`.
 */
export enum CategoryFixed {
  NO = 1,
  YES = 2,
}

/**
 * A system category (created by provisioning, resolved by the condominium
 * configuration): not picked, not edited, not deleted. The API rejects the
 * edit and the delete; this only keeps the screen from offering them.
 */
export const isSystemCategory = (item?: { fixed?: unknown } | null): boolean =>
  Number(item?.fixed) === CategoryFixed.YES;

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
