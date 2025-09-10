'use client';
import React, { useEffect, useState } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';
import Select from '@/mk/components/forms/Select/Select';
import { MONTHS } from '@/mk/utils/date';
import { useAuth } from '@/mk/contexts/AuthProvider';
import { checkRules, hasErrors } from '@/mk/utils/validate/Rules';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { getFullName } from '@/mk/utils/string';
import { UnitsType } from '@/mk/utils/utils';

type yearProps = { id: string | number; name: string }[];

const RenderForm = ({ open, onClose, item, setItem, execute, extraData, user, reLoad }: any) => {
  const [formState, setFormState]: any = useState({
    ...item,
    type: 1,
    dpto_id: item.dpto_id || [],
    due_at: item.due_at || '',
    amount: item.amount || '',
    category_id: item.category_id || '',
    subcategory_id: item.subcategory_id || '',
    distribution: item.distribution || 'equal',
    assignment: item.assignment || 'all',
    description: item.description || '',
  });
  const [errors, setErrors]: any = useState({});
  const [ldpto, setLdpto] = useState([]);
  const client = user.clients.filter((item: any) => item.id === user.client_id)[0];
  const { showToast } = useAuth();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    let errs: any = {};

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
      value: formState.category_id,
      rules: ['required'],
      key: 'category_id',
      errors: errs,
    });

    errs = checkRules({
      value: formState.subcategory_id,
      rules: ['required'],
      key: 'subcategory_id',
      errors: errs,
    });

    errs = checkRules({
      value: formState.distribution,
      rules: ['required'],
      key: 'distribution',
      errors: errs,
    });

    errs = checkRules({
      value: formState.assignment,
      rules: ['required'],
      key: 'assignment',
      errors: errs,
    });

    if (formState.assignment === 'specific') {
      errs = checkRules({
        value: formState.dpto_id && formState.dpto_id.length > 0 ? formState.dpto_id : null,
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

    const { data: response } = await execute(
      '/debts' + (formState.id ? '/' + formState.id : ''),
      method,
      {
        due_at: formState.due_at,
        amount: formState.amount,
        category_id: formState.category_id,
        subcategory_id: formState.subcategory_id,
        distribution: formState.distribution,
        assignment: formState.assignment,
        dpto_id: formState.dpto_id,
        description: formState.description,
        type: 1,
      },
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

  const getCategoryOptions = () => [
    { id: 1, name: 'Servicios básicos' },
    { id: 2, name: 'Mantenimiento' },
    { id: 3, name: 'Daños y perjuicios' },
    { id: 4, name: 'Gastos extraordinarios' },
    { id: 5, name: 'Administración' },
  ];

  const getSubcategoryOptions = () => {
    const subcategories: { [key: number]: { id: number; name: string }[] } = {
      1: [ // Servicios básicos
        { id: 11, name: 'Agua' },
        { id: 12, name: 'Electricidad' },
        { id: 13, name: 'Gas' },
        { id: 14, name: 'Internet' },
        { id: 15, name: 'Teléfono' },
      ],
      2: [ // Mantenimiento
        { id: 21, name: 'Limpieza' },
        { id: 22, name: 'Jardinería' },
        { id: 23, name: 'Reparaciones menores' },
        { id: 24, name: 'Pintura' },
      ],
      3: [ // Daños y perjuicios
        { id: 31, name: 'Reparación de equipos' },
        { id: 32, name: 'Daños a áreas comunes' },
        { id: 33, name: 'Reposición de elementos' },
      ],
      4: [ // Gastos extraordinarios
        { id: 41, name: 'Mejoras' },
        { id: 42, name: 'Equipamiento' },
        { id: 43, name: 'Emergencias' },
      ],
      5: [ // Administración
        { id: 51, name: 'Honorarios administrador' },
        { id: 52, name: 'Gastos legales' },
        { id: 53, name: 'Seguros' },
      ],
    };

    return subcategories[formState.category_id] || [];
  };

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
      title="Crear deuda"
      onSave={onSave}
      buttonText="Guardar"
      buttonCancel="Cancelar"
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%'
      }}>
        {/* Primera fila - Fecha de vencimiento y Monto */}
        <div style={{
          display: 'flex',
          gap: '16px',
          width: '100%'
        }}>
          <div style={{ flex: 1 }}>
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
          <div style={{ flex: 1 }}>
            <Input
              label="Monto (Bs)"
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
        </div>

        {/* Segunda fila - Categoría y Subcategoría */}
        <div style={{
          display: 'flex',
          gap: '16px',
          width: '100%'
        }}>
          <div style={{ flex: 1 }}>
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
          <div style={{ flex: 1 }}>
            <Select
              label="Subcategoría"
              name="subcategory_id"
              value={formState.subcategory_id}
              options={getSubcategoryOptions()}
              onChange={handleChange}
              error={errors}
              required
              placeholder="Seleccionar subcategoría"
              disabled={!formState.category_id}
            />
          </div>
        </div>

        {/* Tercera fila - Distribución y Asignación */}
        <div style={{
          display: 'flex',
          gap: '16px',
          width: '100%'
        }}>
          <div style={{ flex: 1 }}>
            <Select
              label="Distribución"
              name="distribution"
              value={formState.distribution}
              options={[
                { id: 'fixed', name: 'Monto fijo por unidad' },
                { id: 'equal', name: 'Dividido por igual' },
                { id: 'proportional', name: 'Proporcional a mt2' },
              ]}
              onChange={handleChange}
              error={errors}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <Select
              label="Asignación"
              name="assignment"
              value={formState.assignment}
              options={[
                { id: 'all', name: 'Todas las unidades' },
                { id: 'occupied', name: 'Unidades ocupadas' },
                { id: 'unoccupied', name: 'Unidades no ocupadas' },
                { id: 'specific', name: 'Seleccionar unidades específicas' },
              ]}
              onChange={handleChange}
              error={errors}
              required
            />
          </div>
        </div>

        {/* Selección específica de unidades */}
        {formState.assignment === 'specific' && (
          <div style={{ width: '100%' }}>
            <Select
              label="Seleccionar Unidades"
              name="dpto_id"
              value={formState?.dpto_id || []}
              options={ldpto}
              optionLabel="label"
              optionValue="id"
              onChange={handleChange}
              error={errors}
              placeholder="Seleccione las unidades"
              multiSelect={true}
              required
            />
          </div>
        )}

        {/* Campo de descripción */}
        <div style={{ width: '100%' }}>
          <TextArea
            label="Descripción"
            name="description"
            value={formState.description}
            onChange={handleChange}
            maxLength={500}
            required={false}
            error={errors}
            placeholder="Genera y asigna deudas para distintos conceptos como servicios, mantenimiento o gastos extraordinarios."
           
          />
        </div>
      </div>
    </DataModal>
  );
};

export default RenderForm;
