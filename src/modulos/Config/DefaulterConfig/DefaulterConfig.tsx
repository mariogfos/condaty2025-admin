import Input from '@/mk/components/forms/Input/Input';
import React from 'react';
import styles from './DefaulterConfig.module.css';

interface DefaulterConfigProps {
  formState: any;
  onChange: any;
  errors: any;
  onSave?: any;
}

const DefaulterConfig = ({ formState, onChange, errors, onSave }: DefaulterConfigProps) => {
  return (
    <div className={styles.defaulterContainer}>
      <div>
        <h1 className={styles.headerTitle}>Gestión de morosidad</h1>
        <p className={styles.headerSubtitle}>
          Configura las acciones que se tomarán con los morosos del condominio
        </p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Pre-aviso</h2>
            <p className={styles.sectionSubtitle}>
              Define después de cuántas expensas impagas, se activará la notificación de aviso al residente para informarle
              que pague sus expensas
            </p>
          </div>
          
          <div className={styles.inputField}>
            <Input
              type="number"
              label="Cantidad"
              name="soft_limit"
              error={errors}
              required
              value={formState?.soft_limit}
              onChange={onChange}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Bloqueo</h2>
            <p className={styles.sectionSubtitle}>
              Define después de cuántas expensas impagas, el sistema bloqueará el acceso del residente a la app
            </p>
          </div>
          
          <div className={styles.inputField}>
            <Input
              type="number"
              label="Cantidad"
              name="hard_limit"
              error={errors}
              required
              value={formState?.hard_limit}
              onChange={onChange}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Meses para empezar a cobrar la multa</h2>
            <p className={styles.sectionSubtitle}>
              Ingresa el número de meses de retraso permitidos antes de aplicar la multa por mora
            </p>
          </div>
          
          <div className={styles.inputField}>
            <Input
              type="number"
              label="Porcentaje"
              name="penalty_limit"
              error={errors}
              required
              value={formState?.penalty_limit}
              onChange={onChange}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Porcentaje de multa por morosidad</h2>
            <p className={styles.sectionSubtitle}>
              Indica el porcentaje de multa que se aplicará por cada mes de retraso en el pago
            </p>
          </div>
          
          <div className={styles.inputField}>
            <Input
              type="number"
              label="Porcentaje"
              name="penalty_percent"
              error={errors}
              required
              value={formState?.penalty_percent}
              onChange={onChange}
            />
          </div>
        </div>

        <div className={styles.saveButtonContainer}>
          <button className={styles.saveButton} onClick={onSave}>
            Guardar datos
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefaulterConfig;