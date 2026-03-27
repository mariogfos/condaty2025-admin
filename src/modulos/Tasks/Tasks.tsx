"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useAxios from "@/mk/hooks/useAxios";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import { IconMonitorLine } from "@/components/layout/icons/IconsBiblioteca";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import TaskDetailModal from "./TaskDetailModal";
import {
  SelectOption,
  TaskCategory,
  TaskComment,
  TaskFormState,
  TaskItem,
  TaskPerson,
  TaskPriority,
  TaskStatus,
  TaskVisibility,
  UpsertTaskPayload,
} from "./types";
import styles from "./Tasks.module.css";

const getPriorityMeta = (
  priority: TaskPriority,
  translate: (key: string) => string,
) => {
  switch (priority) {
    case "urgent":
      return {
        label: translate("priorityUrgent"),
        color: "var(--cError)",
        bg: "var(--cHoverError)",
      };
    case "high":
      return {
        label: translate("priorityHigh"),
        color: "var(--cWarning)",
        bg: "var(--cHoverCompl4)",
      };
    case "low":
      return {
        label: translate("priorityLow"),
        color: "var(--cInfo)",
        bg: "var(--cHoverCompl3)",
      };
    default:
      return {
        label: translate("priorityMedium"),
        color: "var(--cWhite)",
        bg: "var(--cBlackV2)",
      };
  }
};

const getStatusMeta = (
  status: TaskStatus,
  translate: (key: string) => string,
) => {
  switch (status) {
    case "requested":
      return {
        label: translate("statusRequested"),
        color: "var(--cWarning)",
        bg: "var(--cHoverCompl4)",
      };
    case "pending":
      return {
        label: translate("statusPending"),
        color: "var(--cInfo)",
        bg: "var(--cHoverCompl3)",
      };
    case "in_progress":
      return {
        label: translate("statusInProgress"),
        color: "var(--cPrimary)",
        bg: "var(--cHoverCompl1)",
      };
    case "review":
      return {
        label: translate("statusReview"),
        color: "var(--cAccent)",
        bg: "var(--cHoverCompl2)",
      };
    case "completed":
      return {
        label: translate("statusCompleted"),
        color: "var(--cSuccess)",
        bg: "var(--cHoverSuccess)",
      };
    case "cancelled":
      return {
        label: translate("statusCancelled"),
        color: "var(--cError)",
        bg: "var(--cHoverError)",
      };
    default:
      return {
        label: translate("statusUnknown"),
        color: "var(--cWhite)",
        bg: "var(--cBlackV2)",
      };
  }
};

const STATUSES: TaskStatus[] = [
  "requested",
  "pending",
  "in_progress",
  "review",
  "completed",
  "cancelled",
];

type TaskFilters = {
  title: string;
  createdBy: string;
  assignedTo: string;
  categoryId: string;
  priority: "" | TaskPriority;
  status: "" | TaskStatus;
  dueDate: string;
  createdAt: string;
};

type KanbanGroupState = {
  status: string;
  label: string;
  items: TaskItem[];
  page: number;
  lastPage: number;
  total: number;
  loading: boolean;
};

type CategoryFormState = {
  id: string | null;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: "A" | "X";
};

const EMPTY_FILTERS: TaskFilters = {
  title: "",
  createdBy: "",
  assignedTo: "",
  categoryId: "",
  priority: "",
  status: "",
  dueDate: "",
  createdAt: "",
};

const createEmptyKanbanGroups = (): KanbanGroupState[] => [];

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  id: null,
  name: "",
  description: "",
  color: "#3B82F6",
  icon: "",
  status: "A",
};

const truncateText = (text: string = "") => {
  if (!text) return "";
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
};

const getCategoryTextColor = (hex?: string) => {
  if (!hex || !hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) {
    return "var(--cWhite)";
  }

  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 155 ? "var(--cBlack)" : "var(--cWhite)";
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const toDateDisplayValue = (value?: string | null) => {
  const normalized = toDateInputValue(value);
  if (!normalized) return "";

  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return normalized;

  return `${day}/${month}/${year}`;
};

const normalizeCategoryColor = (value: string) => {
  const raw = String(value || "").trim().replace(/^#/, "").toUpperCase();
  if (!raw) return "";

  if (!/^[0-9A-F]{6}([0-9A-F]{2})?$/.test(raw)) {
    return value;
  }

  return `#${raw}`;
};

const getColorPickerValue = (value: string) => {
  const normalized = normalizeCategoryColor(value);

  if (/^#[0-9A-F]{8}$/.test(normalized)) {
    return normalized.slice(0, 7);
  }

  if (/^#[0-9A-F]{6}$/.test(normalized)) {
    return normalized;
  }

  return "#3B82F6";
};

const isGenericCategory = (category?: TaskCategory | null) => {
  if (!category) return false;
  return !category.client_id;
};

const getPersonAvatar = (person?: TaskPerson | null) => {
  if (!person) return "";
  return person.url_avatar || person.avatar || "";
};

const getTaskCreator = (task?: TaskItem | null): TaskPerson | null => {
  if (!task) return null;
  return (
    task.created_by ||
    task.creator ||
    task.created_by_user ||
    task.created_by_guard ||
    task.created_by_owner ||
    null
  );
};

const getTaskAssignee = (task?: TaskItem | null): TaskPerson | null => {
  if (!task) return null;
  return task.assigned_user || task.assigned_guard || task.assigned_owner || null;
};

const getRowsArray = (payload: unknown): Record<string, unknown>[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }

  const recordPayload = payload as Record<string, unknown>;
  const candidates = [
    recordPayload?.items,
    recordPayload?.data,
    (recordPayload?.message as Record<string, unknown> | undefined)?.items,
    (recordPayload?.data as Record<string, unknown> | undefined)?.items,
    (recordPayload?.data as Record<string, unknown> | undefined)?.data,
    (recordPayload?.message as Record<string, unknown> | undefined)?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Record<string, unknown>[];
    }
  }

  return [];
};

const getRowsFromResponse = (payload: unknown): TaskItem[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload as TaskItem[];

  const recordPayload = payload as Record<string, unknown>;

  const candidates = [
    recordPayload?.items,
    recordPayload?.data,
    (recordPayload?.message as Record<string, unknown> | undefined)?.items,
    (recordPayload?.data as Record<string, unknown> | undefined)?.items,
    (recordPayload?.data as Record<string, unknown> | undefined)?.data,
    (
      (recordPayload?.data as Record<string, unknown> | undefined)
        ?.message as Record<string, unknown> | undefined
    )?.items,
    (recordPayload?.message as Record<string, unknown> | undefined)?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as TaskItem[];
  }

  return [];
};

const getCategoriesFromResponse = (payload: unknown): TaskCategory[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as TaskCategory[];

  const recordPayload = payload as Record<string, unknown>;
  const candidates = [
    recordPayload?.items,
    recordPayload?.data,
    (recordPayload?.message as Record<string, unknown> | undefined)?.items,
    (recordPayload?.data as Record<string, unknown> | undefined)?.items,
    (recordPayload?.data as Record<string, unknown> | undefined)?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as TaskCategory[];
  }

  return [];
};

