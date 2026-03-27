import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Switch from "@/mk/components/forms/Switch/Switch";
import React, { useState } from "react";
import styles from "./DptoConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import Br from "@/components/Detail/Br";
import UploadFileSingle from "@/mk/components/forms/UploadFileSingle/UploadFileSingle";
import Tooltip from "@/mk/components/ui/Tooltip/Tooltip";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
interface PropsType {
  client_config: Record<string, any>;
  onSave: (e: object) => void;
}

const DptoConfig = ({ client_config, onSave }: PropsType) => {
  const [formState, setFormState] = useState({
    url_logo: client_config?.client?.url_logo?.[0] || "",
    url_logo_print: client_config?.client?.url_logo_print?.[0] || "",
    url_banner: client_config?.client?.url_banner?.[0] || "",
    name: client_config?.client?.name || "",
    type: client_config?.client?.type || "",
    phone: client_config?.client?.phone || "",
    email: client_config?.client?.email || "",
    address: client_config?.client?.address || "",
    description: client_config?.client?.description || "",
    month: client_config?.month || "",
    year: client_config?.year || "",
    initial_amount: client_config?.initial_amount || "",
    has_maintenance_value: Boolean(client_config?.has_maintenance_value),
    has_financial_data: Number(client_config?.has_financial_data) === 1,
    has_financial_debt: Number(client_config?.has_financial_debt) === 1,
    financial_mode: client_config?.financial_mode || 0,
    has_soft_reservation: Boolean(client_config?.has_soft_reservation),
    has_tasks_visible:
      Number(client_config?.has_tasks_visible) === 1 ||
      client_config?.has_tasks_visible === true ||
      client_config?.has_tasks_visible === "Y",
    bookingRequiresPayment:
      client_config?.payment_time_limit !== null &&
      client_config?.payment_time_limit !== undefined &&
      client_config?.payment_time_limit !== "" &&
      Number(client_config?.payment_time_limit) !== 0,
    payment_time_limit: client_config?.payment_time_limit || null,
    savedPaymentTimeLimit:
      client_config?.payment_time_limit &&
      client_config?.payment_time_limit !== "" &&
      Number(client_config?.payment_time_limit) > 0
        ? client_config.payment_time_limit
        : "",
  });

  const [errors, setErrors]: any = useState({});

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setFormState((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = ({ target: { name, value } }: any) => {
    if (name === "bookingRequiresPayment") {
      const isEnabled = value === "Y";

      setFormState((prev: any) => ({
        ...prev,
        bookingRequiresPayment: isEnabled,
        payment_time_limit: isEnabled ? prev.savedPaymentTimeLimit || "" : null,
        savedPaymentTimeLimit:
          !isEnabled &&
          prev.payment_time_limit &&
          Number(prev.payment_time_limit) > 0
            ? prev.payment_time_limit
            : prev.savedPaymentTimeLimit,
      }));
    } else if (name === "has_maintenance_value") {
      const isEnabled = value === "Y";

      setFormState((prev: any) => ({
        ...prev,
        has_maintenance_value: isEnabled,
      }));
    } else if (name === "has_financial_data") {
      const isEnabled = value === "1" || value === 1 || value === true;

      setFormState((prev: any) => ({
        ...prev,
        has_financial_data: isEnabled,
      }));
    } else if (name === "has_financial_debt") {
      const isEnabled = value === "1" || value === 1 || value === true;

      setFormState((prev: any) => ({
        ...prev,
        has_financial_debt: isEnabled,
      }));
    } else if (name === "has_soft_reservation") {
      const isEnabled = value === "Y";

      setFormState((prev: any) => ({
        ...prev,
        has_soft_reservation: isEnabled,
      }));
    } else if (name === "has_tasks_visible") {
      const isEnabled = value === "Y";

      setFormState((prev: any) => ({
        ...prev,
        has_tasks_visible: isEnabled,
      }));
    }
  };

  const handleTimeChange = (e: any) => {
    const value = e.target.value;

    if (value) {
      if (Number(value) > 400) {
        setErrors({
          ...errors,
          payment_time_limit: "El tiempo máximo es 400 horas",
        });
      } else {
        const newErrors = { ...errors };
        delete newErrors.payment_time_limit;
        setErrors(newErrors);

        setFormState((prev: any) => ({
          ...prev,
          payment_time_limit: value,
          savedPaymentTimeLimit: value,
        }));
      }
    } else {
      setFormState((prev: any) => ({
        ...prev,
        payment_time_limit: null, // null en lugar de "0"
      }));
    }
  };

  const validate = () => {
    let errors: any = {};

    errors = checkRules({
      value: formState.url_logo,
      rules: ["required"],
      key: "url_logo",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.url_logo_print,
      rules: ["required"],
      key: "url_logo_print",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.url_banner,
      rules: ["required"],
      key: "url_banner",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.name,
      rules: ["required"],
      key: "name",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.type,
      rules: ["required"],
      key: "type",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.phone,
      rules: ["required", "phone"],
      key: "phone",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.email,
      rules: ["required", "email"],
      key: "email",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.address,
      rules: ["required"],
      key: "address",
      errors,
      data: formState,
    });

    // errors = checkRules({
    //   value: formState.description,
    //   rules: ["required"],
    //   key: "description",
    //   errors,
    //   data: formState,
    // });

    errors = checkRules({
      value: formState.month,
      rules: ["required"],
      key: "month",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.initial_amount,
      rules: ["required"],
      key: "initial_amount",
      errors,
      data: formState,
    });
    if (formState.bookingRequiresPayment) {
      errors = checkRules({
        value: formState.payment_time_limit,
        rules: ["required"],
        key: "payment_time_limit",
        errors,
        data: formState,
      });
    }
    if (formState?.has_financial_debt && formState?.has_financial_data) {
      errors = checkRules({
        value: formState.financial_mode,
        rules: ["required"],
        key: "financial_mode",
        errors,
        data: formState,
      });
    }
    setErrors(errors);
    return errors;
  };

  const _onSave = () => {
    if (hasErrors(validate())) return;
    onSave(formState);
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
              <UploadFileSingle
                label="Logo para pantallas"
                formState={formState}
                name="url_logo"
                setFormState={setFormState}
                error={errors}
              />
            </div>
            <div style={{ width: "100%" }}>
              <UploadFileSingle
                label="Logo para impresión"
                formState={formState}
                name="url_logo_print"
                setFormState={setFormState}
                error={errors}
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
            <UploadFileSingle
              // label="Banner"
              formState={formState}
              name="url_banner"
              setFormState={setFormState}
              error={errors}
            />
          </div>
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.inputHalf}>
            <Input
              label={"Nombre del condominio"}
              value={formState.name}
              type="text"
              name="name"
              error={errors}
              required
              onChange={handleChange}
              className="dark-input"
              maxLength={80}
            />
          </div>
          <div className={styles.inputHalf}>
            <Select
              label="Tipo de condominio"
              value={formState.type}
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
              value={formState.phone}
              type="text"
              name="phone"
              error={errors}
              required
              onChange={handleChange}
              className="dark-input"
              maxLength={15}
            />
          </div>
          <div className={styles.inputHalf}>
            <Input
              label={"Correo electrónico"}
              value={formState.email}
              type="email"
              name="email"
              error={errors}
              required
              onChange={handleChange}
              className="dark-input"
              maxLength={100}
            />
          </div>
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.inputHalf}>
            <Input
              label={"Dirección"}
              value={formState.address}
              type="text"
              name="address"
              error={errors}
              required
              onChange={handleChange}
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
            onChange={handleChange}
            value={formState.description}
            className="dark-input"
            maxLength={500}
            error={errors}
          />
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
                value={formState.month}
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
                error={errors}
                required
                value={formState.year}
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

          <Tooltip title="Este es el valor reflejado de la suma de sus montos inciales de cuentas bancarias">
            <Input
              type="currency"
              label="Saldo"
              name="initial_amount"
              error={errors}
              required
              disabled
              value={formState.initial_amount}
              onChange={handleChange}
              className="dark-input"
            />
          </Tooltip>
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
                un pago obligatorio. Puedes configurar un tiempo límite en horas
                para completar el pago.
              </p>
            </div>

            <Switch
              name="bookingRequiresPayment"
              label=""
              value={formState.bookingRequiresPayment ? "Y" : "N"}
              onChange={handleSwitchChange}
              optionValue={["Y", "N"]}
              checked={formState.bookingRequiresPayment}
            />
          </div>
          {formState.bookingRequiresPayment && (
            <Input
              type="number"
              label="Tiempo límite para pago (horas)"
              name="payment_time_limit"
              error={errors}
              value={formState.payment_time_limit || ""}
              onChange={handleTimeChange}
              className="dark-input"
              min="1"
              max="400"
              placeholder="Máximo 400 horas"
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
                Activa esta opción para aplicar mantenimiento de valor a todas
                las reservas, deudas y fondos del condominio
              </p>
            </div>

            <Switch
              name="has_maintenance_value"
              label=""
              value={formState.has_maintenance_value ? "Y" : "N"}
              onChange={handleSwitchChange}
              optionValue={["Y", "N"]}
              checked={formState.has_maintenance_value}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div className={styles.switchContainer}>
            <div>
              <p className={styles.textTitle}>Mostrar resumen financiero</p>
              <p className={styles.textSubtitle}>
                Activa esta opción para habilitar el resumen financiero en la
                vista del condominio.
              </p>
            </div>

            <Switch
              name="has_financial_data"
              label=""
              value={formState.has_financial_data ? "1" : "0"}
              onChange={handleSwitchChange}
              optionValue={["1", "0"]}
              checked={formState.has_financial_data}
            />
          </div>
        </div>
        {formState.has_financial_data && (
          <>
            <div className={styles.sectionContainer}>
              <div className={styles.switchContainer}>
                <div>
                  <p className={styles.textTitle}>Mostrar deudas </p>
                  <p className={styles.textSubtitle}>
                    Activa esta opción para mostrar las deudas del condominio en
                    el resumen financiero.
                  </p>
                </div>
                <Switch
                  name="has_financial_debt"
                  label=""
                  value={formState.has_financial_debt ? "1" : "0"}
                  onChange={handleSwitchChange}
                  optionValue={["1", "0"]}
                  checked={formState.has_financial_debt}
                />
              </div>
            </div>
            {formState?.has_financial_debt && (
              <div className={styles.sectionContainer}>
                <Select
                  name="financial_mode"
                  label="Modo de finanzas"
                  value={formState.financial_mode}
                  onChange={handleChange}
                  options={[
                    { id: 1, name: "Solo expensas" },
                    { id: 2, name: "Expensas y multas separados" },
                    { id: 3, name: "Expensas y mutas juntos" },
                  ]}
                  error={errors}
                />
              </div>
            )}
          </>
        )}

        <div className={styles.sectionContainer}>
          <div className={styles.switchContainer}>
            <div>
              <p className={styles.textTitle}>Bloquear reservas en soft ban</p>
              <p className={styles.textSubtitle}>
                Activa esta opcion, que impide que residentes en soft ban
                realicen reservas
              </p>
            </div>

            <Switch
              name="has_soft_reservation"
              label=""
              value={formState.has_soft_reservation ? "Y" : "N"}
              onChange={handleSwitchChange}
              optionValue={["Y", "N"]}
              checked={formState.has_soft_reservation}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div className={styles.switchContainer}>
            <div>
              <p className={styles.textTitle}>
                Tareas visibles para residentes por defecto
              </p>
              <p className={styles.textSubtitle}>
                Define la visibilidad predeterminada de las tareas nuevas para
                los residentes. Si esta activa, las tareas se crean como
                publicas. Si esta desactivada, las tareas se crean como
                privadas.
              </p>
            </div>

            <Switch
              name="has_tasks_visible"
              label=""
              value={formState.has_tasks_visible ? "Y" : "N"}
              onChange={handleSwitchChange}
              optionValue={["Y", "N"]}
              checked={formState.has_tasks_visible}
            />
          </div>
        </div>

        <div className={styles.saveButtonContainer}>
          <Button className={`${styles.saveButton} `} onClick={_onSave}>
            Guardar datos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DptoConfig;
