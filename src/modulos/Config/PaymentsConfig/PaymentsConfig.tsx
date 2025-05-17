import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { getUrlImages } from "@/mk/utils/string";
import React, { useState, useEffect } from "react";
import styles from "./PaymentsConfig.module.css";
import { IconCamera } from "@/components/layout/icons/IconsBiblioteca";
import Button from "@/mk/components/forms/Button/Button";

const PaymentsConfig = ({
  formState,
  onChange,
  setErrors,
  errors,
  onSave,
}: any) => {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Validar cambios en el formulario
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validación 1: Entidad bancaria - solo letras, máximo 50 caracteres
    if (formState?.payment_transfer_bank) {
      if (
        !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(formState.payment_transfer_bank)
      ) {
        newErrors.payment_transfer_bank = "Solo se permiten letras";
      }

      if (formState.payment_transfer_bank.length > 50) {
        newErrors.payment_transfer_bank = "Máximo 50 caracteres";
      }
    }

    // Validación 2: Número de cuenta - máximo 25 dígitos
    if (formState?.payment_transfer_account) {
      if (formState.payment_transfer_account.length > 25) {
        newErrors.payment_transfer_account = "Máximo 25 caracteres";
      }
    }

    // Validación 3: Nombre de destinatario - solo letras, máximo 50 caracteres
    if (formState?.payment_transfer_name) {
      if (
        !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(formState.payment_transfer_name)
      ) {
        newErrors.payment_transfer_name = "Solo se permiten letras";
      }

      if (formState.payment_transfer_name.length > 50) {
        newErrors.payment_transfer_name = "Máximo 50 caracteres";
      }
    }

    // Validación 4: CI/NIT - máximo 15 dígitos
    if (formState?.payment_transfer_ci) {
      if (formState.payment_transfer_ci.toString().length > 15) {
        newErrors.payment_transfer_ci = "Máximo 15 dígitos";
      }
    }

    // Validación 5: Descripción de pago en oficina - máximo 500 caracteres
    if (formState?.payment_office_obs) {
      if (formState.payment_office_obs.length > 500) {
        newErrors.payment_office_obs = "Máximo 500 caracteres";
      }
    }

    setValidationErrors(newErrors);
  }, [formState]);

  // Función para manejar cambios con validación
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Validaciones específicas por campo
    if (name === "payment_transfer_bank" || name === "payment_transfer_name") {
      // Solo permitir letras y espacios
      if (value === "" || /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{0,50}$/.test(value)) {
        onChange(e);
      }
    } else if (name === "payment_transfer_account") {
      // Limitar a 25 caracteres
      if (value === "" || value.length <= 25) {
        onChange(e);
      }
    } else if (name === "payment_transfer_ci") {
      // Limitar a 15 dígitos y solo números
      if (value === "" || /^\d{0,15}$/.test(value)) {
        onChange(e);
      }
    } else if (name === "payment_office_obs") {
      // Limitar a 500 caracteres
      if (value === "" || value.length <= 500) {
        onChange(e);
      }
    } else {
      onChange(e);
    }
  };

  return (
    <div className={styles.paymentsContainer}>
      <div>
        <h1 className={styles.headerTitle}>Métodos de pagos</h1>
        <p className={styles.headerSubtitle}>
          Configura los métodos de pagos con los cuales los residentes podrán
          pagar sus cuotas, deudas y demás transacciones del condominio
        </p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Subir código QR</h2>
            <p className={styles.sectionSubtitle}>
              Te recomendamos subir un código QR sin monto, esto facilitará la
              gestión de pagos y garantizará un proceso más eficiente
            </p>
          </div>

          <div className={styles.uploadContainer}>
            <div className={styles.qrPreviewContainer}>
              <UploadFile
                name="avatarQr"
                onChange={onChange}
                value={
                  formState?.id
                    ? getUrlImages(
                        "/PAYMENTQR-" +
                          formState?.id +
                          ".webp?" +
                          formState.updated_at
                      )
                    : ""
                }
                setError={setErrors}
                error={errors}
                img={true}
                sizePreview={{ width: "200px", height: "170px" }}
                placeholder="Cargar una imagen"
                ext={["jpg", "png", "jpeg", "webp"]}
                item={formState}
              />
            </div>
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>
              Datos de transferencia bancaria
            </h2>
            <p className={styles.sectionSubtitle}>
              Ingresa los datos bancarios donde los residentes realizarán las
              transferencias
            </p>
          </div>

          <div className={styles.inputContainer}>
            <div className={styles.inputHalf}>
              <Input
                type="text"
                label="Entidad bancaria"
                name="payment_transfer_bank"
                error={
                  validationErrors.payment_transfer_bank ||
                  errors?.payment_transfer_bank
                }
                required
                value={formState?.payment_transfer_bank}
                onChange={handleChange}
                maxLength={50}
              />
            </div>
            <div className={styles.inputHalf}>
              <Input
                type="text"
                label="Número de cuenta"
                name="payment_transfer_account"
                error={
                  validationErrors.payment_transfer_account ||
                  errors?.payment_transfer_account
                }
                required
                value={formState?.payment_transfer_account}
                onChange={handleChange}
                maxLength={25}
              />
            </div>
          </div>

          <div className={styles.inputContainer}>
            <div className={styles.inputHalf}>
              <Input
                type="text"
                label="Nombre de destinatario"
                name="payment_transfer_name"
                error={
                  validationErrors.payment_transfer_name ||
                  errors?.payment_transfer_name
                }
                value={formState?.payment_transfer_name}
                onChange={handleChange}
                required
                maxLength={50}
              />
            </div>
            <div className={styles.inputHalf}>
              <Input
                type="text"
                label="Carnet de identidad/NIT"
                name="payment_transfer_ci"
                error={
                  validationErrors.payment_transfer_ci ||
                  errors?.payment_transfer_ci
                }
                required={true}
                value={formState?.payment_transfer_ci}
                onChange={handleChange}
                maxLength={15}
              />
            </div>
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <h2 className={styles.sectionTitle}>Datos de pago en oficina</h2>
          </div>

          <div className={styles.textareaContainer}>
            <TextArea
              label="Detalles o requisitos"
              required
              name="payment_office_obs"
              onChange={handleChange}
              value={formState?.payment_office_obs}
              error={
                validationErrors.payment_office_obs ||
                errors?.payment_office_obs
              }
              maxLength={500}
            />
          </div>
        </div>

        <div className={styles.saveButtonContainer}>
          <Button
            className={`${styles.saveButton} ${
              Object.keys(validationErrors).length > 0
                ? styles.disabledButton
                : ""
            }`}
            onClick={onSave}
            disabled={Object.keys(validationErrors).length > 0}
          >
            Guardar datos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsConfig;
