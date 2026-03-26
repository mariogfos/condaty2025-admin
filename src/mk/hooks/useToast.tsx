export type ToastType = {
  msg: any;
  type?: "success" | "error" | "warning" | "info";
  time?: number;
};
const useToast = (toast: ToastType, setToast: Function) => {
  const showToast = (message = "", type = "success", time = 5000) => {
    if (setToast) setToast({ msg: message, type, time });
  };
  return { toast, showToast };
};

export default useToast;
