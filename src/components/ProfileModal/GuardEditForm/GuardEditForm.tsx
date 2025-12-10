
import React, { useCallback, useState, useEffect } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Input from '@/mk/components/forms/Input/Input';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { UploadFile } from '@/mk/components/forms/UploadFile/UploadFile';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';
import Br from '@/components/Detail/Br';
import styles from './GuardEditForm.module.css';
import { getUrlImages } from '@/mk/utils/string';
import { checkRules, hasErrors } from '@/mk/utils/validate/Rules';

interface GuardEditFormProps {
  open: boolean;
  onClose: () => void;
  formState: any;
  setFormState: (state: any) => void;
  errors: any;
  setErrors: (errors: any) => void;
  reLoad: () => void;
  reLoadList?: Function;
}

interface FormState {
  id?: string | number;
  ci?: string;
  name?: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  email?: string;
  has_image?: number; // Agregar has_image
  _disabled?: boolean;
  _emailDisabled?: boolean;
}

interface Errors {
  ci?: string;
  name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  avatar?: string;
  [key: string]: string | undefined;
}

const GuardEditForm: React.FC<GuardEditFormProps> = ({
  open,
  onClose,
  formState,
  setFormState,
  errors,
  setErrors,
  reLoad,
  reLoadList
}) => {
  const { showToast } = useAuth();
  const { execute } = useAxios();
  const [localErrors, setLocalErrors] = useState<Errors>({});
  const handleChangeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormState((prev: FormState) => ({
        ...prev,
        [name]: value,
      }));
      if (localErrors[name]) {
        setLocalErrors(prev => ({ ...prev, [name]: '' }));
      }
    },
    [setFormState, localErrors]
  );

  const onBlurCi = useCallback(async (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === '') return;

    const { data } = await execute(
      '/guards',
      'GET',
      {
        fullType: 'EXIST',
        type: 'ci',
        searchBy: e.target.value,
        value: formState.id,
      },
      false,
      true
    );

    if (data?.success && data.data?.data?.id) {
      const filteredData = data.data.data;
      if (filteredData.existCondo) {
        showToast('El guardia ya existe en este condominio', 'warning');
        setFormState({});
        setLocalErrors({ ci: 'Ese CI ya esta en uso en este condominio.' });
        return;
      }
      setLocalErrors({ ci: '' });
      setFormState({
        ...formState,
        ci: filteredData.ci,
        name: filteredData.name,
        middle_name: filteredData.middle_name,
        last_name: filteredData.last_name,
        mother_last_name: filteredData.mother_last_name,
        email: filteredData.email ?? '',
        phone: filteredData.phone,
        _disabled: true,
        _emailDisabled: true,
      });

      showToast(
        'El guardia ya existe en condaty, se va a vincular al condominio',
        'warning'
      );
    } else {
      setLocalErrors({ ci: '' });
      setFormState({
        ...formState,
        _disabled: false,
        _emailDisabled: false,
      });
    }
  }, [execute, showToast, formState, setFormState]);

  const onBlurEmail = useCallback(async (e: React.FocusEvent<HTMLInputElement>) => {
    if (
      e.target.value.trim() === '' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)
    )
      return;

    const { data } = await execute(
      '/guards',
      'GET',
      {
        fullType: 'EXIST',
        type: 'email',
        searchBy: e.target.value,
        value: formState.id,
      },
      false,
      true
    );

    if (data?.success && data.data?.data?.id) {
      showToast('El email ya esta en uso', 'warning');
      setLocalErrors({ email: 'El email ya esta en uso' });
      setFormState({ ...formState, email: '' });
    }
  }, [execute, showToast, formState, setFormState]);

  const validate = useCallback(() => {
    let errs: any = {};
    
    // CI validations
    errs = checkRules({
      value: formState.ci,
      rules: ['required', 'integer', 'min:4'],
      key: 'ci',
      errors: errs,
    });

    // Name validations
    errs = checkRules({
      value: formState.name,
      rules: ['required', 'alpha', 'noSpaces', 'max:20'],
      key: 'name',
      errors: errs,
    });

    // Middle name validations (optional)
    errs = checkRules({
      value: formState.middle_name,
      rules: ['alpha', 'noSpaces', 'max:20'],
      key: 'middle_name',
      errors: errs,
    });

    // Last name validations
    errs = checkRules({
      value: formState.last_name,
      rules: ['required', 'alpha', 'noSpaces', 'max:20'],
      key: 'last_name',
      errors: errs,
    });

    // Mother last name validations (optional)
    errs = checkRules({
      value: formState.mother_last_name,
      rules: ['alpha', 'noSpaces', 'max:20'],
      key: 'mother_last_name',
      errors: errs,
    });

    // Phone validations (optional)
    errs = checkRules({
      value: formState.phone,
      rules: ['integer', 'min:8', 'max:10'],
      key: 'phone',
      errors: errs,
    });

    // Email validations
    errs = checkRules({
      value: formState.email,
      rules: ['required', 'email'],
      key: 'email',
      errors: errs,
    });

    setLocalErrors(errs);
    setErrors(errs);
    return errs;
  }, [formState, setErrors]);

  const onSave = async () => {
    if (hasErrors(validate())) {
      showToast('Por favor revise los campos marcados', 'warning');
      return;
    }

    const url = formState.id ? `/guards/${formState.id}` : '/guards';
    const method = formState.id ? 'PUT' : 'POST';

    const params = {
      ci: formState.ci,
      name: formState.name,
      middle_name: formState.middle_name || '',
      last_name: formState.last_name,
      mother_last_name: formState.mother_last_name || '',
      phone: formState.phone || '',
      email: formState.email,
      address: formState.address || '',
      avatar: formState.avatar || '',
    };

    try {
      const { data: response } = await execute(url, method, params, false, true);

      if (response?.success) {
        onClose();
        reLoad();
        if (reLoadList) reLoadList();
        showToast(
          formState.id ? 'Guardia actualizado con éxito' : 'Guardia creado con éxito',
          'success'
        );
      } else {
        showToast(response?.message || 'Error al guardar guardia', 'error');
        if (response?.errors) {
          setLocalErrors(response.errors);
          setErrors(response.errors);
        }
      }
    } catch (error) {
      console.error(error);
      showToast('Error al guardar guardia', 'error');
    }
  };

  const onCloseModal = useCallback(() => {
    setLocalErrors({});
    onClose();
  }, [onClose]);

  // Función para obtener la URL de la imagen del guardia
  const getGuardImageUrl = () => {


    if (formState.id) {
      // Para guardias existentes, construir la URL similar a ProfileModal
      return getUrlImages(`/GUARD-${formState.id}.webp?d=${new Date().getTime()}`);
    }
    return '';
  };


  return (
    <DataModal
      open={open}
      onClose={onCloseModal}
      onSave={onSave}
      buttonCancel="Cancelar"
      buttonText={formState.id ? "Actualizar" : "Guardar"}
      title={formState.id ? "Editar Guardia" : "Nuevo guardia"}
      minWidth={560}
      maxWidth={860}
    >
      <div className={styles['guard-form-container']}>
        {/* Sección de imagen */}
        <div className={styles.section}>
          <div className={styles['upload-section']}>
            <UploadFile
              name="avatar"
              ext={['jpg', 'png', 'jpeg', 'webp']}
              value={(() => {
                if (formState.avatar && typeof formState.avatar === 'object') {
                  return formState.avatar;
                }
                if (formState.id && formState.has_image === 1) {
                  const url = getGuardImageUrl();
                  return url;
                }
                return '';
              })()}
              onChange={handleChangeInput}
              img={true}
              sizePreview={{ width: '150px', height: '150px' }}
              error={localErrors}
              setError={setLocalErrors}
              required={false}
              placeholder="Suba una Imagen "
            />
          </div>
        </div>

        {/* Carnet de Identidad */}
        <div className={styles.section}>
          <div className={styles['input-container']}>
            <Input
              type="number"
              name="ci"
              label="Carnet de Identidad"
              required={true}
              value={formState.ci || ''}
              onChange={handleChangeInput}
              onBlur={onBlurCi}
              error={localErrors}
              disabled={true}
              maxLength={8}
            />
          </div>
        </div>

        {/* Nombres */}
        <div className={styles.section}>
          <div className={styles['input-row']}>
            <div className={styles['input-half']}>
              <Input
                type="text"
                name="name"
                label="Primer nombre"
                required={true}
                value={formState.name || ''}
                onChange={handleChangeInput}
                error={localErrors}
                disabled={formState._disabled}
                maxLength={20}
              />
            </div>
            <div className={styles['input-half']}>
              <Input
                type="text"
                name="middle_name"
                label="Segundo nombre"
                required={false}
                value={formState.middle_name || ''}
                onChange={handleChangeInput}
                error={localErrors}
                disabled={formState._disabled}
                maxLength={20}
              />
            </div>
          </div>
        </div>

        {/* Apellidos */}
        <div className={styles.section}>
          <div className={styles['input-row']}>
            <div className={styles['input-half']}>
              <Input
                type="text"
                name="last_name"
                label="Apellido paterno"
                required={true}
                value={formState.last_name || ''}
                onChange={handleChangeInput}
                error={localErrors}
                disabled={formState._disabled}
                maxLength={20}
              />
            </div>
            <div className={styles['input-half']}>
              <Input
                type="text"
                name="mother_last_name"
                label="Apellido materno"
                required={false}
                value={formState.mother_last_name || ''}
                onChange={handleChangeInput}
                error={localErrors}
                disabled={formState._disabled}
                maxLength={20}
              />
            </div>
          </div>
        </div>

        {/* Celular */}
        <div className={styles.section}>
          <div className={styles['input-container']}>
            <Input
              type="number"
              name="phone"
              label="Celular"
              required={false}
              value={formState.phone || ''}
              onChange={handleChangeInput}
              error={localErrors}
              disabled={formState._disabled}
              maxLength={10}
            />
          </div>
        </div>

        {/* Dirección */}
        <div className={styles.section}>
          <div className={styles['input-container']}>
            <TextArea
              name="address"
              label="Dirección del domicilio"
              required={false}
              value={formState.address || ''}
              onChange={handleChangeInput}
              error={localErrors}
              maxLength={250}
            />
          </div>
        </div>

        {/* Email con mensaje informativo */}
        <div className={styles.section}>
          <div style={{ width: '100%' }}>
            <Br style={{ marginBottom: '12px' }} />
            <p style={{ marginBottom: '12px', color: 'var(--cWhiteV1)' }}>
              La contraseña será enviada al correo que indiques en este campo
            </p>
          </div>
          <div className={styles['input-container']}>
            <Input
              type="email"
              name="email"
              label="Correo electrónico"
              required={true}
              value={formState.email || ''}
              onChange={handleChangeInput}
              onBlur={onBlurEmail}
              error={localErrors}
              disabled={formState._emailDisabled}
            />
          </div>
        </div>
      </div>
    </DataModal>
  );
};

export default GuardEditForm;
