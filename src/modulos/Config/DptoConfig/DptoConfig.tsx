import { IconCamera } from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { getUrlImages } from "@/mk/utils/string";
import React, { useState, useEffect } from "react";
import styles from "./DptoConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";

const DptoConfig = ({
  formState,
  setFormState,
  setErrors,
  errors,
  client_config,
  onChange,
  onSave,
}: any) => {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { execute } = useAxios();
  const [existLogo, setExistLogo] = useState(false);
  const [existAvatar, setExistAvatar] = useState(false);

  // Validar cambios en el formulario
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validación 1: Nombre del condominio - no debe permitir caracteres especiales y máximo 80 caracteres
    if (formState?.name) {
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]+$/.test(formState.name)) {
        newErrors.name = "No se permiten caracteres especiales";
      } else if (formState.name.length > 80) {
        newErrors.name = "Máximo 80 caracteres";
      }
    }

    // Validación 2: Descripción del condominio - máximo 500 caracteres
    if (formState?.description && formState.description.length > 500) {
      newErrors.description = "Máximo 500 caracteres";
    }

    // Validación 3: Monto inicial - debe ser menos o igual a 10 dígitos
    if (formState?.initial_amount) {
      const amountStr = String(formState.initial_amount).replace(/\D/g, "");
      if (amountStr.length > 10) {
        newErrors.initial_amount =
          "El monto debe ser menor o igual a 10 dígitos";
      }
    }

    // Validación 4: Limitar los otros campos (teléfono, dirección, etc.)
    if (formState?.phone && formState.phone.toString().length > 15) {
      newErrors.phone = "Máximo 15 dígitos";
    }

    if (formState?.address && formState.address.length > 100) {
      newErrors.address = "Máximo 100 caracteres";
    }

    // Correo electrónico ahora tiene máximo de 100 caracteres
    if (formState?.email && formState.email.length > 100) {
      newErrors.email = "Máximo 100 caracteres";
    }

    if (formState?.year && (formState.year < 1900 || formState.year > 2100)) {
      newErrors.year = "Año entre 1900 y 2100";
    }

    setValidationErrors(newErrors);
  }, [formState]);

  // Función para manejar cambios con validación
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Validaciones específicas para cada campo
    if (name === "name") {
      // Solo permitir letras, números y espacios (sin caracteres especiales) con máximo 80 caracteres
      if (
        value === "" ||
        (/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]*$/.test(value) && value.length <= 80)
      ) {
        onChange(e);
      }
    } else if (name === "description") {
      // Limitar a 500 caracteres
      if (value.length <= 500) {
        onChange(e);
      }
    } else if (name === "initial_amount") {
      // Permitir la edición del monto inicial sin restricciones adicionales
      onChange(e);
    } else if (name === "phone") {
      // Solo permitir números con longitud máxima de 15
      if (value === "" || (/^\d*$/.test(value) && value.length <= 15)) {
        onChange(e);
      }
    } else if (name === "address") {
      // Limitar a 100 caracteres
      if (value.length <= 100) {
        onChange(e);
      }
    } else if (name === "email") {
      // Limitar a 100 caracteres (cambiado de 50 a 100)
      if (value.length <= 100) {
        onChange(e);
      }
    } else if (name === "year") {
      // Solo años válidos entre 1900 y 2100
      if (
        value === "" ||
        (/^\d*$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 2100)
      ) {
        onChange(e);
      }
    } else {
      onChange(e);
    }
  };

  return (
    <div className={styles.Config}>
      <h1 className={styles.mainTitle}>Datos generales del condominio</h1>

      <div className={styles.formContainer}>
        <div className={styles.uploadSection}>
          <p className={styles.uploadHelpText}>
            Carga el logotipo del condominio, de preferencia 800px x 800px
          </p>

          <div
            className="upload-container"
            style={{
              display: "flex",
              justifyContent: "left",
              alignItems: "center",
              // height: "400px",
              // width: "400px",
            }}
          >
            <UploadFile
              name="avatarLogo"
              onChange={onChange}
              value={
                !existLogo
                  ? getUrlImages(
                      "/LOGO-" + formState?.id + ".webp?" + formState.updated_at
                    )
                  : ""
              }
              setError={setErrors}
              error={errors}
              img={true}
              editor={{ width: 800, height: 800 }}
              sizePreview={{ width: "200px", height: "200px" }}
              placeholder="Cargar una imagen"
              ext={["jpg", "png", "jpeg", "webp"]}
              item={formState}
              onError={() => setExistLogo(true)}
            />
          </div>
        </div>
        <div className={styles.uploadSection}>
          <p className={styles.uploadHelpText}>
            Carga una foto de portada del condominio, de preferencia 1350px x
            568px
          </p>

          <div className="upload-container">
            <UploadFile
              name="avatar"
              onChange={onChange}
              value={
                !existAvatar
                  ? getUrlImages(
                      "/CLIENT-" +
                        formState?.id +
                        ".webp?" +
                        formState.updated_at
                    )
                  : ""
              }
              setError={setErrors}
              error={errors}
              img={true}
              editor={{ width: 1350, height: 568 }}
              sizePreview={{ width: "650px", height: "284px" }}
              placeholder="Cargar una imagen"
              ext={["jpg", "png", "jpeg", "webp"]}
              item={formState}
              onError={() => setExistAvatar(true)}
            />
          </div>
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.inputHalf}>
            <Input
              label={"Nombre del condominio"}
              value={formState["name"]}
              type="text"
              name="name"
              error={validationErrors.name || errors?.name}
              required
              onChange={handleChange}
              className="dark-input"
              maxLength={80}
            />
            {/* <div className={styles.fieldHint}>Máximo 80 caracteres</div> */}
          </div>
          <div className={styles.inputHalf}>
            <Select
              label="Tipo de condominio"
              value={formState?.type}
              name="type"
              error={errors}
              onChange={handleChange}
              options={[
                { id: "C", name: "Condominio" },
                { id: "E", name: "Edificio" },
                { id: "U", name: "Urbanización" },
              ]}
              required
              className="dark-input appearance-none"
            />
          </div>
        </div>
        <div className={styles.inputContainer}>
          <div className={styles.inputHalf}>
            <Input
              label={"Teléfono"}
              value={formState["phone"]}
              type="text"
              name="phone"
              error={validationErrors.phone || errors?.phone}
              required
              onChange={handleChange}
              className="dark-input"
              maxLength={15}
            />
          </div>
          <div className={styles.inputHalf}>
            <Input
              label={"Correo electrónico"}
              value={formState["email"]}
              type="email"
              name="email"
              error={validationErrors.email || errors?.email}
              required
              onChange={handleChange}
              className="dark-input"
              maxLength={100}
            />
            {/* <div className={styles.fieldHint}>Máximo 100 caracteres</div> */}
          </div>
        </div>
        <div className={styles.inputContainer}>
          <div className={styles.inputHalf}>
            <Input
              label={"Dirección"}
              value={formState["address"]}
              type="text"
              name="address"
              error={validationErrors.address || errors?.address}
              required
              onChange={handleChange}
              className="dark-input"
              maxLength={100}
            />
          </div>
          {/* <div className={styles.inputHalf}>
            <Select
              label="Tipo de unidad"
              value={formState?.type_dpto}
              name="type_dpto"
              error={errors}
              onChange={handleChange}
              options={[
                { id: "D", name: "Departamento" },
                { id: "O", name: "Oficina" },
                { id: "C", name: "Casa" },
                { id: "L", name: "Lote" },
              ]}
              required
              className="dark-input appearance-none"
            />
          </div> */}
        </div>

        <div className={styles.textareaContainer}>
          <TextArea
            label="Agrega una pequeña descripción del condominio"
            name="description"
            required={false}
            onChange={handleChange}
            value={formState?.description}
            className="dark-input"
            maxLength={500}
            error={validationErrors.description || errors?.description}
          />
          {/* <div className={styles.fieldHint}>Máximo 500 caracteres</div> */}
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <p className={styles.textTitle}>
              ¿Desde cuándo quieres que el sistema empiece a cobrar las
              expensas?
            </p>
            <p className={styles.textSubtitle}>
              Es importante que indiques el mes correcto para que el sistema
              pueda calcular correctamente las cuotas adeudadas por los
              residentes.
            </p>
          </div>

          <div className={styles.dateSelectors}>
            <div className={styles.dateSelector}>
              <Select
                label="Mes"
                value={formState?.month}
                name="month"
                error={errors}
                onChange={handleChange}
                options={[
                  { id: "1", name: "Enero" },
                  { id: "2", name: "Febrero" },
                  { id: "3", name: "Marzo" },
                  { id: "4", name: "Abril" },
                  { id: "5", name: "Mayo" },
                  { id: "6", name: "Junio" },
                  { id: "7", name: "Julio" },
                  { id: "8", name: "Agosto" },
                  { id: "9", name: "Septiembre" },
                  { id: "10", name: "Octubre" },
                  { id: "11", name: "Noviembre" },
                  { id: "12", name: "Diciembre" },
                ]}
                required
                className="dark-input appearance-none"
              />
            </div>
            <div className={styles.dateSelector}>
              <Input
                type="number"
                label="Año"
                name="year"
                error={validationErrors.year || errors?.year}
                required
                value={formState?.year}
                onChange={handleChange}
                className="dark-input"
                min={1900}
                max={2100}
              />
            </div>
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <p className={styles.textTitle}>Monto inicial del condominio</p>
            <p className={styles.textSubtitle}>
              Indica el monto con el que el condominio comienza sus operaciones.
              Este valor permitirá un seguimiento financiero exacto desde el
              inicio.
            </p>
          </div>

          <Input
            type="currency"
            label="Saldo"
            name="initial_amount"
            error={validationErrors.initial_amount || errors?.initial_amount}
            required
            value={formState?.initial_amount}
            onChange={handleChange}
            className="dark-input"
          />
          {/* <div className={styles.fieldHint}>
            El monto debe ser menor o igual a 10 dígitos
          </div> */}
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

export default DptoConfig;
