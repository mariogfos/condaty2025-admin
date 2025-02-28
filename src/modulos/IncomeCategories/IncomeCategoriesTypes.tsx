export interface CategoryItem {
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
  action: string;
}

export interface InputEvent {
  target: {
    name: string;
    value: any;
  };
}

export interface CategoryCardProps {
  item: CategoryItem;
  onClick: (item: CategoryItem) => void;
  onEdit: (item: CategoryItem) => void;
  onDel: (item: CategoryItem) => void;
}
