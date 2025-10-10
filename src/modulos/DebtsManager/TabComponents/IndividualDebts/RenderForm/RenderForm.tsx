'use client';
import React, { useState, useEffect, useCallback } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';
import Select from '@/mk/components/forms/Select/Select';
import Check from '@/mk/components/forms/Check/Check';
import Tooltip from '@/mk/components/ui/Tooltip/Tooltip';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { getFullName } from '@/mk/utils/string';
import { UnitsType } from '@/mk/utils/utils';
import styles from './RenderForm.module.css';
import { IconArrowDown, IconQuestion } from '@/components/layout/icons/IconsBiblioteca';
import { checkRules } from '@/mk/utils/validate/Rules';

interface DebtFormState {
  id?: string | number;
  begin_at: string;
  due_at: string;
  type: number;
  description: string;
  subcategory_id: string | number;
  dpto_id: string | number;
  amount: string | number;
  interest: number;
  show_advanced: boolean;
  has_mv: boolean;
  is_forgivable: boolean;
  has_pp: boolean;
  is_blocking: boolean;
}

interface Errors {
  [key: string]: string;
}

interface RenderFormProps {
  open: boolean;
  onClose: () => void;
  item?: Partial<DebtFormState>;
  onSave?: (params: any) => void;
  extraData?: any;
  execute: (url: string, method: string, params: any) => Promise<any>;
  showToast: (msg: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  reLoad: () => void;
  user?: any;
  setItem?: (item: any) => void;
  errors?: any;
  setErrors?: (errors: any) => void;
  action?: string;
}

const RenderForm: React.FC<RenderFormProps> = ({
  open,
  onClose,
  item,
  extraData,
  showToast,
  onSave,
  user,
  setItem,
  errors: externalErrors,
  setErrors: externalSetErrors,
  action,
}) => {
  const [_formState, _setFormState] = useState<DebtFormState>(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    return {
      ...(item || {}),
      begin_at: (item && item.begin_at) || formattedDate,
      due_at: (item && item.due_at) || '',
      type: 0, // Tipo para deudas individuales
      description: (item && item.description) || '',
      subcategory_id: (item && item.subcategory_id) || '',
      dpto_id: (item && item.dpto_id) || '',
      amount: (item && item.amount) || '',
      interest: (item && item.interest) || 0,
      show_advanced: (item && item.show_advanced) || false,
      has_mv: (item && item.has_mv) || false,
      is_forgivable: (item && item.is_forgivable) || false,
      has_pp: (item && item.has_pp) || false,
      is_blocking: (item && item.is_blocking) || false,
    };
  });

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [_errors, set_Errors] = useState<Errors>({});
  const [ldpto, setLdpto] = useState([]);
  const client = user?.clients?.filter((clientItem: any) => clientItem.id === user.client_id)[0];


