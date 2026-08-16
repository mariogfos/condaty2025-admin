export type ToastKind = "success" | "error" | "warning" | "info";

export type ToastType = {
  msg: any;
  type?: ToastKind;
  time?: number;
};

export type ToastItem = ToastType & {
  id: string;
  createdAt: number;
};

const DEFAULT_TOAST_TYPE: ToastKind = "success";
const DEFAULT_TOAST_TIME = 5000;
const MAX_TOAST_QUEUE = 4;
const TOAST_DUPLICATE_WINDOW_MS = 1500;
let toastCounter = 0;

const TOAST_TYPES = new Set<ToastKind>(["success", "error", "warning", "info"]);

const isToastKind = (value: unknown): value is ToastKind =>
  typeof value === "string" && TOAST_TYPES.has(value as ToastKind);

const createToastId = () =>
  `toast-${Date.now()}-${toastCounter++}`;

export const createToastItem = (
  message: any,
  type: ToastKind = DEFAULT_TOAST_TYPE,
  time = DEFAULT_TOAST_TIME,
): ToastItem => ({
  id: createToastId(),
  msg: message,
  type,
  time,
  createdAt: Date.now(),
});

const normalizeToastArgs = (
  message: any,
  type: ToastKind | string = DEFAULT_TOAST_TYPE,
  time = DEFAULT_TOAST_TIME,
) => {
  let nextMessage = message;
  let nextType = isToastKind(type) ? type : DEFAULT_TOAST_TYPE;

  if (isToastKind(message) && typeof type === "string" && !isToastKind(type)) {
    nextMessage = type;
    nextType = message;
  }

  return {
    message: nextMessage,
    type: nextType,
    time: typeof time === "number" ? time : DEFAULT_TOAST_TIME,
  };
};

const getComparableToastMessage = (message: unknown) => {
  if (typeof message === "string") {
    const trimmed = message.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof message === "number") {
    return String(message);
  }

  return null;
};

const getToastDedupKey = (toast: Pick<ToastType, "msg" | "type">) => {
  const comparableMessage = getComparableToastMessage(toast.msg);
  if (!comparableMessage) return null;

  return `${toast.type || DEFAULT_TOAST_TYPE}:${comparableMessage}`;
};

export const appendToastItem = (
  prev: ToastItem[] = [],
  nextToast: ToastItem,
) => {
  const nextDedupKey = getToastDedupKey(nextToast);

  if (nextDedupKey) {
    const hasRecentDuplicate = prev.some((toast) => {
      const currentKey = getToastDedupKey(toast);
      if (currentKey !== nextDedupKey) return false;

      return nextToast.createdAt - toast.createdAt < TOAST_DUPLICATE_WINDOW_MS;
    });

    if (hasRecentDuplicate) {
      return prev;
    }
  }

  return [...prev, nextToast].slice(-MAX_TOAST_QUEUE);
};

const useToast = (setToastQueue?: Function) => {
  const showToast = (
    message = "",
    type: ToastKind | string = DEFAULT_TOAST_TYPE,
    time = DEFAULT_TOAST_TIME,
  ) => {
    if (!setToastQueue) return;

    const normalized = normalizeToastArgs(message, type, time);

    // 🔴 Un mensaje vacío NO vacía la cola (CDT-60).
    //
    // Antes hacía `setToastQueue([])`, y eso convertía cualquier
    // `showToast(response?.message, "error")` con `response === undefined` —un
    // request caído— en un borrado silencioso: el usuario apretaba Guardar, no
    // aparecía nada, y encima se llevaba puesto el aviso que YA estaba en
    // pantalla. Pedir un toast sin texto no es una orden de limpiar: es una
    // llamada que se quedó sin mensaje. Se ignora y la cola queda como está.
    //
    // Para sacar un toast de la pantalla está `onDismiss` del `ToastViewport`,
    // que lo quita por `id` sin tocar los demás.
    if (!normalized.message) {
      return;
    }

    setToastQueue((prev: ToastItem[] = []) =>
      appendToastItem(
        prev,
        createToastItem(normalized.message, normalized.type, normalized.time),
      ),
    );
  };

  return { showToast };
};

export default useToast;
