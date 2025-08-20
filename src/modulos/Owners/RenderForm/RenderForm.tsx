import Input from '@/mk/components/forms/Input/Input';
import Select from '@/mk/components/forms/Select/Select';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { useAuth } from '@/mk/contexts/AuthProvider';
import { checkRules, hasErrors } from '@/mk/utils/validate/Rules';
import React, { useState, useEffect, useMemo } from 'react';
import styles from './Renderform.module.css';
import InputFullName from '@/mk/components/forms/InputFullName/InputFullName';
import Button from '@/mk/components/forms/Button/Button';
import { IconAdd } from '@/components/layout/icons/IconsBiblioteca';

interface OwnerFormState {
  id?: number | string;
  ci: string;
  name: string;
  middle_name?: string;
  last_name: string;
  mother_last_name?: string;
  email?: string;
  phone?: string;
  dpto_id?: string | number;
  will_live_in_unit?: boolean;
  _disabled?: boolean;
  _emailDisabled?: boolean;
  [key: string]: any; // For any additional dynamic properties
}

interface OwnerFormErrors {
  [key: string]: string | undefined;
  ci?: string;
  name?: string;
  last_name?: string;
  email?: string;
  dpto_id?: string;
  will_live_in_unit?: string;
}
const TYPE_OWNERS = [
  {
    type_owner: 'Propietario',
    name: 'Propietario',
  },
  {
    type_owner: 'Inquilino',
    name: 'Inquilino',
  },
];

interface UnitModalProps {
  open: boolean;
  onClose: () => void;
  units: Array<{ dpto_id: string | number; nro: string }>;
  initialData: {
    dpto_id?: string | number;
    will_live_in_unit: boolean;
  };
  onSave: (data: { dpto_id: string | number; will_live_in_unit: boolean }) => void;
}

