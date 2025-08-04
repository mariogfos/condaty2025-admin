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
      value: formState.year,
      rules: ['required'],
      key: 'year',
      errors: errs,
    });
    errs = checkRules({
      value: formState.month,
      rules: ['required'],
      key: 'month',
      errors: errs,
    });
    errs = checkRules({
      value: formState.due_at,
      rules: ['required'],
      key: 'due_at',
      errors: errs,
    });

    if (formState.year && formState.month !== undefined && formState.due_at) {
      const dueDate = new Date(formState.due_at);
      const expenseYear = parseInt(formState.year);
      const expenseMonth = parseInt(formState.month); // Del array MONTHS (1-12, con 0 = "")

      // Obtener año y mes de la fecha de vencimiento
      const dueYear = dueDate.getFullYear();
      const dueMonth = dueDate.getMonth() + 1; // JavaScript months (0-11) convertir a (1-12)

      // La fecha de vencimiento debe ser del mismo mes/año o posterior
      if (dueYear < expenseYear || (dueYear === expenseYear && dueMonth < expenseMonth)) {
        errs.due_at = 'La fecha de vencimiento no puede ser anterior al período de la expensa';
      }
    }
    errs = checkRules({
      value: formState.asignar,
      rules: ['required'],
      key: 'asignar',
      errors: errs,
    });
    if (formState.asignar === 'S') {
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
        year: formState.year,
        month: formState.month,
        due_at: formState.due_at,
        type: 1,
        description: formState.description,
        asignar: formState.asignar,
        dpto_id: formState.dpto_id,
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

  const getYearOptions = () => {
    const years: yearProps = [];
    const lastYear = new Date().getFullYear();
    for (let i = lastYear; i >= 2000; i--) {
      years.push({ id: i, name: i.toString() });
    }
    return years;
  };

  const monthOptions = MONTHS.map((month, index) => ({
    id: index,
    name: month,
  }));

  useEffect(() => {
    const lista: any = [];
    extraData?.dptos?.map((item: any, key: number) => {
      lista[key] = {
        id: item.id,
        nro:
          (getFullName(item.titular?.owner) || 'Sin titular') +
          ' - ' +
          item.nro +
          ' ' +
          UnitsType['_' + client.type_dpto] +
          ' ' +
          item.description,
      };
    });
    setLdpto(lista);
  }, [client.type_dpto, extraData?.dptos]); //esto?

  return (
    <DataModal open={open} onClose={onClose} title="Crear Expensa" onSave={onSave}>
      <Select
        label="Año"
        name="year"
        value={formState.year}
        options={getYearOptions()}
        onChange={handleChange}
        error={errors}
      />
      <Select
        label="Mes"
        name="month"
        value={formState.month}
        options={monthOptions}
        onChange={handleChange}
        error={errors}
      />
      <Input
        label="Fecha de vencimiento"
        name="due_at"
        value={formState.due_at}
        onChange={handleChange}
        type="date"
        error={errors}
      />
      <TextArea
        label="Descripción"
        name="description"
        value={formState.description}
        onChange={handleChange}
        maxLength={255}
        required={false}
        error={errors}
      />
      <Select
        label="Asignar a"
        name="asignar"
        value={formState.asignar}
        options={[
          { id: 'T', name: 'Todas las unidades' },
          { id: 'O', name: 'Unidades ocupadas' },
          { id: 'L', name: 'Unidades no ocupadas' },
          { id: 'S', name: 'Seleccionar unidades específicas' },
        ]}
        onChange={handleChange}
        error={errors}
      />
      {formState.asignar === 'S' && (
        <Select
          label="Seleccionar Unidades"
          name="dpto_id"
          value={formState?.dpto_id || []}
          options={ldpto}
          optionLabel="nro"
          optionValue="id"
          onChange={handleChange}
          error={errors}
          placeholder="Seleccione las unidades"
          multiSelect={true}
        />
      )}
    </DataModal>
  );
};

export default RenderForm;
