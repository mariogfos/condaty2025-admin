'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  category_id: string | number;
  subcategory_id: string | number;
  asignar: string;
  dpto_id?: any[]; // Hacer opcional
  amount_type: string;
  amount: string | number;
  is_advance: string;
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
}

const RenderForm: React.FC<RenderFormProps> = ({
  open,
  onClose,
  item,
  extraData,
  showToast,
  onSave,
  user,
}) => {
  const [_formState, _setFormState] = useState<DebtFormState>(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    return {
      ...(item || {}),
      begin_at: (item && item.begin_at) || formattedDate,
      due_at: (item && item.due_at) || '',
      type: 4,
      description: (item && item.description) || '',
      category_id: (item && item.category_id) || '',
      subcategory_id: (item && item.subcategory_id) || '',
      asignar: (item && item.asignar) || 'T',
      dpto_id: (item && item.dpto_id) || [],
      amount_type: (item && item.amount_type) || 'F',
      amount: (item && item.amount) || '',
      is_advance: (item && item.is_advance) || 'Y',
      interest: (item && item.interest) || 0,
      show_advanced: (item && item.show_advanced) || false,
      has_mv: (item && item.has_mv) || false,
      is_forgivable: (item && item.is_forgivable) || false,
      has_pp: (item && item.has_pp) !== false, // Por defecto true
      is_blocking: (item && item.is_blocking) || false,
    };
  });

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [_errors, set_Errors] = useState<Errors>({});
  const [ldpto, setLdpto] = useState([]);
  const client = user?.clients?.filter((clientItem: any) => clientItem.id === user.client_id)[0];

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
        type: 4,
        description: (item && item.description) || '',
        category_id: (item && item.category_id) || '',
        subcategory_id: (item && item.subcategory_id) || '',
        asignar: (item && item.asignar) || 'T',
        dpto_id: (item && item.dpto_id) || [],
        amount_type: (item && item.amount_type) || 'F',
        amount: (item && item.amount) || '',
        is_advance: (item && item.is_advance) || 'Y',
        interest: (item && item.interest) || 0,
        show_advanced: (item && item.show_advanced) || false,
        has_mv: (item && item.has_mv) || false,
        is_forgivable: (item && item.is_forgivable) || false,
        has_pp: (item && item.has_pp) !== false,
        is_blocking: (item && item.is_blocking) || false,
      });
      setIsInitialized(true);
    }
  }, [open, item, isInitialized]);

  const handleChangeInput = useCallback(
    (e: any) => {
      const { name, value, type, checked } = e.target;
      let newValue = type === 'checkbox' ? checked : value;

      if (name === 'asignar' && value !== 'S') {
        _setFormState(prev => ({
          ...prev,
          [name]: newValue,
          dpto_id: []
        }));
      } else if (name === 'category_id') {
        _setFormState(prev => ({
          ...prev,
          [name]: newValue,
          subcategory_id: ''
        }));
      } else {
        _setFormState(prev => ({ ...prev, [name]: newValue }));
      }
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

    if (_formState.asignar === 'S') {
      addError(
        checkRules({
          value: _formState.dpto_id,
          rules: ['required'],
          key: 'dpto_id',
          errors: errs,
        }),
        'dpto_id'
      );
    }

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
      type: 4,
      description: '',
      category_id: '',
      subcategory_id: '',
      asignar: 'T',
      dpto_id: [],
      amount_type: 'F',
      amount: '',
      is_advance: 'Y',
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

  const handleSave = useCallback(() => {
    if (!validar()) return;

    // Crear el objeto base sin dpto_id
    const baseData = {
      ..._formState,
      // Convertir valores booleanos a strings como espera el backend
      has_mv: _formState.has_mv ? 'Y' : 'N',
      is_forgivable: _formState.is_forgivable ? 'Y' : 'N',
      has_pp: _formState.has_pp ? 'Y' : 'N',
      is_blocking: _formState.is_blocking ? 'Y' : 'N',
      // Asegurar que amount e interest sean números
      amount: parseFloat(String(_formState.amount || '0')),
      interest: parseFloat(String(_formState.interest || '0')),
    };

    // Crear el objeto final condicionalmente
    const dataToSave = _formState.asignar === 'S'
      ? { ...baseData, dpto_id: _formState.dpto_id }
      : { ...baseData };

    onSave?.(dataToSave);
  }, [_formState, validar, onSave]);

  const getCategoryOptions = () => {
    if (extraData?.categories && Array.isArray(extraData.categories)) {
      return extraData.categories.map((category: any) => ({
        id: category.id,
        name: category.name
      }));
    }
    return [];
  };

  const getSubcategoryOptions = () => {
    if (!_formState.category_id || !extraData?.categories) {
      return [];
    }

    const selectedCategory = extraData.categories.find(
      (category: any) => category.id == _formState.category_id
    );

    if (selectedCategory?.hijos && Array.isArray(selectedCategory.hijos)) {
      return selectedCategory.hijos.map((subcategory: any) => ({
        id: subcategory.id,
        name: subcategory.name
      }));
    }

    return [];
  };

  const getAsignarOptions = () => [
    { id: 'T', name: 'Todas las unidades' },
    { id: 'O', name: 'Unidades ocupadas' },
    { id: 'L', name: 'Unidades libres' },
    { id: 'S', name: 'Seleccionar Unidades' },
  ];

  const getAmountTypeOptions = () => [
    { id: 'F', name: 'Fijo' },
    { id: 'M', name: 'Por m²' },
    { id: 'A', name: 'Promedio' },
  ];

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
      onClose={onCloseModal}
      onSave={handleSave}
      buttonCancel="Cancelar"
      buttonText={_formState.id ? 'Actualizar' : 'Crear deuda compartida'}
      title={_formState.id ? 'Editar deuda compartida' : 'Crear deuda compartida'}
    >
      <div className={styles.formContainer}>
        <div className={styles.formTextHeader}>
          <p className={styles.formTextHeaderP}>
            Genera y asigna deudas para distintos conceptos como servicios, mantenimiento o gastos
            extraordinarios.
          </p>
        </div>

        {/* Asignación */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Select
              label="Asignación"
              name="asignar"
              value={_formState.asignar}
              options={getAsignarOptions()}
              onChange={handleChangeInput}
              error={_errors}
              required
              className={_errors.asignar ? styles.error : ''}
            />
          </div>
        </div>

        {/* Unidades (condicional) */}
        {_formState.asignar === 'S' && (
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <Select
                label="Unidades"
                name="dpto_id"
                value={_formState.dpto_id}
                options={ldpto}
                optionLabel="label"
                optionValue="id"
                onChange={handleChangeInput}
                error={_errors}
                required
                placeholder="Seleccionar unidades"
                multiSelect={true}
                className={_errors.dpto_id ? styles.error : ''}
              />
            </div>
          </div>
        )}

        {/* Distribución */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Select
              label="Distribución"
              name="amount_type"
              value={_formState.amount_type}
              options={getAmountTypeOptions()}
              onChange={handleChangeInput}
              error={_errors}
              required
              className={_errors.amount_type ? styles.error : ''}
            />
          </div>
        </div>

        {/* Monto e Interés */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Input
              label="Monto Total (Bs)"
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

        {/* Categoría y Subcategoría */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Select
              label="Categoría"
              name="category_id"
              value={_formState.category_id}
              options={getCategoryOptions()}
              onChange={handleChangeInput}
              error={_errors}
              required
              placeholder="Seleccionar categoría"
              className={_errors.category_id ? styles.error : ''}
            />
          </div>
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
              disabled={!_formState.category_id}
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
            onClick={() =>
              _setFormState(prev => ({ ...prev, show_advanced: !prev.show_advanced }))
            }
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