const UnitModal: React.FC<UnitModalProps> = ({
  open,
  onClose,
  units,
  initialData,
  onSave,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string | number>(initialData.dpto_id || '');
  const [willLiveInUnit, setWillLiveInUnit] = useState(initialData.will_live_in_unit);

  useEffect(() => {
    if (open) {
      setSelectedUnit(initialData.dpto_id || '');
      setWillLiveInUnit(initialData.will_live_in_unit);
    }
  }, [open, initialData]);

  const handleSave = () => {
    if (!selectedUnit) return; // Basic validation
    onSave({
      dpto_id: selectedUnit,
      will_live_in_unit: willLiveInUnit,
    });
    onClose();
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Asignar Unidad"
      onSave={handleSave}
      buttonText="Guardar"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Select
          name="dpto_id"
          label="Seleccionar Unidad"
          value={selectedUnit}
          options={units}
          optionLabel="nro"
          optionValue="dpto_id"
          onChange={e => setSelectedUnit(e.target.value)}
          required
          placeholder="Seleccione una unidad"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="will_live_in_unit">¿Este propietario vivirá en la unidad?</label>
          <input
            style={{ background: 'transparent', cursor: 'pointer' }}
            type="checkbox"
            id="will_live_in_unit"
            checked={willLiveInUnit}
            onChange={e => setWillLiveInUnit(e.target.checked)}
          />
        </div>
      </div>
    </DataModal>
  );
};

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  extraData,
  reLoad,
}: {
  open: boolean;
  onClose: () => void;
  item: OwnerFormState;
  setItem: (item: OwnerFormState) => void;
  execute: (
    endpoint: string,
    method: string,
    data: any,
    showLoader?: boolean,
    silent?: boolean
  ) => Promise<{ data?: any }>;
  extraData: any;
  reLoad: () => void;
}) => {
  const [formState, setFormState] = useState<OwnerFormState>(() => {
    // Create initial state with default values
    const initialState: OwnerFormState = {
      ci: '',
      name: '',
      last_name: '',
      will_live_in_unit: true,
      _disabled: false,
      _emailDisabled: false,
    };

    // Merge with item props, ensuring required fields are not empty
    return {
      ...initialState,
      ...item,
      ci: item?.ci || '',
      name: item?.name || '',
      last_name: item?.last_name || '',
    };
  });
  const [errors, setErrors] = useState<OwnerFormErrors>({});
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const { showToast } = useAuth();

  const selectedUnitDisplay = useMemo(() => {
    if (!formState.dpto_id) return 'Ninguna asignada';
    const unit = extraData?.dptos?.find((d: any) => d.dpto_id === formState.dpto_id);
    return unit ? `Unidad ${unit.nro}` : 'Unidad desconocida';
  }, [formState.dpto_id, extraData?.dptos]);

  useEffect(() => {
    setFormState((prev: OwnerFormState) => ({
      ...prev,
      ...item,
      _disabled: item?._disabled !== undefined ? item._disabled : false,
      _emailDisabled: item?._emailDisabled !== undefined ? item._emailDisabled : false,
    }));
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev: OwnerFormState) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name as keyof OwnerFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = () => {
    let errors: any = {};

    // Required fields
    const requiredFields = ['ci', 'name', 'last_name', 'dpto_id'];

    requiredFields.forEach(field => {
      errors = checkRules({
        value: formState[field],
        rules: ['required'],
        key: field,
        errors,
      });
    });

    // CI validation
    errors = checkRules({
      value: formState.ci,
      rules: ['ci'],
      key: 'ci',
      errors,
    });

    // Email validation if provided
    if (formState.email) {
      errors = checkRules({
        value: formState.email,
        rules: ['email'],
        key: 'email',
        errors,
      });
    }

    setErrors(errors);
    return errors;
  };

  const onBlurCi = async (e: React.FocusEvent<HTMLInputElement>) => {
    const ci = e.target.value.trim();
    if (!ci) return;

    try {
      const { data } = await execute(
        '/owners',
        'GET',
        {
          fullType: 'EXIST',
          type: 'ci',
          searchBy: ci,
        },
        false,
        true
      );

      if (data?.success && data.data?.data?.id) {
        const ownerData = data.data.data;
        if (ownerData.existCondo) {
          showToast('El residente ya existe en este Condominio', 'warning');
          setErrors(prev => ({
            ...prev,
            ci: 'Ese CI ya está en uso en este Condominio',
          }));
          return;
        }

        setFormState((prev: OwnerFormState) => ({
          ...prev,
          ci: ownerData.ci,
          name: ownerData.name,
          middle_name: ownerData.middle_name || '',
          last_name: ownerData.last_name,
          mother_last_name: ownerData.mother_last_name || '',
          email: ownerData.email || '',
          phone: ownerData.phone || '',
          _disabled: true,
          _emailDisabled: true,
        }));

        showToast('El residente ya existe en Condaty, se va a vincular al Condominio', 'warning');
      } else {
        setFormState((prev: OwnerFormState) => ({
          ...prev,
          _disabled: false,
          _emailDisabled: false,
        }));
      }
    } catch (error) {
      console.error('Error al validar CI:', error);
      showToast('Error al validar el CI', 'error');
    }
  };

  const onBlurEmail = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    try {
      const { data } = await execute(
        '/owners',
        'GET',
        {
          fullType: 'EXIST',
          type: 'email',
          searchBy: email,
        },
        false,
        true
      );

      if (data?.success && data.data?.data?.id) {
        showToast('El email ya está en uso', 'warning');
        setErrors((prev: OwnerFormErrors) => ({
          ...prev,
          email: 'El email ya está en uso',
        }));
        setFormState((prev: OwnerFormState) => ({ ...prev, email: '' }));
      } else {
        setErrors((prev: OwnerFormErrors) => ({
          ...prev,
          email: undefined,
        }));
      }
    } catch (error) {
      console.error('Error al validar email:', error);
      showToast('Error al validar el email', 'error');
    }
  };

  const onSave = async () => {
    const validationErrors = validate();
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      showToast('Por favor corrija los errores en el formulario', 'error');
      return;
    }

    try {
      const payload = {
        ci: formState.ci,
        name: formState.name,
        middle_name: formState.middle_name || null,
        last_name: formState.last_name,
        mother_last_name: formState.mother_last_name || null,
        email: formState.email || null,
        phone: formState.phone || null,
        dpto_id: formState.dpto_id,
      };

      const endpoint = formState.id ? `/owners/${formState.id}` : '/owners';
      const method = formState.id ? 'PUT' : 'POST';

      const { data: response } = await execute(
        endpoint,
        method,
        payload,
        true // Show loader
      );

      if (response?.success) {
        reLoad();
        setItem(response.data);
        showToast(response?.message || 'Operación exitosa', 'success');
        onClose();
      } else {
        showToast(response?.message || 'Error al guardar los datos', 'error');
      }
    } catch (error) {
      console.error('Error al guardar el residente:', error);
      showToast('Error al guardar el residente', 'error');
    }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={formState.id ? 'Editar Residente' : 'Nuevo Residente'}
      onSave={onSave}
    >
      <div className={styles.fieldSet}>
        <div className={styles.sectionHeader}>
          <h3>Información Personal</h3>
        </div>
        <Input
          name="ci"
          value={formState.ci || ''}
          onChange={handleChange}
          onBlur={onBlurCi}
          label="Carnet de Identidad"
          error={errors}
          required
          disabled={formState._disabled}
        />
        <InputFullName
          name="name"
          value={formState}
          onChange={handleChange}
          errors={errors}
          disabled={formState._disabled}
        />
        <Input
          label="Celular"
          name="phone"
          value={formState.phone || ''}
          onChange={handleChange}
          error={errors}
        />

        <div className={styles.sectionHeader}>
          <p>La contraseña será enviada al correo que indiques en este campo </p>
        </div>

        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          value={formState.email || ''}
          onChange={handleChange}
          onBlur={onBlurEmail}
          error={errors}
          disabled={formState._emailDisabled}
        />
        <Select
          label="Tipo de Residente"
          name="type_owner"
          value={formState.type_owner}
          options={TYPE_OWNERS}
          optionLabel="name"
          optionValue="type_owner"
          onChange={handleChange}
          error={errors}
          required
        />
        <button
          className={styles.backButtonContent}
          onClick={() => {
            setIsUnitModalOpen(true);
          }}
        >
          <IconAdd size={12} />
          <p>Asignar Unidad</p>
        </button>
      </div>
      <UnitModal
        open={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        units={extraData?.dptosForH || extraData?.dptosForT || []}
        initialData={{
          dpto_id: formState.dpto_id ? String(formState.dpto_id) : '',
          will_live_in_unit: formState.will_live_in_unit !== false,
        }}
        onSave={data => {
          setFormState(prev => ({
            ...prev,
            dpto_id: data.dpto_id,
            will_live_in_unit: data.will_live_in_unit,
          }));
          if (errors.dpto_id) {
            setErrors(prev => ({ ...prev, dpto_id: undefined }));
          }
        }}
      />
    </DataModal>
  );
};

export default RenderForm;
