'use client';
import React, { useEffect, useState } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';
import Select from '@/mk/components/forms/Select/Select';
import Check from '@/mk/components/forms/Check/Check';
import Tooltip from '@/mk/components/ui/Tooltip/Tooltip';
import { MONTHS } from '@/mk/utils/date';
import { useAuth } from '@/mk/contexts/AuthProvider';
import { checkRules, hasErrors } from '@/mk/utils/validate/Rules';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { getFullName } from '@/mk/utils/string';
import { UnitsType } from '@/mk/utils/utils';
import styles from './RenderForm.module.css';
import { IconArrowDown, IconQuestion } from '@/components/layout/icons/IconsBiblioteca';

type yearProps = { id: string | number; name: string }[];

const RenderForm = ({ open, onClose, item, setItem, execute, extraData, user, reLoad }: any) => {
  const [formState, setFormState]: any = useState({
    ...item,
    begin_at: item.begin_at || '',
    due_at: item.due_at || '',
    type: 4,
    description: item.description || '',
    subcategory_id: item.subcategory_id || '',
    asignar: item.asignar || 'T',
    dpto_id: item.dpto_id || [],
    amount_type: item.amount_type || 'F',
    amount: item.amount || '',
    is_advance: item.is_advance || 'Y',
    interest: item.interest || 0,
    // Cambiar a show_advanced para controlar el desplegable
    show_advanced: item.show_advanced || false,
    // Checkboxes avanzados
    has_mv: item.has_mv === 'Y' || item.has_mv === true,
    is_forgivable: item.is_forgivable === 'Y' || item.is_forgivable === true,
    has_pp: item.has_pp === 'Y' || item.has_pp === true || item.has_pp === undefined,
    is_blocking: item.is_blocking === 'Y' || item.is_blocking === true,
  });
  const [errors, setErrors]: any = useState({});
  const [ldpto, setLdpto] = useState([]);
  const client = user.clients.filter((item: any) => item.id === user.client_id)[0];
  const { showToast } = useAuth();

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    if (name === 'asignar' && value !== 'S') {
      setFormState((prev: any) => ({
        ...prev,
        [name]: newValue,
        dpto_id: []
      }));
    } else {
      setFormState((prev: any) => ({ ...prev, [name]: newValue }));
    }
  };

  const validate = () => {
    let errs: any = {};

    errs = checkRules({
      value: formState.begin_at,
      rules: ['required'],
      key: 'begin_at',
      errors: errs,
    });

    errs = checkRules({
      value: formState.due_at,
      rules: ['required'],
      key: 'due_at',
      errors: errs,
    });

    errs = checkRules({
      value: formState.amount,
      rules: ['required'],
      key: 'amount',
      errors: errs,
    });

    errs = checkRules({
      value: formState.subcategory_id,
      rules: ['required'],
      key: 'subcategory_id',
      errors: errs,
    });

    // Solo validar dpto_id si asignar es 'S' (Seleccionar Unidades)
    if (formState.asignar === 'S') {
      errs = checkRules({
        value: formState.dpto_id,
        rules: ['required'],
        key: 'dpto_id',
        errors: errs,
      });
    }

    setErrors(errs);
    return errs;
  };

  const onSave = async () => {
    let method = formState.id ? 'PUT' : 'POST';
    if (hasErrors(validate())) return;

    // Preparar datos para envío con tipo explícito
    const dataToSend: any = {
      begin_at: formState.begin_at,
      due_at: formState.due_at,
      type: "4",
      description: formState.description,
      subcategory_id: formState.subcategory_id,
      asignar: formState.asignar,
      amount_type: formState.amount_type,
      amount: formState.amount,
      is_advance: formState.is_advance,
      interest: formState.interest,
      has_mv: formState.has_mv ? 'Y' : 'N',
      is_forgivable: formState.is_forgivable ? 'Y' : 'N',
      has_pp: formState.has_pp ? 'Y' : 'N',
      is_blocking: formState.is_blocking ? 'Y' : 'N',
    };

    // Solo incluir dpto_id si asignar es 'S'
    if (formState.asignar === 'S') {
      dataToSend.dpto_id = formState.dpto_id;
    }

    const { data: response } = await execute(
      '/debts' + (formState.id ? '/' + formState.id : ''),
      method,
      dataToSend,
      false
    );

    if (response?.success === true) {
      reLoad();
      setItem(formState);
      showToast(response?.message, 'success');
      onClose();
    } else {
      showToast(response?.message, 'error');
    }
  };

  // Función actualizada para usar datos reales de extraData
  const getSubcategoryOptions = () => {
    // Si extraData tiene las categorías con subcategorías (hijos)
    if (extraData?.categories) {
      const subcategories: any[] = [];

      // Iterar sobre todas las categorías
      extraData.categories.forEach((category: any) => {
        // Si la categoría tiene hijos (subcategorías), agregarlos
        if (category.hijos && Array.isArray(category.hijos)) {
          category.hijos.forEach((subcategory: any) => {
            subcategories.push({
              id: subcategory.id,
              name: subcategory.name,
              category_name: category.name // Opcional: incluir el nombre de la categoría padre
            });
          });
        }
      });

      return subcategories;
    }

    // Si extraData tiene una estructura directa con hijos
    if (extraData?.hijos && Array.isArray(extraData.hijos)) {
      return extraData.hijos.map((subcategory: any) => ({
        id: subcategory.id,
        name: subcategory.name
      }));
    }

    // Fallback: devolver array vacío si no hay datos
    return [];
  };

  // Función para obtener categorías
  const getCategoryOptions = () => {
    // Si extraData tiene las categorías con subcategorías (hijos)
    if (extraData?.categories) {
      const subcategories: any[] = [];

      // Iterar sobre todas las categorías
      extraData.categories.forEach((category: any) => {
        // Si la categoría tiene hijos (subcategorías), agregarlos
        if (category.hijos && Array.isArray(category.hijos)) {
          category.hijos.forEach((subcategory: any) => {
            subcategories.push({
              id: subcategory.id,
              name: subcategory.name,
              category_name: category.name, // Opcional: incluir el nombre de la categoría padre
            });
          });
        }
      });

      return subcategories;
    }

    // Si extraData tiene una estructura directa con hijos
    if (extraData?.hijos && Array.isArray(extraData.hijos)) {
      return extraData.hijos.map((subcategory: any) => ({
        id: subcategory.id,
        name: subcategory.name,
      }));
    }

    // Fallback: devolver array vacío si no hay datos
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
    { id: 'V', name: 'Variable' },
    { id: 'P', name: 'Porcentual' },
    { id: 'M', name: 'Por m²' },
    { id: 'A', name: 'Promedio' },
  ];



  useEffect(() => {
    const lista: any = [];
    extraData?.dptos?.map((item: any, key: number) => {
      lista[key] = {
        id: item.id,
        nro: item.nro,
        label:
          (getFullName(item?.titular) || 'Sin titular') +
          ' - ' +
          item.nro +
          ' ' +
          UnitsType['_' + client.type_dpto] +
          ' ' +
          item.description,
      };
    });
    setLdpto(lista);
  }, [client.type_dpto, extraData?.dptos]);

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={formState.id ? 'Editar deuda compartida' : 'Crear deuda compartida'}
      onSave={onSave}
      buttonText="Guardar"
      buttonCancel="Cancelar"
    >
      <div className={styles.formContainer}>
        {/* Segunda fila - Subcategoría y Asignación */}
        <div className={styles.formTextHeader}>
          <p className={styles.formTextHeaderP}>
            Genera y asigna deudas para distintos conceptos como servicios, mantenimiento o gastos
            extraordinarios.
          </p>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Select
              label="Asignación"
              name="asignar"
              value={formState.asignar}
              options={getAsignarOptions()}
              onChange={handleChange}
              error={errors}
              required
            />
          </div>
        </div>
        {/* Tercera fila - Unidades (condicional) */}
        {formState.asignar === 'S' && (
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <Select
                label="Unidades"
                name="dpto_id"
                value={formState.dpto_id}
                options={ldpto}
                optionLabel="label"
                optionValue="id"
                onChange={handleChange}
                error={errors}
                required
                placeholder="Seleccionar unidades"
                multiSelect={true}
              />
            </div>
          </div>
        )}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Select
              label="Distribución"
              name="amount_type"
              value={formState.amount_type}
              options={getAmountTypeOptions()}
              onChange={handleChange}
              error={errors}
              required
            />
          </div>
        </div>
        {/* Cuarta fila - Tipo de monto y Monto */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Input
              label="Monto Total (Bs)"
              name="amount"
              value={formState.amount}
              onChange={handleChange}
              type="number"
              min="0"
              error={errors}
              required
              placeholder="0.00"
            />
          </div>
          <div className={styles.formField}>
            <Input
              label="Interés % (Opcional)"
              name="interest"
              value={formState.interest}
              onChange={handleChange}
              type="number"
              min="0"
              max="100"
              error={errors}
              placeholder="0.00"
            />
          </div>
        </div>
        {/* Primera fila - Fechas */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Input
              label="Fecha de inicio"
              name="begin_at"
              value={formState.begin_at}
              onChange={handleChange}
              type="date"
              error={errors}
              required
            />
          </div>
          <div className={styles.formField}>
            <Input
              label="Fecha de vencimiento"
              name="due_at"
              value={formState.due_at}
              onChange={handleChange}
              type="date"
              error={errors}
              required
            />
          </div>
        </div>

        {/* Segunda fila - Subcategoría y Asignación */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <Select
              label="Categoría"
              name="category_id"
              value={formState.category_id}
              options={getCategoryOptions()}
              onChange={handleChange}
              error={errors}
              required
              placeholder="Seleccionar categoría"
            />
          </div>
          <div className={styles.formField}>
            <Select
              label="Subcategoría"
              name="subcategory_id"
              value={formState.subcategory_id}
              options={getSubcategoryOptions()}
              onChange={handleChange}
              error={errors}
              required
              placeholder="Seleccionar subcategoría"
            />
          </div>
        </div>

        {/* Campo de descripción */}
        <div className={styles.descriptionField}>
          <TextArea
            label="Detalle de la deuda"
            name="description"
            value={formState.description}
            onChange={handleChange}
            maxLength={500}
            required={false}
            error={errors}
            placeholder="Descripción adicional de la deuda (opcional)..."
          />
        </div>

        {/* Sección de Opciones Avanzadas con flecha desplegable */}
        <div className={styles.advancedSection}>
          <div
            className={styles.advancedToggle}
            onClick={() =>
              setFormState((prev: any) => ({ ...prev, show_advanced: !prev.show_advanced }))
            }
          >
            <span className={styles.advancedLabel}>Opciones avanzadas</span>
            <span
              className={`${styles.advancedArrow} ${
                formState.show_advanced ? styles.advancedArrowOpen : ''
              }`}
            >
              <IconArrowDown />
            </span>
          </div>

          {formState.show_advanced && (
            <div className={styles.advancedOptions}>
              <div className={styles.checkboxGrid}>
                <div className={styles.checkboxItem}>
                  <Check
                    label="Tiene Mantenimiento de Valor"
                    name="has_mv"
                    value={formState.has_mv ? 'Y' : 'N'}
                    checked={formState.has_mv}
                    onChange={handleChange}
                    error={errors}
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
                    value={formState.is_forgivable ? 'Y' : 'N'}
                    checked={formState.is_forgivable}
                    onChange={handleChange}
                    error={errors}
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
                    value={formState.is_blocking ? 'Y' : 'N'}
                    checked={formState.is_blocking}
                    onChange={handleChange}
                    error={errors}
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
                    value={formState.has_pp ? 'Y' : 'N'}
                    checked={formState.has_pp}
                    onChange={handleChange}
                    error={errors}
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
