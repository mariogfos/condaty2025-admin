import { IconCamera } from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import Switch from "@/mk/components/forms/Switch/Switch";
import { getUrlImages } from "@/mk/utils/string";
import React, { useState, useEffect } from "react";
import styles from "./DptoConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import Br from "@/components/Detail/Br";

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
  const [bookingRequiresPayment, setBookingRequiresPayment] = useState(() => {
    const paymentTimeLimit = formState?.payment_time_limit;
    return Boolean(paymentTimeLimit && paymentTimeLimit !== "" && Number(paymentTimeLimit) > 0);
  });
  const [savedPaymentTimeLimit, setSavedPaymentTimeLimit] = useState(() => {
    const paymentTimeLimit = formState?.payment_time_limit;
    return (paymentTimeLimit && paymentTimeLimit !== "" && Number(paymentTimeLimit) > 0)
      ? formState.payment_time_limit
      : "";
  });
  const [hasMaintenanceValue, setHasMaintenanceValue] = useState(() => {
    return Boolean(formState?.has_maintenance_value);
  });
  const [hasFinancialData, setHasFinancialData] = useState(() => {
    return Number(formState?.has_financial_data) === 1;
  });


  useEffect(() => {
    const paymentTimeLimit = formState?.payment_time_limit;
    const hasPaymentLimit = Boolean(paymentTimeLimit && paymentTimeLimit !== "" && Number(paymentTimeLimit) > 0);
    setBookingRequiresPayment(hasPaymentLimit);
    if (hasPaymentLimit) {
      setSavedPaymentTimeLimit(formState.payment_time_limit);
    }
  }, [formState?.payment_time_limit]);

  useEffect(() => {
    setHasMaintenanceValue(Boolean(formState?.has_maintenance_value));
  }, [formState?.has_maintenance_value]);

  useEffect(() => {
    setHasFinancialData(Number(formState?.has_financial_data) === 1);
  }, [formState?.has_financial_data]);


  const handleSwitchChange = ({ target: { name, value } }: any) => {
    if (name === "bookingRequiresPayment") {
      const isEnabled = value === "Y";
      setBookingRequiresPayment(isEnabled);

      if (isEnabled) {
        if (savedPaymentTimeLimit) {
          onChange({ target: { name: "payment_time_limit", value: savedPaymentTimeLimit } });
        } else {
          onChange({ target: { name: "payment_time_limit", value: "30" } });
          setSavedPaymentTimeLimit("30");
        }
      } else {
        if (formState?.payment_time_limit) {
          setSavedPaymentTimeLimit(formState.payment_time_limit);
        }
        onChange({ target: { name: "payment_time_limit", value: "" } });
      }
    } else if (name === "has_maintenance_value") {
      const isEnabled = value === "Y";
      setHasMaintenanceValue(isEnabled);
      onChange({ target: { name: "has_maintenance_value", value: isEnabled } });
    } else if (name === "has_financial_data") {
      const isEnabled = value === "1" || value === 1 || value === true;
      setHasFinancialData(isEnabled);
      onChange({ target: { name: "has_financial_data", value: isEnabled ? 1 : 0 } });
      if (typeof setFormState === "function") {
        setFormState((prev: any) => ({ ...prev, has_financial_data: isEnabled ? 1 : 0 }));
      }
    }
  };


  const handleTimeChange = (e: any) => {
    onChange(e);

    if (e.target.value) {
      setSavedPaymentTimeLimit(e.target.value);
    }
  };

  return (
    <div className={styles.Config}>
      <h1 className={styles.mainTitle}>Datos generales del condominio</h1>

      <div className={styles.formContainer}>
        <div className={styles.uploadSection}>
          <p className={styles.uploadHelpText}>
            Carga el logotipo del condominio, de preferencia un mínimo de 130px
            x 63px o un máximo de 256px x 125px
          </p>

          <div
            className="upload-container"
            style={{
              display: "flex",
              justifyContent: "left",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ width: "100%" }}>
              <p className={styles.uploadHelpText} style={{ marginBottom: 8 }}>
                Logo para pantallas
              </p>
              <UploadFile
                name="avatarLogo"
                onChange={onChange}
                value={
                  typeof formState?.avatarLogo === "object"
                    ? formState?.avatarLogo
                    : String(formState?.has_image_l) === "1"
                      ? getUrlImages(
                        "/LOGO-" +
                        formState?.id +
                        ".webp?" +
                        formState?.updated_at
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
            <div
              style={{
                width: "100%",
              }}
            >
              <p className={styles.uploadHelpText} style={{ marginBottom: 8 }}>
                Logo para impresión
              </p>
              <UploadFile
                name="avatarLogoP"
                onChange={onChange}
                value={
                  typeof formState?.avatarLogoP === "object"
                    ? formState?.avatarLogoP
                    : String(formState?.has_image_lp) === "1"
                      ? getUrlImages(
                        "/LOGOP-" +
                        formState?.id +
                        ".webp?" +
                        formState?.updated_at
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
        <Br />
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
        </div>
        <Br />
        <div className={styles.sectionContainer}>
          <div className={styles.switchContainer}>
            <div>
              <p className={styles.textTitle}>
                Reservas requieren pago obligatorio
              </p>
              <p className={styles.textSubtitle}>
                Activa esta opción para requerir que todas las reservas incluyan
                un pago obligatorio. Puedes configurar un tiempo límite en
                minutos para completar el pago.
              </p>
            </div>

            <Switch
              name="bookingRequiresPayment"
              label=""
              value={bookingRequiresPayment ? "Y" : "N"}
              onChange={handleSwitchChange}
              optionValue={["Y", "N"]}
              checked={bookingRequiresPayment}
            />
          </div>

          {bookingRequiresPayment && (
            <Input
              type="number"
              label="Tiempo límite para pago (minutos)"
              name="payment_time_limit"
              error={errors}
              value={formState?.payment_time_limit || ""}
              onChange={handleTimeChange}
              className="dark-input"
              min="1"
              max="60"
              placeholder="Máximo 60 minutos"
            />
          )}
        </div>

        <div className={styles.sectionContainer}>
          <div className={styles.switchContainer}>
            <div>
              <p className={styles.textTitle}>
                Mantenimiento de valor en el condominio
              </p>
              <p className={styles.textSubtitle}>
                Activa esta opción para aplicar mantenimiento de valor a todas las reservas, deudas y fondos del condominio
              </p>
            </div>

            <Switch
              name="has_maintenance_value"
              label=""
              value={hasMaintenanceValue ? "Y" : "N"}
              onChange={handleSwitchChange}
              optionValue={["Y", "N"]}
              checked={hasMaintenanceValue}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div className={styles.switchContainer}>
            <div>
              <p className={styles.textTitle}>Mostrar resumen financiero</p>
              <p className={styles.textSubtitle}>
                Activa esta opción para habilitar el resumen financiero en la vista del condominio.
              </p>
            </div>

            <Switch
              name="has_financial_data"
              label=""
              value={hasFinancialData ? "1" : "0"}
              onChange={handleSwitchChange}
              optionValue={["1", "0"]}
              checked={hasFinancialData}
            />
          </div>
        </div>

        <div className={styles.saveButtonContainer}>
          <Button
            className={`${styles.saveButton} `}
            onClick={onSave}
          >
            Guardar datos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DptoConfig;
