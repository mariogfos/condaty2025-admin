'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Select from '@/mk/components/forms/Select/Select';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import Input from '@/mk/components/forms/Input/Input';
import styles from './RenderForm.module.css';
import Toast from '@/mk/components/ui/Toast/Toast';
import { UploadFile } from '@/mk/components/forms/UploadFile/UploadFile';
import { checkRules } from '@/mk/utils/validate/Rules';

interface Category {
  id: number | string;
  name: string;
  padre?: Category | null;
  category_id?: number | string | null;
}

interface Subcategory {
  id: number | string;
  name: string;
  category_id: number | string;
}

interface User {
  id: string;
  name: string;
  last_name?: string | null;
  middle_name?: string | null;
  mother_last_name?: string | null;
  has_image?: string;
}

interface OutlayFormState {
  date_at: string;
  category_id?: number | string;
  subcategory_id?: number | string;
  description?: string;
  amount?: string | number;
  type?: string;
  file?: File | string | null;
  filename?: string | null;
  ext?: string | null;
}

interface ExtraData {
  categories?: Category[];
  subcategories?: Subcategory[];
}

interface Errors {
  [key: string]: string;
}

interface RenderFormProps {
  open: boolean;
  onClose: () => void;
  item?: Partial<OutlayFormState>;
  onSave?: (params: any) => void;
  extraData?: ExtraData;
  execute: (url: string, method: string, params: any) => Promise<any>;
  showToast: (
    msg: string,
    type?: 'info' | 'success' | 'error' | 'warning'
  ) => void;
  reLoad: () => void;
  user?: User;
}

