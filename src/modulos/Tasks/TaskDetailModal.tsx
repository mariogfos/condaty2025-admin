import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { IconEdit } from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getFullName } from "@/mk/utils/string";
import {
  TaskComment,
  TaskItem,
  TaskPerson,
  TaskPriority,
  TaskStatus,
  UpsertTaskPayload,
} from "./types";
import {
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_VISIBILITY,
  loEscribioElSistema,
  normalizarEstado,
  normalizarPrioridad,
  normalizarVisibilidad,
} from "./taskEnums";
import styles from "./TaskDetailModal.module.css";

type MetaResult = {
  label: string;
  color: string;
  bg: string;
};

type Props = {
  open: boolean;
  task?: TaskItem | null;
  taskId?: string | null;
  comments?: TaskComment[];
  loadingComments?: boolean;
  commentText?: string;
  commentImages?: string[];
  sendingComment?: boolean;
  translate?: (key: string) => string;
  onClose: () => void;
  onEdit?: (task: TaskItem) => void;
  statusOptions?: Array<{ id: TaskStatus; name: string }>;
  changingStatus?: boolean;
  onStatusChange?: (status: TaskStatus) => void;
  onCommentChange?: (value: string) => void;
  onCommentImagesChange?: (images: string[]) => void;
  onSubmitComment?: () => void;
  resolveCreator?: (task: TaskItem) => TaskPerson | null;
  resolveAssignee?: (task: TaskItem) => TaskPerson | null;
  getPriorityMeta?: (priority: TaskPriority, translate: (key: string) => string) => MetaResult;
  getStatusMeta?: (status: TaskStatus, translate: (key: string) => string) => MetaResult;
};

const getPersonAvatar = (person?: TaskPerson | null) => {
  if (!person) return "";
  return person.url_avatar || person.avatar || "";
};

const getCommentAuthor = (comment: TaskComment) => {
  return comment.commentable || comment.user || comment.guard || comment.owner || null;
};

const sameStringArray = (a: string[] = [], b: string[] = []) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
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