  const findCategoryBySubcategory = (subcategoryId: string | number) => {
    if (!extraData?.categories || !subcategoryId) return null;

    for (const category of extraData.categories) {
      if (category.hijos && Array.isArray(category.hijos)) {
        const foundSubcategory = category.hijos.find(
          (sub: any) => sub.id == subcategoryId
        );
        if (foundSubcategory) {
          return category;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      return;
    }
    if (!isInitialized && open) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];

      _setFormState({
        ...(item || {}),
        begin_at: (item && item.begin_at) || formattedDate,
        due_at: (item && item.due_at) || '',
        type: 0,
        description: (item && item.description) || '',
        subcategory_id: (item && item.subcategory_id) || '',
        dpto_id: (item && item.dpto_id) || '',
        amount: (item && item.amount) || '',
        interest: (item && item.interest) || 0,
        show_advanced: (item && item.show_advanced) || false,
        has_mv: (item && item.has_mv) || false,
        is_forgivable: (item && item.is_forgivable) || false,
        has_pp: (item && item.has_pp) || false,
        is_blocking: (item && item.is_blocking) || false,
      });
      setIsInitialized(true);
    }
  }, [open, item, isInitialized, extraData?.categories]);

  const handleChangeInput = useCallback(
    (e: any) => {
      const { name, value, type, checked } = e.target;
      let newValue = type === 'checkbox' ? checked : value;
      _setFormState(prev => ({ ...prev, [name]: newValue }));
    },
    []
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
        value: _formState.begin_at,
        rules: ['required'],
        key: 'begin_at',
        errors: errs,
      }),
      'begin_at'
    );
    addError(
      checkRules({
        value: _formState.due_at,
        rules: ['required'],
        key: 'due_at',
        errors: errs,
      }),
      'due_at'
    );

    if (_formState.begin_at && _formState.due_at) {
      const beginDate = new Date(_formState.begin_at);
      const dueDate = new Date(_formState.due_at);

      if (dueDate <= beginDate) {
        errs.due_at = 'La fecha de vencimiento debe ser posterior a la fecha de inicio';
      }
    }

    addError(
      checkRules({
        value: _formState.amount,
        rules: ['required'],
        key: 'amount',
        errors: errs,
      }),
      'amount'
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
        value: _formState.dpto_id,
        rules: ['required'],
        key: 'dpto_id',
        errors: errs,
      }),
      'dpto_id'
    );

    const filteredErrs = Object.fromEntries(
      Object.entries(errs).filter(
        ([_, v]) => typeof v === 'string' && v !== undefined
      )
    );
    set_Errors(filteredErrs);

    return Object.keys(errs).length === 0;
  }, [_formState]);

  const onCloseModal = useCallback(() => {
    setIsInitialized(false);
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    _setFormState({
      begin_at: formattedDate,
      due_at: '',
      type: 0,
      description: '',
      subcategory_id: '',
      dpto_id: '',
      amount: '',
      interest: 0,
      show_advanced: false,
      has_mv: false,
      is_forgivable: false,
      has_pp: true,
      is_blocking: false,
    });
    set_Errors({});
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!validar()) return;

    const dataToSave = {
      ..._formState,

      has_mv: _formState.has_mv ? 'Y' : 'N',
      is_forgivable: _formState.is_forgivable ? 'Y' : 'N',
      has_pp: _formState.has_pp ? 'Y' : 'N',
      is_blocking: _formState.is_blocking ? 'Y' : 'N',
      // Asegurar que amount e interest sean números
      amount: parseFloat(String(_formState.amount || '0')),
      interest: parseFloat(String(_formState.interest || '0')),

    };

    try {

      if (onSave) {
        await onSave(dataToSave);

      }
    } catch (error) {
      console.error('Error saving:', error);
    }
  }, [_formState, validar, onSave]);


  const currentErrors = externalErrors || _errors;
  const currentSetErrors = externalSetErrors || set_Errors;


  useEffect(() => {
    if (!open && isInitialized) {
      setIsInitialized(false);
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      _setFormState({
        begin_at: formattedDate,
        due_at: '',
        type: 0,
        description: '',
        subcategory_id: '',
        dpto_id: '',
        amount: '',
        interest: 0,
        show_advanced: false,
        has_mv: false,
        is_forgivable: false,
        has_pp: true,
        is_blocking: false,
      });
      set_Errors({});
    }
  }, [open, isInitialized]);

  const getSubcategoryOptions = () => {
    if (!extraData?.categories) {
      return [];
    }

    const subcategories: any[] = [];
    extraData.categories.forEach((category: any) => {
      if (category.hijos && Array.isArray(category.hijos)) {
        category.hijos.forEach((subcategory: any) => {
          subcategories.push({
            id: subcategory.id,
            name: subcategory.name,
            category_name: category.name
          });
        });
      }
    });

    return subcategories;
  };

  useEffect(() => {
    const lista: any = [];
    extraData?.dptos?.map((dptoItem: any, key: number) => {
      lista[key] = {
        id: dptoItem.id,
        nro: dptoItem.nro,
        label:
          (getFullName(dptoItem?.titular) || 'Sin titular') +
          ' - ' +
          dptoItem.nro +
          ' ' +
          UnitsType['_' + client?.type_dpto] +
          ' ' +
          dptoItem.description,
      };
    });
    setLdpto(lista);
  }, [client?.type_dpto, extraData?.dptos]);

  return (
    <DataModal
      open={open}
      onClose={onClose} // Usar directamente onClose sin wrapper
      onSave={handleSave}
      buttonCancel="Cancelar"
      buttonText={_formState.id ? 'Actualizar' : 'Crear deuda individual'}
      title={_formState.id ? 'Editar deuda individual' : 'Crear deuda individual'}
      variant={"mini"}
    >
      <div className={styles.formContainer}>
        <div className={styles.formTextHeader}>
          <p className={styles.formTextHeaderP}>
            Crea deudas individuales para unidades específicas con montos personalizados.
          </p>
        </div>

        {/* Unidad */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Select
              label="Unidad"
              name="dpto_id"
              value={_formState.dpto_id}
              options={ldpto}
              optionLabel="label"
              optionValue="id"
              onChange={handleChangeInput}
              error={_errors}
              required
              placeholder="Seleccionar unidad"
              className={currentErrors.dpto_id ? styles.error : ''}
              filter={true}
            />
          </div>
        </div>

        {/* Monto e Interés */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Input
              label="Monto (Bs)"
              name="amount"
              value={_formState.amount}
              onChange={handleChangeInput}
              type="number"
              min="0"
              error={_errors}
              required
              placeholder="0.00"
              className={_errors.amount ? styles.error : ''}
            />
          </div>
          <div className={styles.formField}>
            <Input
              label="Interés % (Opcional)"
              name="interest"
              value={_formState.interest}
              onChange={handleChangeInput}
              type="number"
              min="0"
              max="100"
              error={_errors}
              placeholder="0.00"
              className={_errors.interest ? styles.error : ''}
            />
          </div>
        </div>

        {/* Fechas */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Input
              label="Fecha de inicio"
              name="begin_at"
              value={_formState.begin_at}
              onChange={handleChangeInput}
              type="date"
              error={_errors}
              required
              className={_errors.begin_at ? styles.error : ''}
            />
          </div>
          <div className={styles.formField}>
            <Input
              label="Fecha de vencimiento"
              name="due_at"
              value={_formState.due_at}
              onChange={handleChangeInput}
              type="date"
              error={_errors}
              required
              className={_errors.due_at ? styles.error : ''}
            />
          </div>
        </div>

        {/* Subcategoría */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Select
              label="Subcategoría"
              name="subcategory_id"
              value={_formState.subcategory_id}
              options={getSubcategoryOptions()}
              onChange={handleChangeInput}
              error={_errors}
              required
              placeholder="Seleccionar subcategoría"
              className={_errors.subcategory_id ? styles.error : ''}
            />
          </div>
        </div>

        {/* Descripción */}
        <div className={styles.descriptionField}>
          <TextArea
            label="Detalle de la deuda"
            name="description"
            value={_formState.description}
            onChange={handleChangeInput}
            maxLength={500}
            required={false}
            error={_errors}
            placeholder="Descripción adicional de la deuda (opcional)..."
            className={_errors.description ? styles.error : ''}
          />
        </div>

        {/* Opciones Avanzadas */}
        <div className={styles.advancedSection}>
          <div
            className={styles.advancedToggle}
            onClick={() => _setFormState(prev => ({ ...prev, show_advanced: !prev.show_advanced }))}
          >
            <span className={styles.advancedLabel}>Opciones avanzadas</span>
            <span
              className={`${styles.advancedArrow} ${
                _formState.show_advanced ? styles.advancedArrowOpen : ''
              }`}
            >
              <IconArrowDown />
            </span>
          </div>

          {_formState.show_advanced && (
            <div className={styles.advancedOptions}>
              <div className={styles.checkboxGrid}>
                <div className={styles.checkboxItem}>
                  <Check
                    label="Tiene Mantenimiento de Valor"
                    name="has_mv"
                    value={_formState.has_mv ? 'Y' : 'N'}
                    checked={_formState.has_mv}
                    onChange={handleChangeInput}
                    error={_errors}
                    reverse={true}
                  />
                  <Tooltip
                    title="Ajusta automáticamente el valor de la deuda según la inflación o índices económicos"
                    position="top"
                  >
                    <IconQuestion size={16} className={styles.tooltipIcon} />
                  </Tooltip>
                </div>

                <div className={styles.checkboxItem}>
                  <Check
                    label="Será condonable"
                    name="is_forgivable"
                    value={_formState.is_forgivable ? 'Y' : 'N'}
                    checked={_formState.is_forgivable}
                    onChange={handleChangeInput}
                    error={_errors}
                    reverse={true}
                  />
                  <Tooltip
                    title="Permite que la administración pueda perdonar o cancelar esta deuda en casos especiales"
                    position="top"
                  >
                    <IconQuestion size={16} className={styles.tooltipIcon} />
                  </Tooltip>
                </div>

                <div className={styles.checkboxItem}>
                  <Check
                    label="Será bloqueante por mora"
                    name="is_blocking"
                    value={_formState.is_blocking ? 'Y' : 'N'}
                    checked={_formState.is_blocking}
                    onChange={handleChangeInput}
                    error={_errors}
                    reverse={true}
                  />
                  <Tooltip
                    title="Impide que el propietario realice ciertas acciones hasta que pague esta deuda"
                    position="top"
                  >
                    <IconQuestion size={16} className={styles.tooltipIcon} />
                  </Tooltip>
                </div>

                <div className={styles.checkboxItem}>
                  <Check
                    label="Tendrá plan de pago"
                    name="has_pp"
                    value={_formState.has_pp ? 'Y' : 'N'}
                    checked={_formState.has_pp}
                    onChange={handleChangeInput}
                    error={_errors}
                    reverse={true}
                  />
                  <Tooltip
                    title="Permite dividir el pago de esta deuda en cuotas mensuales"
                    position="top"
                  >
                    <IconQuestion size={16} className={styles.tooltipIcon} />
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DataModal>
  );
};

export default RenderForm;