const getCommentsFromResponse = (payload: unknown): TaskComment[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as TaskComment[];

  const recordPayload = payload as Record<string, unknown>;
  const candidates = [
    recordPayload?.items,
    recordPayload?.data,
    (recordPayload?.message as Record<string, unknown> | undefined)?.items,
    (recordPayload?.data as Record<string, unknown> | undefined)?.items,
    (recordPayload?.data as Record<string, unknown> | undefined)?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as TaskComment[];
  }

  return [];
};

const getPaginationFromResponse = (payload: unknown) => {
  const defaultPagination = {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 0,
  };

  if (!payload || Array.isArray(payload)) return defaultPagination;

  const recordPayload = payload as Record<string, unknown>;
  const candidates = [
    recordPayload?.pagination,
    (recordPayload?.data as Record<string, unknown> | undefined)?.pagination,
    (recordPayload?.message as Record<string, unknown> | undefined)?.pagination,
    (
      (recordPayload?.data as Record<string, unknown> | undefined)
        ?.message as Record<string, unknown> | undefined
    )?.pagination,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const pg = candidate as Record<string, unknown>;
      return {
        current_page: Number(pg.current_page || 1),
        last_page: Number(pg.last_page || 1),
        total: Number(pg.total || 0),
        per_page: Number(pg.per_page || 0),
      };
    }
  }

  return defaultPagination;
};

const getKanbanGroupsFromResponse = (payload: unknown): KanbanGroupState[] => {
  if (!payload) return createEmptyKanbanGroups();

  const root = payload as Record<string, unknown>;
  const dataRecord = (root?.data as Record<string, unknown> | undefined) || {};
  const messageRecord = (root?.message as Record<string, unknown> | undefined) || {};

  const groupsCandidate =
    (dataRecord?.groups as unknown[] | undefined) ||
    (root?.groups as unknown[] | undefined) ||
    (messageRecord?.groups as unknown[] | undefined);

  const catalogCandidate =
    (dataRecord?.status_catalog as unknown[] | undefined) ||
    (root?.status_catalog as unknown[] | undefined) ||
    (messageRecord?.status_catalog as unknown[] | undefined) ||
    [];

  const orderMap = new Map<string, number>();
  const labelMap = new Map<string, string>();
  catalogCandidate.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const rec = entry as Record<string, unknown>;
    const code = String(rec.code || "");
    if (!code) return;
    orderMap.set(code, Number(rec.order || 9999));
    labelMap.set(code, String(rec.label || code));
  });

  if (Array.isArray(groupsCandidate)) {
    const parsed = groupsCandidate
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => {
        const rec = entry as Record<string, unknown>;
        const status = String(rec.status || "");
        const rows = getRowsFromResponse(rec);
        const pg = getPaginationFromResponse(rec);
        return {
          status,
          label: String(rec.label || labelMap.get(status) || status),
          items: rows,
          page: pg.current_page || 1,
          lastPage: pg.last_page || 1,
          total: pg.total || rows.length,
          loading: false,
        };
      });

    parsed.sort((a, b) => {
      const orderA = orderMap.get(a.status) ?? 9999;
      const orderB = orderMap.get(b.status) ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.label.localeCompare(b.label);
    });

    return parsed;
  }

  const flatRows = getRowsFromResponse(payload);
  const grouped = new Map<string, KanbanGroupState>();
  flatRows.forEach((task) => {
    const status = String(task.status || "unknown");
    if (!grouped.has(status)) {
      grouped.set(status, {
        status,
        label: labelMap.get(status) || status,
        items: [],
        page: 1,
        lastPage: 1,
        total: 0,
        loading: false,
      });
    }
    const target = grouped.get(status);
    if (target) {
      target.items.push(task);
      target.total += 1;
    }
  });

  return Array.from(grouped.values());
};

