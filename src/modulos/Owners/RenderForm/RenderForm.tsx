import Input from '@/mk/components/forms/Input/Input';
import Select from '@/mk/components/forms/Select/Select';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { useAuth } from '@/mk/contexts/AuthProvider';
import { checkRules, hasErrors } from '@/mk/utils/validate/Rules';
import React, { useState, useEffect, useMemo } from 'react';
import styles from './Renderform.module.css';
import InputFullName from '@/mk/components/forms/InputFullName/InputFullName';
import { IconAdd } from '@/components/layout/icons/IconsBiblioteca';
import { IconTrash } from '@/components/layout/icons/IconsBiblioteca';

interface OwnerFormState {
  id?: number | string;
  ci: string;
  name: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
  email?: string;
  phone?: string;
  dpto_id?: string | number;
  dptos?: Array<{ dpto_id: string | number; nro?: string; dpto_nro?: string }>;
  _disabled?: boolean;
  _emailDisabled?: boolean;
  [key: string]: any;
}

interface OwnerFormErrors {
  [key: string]: string | undefined;
  ci?: string;
  name?: string;
  last_name?: string;
  email?: string;
  dpto_id?: string;
}
const TYPE_OWNERS = [
  {
    type_owner: 'Propietario',
    name: 'Propietario',
  },
  {
    type_owner: 'Residente',
    name: 'Residente',
  },
];

const getUnitNro = (unitsList: any[] = [], id?: string | number) => {
  if (id === undefined || id === null) return undefined;
  const match = unitsList.find(
    u =>
      String(u.id) === String(id) ||
      String(u.dpto_id) === String(id) ||
      String(u.dpto) === String(id)
  );
  return match?.nro ?? match?.nro_dpto ?? match?.number ?? String(id);
};

interface UnitModalProps {
  open: boolean;
  onClose: () => void;
  units: Array<{ id: string | number; nro: string }>;
  initialData: {
    dpto_id?: string | number;
  };
  onSave: (data: { dpto_id: string | number }) => void;
  typeOwner?: string;
}

