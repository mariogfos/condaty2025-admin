'use client';
import {
  IconInfoToast,
  IconSuccessToast,
  IconX,
} from '@/components/layout/icons/IconsBiblioteca';
import { ToastType } from '@/mk/hooks/useToast';
import { useEffect, useState } from 'react';
import styles from './toast.module.css';

const ToastIcon = {
  success: <IconSuccessToast size={18} color="var(--cWhite)" />,
  error: <IconX size={18} color="var(--cWhite)" />,
  warning: <IconX size={18} color="var(--cWhite)" />,
  info: <IconInfoToast size={18} color="var(--cWhite)" />,
};

const StatusColor = {
  success: 'var(--cSuccess)',
  error: 'var(--cError)',
  warning: 'var(--cWarning)',
  info: 'var(--cInfo)',
};
const ToastColor = {
  success: 'var(--cToastSuccess)',
  error: 'var(--cToastError)',
  warning: 'var(--cToastWarning)',
  info: 'var(--cToastInfo)',
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
      showToast('');
    }, 700);
  };

  useEffect(() => {
    if (toast?.msg && toast?.msg != '') {
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
    ' ' +
    (open1 ? styles.open : '') +
    ' ' +
    (!toast?.msg || toast?.msg == '' ? 'hidden ' : '') +
    styles[toast?.type || 'info'];

  return (
    <>
      <div
        className={clase}
        style={{
          backgroundColor: ToastColor[toast?.type || 'info'],
          border: `1px solid ${StatusColor[toast?.type || 'info']}`,
        }}
      >
        <div
          style={{
            backgroundColor: StatusColor[toast?.type || 'info'],
            padding: 4,
            borderRadius: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {ToastIcon[toast?.type || 'info']}
        </div>
        <div>
          {/* <p>{ToastMsg[toast?.type || "info"]}</p> */}
          {toast?.type === 'success' && (
            <div
              style={{
                fontSize: 16,
                color: 'var(--cWhite)',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
              }}
            >
              ¡Excelente!
            </div>
          )}
          {toast?.type === 'error' && (
            <div
              style={{
                fontSize: 16,
                color: 'var(--cWhite)',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
              }}
            >
            ¡Lo sentimos!
            </div>
          )}
          {toast?.type === 'warning' && (
            <div
              style={{
                fontSize: 16,
                color: 'var(--cWhite)',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
              }}
            >
            ¡Advertencia!
            </div>
          )}
          <div>{toast?.msg}</div>
        </div>
        <div className={styles.close} onClick={() => _close()}>
          <IconX size={24} />
        </div>
      </div>
    </>
  );
};
export default Toast;
