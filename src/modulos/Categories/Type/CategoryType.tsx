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
  type?: 'I' | 'E' | string;
  fixed?: string;
  _isAddingSubcategoryFlow?: boolean;
  [key: string]: any;
}

export interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  item: Partial<CategoryItem>;
  setItem: (
    item: Partial<CategoryItem> | ((prev: Partial<CategoryItem>) => Partial<CategoryItem>)
  ) => void;
  errors: Record<string, any>;
  onSave: (item: Partial<CategoryItem>) => void;
  extraData?: Record<string, any>;
  getExtraData?: () => void;
  action: 'add' | 'edit' | string;
  categoryType: 'I' | 'E';
}export interface CategoryCardProps {
  item: CategoryItem;
  onClick?: (item: CategoryItem) => void;
  onEdit: (item: CategoryItem) => void;
  onDel: (item: CategoryItem) => void;
  categoryType: 'I' | 'E';
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
