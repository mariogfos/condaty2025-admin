'use client';
import React, { useState, useEffect, useCallback } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';
import Select from '@/mk/components/forms/Select/Select';
import Check from '@/mk/components/forms/Check/Check';
import Tooltip from '@/mk/components/ui/Tooltip/Tooltip';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { getFullName } from '@/mk/utils/string';
import { hasMaintenanceValue, UnitsType } from '@/mk/utils/utils';
import styles from './RenderForm.module.css';
import { IconArrowDown, IconQuestion } from '@/components/layout/icons/IconsBiblioteca';
import { checkRules } from '@/mk/utils/validate/Rules';
import { getNow } from "@/mk/utils/date";
import {
  DebtBlocking,
  DebtForgivable,
  DebtMaintenanceValue,
  DebtPaymentPlan,
  DebtType,
} from '@/types/PaymentType';
import { banderaEncendida } from '../../constants';

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
  action,
}) => {
  const [_formState, _setFormState] = useState<DebtFormState>(() => {
    const formattedDate = getNow();
    return {
      ...(item || {}),
      begin_at: (item && item.begin_at) || formattedDate,
      due_at: (item && item.due_at) || '',
      type: DebtType.NORMAL,
      description: (item && item.description) || '',
      subcategory_id: (item && item.subcategory_id) || '',
      dpto_id: (item && item.dpto_id) || '',
      amount: (item && item.amount) || '',
      interest: (item && item.interest) || 0,
      show_advanced: (item && item.show_advanced) || false,
      // 🔴 `(item && item.has_mv) || false` leía `1` y `2` como verdaderos:
      // abrir una deuda para editarla mostraba las cuatro tildadas, fuera cual
      // fuera su valor, y guardarla las encendía de verdad. Ver `banderaEncendida`.
      has_mv: banderaEncendida(item?.has_mv, DebtMaintenanceValue.APLICA),
      is_forgivable: banderaEncendida(item?.is_forgivable, DebtForgivable.CONDONABLE),
      has_pp: banderaEncendida(item?.has_pp, DebtPaymentPlan.ADMITE),
      is_blocking: banderaEncendida(item?.is_blocking, DebtBlocking.BLOQUEA),
    };
  });

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [_errors, set_Errors] = useState<Errors>({});
  const [ldpto, setLdpto] = useState([]);
  const client = user?.clients?.filter((clientItem: any) => clientItem.id === user.client_id)[0];
  const canUseMaintenance = hasMaintenanceValue(user);


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
      const formattedDate = getNow();

      _setFormState({
        ...(item || {}),
        begin_at: (item && item.begin_at) || formattedDate,
        due_at: (item && item.due_at) || '',
        type: DebtType.NORMAL,
        description: (item && item.description) || '',
        subcategory_id: (item && item.subcategory_id) || '',
        dpto_id: (item && item.dpto_id) || '',
        amount: (item && item.amount) || '',
        interest: (item && item.interest) || 0,
        show_advanced: (item && item.show_advanced) || false,
        has_mv: banderaEncendida(item?.has_mv, DebtMaintenanceValue.APLICA),
        is_forgivable: banderaEncendida(item?.is_forgivable, DebtForgivable.CONDONABLE),
        has_pp: banderaEncendida(item?.has_pp, DebtPaymentPlan.ADMITE),
        is_blocking: banderaEncendida(item?.is_blocking, DebtBlocking.BLOQUEA),
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

    // Function: RenderForm (fragmento dentro de validar)
    addError(
      checkRules({
        value: _formState.amount,
        rules: ['required', 'positive'],
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
    // Validación para interés: positivo y máximo 100
    addError(
      checkRules({
        value: _formState.interest,
        rules: ['positive', 'less:100'],
        key: 'interest',
        errors: errs,
      }),
      'interest'
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
    const formattedDate = getNow();
    _setFormState({
      begin_at: formattedDate,
      due_at: '',
      type: DebtType.NORMAL,
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

      // 🔴 Booleanos, NO 'Y'/'N' (CDT-60). Las cuatro columnas son
      // `tinyint(1)` desde la migración de 2026-06-30 y son `$fillable` en
      // `DebtDpto`, así que el string entra crudo al INSERT: Laravel castea al
      // LEER, no al escribir. Con la base en modo estricto el alta muere con
      // `ERROR 1366: Incorrect integer value: 'N' for column has_mv`; sin modo
      // estricto pasa y guarda 0 en las cuatro. Los dos casos son el bug.
      //
      // ⚠️ El alta individual (`DebtType.NORMAL`) va por `parent::store()` del kernel,
      // que NO normaliza. El `boolFlag()` de `SharedDebtService` sólo cubre el
      // camino compartido (`DebtType.SHARED`), por eso este formulario era el único que
      // moría.
      has_mv: !!_formState.has_mv,
      is_forgivable: !!_formState.is_forgivable,
      has_pp: !!_formState.has_pp,
      is_blocking: !!_formState.is_blocking,
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


  // 🔴 Los DOS juegos de errores, mezclados (CDT-60).
  //
  // Era `externalErrors || _errors`, y `externalErrors` es un objeto: `{}` es
  // truthy, así que el `||` se quedaba SIEMPRE con el del kernel y los locales
  // no llegaban nunca. Encima los inputs pintaban `_errors` a mano, con lo cual
  // un rechazo de `checkRulesFields` era invisible. Se mezclan y se pinta esto.
  const currentErrors: Errors = { ..._errors, ...(externalErrors || {}) };


  useEffect(() => {
    if (!open && isInitialized) {
      setIsInitialized(false);
      const formattedDate = getNow();
      _setFormState({
        begin_at: formattedDate,
        due_at: '',
        type: DebtType.NORMAL,
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
          (dptoItem.description ? ' - ' + dptoItem.description : ''),
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
              error={currentErrors}
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
              error={currentErrors}
              required
              placeholder="0.00"
              className={currentErrors.amount ? styles.error : ''}
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
              error={currentErrors}
              placeholder="0.00"
              className={currentErrors.interest ? styles.error : ''}
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
              error={currentErrors}
              required
              className={currentErrors.begin_at ? styles.error : ''}
            />
          </div>
          <div className={styles.formField}>
            <Input
              label="Fecha de vencimiento"
              name="due_at"
              value={_formState.due_at}
              onChange={handleChangeInput}
              type="date"
              error={currentErrors}
              required
              className={currentErrors.due_at ? styles.error : ''}
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
              error={currentErrors}
              required
              placeholder="Seleccionar subcategoría"
              className={currentErrors.subcategory_id ? styles.error : ''}
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
            error={currentErrors}
            placeholder="Descripción adicional de la deuda (opcional)..."
            className={currentErrors.description ? styles.error : ''}
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
              className={`${styles.advancedArrow} ${_formState.show_advanced ? styles.advancedArrowOpen : ''
                }`}
            >
              <IconArrowDown />
            </span>
          </div>

          {_formState.show_advanced && (
            <div className={styles.advancedOptions}>
              <div className={styles.checkboxGrid}>
                {canUseMaintenance &&
                  <>
                    <div className={styles.checkboxItem}>

                      <Check
                        label="Tiene Mantenimiento de Valor"
                        name="has_mv"
                        value={_formState.has_mv ? 'Y' : 'N'}
                        checked={_formState.has_mv}
                        onChange={handleChangeInput}
                        error={currentErrors}
                        reverse={true}
                      />
                      <Tooltip
                        title="Ajusta automáticamente el valor de la deuda según la inflación o índices económicos"
                        position="top"
                      >
                        <IconQuestion size={16} className={styles.tooltipIcon} />
                      </Tooltip>

                    </div>
                  </>}
                <div className={styles.checkboxItem}>
                  <Check
                    label="Será condonable"
                    name="is_forgivable"
                    value={_formState.is_forgivable ? 'Y' : 'N'}
                    checked={_formState.is_forgivable}
                    onChange={handleChangeInput}
                    error={currentErrors}
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
                    error={currentErrors}
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
                    error={currentErrors}
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
