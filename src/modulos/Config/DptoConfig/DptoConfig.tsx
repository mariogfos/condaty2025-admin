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


  const [existLogo, setExistLogo] = useState(false);
  const [existAvatar, setExistAvatar] = useState(false);

  return (
    <div className={styles.Config}>
      <h1 className={styles.mainTitle}>Datos generales del condominio</h1>

      <div className={styles.formContainer}>
        <div className={styles.uploadSection}>
          <p className={styles.uploadHelpText}>
            Carga el logotipo del condominio, de preferencia un mínimo de 130px x 63px o un máximo de 256px x 125px
          </p>

          <div
            className="upload-container"
            style={{
              display: "flex",
              justifyContent: "left",
              alignItems: "center",
            }}
          >
            <UploadFile
              name="avatarLogo"
              onChange={onChange}
              value={
                typeof formState?.avatarLogo === "object"
                  ? formState?.avatarLogo
                  : String(formState?.has_image_l) === "1"
                    ? getUrlImages(
                        "/LOGO-" + formState?.id + ".webp?" + formState?.updated_at
                      )
                    : undefined
              }
              setError={setErrors}
              error={errors}
              img={true}
              editor={{ width: 800, height: 800 }}
              sizePreview={{ width: "200px", height: "200px" }}
              placeholder="Cargar una imagen"
              ext={["jpg", "png", "jpeg", "webp"]}
              item={formState}
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
                typeof formState?.avatar === "object"
                  ? formState?.avatar
                  : String(formState?.has_image_c) === "1"
                    ? getUrlImages(
                        "/CLIENT-" +
                          formState?.id +
                          ".webp?" +
                          formState?.updated_at
                      )
                    : undefined
              }
              setError={setErrors}
              error={errors}
              img={true}
              editor={{ width: 1350, height: 568 }}
              sizePreview={{ width: "650px", height: "284px" }}
              placeholder="Cargar una imagen"
              ext={["jpg", "png", "jpeg", "webp"]}
              item={formState}
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
              error={errors}
              required
              onChange={onChange}
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
              onChange={onChange}
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
              error={errors}
              required
              onChange={onChange}
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
              error={errors}
              required
              onChange={onChange}
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
              error={errors}
              required
              onChange={onChange}
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
            onChange={onChange}
            value={formState?.description}
            className="dark-input"
            maxLength={500}
            error={errors}
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
                onChange={onChange}
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
                error={errors}
                required
                value={formState?.year}
                onChange={onChange}
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
            error={errors}
            required
            value={formState?.initial_amount}
            onChange={onChange}
            className="dark-input"
          />
          {/* <div className={styles.fieldHint}>
            El monto debe ser menor o igual a 10 dígitos
          </div> */}
        </div>

        <div className={styles.saveButtonContainer}>
          <Button
            className={`${styles.saveButton} `}
            onClick={onSave}
            // disabled={Object.keys(validationErrors).length > 0}
          >
            Guardar datos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DptoConfig;
