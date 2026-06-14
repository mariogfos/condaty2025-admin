import { CategoryType, CategoryStatus } from "../Type/CategoryType";

export const CATEGORY_TYPES: Record<number, string> = {
  [CategoryType.INCOME]: "Ingreso",
  [CategoryType.EXPENSE]: "Egreso",
};

export const CATEGORY_STATUSES: Record<number, string> = {
  [CategoryStatus.INACTIVE]: "Inactivo",
  [CategoryStatus.ACTIVE]: "Activo",
  [CategoryStatus.VOID]: "Anulado",
};

export const FORM_LABELS = {
  parentCategory: "Categoría padre",
  name: "Nombre",
  bankAccount: "Asignar cuenta bancaria",
  description: "Descripción",
  buttonSave: "Guardar",
  buttonCancel: "Cancelar",
} as const;