const UnitModal: React.FC<UnitModalProps> = ({
  open,
  onClose,
  units,
  initialData,
  onSave,
  typeOwner,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string | number>(initialData.dpto_id || '');

  useEffect(() => {
    if (open) {
      setSelectedUnit(initialData.dpto_id || '');
    }
  }, [open, initialData]);

  const handleSelectChange = (valueOrEvent: any) => {
    const val = valueOrEvent?.target?.value ?? valueOrEvent?.value ?? valueOrEvent;
    setSelectedUnit(val);
  };

  const handleSave = () => {
    if (selectedUnit === '' || selectedUnit === null || selectedUnit === undefined) return;
    const parsed =
      typeof selectedUnit === 'string' && /^\d+$/.test(selectedUnit)
        ? Number(selectedUnit)
        : selectedUnit;

    onSave({
      dpto_id: parsed,
    });
    onClose();
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Asignar Unidad"
      onSave={handleSave}
      buttonText="Asignar"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Select
          name="dpto_id"
          filter={true}
          label="Seleccionar Unidad"
          value={selectedUnit}
          options={units}
          optionLabel="nro"
          optionValue="id"
          onChange={handleSelectChange}
          required
        />
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
  defaultUnitId,
  defaultOwnerType,
  defaultIsResident,
  disableUnitEditing = false,
  disableTypeEditing = false,
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
  defaultUnitId?: string | number;
  defaultOwnerType?: 'Propietario' | 'Residente';
  defaultIsResident?: boolean;
  disableUnitEditing?: boolean;
  disableTypeEditing?: boolean;
}) => {
  const [formState, setFormState] = useState<OwnerFormState>(() => {
    const initialState: OwnerFormState = {
      ci: '',
      name: '',
      last_name: '',
      dptos: defaultUnitId
        ? [
            {
              dpto_id: defaultUnitId,
            },
          ]
        : [],
      type_owner: defaultOwnerType || undefined,
      _disabled: false,
      _emailDisabled: false,
    };
    return {
      ...initialState,
      ...item,
      ci: item?.ci || '',
      name: item?.name || '',
      last_name: item?.last_name || '',
      dptos: item?.dptos || (defaultUnitId ? [{
        dpto_id: defaultUnitId,
        dpto_nro: item?.dptos?.[0]?.dpto_nro,
      }] : []),
      type_owner: item?.type_owner || defaultOwnerType || undefined,
    };
  });
  const [errors, setErrors] = useState<OwnerFormErrors>({});
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const { showToast } = useAuth();

  const selectedUnitDisplay = useMemo(() => {
    if (!formState.dptos || formState.dptos.length === 0) return 'Ninguna asignada';
    const unitsList =
      formState.type_owner === 'Propietario'
        ? extraData?.dptosForH || []
        : extraData?.dptosForT || [];
    const first = formState.dptos[0];
    const unit = unitsList.find((d: any) => String(d.dpto_id) === String(first.dpto_id));
    return unit ? `Unidad ${unit.nro}` : `Unidad ${first.dpto_id}`;
  }, [formState.dptos, formState.type_owner, extraData?.dptosForH, extraData?.dptosForT]);

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
    if (name === 'type_owner') {
      setFormState((prev: OwnerFormState) => ({
        ...prev,
        [name]: value,
        dptos: [],
        dpto_id: undefined,
      }));
      if (errors.dpto_id) {
        setErrors(prev => ({ ...prev, dpto_id: undefined }));
      }
      return;
    }

    setFormState((prev: OwnerFormState) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof OwnerFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = () => {
    let errors: any = {};
    const requiredFields = ['ci', 'name', 'last_name', 'email', 'type_owner'];
    requiredFields.forEach(field => {
      errors = checkRules({
        value: formState[field],
        rules: ['required'],
        key: field,
        errors,
      });
    });

    if (!formState.dptos || formState.dptos.length === 0) {
      errors.dpto_id = 'required';
    }

    // Aplicar regla específica para CI
    errors = checkRules({
      value: formState.ci,
      rules: ['ci'],
      key: 'ci',
      errors,
    });

    // Aplicar reglas específicas para email
    errors = checkRules({
      value: formState.email,
      rules: ['required', 'email'],
      key: 'email',
      errors,
    });

    // Aplicar regla específica para teléfono si tiene valor
    if (formState.phone) {
      errors = checkRules({
        value: formState.phone,
        rules: ['phone'],
        key: 'phone',
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

      const missingFields = [];
      if (validationErrors.ci) missingFields.push('CI');
      if (validationErrors.name) missingFields.push('Nombre');
      if (validationErrors.last_name) missingFields.push('Apellido');
      if (validationErrors.email) missingFields.push('Correo electrónico');
      if (validationErrors.type_owner) missingFields.push('Tipo de residente');
      if (validationErrors.dpto_id) missingFields.push('Unidad');

      const message = missingFields.length > 0
        ? `Faltan los siguientes campos: ${missingFields.join(', ')}`
        : 'Por favor corrija los errores en el formulario';

      showToast(message, 'error');
      return;
    }

    try {
      const dptoIds = (formState.dptos || []).map(d => d.dpto_id);

      const payload: any = {
        ci: formState.ci,
        name: formState.name,
        middle_name: formState.middle_name || '',
        last_name: formState.last_name,
        mother_last_name: formState.mother_last_name || '',
        phone: formState.phone || '',
        email: formState.email || '',
        dpto: dptoIds,
        is_homeowner: formState.type_owner === 'Propietario' ? 'Y' : 'N',
      };

      const endpoint = formState.id ? `/owners/${formState.id}` : '/owners';
      const method = formState.id ? 'PUT' : 'POST';

      const { data: response } = await execute(
        endpoint,
        method,
        payload,
        true
      );

      if (response?.success) {
        reLoad();
        window.location.reload();
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

  const removeUnit = (id: string | number) => {
    setFormState(prev => ({
      ...prev,
      dptos: (prev.dptos || []).filter(d => String(d.dpto_id) !== String(id)),
    }));
    if (errors.dpto_id) {
      setErrors(prev => ({ ...prev, dpto_id: undefined }));
    }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={formState.id ? 'Editar Residente' : 'Nuevo Residente'}
      onSave={onSave}
      variant={"mini"}
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
          label="Celular (Opcional)"
          name="phone"
          value={formState.phone || ''}
          onChange={handleChange}
          error={errors}
        />

        <div className={styles.sectionHeader}>
          <p>La contraseña será enviada al correo que indique en este campo </p>
        </div>

        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          value={formState.email || ''}
          onChange={handleChange}
          onBlur={onBlurEmail}
          error={errors}
          required
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
          disabled={disableTypeEditing}
        />
        {(formState.dptos || []).length > 0 && (
          <div className={styles.unitCardsWrapper}>
            {(formState.dptos || []).map((d, idx) => {
              const unitsList =
                formState.type_owner === 'Propietario'
                  ? extraData?.dptosForH || []
                  : extraData?.dptosForT || [];

              const nro = d.dpto_nro ? getUnitNro(unitsList, d.dpto_nro) : getUnitNro(unitsList, d.dpto_id);
              return (
                <div key={String(d.dpto_id) + '_' + idx} className={styles.unitCard}>
                  <div className={styles.unitCardLeft}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={styles.unitLetter}>U:</span>
                      <span className={styles.unitNumber}>{nro}</span>
                    </div>
                  </div>
                  <div className={styles.unitCardRight}>
                    {!disableUnitEditing && (
                      <button
                        type="button"
                        className={styles.trashButton}
                        onClick={() => removeUnit(d.dpto_id)}
                        aria-label="Quitar unidad"
                      >
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!disableUnitEditing && (
          <button
            className={styles.backButtonContent}
            onClick={() => {
              setIsUnitModalOpen(true);
            }}
            disabled={!formState.type_owner}
          >
            <IconAdd size={12} />
            <p style={{ textDecoration: 'underline' }}>Asignar Unidad</p>
          </button>
        )}
      </div>
      <UnitModal
        open={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        units={
          formState.type_owner === 'Propietario'
            ? extraData?.dptosForH || []
            : extraData?.dptosForT || []
        }
        initialData={{
          dpto_id: '',
        }}
        typeOwner={formState.type_owner}
        onSave={data => {
          const normalizedId =
            typeof data.dpto_id === 'string' && /^\d+$/.test(data.dpto_id)
              ? Number(data.dpto_id)
              : data.dpto_id;

          const unitsList =
            formState.type_owner === 'Propietario'
              ? extraData?.dptosForH || []
              : extraData?.dptosForT || [];
          const unit = unitsList.find((u: any) => String(u.id) === String(normalizedId));
          const nro = unit ? unit.nro : undefined;

          setFormState(prev => {
            const existing = (prev.dptos || []).find(
              d => String(d.dpto_id) === String(normalizedId)
            );
            if (prev.type_owner === 'Residente') {
              return {
                ...prev,
                dptos: [
                  { dpto_id: normalizedId, nro },
                ],
              };
            }

            let newDptos = prev.dptos ? [...prev.dptos] : [];
            if (existing) {
              newDptos = newDptos.map(d =>
                String(d.dpto_id) === String(normalizedId)
                  ? { ...d, nro }
                  : d
              );
            } else {
              newDptos.push({
                dpto_id: normalizedId,
                nro,
              });
            }

            return {
              ...prev,
              dptos: newDptos,
            };
          });

          if (errors.dpto_id) {
            setErrors(prev => ({ ...prev, dpto_id: undefined }));
          }

          setIsUnitModalOpen(false);
        }}
      />
    </DataModal>
  );
};

export default RenderForm;
