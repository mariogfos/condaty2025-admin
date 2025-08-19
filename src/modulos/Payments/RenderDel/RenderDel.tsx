'use client';
import { memo, useState, useCallback } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import styles from './RenderDel.module.css';
import { checkRules } from '@/mk/utils/validate/Rules';
import { useAuth } from '@/mk/contexts/AuthProvider';

interface RenderDelProps {
  open: boolean;
  onClose: () => void;
  item?: any;
  onSave: (params: any) => void;
  execute: (url: string, method: string, params: any) => Promise<any>;
  reLoad: () => void;
  extraData?: any;
}

const RenderDel = memo(({ open, onClose, item, onSave, execute, reLoad }: RenderDelProps) => {
  const { showToast } = useAuth();
  const [canceledObs, setCanceledObs] = useState('');
  const [_errors, set_Errors] = useState<{ [key: string]: string }>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = e.target;
      setCanceledObs(value);

      // Clear error when user starts typing
      if (_errors.canceled_obs) {
        set_Errors(prev => ({
          ...prev,
          canceled_obs: '',
        }));
      }
    },
    [_errors]
  );

  const validar = useCallback(() => {
    let errs: { [key: string]: string } = {};

    const addError = (result: string | Record<string, string> | null, key: string) => {
      if (typeof result === 'string' && result) {
        errs[key] = result;
      } else if (result && typeof result === 'object') {
        Object.entries(result).forEach(([k, v]) => {
          if (v) errs[k] = v;
        });
      }
    };

    addError(
      checkRules({
        value: canceledObs,
        rules: ['required', 'max:500'],
        key: 'canceled_obs',
        errors: errs,
      }),
      'canceled_obs'
    );

    const filteredErrs = Object.fromEntries(
      Object.entries(errs).filter(([_, v]) => typeof v === 'string' && v !== undefined)
    );
    set_Errors(filteredErrs);

    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const firstErrorElement =
          document.querySelector(`.${styles.error}`) || document.querySelector('.error');
        if (firstErrorElement) {
          (firstErrorElement as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
    }
    return Object.keys(errs).length === 0;
  }, [canceledObs]);

  const handleSave = useCallback(async () => {
    if (!validar()) return;

    const params = {
      id: item?.id,
      canceled_obs: canceledObs.trim(),
    };

    try {
      const { data: response } = await execute(`/payments/${item?.id}`, 'DELETE', params);

      if (response?.success) {
        onClose();
        reLoad();
        showToast('Ingreso anulado con éxito', 'success');
      } else {
        showToast(response?.message || 'Error al anular el ingreso', 'error');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      showToast('Error al anular el ingreso', 'error');
    }
  }, [validar, item?.id, canceledObs, execute, onClose, reLoad, showToast]);

  const onCloseModal = useCallback(() => {
    setCanceledObs('');
    set_Errors({});
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <DataModal
      id="PaymentDelModal"
      title="Anular ingreso"
      open={open}
      onClose={onCloseModal}
      buttonText="Anular ingreso"
      buttonCancel="Cancelar"
      onSave={handleSave}
      className={styles.delModalContent}
      variant="mini"
    >
      <div className={styles.delContainer}>
        <p className={styles.warningText}>
          ¿Seguro que quieres anular este ingreso? Recuerda que si realizas esta acción perderás los
          cambios y no se reflejará en tu flujo de efectivo.
        </p>

        <TextArea
          name="canceled_obs"
          value={canceledObs}
          onChange={handleChange}
          label="Motivo de anulación"
          error={_errors}
          required
          maxLength={500}
          className={_errors.canceled_obs ? styles.error : ''}
        />

        {canceledObs && canceledObs.length > 0 && (
          <p className={styles.charCount}>{canceledObs.length}/500 caracteres</p>
        )}
      </div>
    </DataModal>
  );
});

RenderDel.displayName = 'RenderDel';
export default RenderDel;
