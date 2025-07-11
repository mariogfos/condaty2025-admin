'use client';
import Button from '@/mk/components/forms/Button/Button';
import Input from '@/mk/components/forms/Input/Input';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { useState } from 'react';
import styles from './RenderForm.module.css';
import { IconTrash } from '@/components/layout/icons/IconsBiblioteca';
import { checkRules, hasErrors } from '@/mk/utils/validate/Rules';
import { useAuth } from '@/mk/contexts/AuthProvider';

interface ExtraField {
  id?: number;
  name: string;
  value: string;
}

interface RenderFormProps {
  open: boolean;
  onClose: () => void;
  item: any;
  setItem: (item: any) => void;
  errors: any;
  extraData: any;
  user: any;
  execute: any;
  setErrors: any;
  action: string;
  reLoad: () => void;
  
}

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  errors,
  extraData,
  user,
  execute,
  setErrors,
  action,
  reLoad,
}: RenderFormProps) => {
  const [extraFields, setExtraFields] = useState<ExtraField[]>(() => {
    if (action === 'add') return [];
   
    return (extraData?.fields || []).filter((field: any) => field.type_id === item.id).map((field: any) => ({
      id: field.id,
      name: field.name,
      value: field.type || 'text'
    }));
  });
  const [formState, setFormState] = useState({ ...item });
  const {showToast} = useAuth();

  // console.log(extraData,'extraaa')

  const handleChange = (e: any) => {
    let value = e.target.value;

    setFormState({ ...formState, [e.target.name]: value });
  };

  const handleAddField = () => {
    setExtraFields([...extraFields, { name: '', value: 'text' }]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = extraFields.filter((_, i) => i !== index);
    setExtraFields(newFields);
  };

  const handleExtraFieldChange = (index: number, field: string, value: string) => {
    const newFields = [...extraFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setExtraFields(newFields);
  };

  const validate = (field: any = "") => {
    let errors: any = {};

    errors = checkRules({
      value: formState.name,
      rules: ["required"],
      key: "name",
      errors,
    });

    setErrors(errors);
    return errors;
  }


  const handleSubmit = async () => {
    if (hasErrors(validate())) return;
    const formData = {
      // ...formState,
      name: formState.name,
      description: formState.description || '',
      fields: extraFields.map(field => {
        let fieldData: any = {
          name: field.name,
          type: field.value
        };
        // Incluir el ID del campo si existe, independientemente de la acción
        if (field.id) {
          fieldData.id = field.id;
        }
        return fieldData;
      })
    };

    const method = action === 'add' ? 'POST' : 'PUT';
    const endpoint = action === 'add' ? '/types' : `/types/${formState.id}`;
    
    const { data: response } = await execute(
      endpoint,
      method,
      formData,
      false
    );

    if (response?.success === true) {
      reLoad();
      // setItem(formData);
      showToast(response?.message, "success");
      onClose();
    }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={action === 'add' ? 'Agregar Tipo de Unidad' : 'Editar Tipo de Unidad'}
      onSave={handleSubmit}
    >
      <Input
        name="name"
        label="Nombre de la unidad"
        value={formState?.name || ''}
        onChange={handleChange}
        error={errors?.name}
        disabled={action !== 'add' && item.is_fixed === "A"}
        required
      />
       <Input
        name="description"
        label="Descripción"
        value={formState?.description || ''}
        onChange={handleChange}
      />
      <div className={styles.textContainer}>
        <div>Campos adicionales</div>
        <div>Campos que una unidad puede o no tener en un condominio (Eje: Garaje, Baulera, entre otros)</div>
      </div>
      {extraFields.map((field, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Input
            name={`extra_field_name_${index}`}
            label="Nombre del Campo"
            value={field.name}
            onChange={(e) => handleExtraFieldChange(index, 'name', e.target.value)}
            style={{ flex: 1 }}
            iconRight={<IconTrash onClick={() => handleRemoveField(index)}  style={{cursor:'pointer'}}/>}
           
          />
    
          {/* <Button
            onClick={() => handleRemoveField(index)}>a
            <Button /> */}
        
        </div>
      ))}

      <div
        onClick={handleAddField}
        style={{ marginTop: '10px',color:'var(--cAccent)',cursor:'pointer' }}
      >
        Agregar Campo Extra
      </div>
    </DataModal>
  );
};

export default RenderForm;