"use client";
import {
  IconAlert,
  IconCheck,
  IconErrorToast,
  IconInfoToast,
  IconSuccessToast,
  IconX,
} from "@/components/layout/icons/IconsBiblioteca";
import { ToastType } from "@/mk/hooks/useToast";
import { useEffect, useState } from "react";
import styles from "./toast.module.css";

// const ToastMsg = {
//   success: "¡GENIAL!",
//   error: "¡ERROR!",
//   warning: "¡ALERTA!",
//   info: "¡INFO!",
// };

const ToastIcon = {
  success: <IconSuccessToast size={24} color="var(--cSuccess)" />,
  error: <IconErrorToast size={24} color="var(--cError)" />,
  warning: (
    <IconInfoToast
      size={24}
      color="var(--cWarning)"
      style={{ transform: "scaleY(-1)" }}
    />
  ),
  info: <IconInfoToast size={24} color="var(--cInfo)" />,
};
const Toast = ({
  toast,
  showToast,
}: {
  toast: ToastType;
  showToast: Function;
}) => {
  const [open1, setOpen1] = useState(false);

  const _close = () => {
    setOpen1(false);
    setTimeout(() => {
      showToast("");
    }, 700);
  };

  useEffect(() => {
    if (toast?.msg && toast?.msg != "") {
      setOpen1(true);
      if ((toast?.time || 5000) > 0) {
        setTimeout(() => {
          _close();
        }, toast?.time || 5000);
      }
    }
  }, [toast?.msg]);

  const clase =
    styles.toast +
    " " +
    (open1 ? styles.open : "") +
    " " +
    (!toast?.msg || toast?.msg == "" ? "hidden " : "") +
    styles[toast?.type || "info"];

  return (
    <>
      <div className={clase}>
        <div>{ToastIcon[toast?.type || "info"]}</div>
        <div>
          {/* <p>{ToastMsg[toast?.type || "info"]}</p> */}
          <div>{toast?.msg}</div>
        </div>
        <div className={styles.close} onClick={() => _close()}>
          <IconX size={14} />
        </div>
      </div>
    </>
  );
};

export default Toast;