const RenderForm: React.FC<RenderFormProps> = ({
  open,
  onClose,
  item,
  extraData,
  showToast,
  onSave,
}) => {
  const [_formState, _setFormState] = useState<OutlayFormState>(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    return {
      ...(item || {}),
      ...(item || {}),
      date_at: (item && item.date_at) || formattedDate,
      type: (item && item.type) || '',
      file: (item && item.file) || null,
    };
  });
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [toast] = useState<{
    msg: string;
    type: 'info' | 'success' | 'error' | 'warning';
  }>({ msg: '', type: 'info' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [_errors, set_Errors] = useState<Errors>({});
  const exten = ['jpg', 'pdf', 'png', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'];

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      _setFormState(prev => ({
        ...prev,
        file: null,
      }));

      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (!isInitialized && open) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      _setFormState({
        ...(item || {}),
        date_at: (item && item.date_at) || formattedDate,
        type: (item && item.type) || '',
        file: (item && item.file) || null,
      });
      setIsInitialized(true);
    }
  }, [open, item, isInitialized]);

  const handleChangeInput = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | {
            target: {
              name: string;
              value: any;
              type?: string;
              checked?: boolean;
            };
          }
    ) => {
      const { name, value, type } = e.target;
      let newValue = value;
      if (type === 'checkbox' && 'checked' in e.target) {
        newValue = (e.target as HTMLInputElement).checked ? 'Y' : 'N';
      }
      if (name === 'category_id') {
        _setFormState(prev => ({
          ...prev,
          [name]: newValue,
          subcategory_id: '',
        }));
        if (newValue && extraData?.subcategories) {
          const filtered = extraData.subcategories.filter(
            subcat => subcat.category_id === Number(String(newValue))
          );
          setFilteredSubcategories(filtered || []);
        } else {
          setFilteredSubcategories([]);
        }
      } else {
        _setFormState(prev => ({ ...prev, [name]: newValue }));
      }
    },
    [extraData?.subcategories]
  );
  const validar = useCallback(() => {
    let errs: Errors = {};

    const addError = (
      result: string | Record<string, string> | null,
      key: string
    ) => {
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
        value: _formState.date_at,
        rules: ['required'],
        key: 'date_at',
        errors: errs,
      }),
      'date_at'
    );
    addError(
      checkRules({
        value: _formState.category_id,
        rules: ['required'],
        key: 'category_id',
        errors: errs,
      }),
      'category_id'
    );
    addError(
      checkRules({
        value: _formState.subcategory_id,
        rules: ['required'],
        key: 'subcategory_id',
        errors: errs,
      }),
      'subcategory_id'
    );
    addError(
      checkRules({
        value: _formState.description,
        rules: ['required', 'max:500'],
        key: 'description',
        errors: errs,
      }),
      'description'
    );
    addError(
      checkRules({
        value: _formState.amount,
        rules: ['required', 'max:10'],
        key: 'amount',
        errors: errs,
      }),
      'amount'
    );
    addError(
      checkRules({
        value: _formState.type,
        rules: ['required'],
        key: 'type',
        errors: errs,
      }),
      'type'
    );
    addError(
      checkRules({
        value: _formState.file,
        rules: ['required'],
        key: 'file',
        errors: errs,
      }),
      'file'
    );

    const filteredErrs = Object.fromEntries(
      Object.entries(errs).filter(
        ([_, v]) => typeof v === 'string' && v !== undefined
      )
    );
    set_Errors(filteredErrs);

    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const firstErrorElement =
          document.querySelector(`.${styles.error}`) ||
          document.querySelector('.error');
        if (firstErrorElement) {
          (firstErrorElement as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else {
          const modalBody = document.querySelector('.data-modal-body');
          if (modalBody) (modalBody as HTMLElement).scrollTop = 0;
        }
      }, 100);
    }
    return Object.keys(errs).length === 0;
  }, [_formState]);

  const onCloseModal = useCallback(() => {
    setIsInitialized(false);
    _setFormState(prev => ({
      date_at: new Date().toISOString().split('T')[0],
      type: '',
      category_id: '',
      subcategory_id: '',
      description: '',
      amount: '',
      file: null,
    }));
    setFilteredSubcategories([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    set_Errors({});
    onClose();
  }, [onClose, set_Errors]);

  const paymentMethods = [
    { id: 'T', name: 'Transferencia bancaria' },
    { id: 'O', name: 'Pago en oficina' },
    { id: 'Q', name: 'Pago QR' },
    { id: 'E', name: 'Efectivo' },
    { id: 'C', name: 'Cheque' },
  ];

  const handleSave = useCallback(() => {
    if (!validar()) return;

    const {
      date_at,
      category_id,
      subcategory_id,
      description,
      amount,
      type,
      file,
    } = _formState;
    const params = {
      date_at,
      category_id,
      subcategory_id: subcategory_id || null,
      description,
      amount: parseFloat(String(amount || '0')),
      type,
      file,
    };

    onSave?.(params);
  }, [_formState, validar, onSave]);

  return (
    <>
      <Toast toast={toast} showToast={showToast} />
      <DataModal
        open={open}
        onClose={onCloseModal}
        onSave={handleSave}
        buttonCancel="Cancelar"
        buttonText={'Crear egreso'}
        title={'Crear egreso'}
        variant={"mini"}
      >
        <div className={styles['outlays-form-container']}>
          {/* Fecha de pago */}
          <div className={styles.section}>
            <div className={styles['input-container']}>
              <Input
                type="date"
                name="date_at"
                label="Fecha de pago"
                required={true}
                value={_formState.date_at || ''}
                onChange={handleChangeInput}
                error={_errors}
                className={_errors.date_at ? styles.error : ''}
                max={new Date().toISOString().split('T')[0]}
                min={
                  new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0]
                }
              />
            </div>
          </div>
          {/* Categoría y Subcategoría */}
          <div className={styles.section}>
            <div className={styles['two-column-container']}>
              <div className={styles.column}>
                <div className={styles['input-container']}>
                  <Select
                    name="category_id"
                    value={_formState.category_id || ''}
                    label="Categoría"
                    onChange={handleChangeInput}
                    options={extraData?.categories || []}
                    error={_errors}
                    required
                    optionLabel="name"
                    optionValue="id"
                    className={_errors.category_id ? styles.error : ''}
                  />
                </div>
              </div>
              <div className={styles.column}>
                <div className={styles['input-container']}>
                  <Select
                    name="subcategory_id"
                    value={_formState.subcategory_id || ''}
                    label="Subcategoría"
                    onChange={handleChangeInput}
                    options={filteredSubcategories}
                    error={_errors}
                    required={true}
                    optionLabel="name"
                    optionValue="id"
                    disabled={!_formState.category_id}
                    className={_errors.subcategory_id ? styles.error : ''}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Monto y Método de pago */}
          <div className={styles['two-column-container']}>
            <div className={styles.column}>
              <div className={styles.section}>
                <div className={styles['input-container']}>
                  <Input
                    type="currency"
                    name="amount"
                    label="Monto del pago"
                    value={_formState.amount || ''}
                    onChange={handleChangeInput}
                    error={_errors}
                    required
                    maxLength={10}
                    className={_errors.amount ? styles.error : ''}
                  />
                </div>
              </div>
            </div>
            <div className={styles.column}>
              <div className={styles.section}>
                <div className={styles['input-container']}>
                  <Select
                    name="type"
                    value={_formState.type || ''}
                    label="Forma de pago"
                    onChange={handleChangeInput}
                    options={paymentMethods}
                    error={_errors}
                    required
                    optionLabel="name"
                    optionValue="id"
                    className={_errors.type ? styles.error : ''}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Comprobante */}
          <div className={styles.section}>
            <div className={styles['input-container']}>
              <UploadFile
                name="file"
                ext={exten}
                value={_formState.file ? { file: _formState.file } : ''}
                onChange={handleChangeInput}
                img={true}
                sizePreview={{ width: '40%', height: 'auto' }}
                error={_errors}
                setError={set_Errors}
                required={true}
                placeholder="Cargar un archivo o arrastrar y soltar"
              />
            </div>
          </div>
          {/* Concepto del pago */}
          <div className={styles.section}>

              <TextArea
                name="description"
                label="Concepto"
                value={_formState.description || ''}
                onChange={handleChangeInput}
                error={_errors}
                required
                maxLength={500}
                className={_errors.description ? styles.error : ''}
              />
              {_formState.description && _formState.description.length > 0 && (
                <p className={styles['char-count']}>
                  {_formState.description.length}/500 caracteres
                </p>
              )}

          </div>
          {/* Mostrar errores generales si existen */}
          {_errors.general && (
            <div className={`${styles.section} ${styles['error-general']}`}>
              <p className={styles['error-message']}>{_errors.general}</p>
            </div>
          )}
        </div>
      </DataModal>
    </>
  );
};

export default RenderForm;