const createFallbackTask = (id: string): TaskItem => ({
  id,
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

const defaultResolveCreator = (task: TaskItem): TaskPerson | null => {
  return (
    task.created_by ||
    task.creator ||
    task.created_by_user ||
    task.created_by_guard ||
    task.created_by_owner ||
    null
  );
};

const defaultResolveAssignee = (task: TaskItem): TaskPerson | null => {
  return task.assigned_user || task.assigned_guard || task.assigned_owner || null;
};

/**
 * 🔴 El `switch` va sobre el NÚMERO normalizado: desde el corte 4 la prioridad es
 * un entero, y un `case "urgent"` sobre un `4` caería al `default` y pintaría
 * «media» sobre una tarea urgente, sin error y sin log.
 */
const defaultPriorityMeta = (
  priority: TaskPriority | string,
  translate: (key: string) => string,
): MetaResult => {
  switch (normalizarPrioridad(priority)) {
    case TASK_PRIORITY.URGENT:
      return { label: translate("priorityUrgent"), color: "var(--cError)", bg: "var(--cHoverError)" };
    case TASK_PRIORITY.HIGH:
      return { label: translate("priorityHigh"), color: "var(--cWarning)", bg: "var(--cHoverCompl4)" };
    case TASK_PRIORITY.LOW:
      return { label: translate("priorityLow"), color: "var(--cInfo)", bg: "var(--cHoverCompl3)" };
    default:
      return { label: translate("priorityMedium"), color: "var(--cWhite)", bg: "var(--cBlackV2)" };
  }
};

/** Igual que la prioridad: sobre el número normalizado. */
const defaultStatusMeta = (
  status: TaskStatus | string,
  translate: (key: string) => string,
): MetaResult => {
  switch (normalizarEstado(status)) {
    case TASK_STATUS.REQUESTED:
      return { label: translate("statusRequested"), color: "var(--cWarning)", bg: "var(--cHoverCompl4)" };
    case TASK_STATUS.PENDING:
      return { label: translate("statusPending"), color: "var(--cInfo)", bg: "var(--cHoverCompl3)" };
    case TASK_STATUS.IN_PROGRESS:
      return { label: translate("statusInProgress"), color: "var(--cPrimary)", bg: "var(--cHoverCompl1)" };
    case TASK_STATUS.REVIEW:
      return { label: translate("statusReview"), color: "var(--cAccent)", bg: "var(--cHoverCompl2)" };
    case TASK_STATUS.COMPLETED:
      return { label: translate("statusCompleted"), color: "var(--cSuccess)", bg: "var(--cHoverSuccess)" };
    case TASK_STATUS.CANCELLED:
      return { label: translate("statusCancelled"), color: "var(--cError)", bg: "var(--cHoverError)" };
    default:
      return { label: translate("statusUnknown"), color: "var(--cWhite)", bg: "var(--cBlackV2)" };
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
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

const TaskDetailModal = ({
  open,
  task,
  taskId,
  comments,
  loadingComments,
  commentText,
  commentImages,
  sendingComment,
  translate,
  onClose,
  onEdit,
  statusOptions,
  changingStatus,
  onStatusChange,
  onCommentChange,
  onCommentImagesChange,
  onSubmitComment,
  resolveCreator,
  resolveAssignee,
  getPriorityMeta,
  getStatusMeta,
}: Props) => {
  const router = useRouter();
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const { translate: internalTranslate } = useScopedI18n("tasks");

  const [autoTask, setAutoTask] = useState<TaskItem | null>(null);
  const [autoComments, setAutoComments] = useState<TaskComment[]>([]);
  const [autoLoadingComments, setAutoLoadingComments] = useState(false);
  const [autoCommentText, setAutoCommentText] = useState("");
  const [autoCommentImages, setAutoCommentImages] = useState<string[]>([]);
  const [autoSendingComment, setAutoSendingComment] = useState(false);
  const [autoChangingStatus, setAutoChangingStatus] = useState(false);
  const lastAutoLoadKeyRef = useRef<string | null>(null);

  const effectiveTranslate = translate || internalTranslate;
  const isAutoMode = Boolean(taskId) && !task;

  const autoStatusOptions = useMemo(
    () => [
      { id: TASK_STATUS.REQUESTED, name: effectiveTranslate("statusRequested") },
      { id: TASK_STATUS.PENDING, name: effectiveTranslate("statusPending") },
      { id: TASK_STATUS.IN_PROGRESS, name: effectiveTranslate("statusInProgress") },
      { id: TASK_STATUS.REVIEW, name: effectiveTranslate("statusReview") },
      { id: TASK_STATUS.COMPLETED, name: effectiveTranslate("statusCompleted") },
      { id: TASK_STATUS.CANCELLED, name: effectiveTranslate("statusCancelled") },
    ],
    [effectiveTranslate],
  );

  useEffect(() => {
    const load = async () => {
      if (!isAutoMode || !open || !taskId) return;

      const loadKey = `${taskId}:${open ? "1" : "0"}`;
      if (lastAutoLoadKeyRef.current === loadKey) return;
      lastAutoLoadKeyRef.current = loadKey;

      setAutoTask(createFallbackTask(taskId));
      setAutoCommentText("");
      setAutoCommentImages([]);
      setAutoLoadingComments(true);

      try {
        let targetTask: TaskItem | null = null;
        const { data: byId } = await execute(`/tasks/${taskId}`, "GET", {}, false, true);
        const byIdCandidates = [byId, byId?.data, byId?.message, byId?.data?.message];

        for (const candidate of byIdCandidates) {
          const rows = getRowsFromResponse(candidate);
          if (rows.length > 0) {
            targetTask = rows.find((item) => item.id === taskId) || rows[0];
            break;
          }
          if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
            const typed = candidate as TaskItem;
            if (typed.id === taskId) {
              targetTask = typed;
              break;
            }
          }
        }

        if (!targetTask) {
          const { data: listData } = await execute(
            "/tasks",
            "GET",
            { page: 1, perPage: 20, fullType: "L", searchBy: taskId },
            false,
            true,
          );
          const rows = getRowsFromResponse(listData);
          targetTask = rows.find((item) => item.id === taskId) || null;
        }

        if (targetTask) {
          setAutoTask(targetTask);
        } else {
          showToast("No se encontró el detalle completo de la tarea", "error");
        }

        const { data: commentsData } = await execute(
          `/tasks/${taskId}/comments`,
          "GET",
          {},
          false,
          true,
        );
        setAutoComments(getCommentsFromResponse(commentsData));
      } catch (error) {
        console.error("Error opening task modal from id:", error);
        showToast("No se pudo abrir la tarea", "error");
      } finally {
        setAutoLoadingComments(false);
      }
    };

    load();
  }, [isAutoMode, open, taskId]);

  useEffect(() => {
    if (!open) {
      lastAutoLoadKeyRef.current = null;
    }
  }, [open]);

  const effectiveTask = isAutoMode ? autoTask : (task || null);
  const effectiveComments = isAutoMode ? autoComments : (comments || []);
  const effectiveLoadingComments = isAutoMode
    ? autoLoadingComments
    : Boolean(loadingComments);
  const effectiveCommentText = isAutoMode ? autoCommentText : (commentText || "");
  const effectiveCommentImages = isAutoMode ? autoCommentImages : (commentImages || []);
  const effectiveSendingComment = isAutoMode
    ? autoSendingComment
    : Boolean(sendingComment);
  const effectiveChangingStatus = isAutoMode
    ? autoChangingStatus
    : Boolean(changingStatus);
  const effectiveStatusOptions = statusOptions || autoStatusOptions;

  const handleAutoStatusChange = async (nextStatus: TaskStatus) => {
    if (!autoTask || autoChangingStatus || autoTask.status === nextStatus) return;

    const previousStatus = autoTask.status;
    setAutoChangingStatus(true);
    setAutoTask((old) => (old ? { ...old, status: nextStatus } : old));

    try {
      const payload: UpsertTaskPayload = {
        title: autoTask.title,
        description: autoTask.description,
        images: autoTask.images || [],
        category_id: autoTask.category_id || null,
        // 🔴 Se normaliza lo que trajo el API antes de reenviarlo: si la fila
        // llegó con el string viejo, mandarlo tal cual escribiría un 0 en una
        // columna numérica.
        priority: normalizarPrioridad(autoTask.priority) ?? TASK_PRIORITY.MEDIUM,
        status: nextStatus,
        visibility: normalizarVisibilidad(autoTask.visibility) ?? TASK_VISIBILITY.INHERIT,
        due_date: autoTask.due_date || null,
        assigned_to_user_id: autoTask.assigned_to_user_id || null,
        assigned_to_guard_id: autoTask.assigned_to_guard_id || null,
      };

      const { data } = await execute(`/tasks/${autoTask.id}`, "PUT", payload, false, true);
      if (!data?.success) {
        setAutoTask((old) => (old ? { ...old, status: previousStatus } : old));
        showToast(data?.message || "No se pudo cambiar el estado", "error");
      }
    } finally {
      setAutoChangingStatus(false);
    }
  };

  const handleAutoSubmitComment = async () => {
    if (!autoTask || !autoCommentText.trim()) return;

    setAutoSendingComment(true);
    const { data } = await execute(
      `/tasks/${autoTask.id}/comments`,
      "POST",
      {
        content: autoCommentText.trim(),
        images: autoCommentImages || [],
        type: "comment",
      },
      false,
      true,
    );
    setAutoSendingComment(false);

    if (!data?.success) {
      showToast(data?.message || "No se pudo crear el comentario", "error");
      return;
    }

    setAutoCommentText("");
    setAutoCommentImages([]);
    const { data: commentsData } = await execute(
      `/tasks/${autoTask.id}/comments`,
      "GET",
      {},
      false,
      true,
    );
    setAutoComments(getCommentsFromResponse(commentsData));
  };

  const effectiveOnStatusChange = onStatusChange || handleAutoStatusChange;
  const effectiveOnCommentChange = onCommentChange || setAutoCommentText;
  const effectiveOnCommentImagesChange = onCommentImagesChange || setAutoCommentImages;
  const effectiveOnSubmitComment = onSubmitComment || handleAutoSubmitComment;
  const effectiveOnEdit =
    onEdit ||
    ((nextTask: TaskItem) => {
      router.push(`/tasks?openTaskId=${nextTask.id}`);
    });

  const creator = effectiveTask
    ? (resolveCreator ? resolveCreator(effectiveTask) : defaultResolveCreator(effectiveTask))
    : null;
  const assignee = effectiveTask
    ? (resolveAssignee ? resolveAssignee(effectiveTask) : defaultResolveAssignee(effectiveTask))
    : null;
  // ⚠️ Se normaliza ANTES de pasárselo a los `getMeta` de afuera: el que los
  // inyecta puede seguir esperando el tipo estricto.
  const prioridadDeLaTarea = effectiveTask
    ? normalizarPrioridad(effectiveTask.priority) ?? TASK_PRIORITY.MEDIUM
    : null;
  const estadoDeLaTarea = effectiveTask
    ? normalizarEstado(effectiveTask.status) ?? TASK_STATUS.REQUESTED
    : null;
  const priorityMeta = prioridadDeLaTarea !== null
    ? (getPriorityMeta
        ? getPriorityMeta(prioridadDeLaTarea, effectiveTranslate)
        : defaultPriorityMeta(prioridadDeLaTarea, effectiveTranslate))
    : null;
  const statusMeta = estadoDeLaTarea !== null
    ? (getStatusMeta
        ? getStatusMeta(estadoDeLaTarea, effectiveTranslate)
        : defaultStatusMeta(estadoDeLaTarea, effectiveTranslate))
    : null;

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={effectiveTranslate("detailTitle")}
      buttonText=""
      buttonCancel=""
      maxWidth={900}
    >
      {effectiveTask ? (
        <div className={styles.detailWrap}>
          <div className={styles.detailHeader}>
            <div className={styles.headerTitleArea}>
              <div className={styles.detailBadges}>
                {effectiveTask.category?.name ? (
                  <div className={styles.metaChip}>
                    <span className={styles.metaChipLabel}>{effectiveTranslate("category")}</span>
                    <span className={styles.metaChipValue}>
                      <span
                        className={styles.metaChipDot}
                        style={{ backgroundColor: effectiveTask.category.color || "var(--cBlackV2)" }}
                      />
                      <span
                        style={{
                          color: getCategoryTextColor(effectiveTask.category.color),
                        }}
                      >
                        {effectiveTask.category.name}
                      </span>
                    </span>
                  </div>
                ) : null}
                <div className={styles.metaChip}>
                  <span className={styles.metaChipLabel}>{effectiveTranslate("priority")}</span>
                  <span className={styles.metaChipValue}>
                    <span
                      className={styles.metaChipDot}
                      style={{ backgroundColor: priorityMeta?.color || "var(--cWhiteV1)" }}
                    />
                    {priorityMeta?.label || "-"}
                  </span>
                </div>
                <div className={styles.quickStatusControl}>
                  <span className={styles.metaChipLabel}>{effectiveTranslate("status")}</span>
                  <span
                    className={styles.metaChipDot}
                    style={{ backgroundColor: statusMeta?.color || "var(--cWhiteV1)" }}
                  />
                  <Select
                    label=""
                    name="quick_status"
                    value={effectiveTask.status}
                    options={effectiveStatusOptions}
                    optionLabel="name"
                    optionValue="id"
                    required={false}
                    error={false}
                    disabled={effectiveChangingStatus}
                    className={styles.quickStatusSelectWrap}
                    selectOptionsClassName={styles.quickStatusOptions}
                    inputStyle={{ height: "30px", minHeight: "30px" }}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      // 🔴 El DOM devuelve string: se normaliza en vez de mentirle
                      // al compilador con un `as`.
                      effectiveOnStatusChange(
                        normalizarEstado(event.target.value) ?? TASK_STATUS.REQUESTED,
                      )
                    }
                  />
                </div>
              </div>
              <div className={styles.titleWithIcon}>
                <div className={styles.titleContent}>
                  <h3>{effectiveTask.title}</h3>
                  <div className={styles.taskDescription}>{effectiveTask.description}</div>
                </div>
                <button
                  className={styles.editIconButton}
                  onClick={() => effectiveOnEdit(effectiveTask)}
                  title={effectiveTranslate("openEdit")}
                  aria-label={effectiveTranslate("openEdit")}
                >
                  <IconEdit size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <h5>{effectiveTranslate("createdBy")}</h5>
              {creator ? (
                <div className={styles.personLine}>
                  <Avatar
                    src={getPersonAvatar(creator)}
                    name={getFullName(creator)}
                    w={36}
                    h={36}
                  />
                  <div>
                    <p className={styles.personName}>{getFullName(creator)}</p>
                  </div>
                </div>
              ) : (
                <p>{effectiveTranslate("notAvailable")}</p>
              )}
            </div>

            <div className={styles.metaCard}>
              <h5>{effectiveTranslate("assignedTo")}</h5>
              {assignee ? (
                <div className={styles.personLine}>
                  <Avatar
                    src={getPersonAvatar(assignee)}
                    name={getFullName(assignee)}
                    w={36}
                    h={36}
                  />
                  <div>
                    <p className={styles.personName}>{getFullName(assignee)}</p>
                  </div>
                </div>
              ) : (
                <p>{effectiveTranslate("unassigned")}</p>
              )}
            </div>

            <div className={styles.metaCard}>
              <h5>{effectiveTranslate("createdAt") || "Creado"}</h5>
              <p className={styles.metaDateValue}>{formatDateTime(effectiveTask.created_at)}</p>
            </div>
          </div>

          {Array.isArray(effectiveTask.images) && effectiveTask.images.length > 0 ? (
            <div className={styles.imagesWrap}>
              {effectiveTask.images.map((imageUrl, index) => (
                <Avatar
                  key={`${effectiveTask.id}-image-${index}`}
                  src={imageUrl}
                  name={`${effectiveTask.title}-${index + 1}`}
                  w={84}
                  h={84}
                  square
                  expandable
                  expandableIcon={false}
                />
              ))}
            </div>
          ) : null}

          <div className={styles.commentsSection}>
            <h4>{effectiveTranslate("commentsTitle")}</h4>
            {effectiveLoadingComments ? (
              <p>{effectiveTranslate("loading")}</p>
            ) : effectiveComments.length === 0 ? (
              <p>{effectiveTranslate("noComments")}</p>
            ) : (
              <div className={styles.commentList}>
                {effectiveComments.map((comment) => {
                  const author = getCommentAuthor(comment);
                  // 🔴 Lo que anotó el SISTEMA se distingue de lo que escribió una
                  // persona. Antes no se podía: las cuatro escrituras de la
                  // bitácora se guardaban con el mismo `type` que un comentario.
                  const delSistema = loEscribioElSistema(comment.type);
                  return (
                    <article
                      key={comment.id}
                      className={styles.commentItem}
                      data-system-entry={delSistema ? "true" : undefined}
                    >
                      <div className={styles.commentHead}>
                        <div className={styles.commentHeadLeft}>
                          <Avatar
                            src={getPersonAvatar(author)}
                            name={author ? getFullName(author) : "?"}
                            w={28}
                            h={28}
                          />
                          <p className={styles.commentAuthor}>
                            {author ? getFullName(author) : effectiveTranslate("notAvailable")}
                            {delSistema ? (
                              <span className={styles.commentSystemTag}>
                                {effectiveTranslate("systemEntry")}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <p className={styles.commentDate}>
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p>{comment.content}</p>
                      {Array.isArray(comment.images) && comment.images.length > 0 ? (
                        <div className={styles.commentImages}>
                          {comment.images.map((imageUrl, index) => (
                            <Avatar
                              key={`${comment.id}-image-${index}`}
                              src={imageUrl}
                              name={`comment-image-${index}`}
                              w={60}
                              h={60}
                              square
                              expandable
                              expandableIcon={false}
                            />
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}

            <div className={styles.commentComposer}>
              <TextArea
                name="taskComment"
                value={effectiveCommentText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  effectiveOnCommentChange(e.target.value)
                }
                label=""
                placeholder={effectiveTranslate("writeCommentPlaceholder")}
                error={false}
                required={false}
                lines={3}
              />
              <UploadFileV3
                name="commentImages"
                formState={{ commentImages: effectiveCommentImages }}
                setFormState={(updater) => {
                  const newFormState = updater({ commentImages: effectiveCommentImages });
                  const nextImages = newFormState.commentImages || [];
                  if (!sameStringArray(nextImages, effectiveCommentImages)) {
                    effectiveOnCommentImagesChange(nextImages);
                  }
                }}
                mode="images"
                cant={6}
                maxMB={5}
                title={effectiveTranslate("uploadImagesTitle")}
                subtitle={effectiveTranslate("uploadImagesSubtitle")}
              />
              {Array.isArray(effectiveCommentImages) && effectiveCommentImages.length > 0 ? (
                <div className={styles.commentImages}>
                  {effectiveCommentImages.map((imageUrl, index) => (
                    <Avatar
                      key={`preview-${index}`}
                      src={imageUrl}
                      name={`preview-image-${index}`}
                      w={60}
                      h={60}
                      square
                      expandable
                      expandableIcon={false}
                    />
                  ))}
                </div>
              ) : null}
              <Button
                onClick={effectiveOnSubmitComment}
                disabled={effectiveSendingComment || !effectiveCommentText.trim()}
              >
                {effectiveTranslate("sendComment")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DataModal>
  );
};

export default TaskDetailModal;