const Tasks = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { translate } = useScopedI18n("tasks");
  const { execute } = useAxios();
  const { userCan, showToast, user } = useAuth();
  const processedOpenTaskIdRef = useRef<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [openFiltersModal, setOpenFiltersModal] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [kanbanGroups, setKanbanGroups] = useState<KanbanGroupState[]>(
    createEmptyKanbanGroups,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [changingDetailStatus, setChangingDetailStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openCategoriesModal, setOpenCategoriesModal] = useState(false);
  const [openCategoryFormModal, setOpenCategoryFormModal] = useState(false);
  const [showCreateTaskDetails, setShowCreateTaskDetails] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryDeletingId, setCategoryDeletingId] = useState<string | null>(null);
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string>>({});
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [categoryFormState, setCategoryFormState] = useState<CategoryFormState>(
    EMPTY_CATEGORY_FORM,
  );
  const [formState, setFormState] = useState<TaskFormState>({
    id: null,
    title: "",
    description: "",
    images: [],
    category_id: "",
    priority: "medium",
    status: "requested",
    visibility: "inherit",
    due_date: "",
    assigned_to_user_id: null,
    assigned_to_guard_id: null,
    assigned_to_type: "none",
    assigned_to_id: "",
  });
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [adminOptions, setAdminOptions] = useState<SelectOption[]>([]);
  const [guardOptions, setGuardOptions] = useState<SelectOption[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<SelectOption[]>([]);

  const buildTaskQueryParams = (
    sourceFilters: TaskFilters,
    page: number,
    perPage: number,
    extra: Record<string, unknown> = {},
  ) => {
    const params: Record<string, unknown> = {
      page,
      perPage,
      fullType: "L",
      ...extra,
    };

    if (sourceFilters.title) params.title = sourceFilters.title;
    if (sourceFilters.categoryId) params.categoryId = sourceFilters.categoryId;
    if (sourceFilters.priority) params.priority = sourceFilters.priority;
    if (sourceFilters.status) params.status = sourceFilters.status;
    if (sourceFilters.dueDate) params.dueDate = sourceFilters.dueDate;
    if (sourceFilters.createdAt) params.createdAt = sourceFilters.createdAt;

    if (sourceFilters.createdBy) {
      const [createdByType, createdById] = sourceFilters.createdBy.split(":");
      if (createdByType && createdById) {
        params.createdByType = createdByType;
        params.createdById = createdById;
      }
    }

    if (sourceFilters.assignedTo) {
      const [assignedToType, assignedToId] = sourceFilters.assignedTo.split(":");
      if (assignedToType && assignedToId) {
        params.assignedToType = assignedToType;
        params.assignedToId = assignedToId;
      }
    }

    return params;
  };

  const loadTasks = async (page: number = 1, sourceFilters: TaskFilters = filters) => {
    setLoading(true);
    const { data } = await execute(
      "/tasks",
      "GET",
      buildTaskQueryParams(sourceFilters, page, 20),
      false,
      true,
    );
    const rows = getRowsFromResponse(data);
    const pagination = getPaginationFromResponse(data);

    setTasks(rows);
    setCurrentPage(pagination.current_page || page || 1);
    setLastPage(pagination.last_page || 1);
    setTotalItems(pagination.total || rows.length || 0);
    setLoading(false);
  };

  const loadKanban = async (sourceFilters: TaskFilters = filters) => {
    setLoading(true);
    const { data } = await execute(
      "/tasks",
      "GET",
      buildTaskQueryParams(sourceFilters, 1, 10, { mode: "kanban" }),
      false,
      true,
    );
    setKanbanGroups(getKanbanGroupsFromResponse(data));
    setLoading(false);
  };

  const loadMoreKanbanGroup = async (
    status: string,
    page: number,
    sourceFilters: TaskFilters = filters,
  ) => {
    const targetGroup = kanbanGroups.find((group) => group.status === status);
    if (!targetGroup || targetGroup.loading || page <= targetGroup.page) return;

    setKanbanGroups((prev) =>
      prev.map((group) =>
        group.status === status ? { ...group, loading: true } : group,
      ),
    );

    const { data } = await execute(
      "/tasks/kanban",
      "GET",
      buildTaskQueryParams(sourceFilters, page, 10, { status }),
      false,
      true,
    );

    const incomingGroups = getKanbanGroupsFromResponse(data);
    const incomingGroup =
      incomingGroups.find((group) => group.status === status) || incomingGroups[0] || null;

    if (!incomingGroup) {
      setKanbanGroups((prev) =>
        prev.map((group) =>
          group.status === status ? { ...group, loading: false } : group,
        ),
      );
      return;
    }

    setKanbanGroups((prev) =>
      prev.map((group) => {
        if (group.status !== status) return group;

        const existingIds = new Set(group.items.map((item) => item.id));
        const incomingUnique = incomingGroup.items.filter((item) => !existingIds.has(item.id));
        const merged = [...group.items, ...incomingUnique];
        return {
          ...group,
          items: merged,
          page: incomingGroup.page || page || group.page,
          lastPage: incomingGroup.lastPage || group.lastPage,
          total: incomingGroup.total || group.total,
          loading: false,
        };
      }),
    );
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    const { data } = await execute(
      "/task-categories",
      "GET",
      { page: 1, perPage: -1 },
      false,
      true,
    );
    const rows = getCategoriesFromResponse(data);

    setTaskCategories(rows);
    setCategoryOptions(
      rows
        .filter((item: TaskCategory & { is_disabled_for_client?: boolean }) => {
          const isInactive = String(item.status || "").toUpperCase() === "X";
          const isDisabledForClient = Boolean(item.is_disabled_for_client);
          return !isInactive && !isDisabledForClient;
        })
        .map((item: TaskCategory) => ({
        id: item.id,
        name: item.name,
        color: item.color,
        })),
    );
    setCategoriesLoading(false);
  };

  const canManageCategories = useMemo(() => {
    if (!user) return false;
    return (
      Boolean(user?.role) ||
      userCan("task-categories", "C", null) ||
      userCan("task-categories", "U", null) ||
      userCan("task-categories", "D", null) ||
      userCan("categories", "C", null) ||
      userCan("categories", "U", null) ||
      userCan("categories", "D", null)
    );
  }, [user, userCan]);

  const openCategoriesManager = async () => {
    await loadCategories();
    setOpenCategoriesModal(true);
  };

  const openCreateCategory = () => {
    setCategoryFormErrors({});
    setCategoryFormState(EMPTY_CATEGORY_FORM);
    setOpenCategoryFormModal(true);
  };

  const openEditCategory = (category: TaskCategory) => {
    if (isGenericCategory(category)) {
      showToast(translate("genericCategoryNotEditable"), "error");
      return;
    }

    setCategoryFormErrors({});
    setCategoryFormState({
      id: category.id,
      name: category.name || "",
      description: category.description || "",
      color: category.color || "#3B82F6",
      icon: category.icon || "",
      status: String(category.status || "A").toUpperCase() === "X" ? "X" : "A",
    });
    setOpenCategoryFormModal(true);
  };

  const validateCategoryForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!categoryFormState.name.trim()) {
      nextErrors.name = "Campo requerido";
    }

    const normalizedColor = normalizeCategoryColor(categoryFormState.color);
    if (
      normalizedColor &&
      !/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(normalizedColor)
    ) {
      nextErrors.color = "Color inválido. Usa formato HEX";
    }

    setCategoryFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveCategory = async () => {
    if (!validateCategoryForm()) return;

    setCategorySaving(true);

    const payload: Record<string, unknown> = {
      name: categoryFormState.name.trim(),
      description: categoryFormState.description.trim() || undefined,
      color: normalizeCategoryColor(categoryFormState.color),
      icon: categoryFormState.icon.trim() || undefined,
      status: categoryFormState.status,
    };

    const method = categoryFormState.id ? "PUT" : "POST";
    const endpoint = categoryFormState.id
      ? `/task-categories/${categoryFormState.id}`
      : "/task-categories";

    const { data } = await execute(endpoint, method, payload, false, true);
    setCategorySaving(false);

    if (!data?.success) {
      showToast(data?.message || "No se pudo guardar la categoría", "error");
      return;
    }

    showToast(data?.message || "Categoría guardada", "success");
    setOpenCategoryFormModal(false);
    setCategoryFormState(EMPTY_CATEGORY_FORM);
    await loadCategories();
  };

  const removeCategory = async (category: TaskCategory) => {
    const confirmed = window.confirm(
      `${translate("confirmDeleteCategory")}\n\n${category.name || ""}`,
    );

    if (!confirmed) return;

    setCategoryDeletingId(category.id);
    const { data } = await execute(
      `/task-categories/${category.id}`,
      "DELETE",
      {},
      false,
      true,
    );
    setCategoryDeletingId(null);

    if (!data?.success) {
      showToast(data?.message || "No se pudo eliminar la categoría", "error");
      return;
    }

    showToast(data?.message || "Categoría eliminada", "success");
    await loadCategories();
  };

  const loadAssignablePeople = async () => {
    const [usersResponse, guardsResponse, ownersResponse] = await Promise.all([
      execute(
        "/users",
        "GET",
        { page: 1, perPage: 300, fullType: "L" },
        false,
        true,
      ),
      execute(
        "/guards",
        "GET",
        { page: 1, perPage: 300, fullType: "L" },
        false,
        true,
      ),
      execute(
        "/owners",
        "GET",
        { page: 1, perPage: 300, fullType: "L" },
        false,
        true,
      ),
    ]);

    const users = getRowsArray(usersResponse.data).map((row) => {
      const person = row as unknown as TaskPerson;
      return {
        id: String(row.id || ""),
        name: getFullName(person) || String(row.name || "-"),
        img: String(row.url_avatar || row.avatar || ""),
      };
    });

    const guards = getRowsArray(guardsResponse.data).map((row) => {
      const person = row as unknown as TaskPerson;
      return {
        id: String(row.id || ""),
        name: getFullName(person) || String(row.name || "-"),
        img: String(row.url_avatar || row.avatar || ""),
      };
    });

    const owners = getRowsArray(ownersResponse.data).map((row) => {
      const person = row as unknown as TaskPerson;
      return {
        id: String(row.id || ""),
        name: getFullName(person) || String(row.name || "-"),
        img: String(row.url_avatar || row.avatar || ""),
      };
    });

    setAdminOptions(users.filter((option) => option.id));
    setGuardOptions(guards.filter((option) => option.id));
    setOwnerOptions(owners.filter((option) => option.id));
  };

  useEffect(() => {
    loadTasks(1);
    loadCategories();
    loadAssignablePeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setErrors({});
    setShowCreateTaskDetails(false);
    setFormState({
      id: null,
      title: "",
      description: "",
      images: [],
      category_id: "",
      priority: "medium",
      status: "requested",
      visibility: "inherit",
      due_date: "",
      assigned_to_user_id: null,
      assigned_to_guard_id: null,
      assigned_to_type: "none",
      assigned_to_id: "",
    });
    setOpenModal(true);
  };

  const openEdit = (task: TaskItem) => {
    setErrors({});
    setShowCreateTaskDetails(true);
    setFormState({
      id: task.id,
      title: task.title || "",
      description: task.description || "",
      images: task.images || [],
      category_id: task.category_id || "",
      priority: task.priority || "medium",
      status: task.status || "requested",
      visibility: task.visibility || "inherit",
      due_date: toDateInputValue(task.due_date),
      assigned_to_user_id: task.assigned_to_user_id || null,
      assigned_to_guard_id: task.assigned_to_guard_id || null,
      assigned_to_type: task.assigned_to_guard_id
        ? "guard"
        : task.assigned_to_user_id
          ? "admin"
          : "none",
      assigned_to_id:
        task.assigned_to_guard_id || task.assigned_to_user_id || "",
    });
    setOpenModal(true);
  };

  const openTaskDetail = async (task: TaskItem) => {
    setDetailTask(task);
    setCommentText("");
    setCommentImages([]);
    setOpenDetail(true);
    setLoadingComments(true);
    const { data } = await execute(
      `/tasks/${task.id}/comments`,
      "GET",
      {},
      false,
      true,
    );
    setComments(getCommentsFromResponse(data));
    setLoadingComments(false);
  };

  const findTaskInState = (taskId: string) => {
    const taskFromTable = tasks.find((item) => item.id === taskId);
    if (taskFromTable) return taskFromTable;

    return kanbanGroups
      .flatMap((group) => group.items)
      .find((item) => item.id === taskId);
  };

  const createFallbackTask = (taskId: string): TaskItem => ({
    id: taskId,
    client_id: "",
    title: "Tarea",
    description: "",
    images: [],
    category_id: null,
    priority: "medium",
    status: "pending",
    created_by_type: "",
    created_by_id: "",
    assigned_to_user_id: null,
    assigned_to_guard_id: null,
    assigned_at: null,
    started_at: null,
    completed_at: null,
    due_date: null,
    resolution_notes: null,
    resolution_images: null,
    visibility: "inherit",
    created_at: "",
    updated_at: "",
    deleted_at: null,
  });

  const openTaskFromQueryParam = async (taskId: string) => {
    const clearOpenTaskParam = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("openTaskId");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl);
    };

    try {
      let targetTask = findTaskInState(taskId);

      if (!targetTask) {
        const { data } = await execute(`/tasks/${taskId}`, "GET", {}, false, true);
        const candidates = [data, data?.data, data?.message, data?.data?.message];

        for (const candidate of candidates) {
          const fromRows = getRowsFromResponse(candidate);
          if (fromRows.length > 0) {
            targetTask = fromRows.find((item) => item.id === taskId) || fromRows[0];
            break;
          }

          if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
            const typedCandidate = candidate as TaskItem;
            if (typedCandidate.id === taskId) {
              targetTask = typedCandidate;
              break;
            }
          }
        }
      }

      if (!targetTask) {
        const lookupParams: Array<Record<string, unknown>> = [
          { page: 1, perPage: 1, fullType: "L", id: taskId },
          { page: 1, perPage: 1, fullType: "L", taskId },
          { page: 1, perPage: 1, fullType: "L", task_id: taskId },
          { page: 1, perPage: 20, fullType: "L", searchBy: taskId },
        ];

        for (const params of lookupParams) {
          const { data } = await execute("/tasks", "GET", params, false, true);
          const rows = getRowsFromResponse(data);
          const found = rows.find((item) => item.id === taskId) || rows[0];
          if (found) {
            targetTask = found;
            break;
          }
        }
      }

      await openTaskDetail(targetTask || createFallbackTask(taskId));
    } catch (error) {
      console.error("Error opening task from notification:", error);
      await openTaskDetail(createFallbackTask(taskId));
    } finally {
      clearOpenTaskParam();
    }
  };

  const submitComment = async () => {
    if (!detailTask || !commentText.trim()) return;
    setSendingComment(true);
    const { data } = await execute(
      `/tasks/${detailTask.id}/comments`,
      "POST",
      {
        content: commentText.trim(),
        images: commentImages || [],
        type: "comment",
      },
      false,
      true,
    );
    setSendingComment(false);

    if (!data?.success) {
      showToast(data?.message || "No se pudo crear el comentario", "error");
      return;
    }

    setCommentText("");
    setCommentImages([]);
    const { data: commentsData } = await execute(
      `/tasks/${detailTask.id}/comments`,
      "GET",
      {},
      false,
      true,
    );
    setComments(getCommentsFromResponse(commentsData));
  };

  const priorityOptions = useMemo(
    () => [
      { id: "urgent" as TaskPriority, name: translate("priorityUrgent") },
      { id: "high" as TaskPriority, name: translate("priorityHigh") },
      { id: "medium" as TaskPriority, name: translate("priorityMedium") },
      { id: "low" as TaskPriority, name: translate("priorityLow") },
    ],
    [translate],
  );

  const statusOptions = useMemo(
    () => [
      { id: "requested" as TaskStatus, name: translate("statusRequested") },
      { id: "pending" as TaskStatus, name: translate("statusPending") },
      { id: "in_progress" as TaskStatus, name: translate("statusInProgress") },
      { id: "review" as TaskStatus, name: translate("statusReview") },
      { id: "completed" as TaskStatus, name: translate("statusCompleted") },
      { id: "cancelled" as TaskStatus, name: translate("statusCancelled") },
    ],
    [translate],
  );

  const creatorFilterOptions = useMemo(() => {
    const userOptions = adminOptions.map((option) => ({
      id: `user:${option.id}`,
      name: option.name,
    }));
    const guardsAsCreators = guardOptions.map((option) => ({
      id: `guard:${option.id}`,
      name: option.name,
    }));
    const ownersAsCreators = ownerOptions.map((option) => ({
      id: `owner:${option.id}`,
      name: option.name,
    }));

    return [
      { id: "", name: translate("allFeminine") },
      ...userOptions,
      ...guardsAsCreators,
      ...ownersAsCreators,
    ];
  }, [adminOptions, guardOptions, ownerOptions, translate]);

  const assigneeFilterOptions = useMemo(() => {
    const userOptions = adminOptions.map((option) => ({
      id: `user:${option.id}`,
      name: option.name,
    }));
    const guardOptionsForAssignee = guardOptions.map((option) => ({
      id: `guard:${option.id}`,
      name: option.name,
    }));

    return [
      { id: "", name: translate("allFeminine") },
      ...userOptions,
      ...guardOptionsForAssignee,
    ];
  }, [adminOptions, guardOptions, translate]);

  const visibilityOptions = useMemo(
    () => [
      { id: "inherit" as TaskVisibility, name: translate("visibilityInherit") },
      { id: "public" as TaskVisibility, name: translate("visibilityPublic") },
      { id: "private" as TaskVisibility, name: translate("visibilityPrivate") },
    ],
    [translate],
  );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formState.title?.trim()) nextErrors.title = "Campo requerido";
    if (!formState.priority) nextErrors.priority = "Campo requerido";
    if (!formState.status) nextErrors.status = "Campo requerido";
    if (!formState.visibility) nextErrors.visibility = "Campo requerido";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveTask = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const payload: UpsertTaskPayload = {
      title: formState.title,
      description: formState.description,
      images: formState.images || [],
      category_id: formState.category_id || null,
      priority: formState.priority,
      status: formState.status,
      visibility: formState.visibility,
      due_date: formState.due_date || null,
      assigned_to_user_id:
        formState.assigned_to_type === "admin" && formState.assigned_to_id
          ? formState.assigned_to_id
          : null,
      assigned_to_guard_id:
        formState.assigned_to_type === "guard" && formState.assigned_to_id
          ? formState.assigned_to_id
          : null,
    };

    const method = formState.id ? "PUT" : "POST";
    const url = formState.id ? `/tasks/${formState.id}` : "/tasks";
    const { data } = await execute(url, method, payload, false, true);
    setSaving(false);

    if (data?.success) {
      setOpenModal(false);
      showToast(data?.message || "Tarea guardada", "success");
      if (viewMode === "table") {
        loadTasks(currentPage, filters);
      } else {
        loadKanban(filters);
      }
      return;
    }

    showToast(data?.message || "No se pudo guardar la tarea", "error");
  };

  const updateTaskStatus = async (task: TaskItem, nextStatus: string) => {
    if (task.status === nextStatus) return true;

    const previousStatus = task.status;

    setTasks((prevTasks) =>
      prevTasks.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus as TaskStatus } : item,
      ),
    );
    setKanbanGroups((prev) => {
      const sourceIndex = prev.findIndex((group) =>
        group.items.some((item) => item.id === task.id),
      );

      if (sourceIndex < 0) return prev;

      const sourceGroup = prev[sourceIndex];
      const movedTask = sourceGroup.items.find((item) => item.id === task.id);
      if (!movedTask) return prev;

      const next = prev.map((group) => ({ ...group, items: [...group.items] }));
      next[sourceIndex] = {
        ...next[sourceIndex],
        items: next[sourceIndex].items.filter((item) => item.id !== task.id),
        total: Math.max(0, (next[sourceIndex].total || 0) - 1),
      };

      const targetIndex = next.findIndex((group) => group.status === nextStatus);
      if (targetIndex >= 0) {
        next[targetIndex] = {
          ...next[targetIndex],
          items: [{ ...movedTask, status: nextStatus as TaskStatus }, ...next[targetIndex].items],
          total: (next[targetIndex].total || 0) + 1,
        };
      } else {
        next.push({
          status: nextStatus,
          label: nextStatus,
          items: [{ ...movedTask, status: nextStatus as TaskStatus }],
          page: 1,
          lastPage: 1,
          total: 1,
          loading: false,
        });
      }

      return next;
    });
    setDetailTask((prev) =>
      prev && prev.id === task.id ? { ...prev, status: nextStatus as TaskStatus } : prev,
    );

    const payload: UpsertTaskPayload = {
      title: task.title,
      description: task.description,
      images: task.images || [],
      category_id: task.category_id || null,
      priority: task.priority,
      status: nextStatus as TaskStatus,
      visibility: task.visibility,
      due_date: task.due_date || null,
      assigned_to_user_id: task.assigned_to_user_id || null,
      assigned_to_guard_id: task.assigned_to_guard_id || null,
    };

    const { data } = await execute(`/tasks/${task.id}`, "PUT", payload, false, true);

    if (data?.success) {
      showToast(data?.message || "Estado actualizado", "success");
      return true;
    }

    setTasks((prevTasks) =>
      prevTasks.map((item) =>
        item.id === task.id ? { ...item, status: previousStatus } : item,
      ),
    );
    if (viewMode === "kanban") {
      loadKanban(filters);
    }
    setDetailTask((prev) =>
      prev && prev.id === task.id ? { ...prev, status: previousStatus } : prev,
    );
    showToast(data?.message || "No se pudo cambiar el estado", "error");
    return false;
  };

  const handleDetailStatusChange = async (nextStatus: TaskStatus) => {
    if (!detailTask || changingDetailStatus) return;
    setChangingDetailStatus(true);
    await updateTaskStatus(detailTask, nextStatus);
    setChangingDetailStatus(false);
  };

  const handleDragStart = (event: React.DragEvent<HTMLElement>, taskId: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragOverColumn = (
    event: React.DragEvent<HTMLElement>,
    status: string,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDropOnColumn = async (
    event: React.DragEvent<HTMLElement>,
    nextStatus: string,
  ) => {
    event.preventDefault();

    const droppedTaskId = event.dataTransfer.getData("text/plain") || draggingTaskId;

    setDragOverStatus(null);
    setDraggingTaskId(null);

    if (!droppedTaskId) return;

    const taskFromTable = tasks.find((item) => item.id === droppedTaskId);
    const taskFromKanban = kanbanGroups.flatMap((group) => group.items).find((item) => item.id === droppedTaskId);
    const task = taskFromTable || taskFromKanban;
    if (!task) return;

    await updateTaskStatus(task, nextStatus);
  };

  const resolveTaskCreator = (task: TaskItem): TaskPerson | null => {
    const directCreator = getTaskCreator(task);
    if (directCreator) return directCreator;

    if (!task.created_by_id) return null;

    if (String(task.created_by_type || "").toLowerCase().includes("guard")) {
      const guard = guardOptions.find((item) => item.id === task.created_by_id);
      return guard
        ? ({ id: guard.id, name: guard.name, url_avatar: (guard as any).img } as TaskPerson)
        : null;
    }

    if (String(task.created_by_type || "").toLowerCase().includes("owner")) {
      const owner = ownerOptions.find((item) => item.id === task.created_by_id);
      return owner
        ? ({ id: owner.id, name: owner.name, url_avatar: (owner as any).img } as TaskPerson)
        : null;
    }

    const admin = adminOptions.find((item) => item.id === task.created_by_id);
    return admin
      ? ({ id: admin.id, name: admin.name, url_avatar: (admin as any).img } as TaskPerson)
      : null;
  };

  const resolveTaskAssignee = (task: TaskItem): TaskPerson | null => {
    const directAssignee = getTaskAssignee(task);
    if (directAssignee) return directAssignee;

    if (task.assigned_to_guard_id) {
      const guard = guardOptions.find((item) => item.id === task.assigned_to_guard_id);
      return guard
        ? ({ id: guard.id, name: guard.name, url_avatar: (guard as any).img } as TaskPerson)
        : null;
    }

    if (task.assigned_to_user_id) {
      const admin = adminOptions.find((item) => item.id === task.assigned_to_user_id);
      return admin
        ? ({ id: admin.id, name: admin.name, url_avatar: (admin as any).img } as TaskPerson)
        : null;
    }

    return null;
  };

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter((value) => String(value || "").trim()).length,
    [filters],
  );
  const freezeBoardRender = openModal || openFiltersModal;

  const openFilters = () => {
    setDraftFilters(filters);
    setOpenFiltersModal(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    if (viewMode === "table") {
      loadTasks(1, draftFilters);
    } else {
      loadKanban(draftFilters);
    }
    setOpenFiltersModal(false);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    if (viewMode === "table") {
      loadTasks(1, EMPTY_FILTERS);
    } else {
      loadKanban(EMPTY_FILTERS);
    }
  };

  useEffect(() => {
    if (viewMode === "kanban") {
      loadKanban(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    const taskId = searchParams.get("openTaskId");
    if (!taskId) {
      processedOpenTaskIdRef.current = null;
      return;
    }
    if (processedOpenTaskIdRef.current === taskId) return;

    processedOpenTaskIdRef.current = taskId;
    openTaskFromQueryParam(taskId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tasks, kanbanGroups]);

  if (!userCan("", "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.leftControls}>
          <Button
            variant="secondary"
            onClick={openFilters}
            className={styles.smallButton}
          >
            {translate("filters")} {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
          </Button>
          <Button
            variant="secondary"
            onClick={clearFilters}
            className={styles.smallButton}
            disabled={activeFiltersCount === 0}
          >
            {translate("clearFilters")}
          </Button>
          {activeFiltersCount > 0 && (
            <span className={styles.filterSummary}>
              {translate("filtersActiveCount")} {activeFiltersCount}
            </span>
          )}
        </div>
        <div className={styles.rightControls}>
          <Button
            variant={viewMode === "table" ? "primary" : "secondary"}
            onClick={() => {
              setViewMode("table");
              loadTasks(currentPage, filters);
            }}
            className={styles.smallButton}
          >
            {translate("tableView")}
          </Button>
          <Button
            variant={viewMode === "kanban" ? "primary" : "secondary"}
            onClick={() => setViewMode("kanban")}
            className={styles.smallButton}
          >
            {translate("kanbanView")}
          </Button>
          <Button onClick={openCreate} className={styles.smallButton}>
            {translate("newTask")}
          </Button>
          {canManageCategories && (
            <Button
              variant="secondary"
              onClick={() => void openCategoriesManager()}
              className={styles.smallButton}
            >
              {translate("manageCategories")}
            </Button>
          )}
        </div>
      </div>

      {freezeBoardRender ? null : loading ? (
        <div className={styles.emptyBox}>{translate("loading")}</div>
      ) : viewMode === "table" && tasks.length === 0 ? (
        <div className={styles.emptyBox}>
          <IconMonitorLine size={60} color="var(--cWhiteV1)" />
          <p>{translate("emptyMsg")}</p>
          <p>{translate("emptyLine2")}</p>
        </div>
      ) : viewMode === "table" ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
            <thead>
              <tr>
                <th>{translate("title")}</th>
                <th>{translate("createdBy")}</th>
                <th>{translate("assignedTo")}</th>
                <th>{translate("category")}</th>
                <th>{translate("priority")}</th>
                <th className={styles.statusHeaderCenter}>{translate("status")}</th>
                <th>{translate("dueDate")}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const priorityMeta = getPriorityMeta(task.priority, translate);
                const statusMeta = getStatusMeta(task.status, translate);
                const creator = resolveTaskCreator(task);
                const assignee = resolveTaskAssignee(task);
                const dueDateDisplay = toDateDisplayValue(task.due_date);
                return (
                  <tr key={task.id} onClick={() => openTaskDetail(task)}>
                    <td>
                      <div className={styles.taskTitle}>{task.title}</div>
                      <div className={styles.taskDesc}>{truncateText(task.description)}</div>
                    </td>
                    <td>
                      {creator ? (
                        <div className={styles.personCell}>
                          <Avatar
                            src={getPersonAvatar(creator)}
                            name={getFullName(creator)}
                            w={28}
                            h={28}
                          />
                          <span>{getFullName(creator)}</span>
                        </div>
                      ) : (
                        <span className={styles.dashCenter}>-</span>
                      )}
                    </td>
                    <td>
                      {assignee ? (
                        <div className={styles.personCell}>
                          <Avatar
                            src={getPersonAvatar(assignee)}
                            name={getFullName(assignee)}
                            w={28}
                            h={28}
                          />
                          <span>{getFullName(assignee)}</span>
                        </div>
                      ) : (
                        translate("unassigned")
                      )}
                    </td>
                    <td>
                      {task?.category?.name ? (
                        <StatusBadge
                          backgroundColor={task.category.color || "var(--cBlackV2)"}
                          color={getCategoryTextColor(task.category.color)}
                          containerStyle={{ justifyContent: "flex-start" }}
                        >
                          {task.category.name}
                        </StatusBadge>
                      ) : (
                        <span className={styles.dashCenter}>-</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge
                        backgroundColor={priorityMeta.bg}
                        color={priorityMeta.color}
                        containerStyle={{ justifyContent: "flex-start" }}
                      >
                        {priorityMeta.label}
                      </StatusBadge>
                    </td>
                    <td className={styles.statusCellCenter}>
                      <StatusBadge
                        backgroundColor={statusMeta.bg}
                        color={statusMeta.color}
                      >
                        {statusMeta.label}
                      </StatusBadge>
                    </td>
                    <td>
                      {dueDateDisplay ? (
                        <span className={styles.badgeAlignedText}>{dueDateDisplay}</span>
                      ) : (
                        <span className={styles.dashCenter}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
          <div className={styles.paginationBar}>
            <span className={styles.paginationInfo}>
              {`Página ${currentPage} de ${lastPage} (${totalItems} registros)`}
            </span>
            <div className={styles.paginationActions}>
              <Button
                variant="secondary"
                className={styles.smallButton}
                disabled={loading || currentPage <= 1}
                onClick={() => loadTasks(Math.max(1, currentPage - 1))}
              >
                {"<"} {translate("previous")}
              </Button>
              <Button
                variant="secondary"
                className={styles.smallButton}
                disabled={loading || currentPage >= lastPage}
                onClick={() => loadTasks(Math.min(lastPage, currentPage + 1))}
              >
                {translate("next")} {">"}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.kanbanWrap}>
          {kanbanGroups.map((group) => {
            const columnTasks = group.items || [];
            return (
              <section key={group.status} className={styles.kanbanCol}>
                <header className={styles.kanbanColHeader}>
                  <span>{group.label || group.status}</span>
                  <span>{group.total || columnTasks.length}</span>
                </header>
                <div
                  className={`${styles.kanbanColBody} ${
                    dragOverStatus === group.status ? styles.kanbanColBodyActive : ""
                  }`}
                  onDragOver={(event) => handleDragOverColumn(event, group.status)}
                  onDrop={(event) => void handleDropOnColumn(event, group.status)}
                  onDragLeave={() => {
                    if (dragOverStatus === group.status) {
                      setDragOverStatus(null);
                    }
                  }}
                >
                  {columnTasks.map((task) => {
                    const priorityMeta = getPriorityMeta(task.priority, translate);
                    const creator = resolveTaskCreator(task);
                    const assignee = resolveTaskAssignee(task);
                    return (
                      <article
                        key={task.id}
                        className={`${styles.kanbanCard} ${
                          draggingTaskId === task.id ? styles.kanbanCardDragging : ""
                        }`}
                        onClick={() => openTaskDetail(task)}
                        draggable
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <h4>{task.title}</h4>
                        <p>{truncateText(task.description)}</p>
                        <div className={styles.peopleRow}>
                          {creator ? (
                            <div className={styles.personCell}>
                              <Avatar
                                src={getPersonAvatar(creator)}
                                name={getFullName(creator)}
                                w={22}
                                h={22}
                              />
                              <span>{getFullName(creator, "Nl")}</span>
                            </div>
                          ) : null}
                          {assignee ? (
                            <div className={styles.personCell}>
                              <Avatar
                                src={getPersonAvatar(assignee)}
                                name={getFullName(assignee)}
                                w={22}
                                h={22}
                              />
                              <span>{getFullName(assignee, "Nl")}</span>
                            </div>
                          ) : (
                            <span className={styles.personEmpty}>{translate("unassigned")}</span>
                          )}
                        </div>
                        <div className={styles.cardBadges}>
                          <StatusBadge
                            backgroundColor={priorityMeta.bg}
                            color={priorityMeta.color}
                          >
                            {priorityMeta.label}
                          </StatusBadge>
                          {task?.category?.name ? (
                            <StatusBadge
                              backgroundColor={task.category.color || "var(--cBlackV2)"}
                              color={getCategoryTextColor(task.category.color)}
                            >
                              {task.category.name}
                            </StatusBadge>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                  {group.loading ? (
                    <div className={styles.personEmpty}>{translate("loading")}</div>
                  ) : null}
                  {!group.loading && group.page < group.lastPage ? (
                    <Button
                      variant="secondary"
                      className={styles.smallButton}
                      onClick={() => loadMoreKanbanGroup(group.status, (group.page || 1) + 1)}
                    >
                      {translate("loadMore")}
                    </Button>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <DataModal
        open={openFiltersModal}
        onClose={() => setOpenFiltersModal(false)}
        onSave={applyFilters}
        title={translate("filtersTitle")}
        buttonText={translate("applyFilters")}
        maxWidth={900}
      >
        <div className={styles.filtersModalGrid}>
          <Input
            name="taskFilterTitle"
            value={draftFilters.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftFilters((old) => ({ ...old, title: e.target.value || "" }))
            }
            label={translate("title")}
            error={false}
          />
          <Select
            label={translate("createdBy")}
            name="taskFilterCreatedBySelect"
            value={draftFilters.createdBy}
            options={creatorFilterOptions}
            optionLabel="name"
            optionValue="id"
            filter
            required={false}
            error={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftFilters((old) => ({ ...old, createdBy: e.target.value || "" }))
            }
          />
          <Select
            label={translate("assignedTo")}
            name="taskFilterAssignedTo"
            value={draftFilters.assignedTo}
            options={assigneeFilterOptions}
            optionLabel="name"
            optionValue="id"
            filter
            required={false}
            error={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftFilters((old) => ({ ...old, assignedTo: e.target.value || "" }))
            }
          />
          <Select
            label={translate("category")}
            name="taskFilterCategory"
            value={draftFilters.categoryId}
            options={[{ id: "", name: translate("allFeminine") }, ...categoryOptions]}
            optionLabel="name"
            optionValue="id"
            filter
            required={false}
            error={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftFilters((old) => ({ ...old, categoryId: e.target.value || "" }))
            }
          />
          <Select
            label={translate("priority")}
            name="taskFilterPriority"
            value={draftFilters.priority}
            options={[{ id: "", name: translate("allFeminine") }, ...priorityOptions]}
            optionLabel="name"
            optionValue="id"
            filter
            required={false}
            error={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftFilters((old) => ({ ...old, priority: e.target.value as TaskPriority | "" }))
            }
          />
          <Select
            label={translate("status")}
            name="taskFilterStatus"
            value={draftFilters.status}
            options={[{ id: "", name: translate("allFeminine") }, ...statusOptions]}
            optionLabel="name"
            optionValue="id"
            filter
            required={false}
            error={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftFilters((old) => ({ ...old, status: e.target.value as TaskStatus | "" }))
            }
          />
          <Input
            type="date"
            name="taskFilterDueDate"
            label={translate("dueDate")}
            value={draftFilters.dueDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftFilters((old) => ({ ...old, dueDate: e.target.value || "" }))
            }
            error={false}
            required={false}
          />
          <Input
            type="date"
            name="taskFilterCreatedAt"
            label={translate("createdAt")}
            value={draftFilters.createdAt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftFilters((old) => ({ ...old, createdAt: e.target.value || "" }))
            }
            error={false}
            required={false}
          />
        </div>
      </DataModal>

      <DataModal
        open={openCategoriesModal}
        onClose={() => setOpenCategoriesModal(false)}
        title={translate("categoriesTitle")}
        maxWidth={1000}
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.categoriesHeaderRow}>
          <Button onClick={openCreateCategory} className={styles.smallButton}>
            {translate("newCategory")}
          </Button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{translate("category")}</th>
                <th>{translate("categoryColor")}</th>
                <th>{translate("categoryStatus")}</th>
                <th>{translate("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {taskCategories.map((category) => {
                const isInactive = String(category.status || "").toUpperCase() === "X";
                const isGeneric = isGenericCategory(category);
                const isDisabledForClient = Boolean(
                  (category as TaskCategory & { is_disabled_for_client?: boolean })
                    .is_disabled_for_client,
                );

                return (
                  <tr key={category.id}>
                    <td>
                      <div className={styles.taskTitle}>{category.name || "-"}</div>
                      <div className={styles.taskDesc}>
                        {category.description || "-"}
                        {isGeneric ? ` · ${translate("genericCategory")}` : ""}
                      </div>
                    </td>
                    <td>
                      <span
                        className={styles.categoryColorChip}
                        style={{ backgroundColor: category.color || "#3B82F6" }}
                      >
                        {category.color || "-"}
                      </span>
                    </td>
                    <td>
                      {isInactive || isDisabledForClient
                        ? translate("inactive")
                        : translate("active")}
                    </td>
                    <td>
                      <div className={styles.categoryActionsRow}>
                        <Button
                          variant="secondary"
                          className={styles.smallButton}
                          disabled={isGeneric}
                          onClick={() => openEditCategory(category)}
                        >
                          {translate("openEdit")}
                        </Button>
                        <Button
                          variant="danger"
                          className={styles.smallButton}
                          disabled={categoryDeletingId === category.id}
                          onClick={() => void removeCategory(category)}
                        >
                          {translate("taskDelete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!categoriesLoading && taskCategories.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyInline}>{translate("emptyMsg")}</div>
                  </td>
                </tr>
              )}

              {categoriesLoading && (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyInline}>{translate("loading")}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DataModal>

      <DataModal
        open={openCategoryFormModal}
        onClose={() => setOpenCategoryFormModal(false)}
        onSave={saveCategory}
        disabled={categorySaving}
        title={
          categoryFormState.id
            ? translate("editCategoryTitle")
            : translate("createCategoryTitle")
        }
        maxWidth={900}
      >
        <div className={styles.formGrid}>
          <Input
            name="taskCategoryName"
            label={translate("categoryName")}
            value={categoryFormState.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCategoryFormState((prev) => ({ ...prev, name: e.target.value }))
            }
            error={categoryFormErrors}
            required
          />
          <TextArea
            name="taskCategoryDescription"
            label={translate("categoryDescription")}
            value={categoryFormState.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setCategoryFormState((prev) => ({ ...prev, description: e.target.value }))
            }
            error={categoryFormErrors}
            required={false}
            lines={3}
          />
          <div className={styles.row3}>
            <div className={styles.colorField}>
              <Input
                name="taskCategoryColor"
                label={translate("categoryColor")}
                value={categoryFormState.color}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCategoryFormState((prev) => ({ ...prev, color: e.target.value }))
                }
                error={categoryFormErrors}
                required={false}
              />
              <div className={styles.colorPickerRow}>
                <input
                  type="color"
                  name="taskCategoryColorPicker"
                  className={styles.colorPickerInput}
                  value={getColorPickerValue(categoryFormState.color)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCategoryFormState((prev) => ({ ...prev, color: e.target.value }))
                  }
                  aria-label={translate("categoryColor")}
                />
                <span className={styles.colorPickerValue}>
                  {normalizeCategoryColor(categoryFormState.color) || "#3B82F6"}
                </span>
              </div>
            </div>
            <Select
              label={translate("categoryStatus")}
              name="taskCategoryStatus"
              value={categoryFormState.status}
              options={[
                { id: "A", name: translate("active") },
                { id: "X", name: translate("inactive") },
              ]}
              optionLabel="name"
              optionValue="id"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCategoryFormState((prev) => ({
                  ...prev,
                  status: e.target.value === "X" ? "X" : "A",
                }))
              }
              error={categoryFormErrors}
              required={false}
            />
          </div>
        </div>
      </DataModal>

      <DataModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={saveTask}
        disabled={saving}
        title={
          formState.id
            ? translate("editTaskTitle")
            : translate("createTaskTitle")
        }
        maxWidth={900}
      >
        <div className={styles.formGrid}>
          <Input
            name="title"
            value={formState.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormState((p) => ({ ...p, title: e.target.value }))
            }
            label={translate("title")}
            placeholder={translate("titlePlaceholder")}
            error={errors}
            required
          />
          <TextArea
            name="description"
            value={formState.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormState((p) => ({ ...p, description: e.target.value }))
            }
            label={translate("description")}
            error={errors}
            required={false}
            lines={4}
          />
          {!formState.id ? (
            <Button
              variant="secondary"
              className={styles.smallButton}
              onClick={() => setShowCreateTaskDetails((prev) => !prev)}
            >
              {showCreateTaskDetails
                ? translate("hideDetails")
                : translate("addDetails")}
            </Button>
          ) : null}

          {(formState.id || showCreateTaskDetails) ? (
            <>
              <div className={styles.creatorPreview}>
                <span>{translate("createdBy")}:</span>
                <div className={styles.personCell}>
                  <Avatar
                    src={user?.url_avatar || user?.avatar || ""}
                    name={getFullName(user || {})}
                    w={28}
                    h={28}
                  />
                  <span>{getFullName(user || {}) || translate("notAvailable")}</span>
                </div>
              </div>
              <Select
                label={translate("category")}
                name="category_id"
                value={formState.category_id || ""}
                options={categoryOptions}
                optionLabel="name"
                optionValue="id"
                inputStyle={{ textAlign: "left" }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormState((p) => ({ ...p, category_id: e.target.value }))
                }
                error={errors}
                required={false}
              />
              <div className={styles.row3}>
                <Select
                  label={translate("priority")}
                  name="priority"
                  value={formState.priority}
                  options={priorityOptions}
                  optionLabel="name"
                  optionValue="id"
                  inputStyle={{ textAlign: "left" }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormState((p) => ({ ...p, priority: e.target.value as TaskPriority }))
                  }
                  error={errors}
                />
                <Select
                  label={translate("status")}
                  name="status"
                  value={formState.status}
                  options={statusOptions}
                  optionLabel="name"
                  optionValue="id"
                  inputStyle={{ textAlign: "left" }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormState((p) => ({ ...p, status: e.target.value as TaskStatus }))
                  }
                  error={errors}
                />
                <Select
                  label={translate("assignToType")}
                  name="assigned_to_type"
                  value={formState.assigned_to_type}
                  options={[
                    { id: "none", name: translate("assignNone") },
                    { id: "admin", name: translate("assignAdmin") },
                    { id: "guard", name: translate("assignGuard") },
                  ]}
                  optionLabel="name"
                  optionValue="id"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormState((p) => ({
                      ...p,
                      assigned_to_type: e.target.value as TaskFormState["assigned_to_type"],
                      assigned_to_id: "",
                      assigned_to_user_id: null,
                      assigned_to_guard_id: null,
                    }))
                  }
                  error={errors}
                  required={false}
                />
                <Select
                  label={translate("assignedTo")}
                  name="assigned_to_id"
                  value={formState.assigned_to_id}
                  options={
                    formState.assigned_to_type === "admin"
                      ? adminOptions
                      : formState.assigned_to_type === "guard"
                        ? guardOptions
                        : []
                  }
                  optionLabel="name"
                  optionValue="id"
                  placeholder={translate("assignSelectPlaceholder")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormState((p) => ({ ...p, assigned_to_id: e.target.value }))
                  }
                  error={errors}
                  required={false}
                  disabled={formState.assigned_to_type === "none"}
                />
                <Select
                  label={translate("visibility")}
                  name="visibility"
                  value={formState.visibility}
                  options={visibilityOptions}
                  optionLabel="name"
                  optionValue="id"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormState((p) => ({ ...p, visibility: e.target.value as TaskVisibility }))
                  }
                  error={errors}
                />
              </div>
              <Input
                type="date"
                label={translate("dueDate")}
                name="due_date"
                value={formState.due_date || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormState((p) => ({ ...p, due_date: e.target.value }))
                }
                error={errors}
                required={false}
              />
              <UploadFileV3
                name="images"
                formState={formState}
                setFormState={setFormState}
                mode="images"
                cant={6}
                maxMB={5}
                error={errors}
                title={translate("uploadImagesTitle")}
                subtitle={translate("uploadImagesSubtitle")}
              />
            </>
          ) : null}
        </div>
      </DataModal>

      <TaskDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        task={detailTask}
        comments={comments}
        loadingComments={loadingComments}
        commentText={commentText}
        commentImages={commentImages}
        sendingComment={sendingComment}
        translate={translate}
        statusOptions={statusOptions}
        changingStatus={changingDetailStatus}
        onStatusChange={handleDetailStatusChange}
        onCommentChange={setCommentText}
        onCommentImagesChange={setCommentImages}
        onSubmitComment={submitComment}
        onEdit={(task) => {
          setOpenDetail(false);
          openEdit(task);
        }}
        resolveCreator={resolveTaskCreator}
        resolveAssignee={resolveTaskAssignee}
        getPriorityMeta={getPriorityMeta}
        getStatusMeta={getStatusMeta}
      />
    </div>
  );
};

export default Tasks;
