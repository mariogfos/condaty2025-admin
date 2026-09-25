import type {
  TaskCommentTypeValue,
  TaskPriorityValue,
  TaskStatusValue,
  TaskVisibilityValue,
} from "./taskEnums";

/**
 * 🔴 Los cuatro enums son NÚMEROS desde el corte 4 de la migración del módulo
 * (2026-09-24). Eran uniones de literales de string, y el API los guardaba en un
 * `enum(...)` de MySQL.
 *
 * ⚠️ Son alias de los tipos de `taskEnums.ts` y no uniones propias: dos listas de
 * valores para el mismo enum se desincronizan el día que se agregue un caso — y
 * el compilador no lo nota, porque las dos compilan.
 */
export type TaskPriority = TaskPriorityValue;

export type TaskStatus = TaskStatusValue;

export type TaskVisibility = TaskVisibilityValue;

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface TaskCategory {
  id: string;
  client_id: string | null;
  code?: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  // 🔴 Numero desde el 2026-09-24. Se deja `string` tambien porque una fila sin
  // migrar puede devolver el char viejo: lo normaliza
  // `normalizarEstadoDeCategoria()`.
  status?: number | string;
  is_disabled_for_client?: boolean;
}

export interface TaskPerson {
  id: string;
  name?: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
  avatar?: string;
  url_avatar?: string;
}

export interface TaskItem {
  id: string;
  client_id: string;
  title: string;
  description: string;
  images: string[];
  category_id: string | null;
  // ⚠️ `number | string`: lo que el API devuelve es el número, pero el query
  // string y un `JSON.parse` de caché vieja pueden traerlo como texto. Se pasa
  // por `normalizarEstado()` / `normalizarPrioridad()` antes de comparar.
  priority: TaskPriority | string;
  status: TaskStatus | string;
  created_by_type: string;
  created_by_id: string;
  assigned_to_user_id: string | null;
  assigned_to_guard_id: string | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  resolution_notes: string | null;
  resolution_images: string[] | null;
  visibility: TaskVisibility | string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: TaskCategory | null;
  created_by?: TaskPerson | null;
  creator?: TaskPerson | null;
  created_by_user?: TaskPerson | null;
  created_by_guard?: TaskPerson | null;
  created_by_owner?: TaskPerson | null;
  assigned_user?: TaskPerson | null;
  assigned_guard?: TaskPerson | null;
  assigned_owner?: TaskPerson | null;
}

export interface TaskListResponse {
  items: TaskItem[];
  pagination: PaginationMeta;
}

export interface TaskCategoryListResponse {
  items: TaskCategory[];
  pagination?: PaginationMeta;
}

export type TaskCommentType = TaskCommentTypeValue;

export interface TaskComment {
  id: string;
  task_id: string;
  commentable_type: string;
  commentable_id: string;
  content: string;
  images: string[];
  type: TaskCommentType | string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  commentable?: TaskPerson | null;
  user?: TaskPerson | null;
  guard?: TaskPerson | null;
  owner?: TaskPerson | null;
}

export interface UpsertTaskPayload {
  title: string;
  description: string;
  images: string[];
  category_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  visibility: TaskVisibility;
  due_date: string | null;
  assigned_to_user_id: string | null;
  assigned_to_guard_id: string | null;
}

export interface TaskFormState extends UpsertTaskPayload {
  id: string | null;
  assigned_to_type: "none" | "admin" | "guard";
  assigned_to_id: string;
}

export interface SelectOption {
  id: string;
  name: string;
  color?: string;
}
