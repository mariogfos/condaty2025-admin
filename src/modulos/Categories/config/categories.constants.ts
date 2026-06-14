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

export const CATEGORIES_NAVIGATION = {
  backToDebts: "Volver a sección deudas",
  backToExpenses: "Volver a sección egresos",
  backToIncomes: "Volver a sección ingresos",
  headerExpenses: "Categorías de egresos",
  headerIncomes: "Categorías de ingresos",
  emptyMsg: "Sin categorías.",
  emptyLine2: "Crea categorías para organizar tus movimientos financieros.",
  newCategory: "Nueva categoría",
  addSubcategory: "Agregar subcategoría",
} as const;

export const NAVIGATION_PATHS = {
  debts: "/debts_manager",
  expenses: "/outlays",
  incomes: "/payments",
} as const;
