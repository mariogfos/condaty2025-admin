import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Switch from "@/mk/components/forms/Switch/Switch";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DptoConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import Tooltip from "@/mk/components/ui/Tooltip/Tooltip";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useFileUpload } from "@/mk/hooks/useFileUpload";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { ChevronDown, Pencil, Trash2, Upload } from "lucide-react";

interface PropsType {
  client_config: Record<string, any>;
  onSave: (e: object) => Promise<void> | void;
  mode?: "condo" | "rules";
}

const DEFAULT_PAYMENT_METHODS_CONFIG = {
  expenses: ["Q", "T"],
  reservations: ["Q", "T"],
  fines: ["Q", "T"],
  others: ["Q", "T"],
};

const paymentDebtTypes = [
  { id: "expenses", name: "Expensas" },
  { id: "reservations", name: "Reservas" },
  { id: "fines", name: "Multas" },
  { id: "others", name: "Otras deudas" },
] as const;

const paymentMethodOptions = [
  { id: "Q", name: "QR" },
  { id: "T", name: "Transferencia" },
  { id: "W", name: "WhatsApp" },
] as const;

type PaymentDebtType = (typeof paymentDebtTypes)[number]["id"];
type PaymentMethod = (typeof paymentMethodOptions)[number]["id"];

const normalizePaymentMethodsConfig = (value: any) => {
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        })()
      : value || {};

  return paymentDebtTypes.reduce((acc, debtType) => {
    const methods = Array.isArray(parsed?.[debtType.id])
      ? parsed[debtType.id]
      : DEFAULT_PAYMENT_METHODS_CONFIG[debtType.id];

    acc[debtType.id] = Array.from(
      new Set(
        methods
          .map((method: any) => String(method).toUpperCase())
          .filter((method: any) =>
            paymentMethodOptions.some((option) => option.id === method),
          ),
      ),
    );
    return acc;
  }, {} as Record<PaymentDebtType, string[]>);
};

const hasWhatsAppPaymentMethod = (
  config: Record<PaymentDebtType, string[]>,
) => paymentDebtTypes.some((debtType) => config[debtType.id]?.includes("W"));

const getSingleUrl = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0] || "";
  }
  return typeof value === "string" ? value : "";
};

const createFormState = (client_config: Record<string, any>) => ({
  url_logo: client_config?.client?.url_logo || [],
  url_logo_print: client_config?.client?.url_logo_print || [],
  url_banner: client_config?.client?.url_banner || [],
  name: client_config?.client?.name || "",
  type: client_config?.client?.type || "",
  phone: client_config?.client?.phone || "",
  email: client_config?.client?.email || "",
  address: client_config?.client?.address || "",
  description: client_config?.client?.description || "",
  month: client_config?.month || "",
  year: client_config?.year || "",
  initial_amount: client_config?.initial_amount || "",
  has_maintenance_value:
    Number(client_config?.has_maintenance_value) === 1 ||
    client_config?.has_maintenance_value === true ||
    client_config?.has_maintenance_value === "Y",
  has_financial_data: Number(client_config?.has_financial_data) === 1,
  has_financial_debt: Number(client_config?.has_financial_debt) === 1,
  financial_mode: client_config?.financial_mode || 0,
  has_soft_reservation:
    Number(client_config?.has_soft_reservation) === 1 ||
    client_config?.has_soft_reservation === true ||
    client_config?.has_soft_reservation === "Y",
  has_reservation_advance_limit:
    Number(client_config?.has_reservation_advance_limit) === 1 ||
    client_config?.has_reservation_advance_limit === true ||
    client_config?.has_reservation_advance_limit === "Y",
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
  payment_methods_config: normalizePaymentMethodsConfig(
    client_config?.payment_methods_config,
  ),
  payment_whatsapp_phone: client_config?.payment_whatsapp_phone || "",
});

const getComparableState = (formState: Record<string, any>) => ({
  ...formState,
  url_logo: getSingleUrl(formState.url_logo),
  url_logo_print: getSingleUrl(formState.url_logo_print),
  url_banner: getSingleUrl(formState.url_banner),
  payment_methods_config: normalizePaymentMethodsConfig(
    formState.payment_methods_config,
  ),
  payment_time_limit: formState.bookingRequiresPayment
    ? formState.payment_time_limit || ""
    : null,
});

const DptoConfig = ({
  client_config,
  onSave,
  mode = "condo",
}: PropsType) => {
  const { showToast } = useAuth();
  const isRulesMode = mode === "rules";
  const initialState = useMemo(() => createFormState(client_config), [client_config]);
  const [formState, setFormState] = useState(initialState);
  const [editMode, setEditMode] = useState(false);
  const [openAccordions, setOpenAccordions] = useState({
    reservas: true,
    finanzas: true,
    tareas: true,
  });

  const [errors, setErrors]: any = useState({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const printInputRef = useRef<HTMLInputElement>(null);

  const logoUpload = useFileUpload({
    name: "url_logo",
    formState,
    setFormState,
    cant: 1,
    mode: "images",
    showToast,
  });

  const bannerUpload = useFileUpload({
    name: "url_banner",
    formState,
    setFormState,
    cant: 1,
    mode: "images",
    showToast,
  });

  const printUpload = useFileUpload({
    name: "url_logo_print",
    formState,
    setFormState,
    cant: 1,
    mode: "images",
    showToast,
  });

  const logoUrl = getSingleUrl(formState.url_logo);
  const bannerUrl = getSingleUrl(formState.url_banner);
  const printLogoUrl = getSingleUrl(formState.url_logo_print);
  const firstFieldQuery = isRulesMode
    ? 'input[name="payment_time_limit"], [name="financial_mode"]'
    : 'input[name="name"]';
  const isDirty =
    JSON.stringify(getComparableState(formState)) !==
    JSON.stringify(getComparableState(initialState));

  useEffect(() => {
    setFormState(initialState);
    setErrors({});
    setEditMode(false);
  }, [initialState]);

  useEffect(() => {
    if (isRulesMode) {
      setOpenAccordions({
        reservas: true,
        finanzas: true,
        tareas: true,
      });
    }
  }, [isRulesMode]);

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
    } else if (name === "has_reservation_advance_limit") {
      const isEnabled = value === "Y";

      setFormState((prev: any) => ({
        ...prev,
        has_reservation_advance_limit: isEnabled,
      }));
    } else if (name === "has_tasks_visible") {
      const isEnabled = value === "Y";

      setFormState((prev: any) => ({
        ...prev,
        has_tasks_visible: isEnabled,
      }));
    }
  };

  const handlePaymentMethodSwitch =
    (debtType: PaymentDebtType, method: PaymentMethod) =>
    ({ target: { value } }: any) => {
      const isEnabled = value === "Y";

      setFormState((prev: any) => {
        const currentConfig = normalizePaymentMethodsConfig(
          prev.payment_methods_config,
        );
        const currentMethods = currentConfig[debtType] || [];
        const nextMethods = isEnabled
          ? Array.from(new Set([...currentMethods, method]))
          : currentMethods.filter((item) => item !== method);

        return {
          ...prev,
          payment_methods_config: {
            ...currentConfig,
            [debtType]: nextMethods,
          },
        };
      });
    };

  const handleWhatsAppPhoneChange = (e: any) => {
    const value = String(e.target.value || "").replace(/\D/g, "");

    setFormState((prev: any) => ({
      ...prev,
      payment_whatsapp_phone: value,
    }));
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
        const nextErrors = { ...errors };
        delete nextErrors.payment_time_limit;
        setErrors(nextErrors);

        setFormState((prev: any) => ({
          ...prev,
          payment_time_limit: value,
          savedPaymentTimeLimit: value,
        }));
      }
    } else {
      setFormState((prev: any) => ({
        ...prev,
        payment_time_limit: null,
      }));
    }
  };

  const validate = () => {
    let nextErrors: any = {};

    if (!isRulesMode) {
      nextErrors = checkRules({
        value: logoUrl,
        rules: ["required"],
        key: "url_logo",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: printLogoUrl,
        rules: ["required"],
        key: "url_logo_print",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: bannerUrl,
        rules: ["required"],
        key: "url_banner",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: formState.name,
        rules: ["required"],
        key: "name",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: formState.type,
        rules: ["required"],
        key: "type",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: formState.phone,
        rules: ["required", "phone"],
        key: "phone",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: formState.email,
        rules: ["required", "email"],
        key: "email",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: formState.address,
        rules: ["required"],
        key: "address",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: formState.month,
        rules: ["required"],
        key: "month",
        errors: nextErrors,
        data: formState,
      });

      nextErrors = checkRules({
        value: formState.initial_amount,
        rules: ["required"],
        key: "initial_amount",
        errors: nextErrors,
        data: formState,
      });
    }

    if (formState.bookingRequiresPayment) {
      nextErrors = checkRules({
        value: formState.payment_time_limit,
        rules: ["required"],
        key: "payment_time_limit",
        errors: nextErrors,
        data: formState,
      });
    }

    if (formState?.has_financial_debt && formState?.has_financial_data) {
      nextErrors = checkRules({
        value: formState.financial_mode,
        rules: ["required"],
        key: "financial_mode",
        errors: nextErrors,
        data: formState,
      });
    }

    const paymentMethodsConfig = normalizePaymentMethodsConfig(
      formState.payment_methods_config,
    );

    paymentDebtTypes.forEach((debtType) => {
      if ((paymentMethodsConfig[debtType.id] || []).length === 0) {
        nextErrors[`payment_methods_config_${debtType.id}`] =
          "Selecciona al menos un método de pago";
      }
    });

    if (hasWhatsAppPaymentMethod(paymentMethodsConfig)) {
      nextErrors = checkRules({
        value: formState.payment_whatsapp_phone,
        rules: ["required"],
        key: "payment_whatsapp_phone",
        errors: nextErrors,
        data: formState,
      });

      if (
        formState.payment_whatsapp_phone &&
        (formState.payment_whatsapp_phone.length < 8 ||
          formState.payment_whatsapp_phone.length > 20)
      ) {
        nextErrors.payment_whatsapp_phone =
          "Incluye código de país, entre 8 y 20 dígitos y sin +";
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const triggerInput = (ref: React.RefObject<HTMLInputElement | null>) => {
    setEditMode(true);
    ref.current?.click();
  };

  const handleAssetSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
    uploadHandler: (files: FileList | null) => Promise<void>,
  ) => {
    setEditMode(true);
    await uploadHandler(event.target.files);
    event.target.value = "";
  };

  const _onSave = async () => {
    if (hasErrors(validate())) return;
    await onSave(formState);
    setEditMode(false);
  };

  const handleEditClick = () => {
    setEditMode(true);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(firstFieldQuery)?.focus();
    });
  };

  const handleDiscardChanges = () => {
    setErrors({});
    if (isDirty) {
      setFormState(initialState);
    }
    setEditMode(false);
  };

  const toggleAccordion = (key: "reservas" | "finanzas" | "tareas") => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const condoTypeOptions = [
    { id: "C", name: "Condominio" },
    { id: "E", name: "Edificio" },
    { id: "U", name: "Urbanización" },
  ];

  const condoTypeLabel =
    condoTypeOptions.find((option) => option.id === formState.type)?.name ||
    "Condominio";
  const paymentMethodsConfig = normalizePaymentMethodsConfig(
    formState.payment_methods_config,
  );
  const whatsappPaymentEnabled =
    hasWhatsAppPaymentMethod(paymentMethodsConfig);

  return (
    <div className={`${styles.Config} ${isRulesMode ? styles.compactMode : ""}`}>
      <div className={styles.headerRow}>
        <div className={styles.headerContent}>
          <h1 className={styles.mainTitle}>
            {isRulesMode ? "Reglas operativas" : "Datos generales del condominio"}
          </h1>
          <p className={styles.mainSubtitle}>
            {isRulesMode
              ? "Ordena las reglas del condominio por modulo para reservas, finanzas y tareas sin mezclar la identidad visual con la operacion."
              : "Organiza la identidad, contacto y base operativa del condominio."}
          </p>
        </div>

        <div className={styles.headerAction}>
          <div className={styles.headerButtons}>
            {!editMode ? (
              <Button
                variant="secondary"
                className={styles.editButton}
                onClick={handleEditClick}
              >
                Editar
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className={styles.editButton}
                  onClick={handleDiscardChanges}
                >
                  Descartar cambios
                </Button>
                <Button
                  className={styles.saveButton}
                  onClick={_onSave}
                  disabled={!isDirty}
                >
                  Guardar cambios
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {!isRulesMode ? (
        <div className={styles.layoutGrid}>
          <section className={`${styles.formCard} ${styles.identityCard}`}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.textTitle}>Identidad visual</p>
                <p className={styles.textSubtitle}>
                  Mantén la portada y el logotipo principal alineados con la
                  experiencia del condominio.
                </p>
              </div>
            </div>

            <div className={styles.coverPreview}>
              <div className={styles.coverFrame}>
                <div className={styles.coverActions}>
                  <button
                    type="button"
                    className={styles.assetIconButton}
                    onClick={() => triggerInput(bannerInputRef)}
                  >
                    {bannerUrl ? (
                      <Pencil size={16} strokeWidth={1.8} />
                    ) : (
                      <Upload size={16} strokeWidth={1.8} />
                    )}
                  </button>
                  {bannerUrl && (
                    <button
                      type="button"
                      className={`${styles.assetIconButton} ${styles.assetDeleteButton}`}
                      onClick={() => {
                        setEditMode(true);
                        bannerUpload.handleDelete(0);
                      }}
                    >
                      <Trash2 size={16} strokeWidth={1.8} />
                    </button>
                  )}
                </div>

                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Portada del condominio"
                    className={styles.coverImage}
                  />
                ) : (
                  <div className={styles.coverPlaceholder}>
                    <span>Sin portada</span>
                  </div>
                )}

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={(event) =>
                    handleAssetSelection(event, bannerUpload.handleFiles)
                  }
                />
              </div>

              <div className={styles.coverAvatarAnchor}>
                <div className={styles.profileLogoShell}>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo del condominio"
                      className={styles.profileLogoImage}
                    />
                  ) : (
                    <div className={styles.profileLogoPlaceholder}>
                      {formState.name?.slice(0, 1) || "C"}
                    </div>
                  )}

                  <div className={styles.profileLogoOverlay}>
                    <button
                      type="button"
                      className={styles.profileActionButton}
                      onClick={() => triggerInput(logoInputRef)}
                    >
                      <Upload size={16} strokeWidth={1.8} />
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        className={`${styles.profileActionButton} ${styles.assetDeleteButton}`}
                        onClick={() => {
                          setEditMode(true);
                          logoUpload.handleDelete(0);
                        }}
                      >
                        <Trash2 size={16} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className={styles.assetError}>{errors?.url_banner}</p>

            <div className={styles.profilePreviewRow}>
              <div className={styles.profilePreviewMeta}>
                <p className={styles.profilePreviewTitle}>
                  {formState.name || "Nombre del condominio"}
                </p>
                <p className={styles.profilePreviewSubtitle}>
                  {condoTypeLabel}
                </p>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(event) =>
                  handleAssetSelection(event, logoUpload.handleFiles)
                }
              />
            </div>
            <p className={styles.assetError}>{errors?.url_logo}</p>

            <div className={styles.sectionDivider} />

            <div className={styles.printLogoModule}>
              <div className={styles.printLogoThumb}>
                {printLogoUrl ? (
                  <img
                    src={printLogoUrl}
                    alt="Logo de impresión"
                    className={styles.printLogoImage}
                  />
                ) : (
                  <div className={styles.printLogoPlaceholder}>IP</div>
                )}
              </div>

              <div className={styles.printLogoText}>
                <div>
                  <p className={styles.assetActionTitle}>Logo de impresión</p>
                  <p className={styles.assetActionSubtitle}>
                    Úsalo para reportes, recibos y documentos del condominio.
                  </p>
                </div>
              </div>
              <div className={styles.printLogoActions}>
                <div className={styles.assetActionButtons}>
                  <button
                    type="button"
                    className={styles.assetIconButton}
                    onClick={() => triggerInput(printInputRef)}
                  >
                    {printLogoUrl ? (
                      <Pencil size={16} strokeWidth={1.8} />
                    ) : (
                      <Upload size={16} strokeWidth={1.8} />
                    )}
                  </button>
                  {printLogoUrl && (
                    <button
                      type="button"
                      className={`${styles.assetIconButton} ${styles.assetDeleteButton}`}
                      onClick={() => {
                        setEditMode(true);
                        printUpload.handleDelete(0);
                      }}
                    >
                      <Trash2 size={16} strokeWidth={1.8} />
                    </button>
                  )}
                </div>
                <input
                  ref={printInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={(event) =>
                    handleAssetSelection(event, printUpload.handleFiles)
                  }
                />
                <p className={styles.assetError}>{errors?.url_logo_print}</p>
              </div>
            </div>
          </section>

          <section className={`${styles.formCard} ${styles.infoCard}`}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.textTitle}>Información del condominio</p>
                <p className={styles.textSubtitle}>
                  Agrupa los datos públicos, el logo de impresión y el inicio
                  financiero dentro de una sola card flexible.
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
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
                disabled={!editMode}
              />
              <Select
                label="Tipo de condominio"
                value={formState.type}
                name="type"
                error={errors}
                onChange={handleChange}
                options={condoTypeOptions}
                required
                className="dark-input appearance-none"
                disabled={!editMode}
              />
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
                disabled={!editMode}
              />
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
                disabled={!editMode}
              />
              <div className={styles.fullSpan}>
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
                  disabled={!editMode}
                />
              </div>
              <div className={`${styles.textareaContainer} ${styles.fullSpan}`}>
                <TextArea
                  label="Agrega una pequeña descripción del condominio"
                  name="description"
                  required={false}
                  onChange={handleChange}
                  value={formState.description}
                  className="dark-input"
                  maxLength={500}
                  error={errors}
                  disabled={!editMode}
                />
              </div>
            </div>

            <div className={styles.sectionDivider} />

            <div className={styles.cardHeader}>
              <div>
                <p className={styles.textTitle}>Inicio financiero</p>
                <p className={styles.textSubtitle}>
                  Define desde cuándo corre el cobro de expensas y el saldo base
                  del condominio.
                </p>
              </div>
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
                  disabled={!editMode}
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
                  disabled={!editMode}
                />
              </div>
            </div>

            <Tooltip title="Este es el valor reflejado de la suma de sus montos inciales de cuentas bancarias">
              <Input
                type="currency"
                label="Saldo inicial"
                name="initial_amount"
                error={errors}
                required
                disabled
                value={formState.initial_amount}
                onChange={handleChange}
                className="dark-input"
              />
            </Tooltip>
          </section>
        </div>
      ) : (
        <div className={styles.rulesGrid}>
          <section className={styles.formCard}>
            <button
              type="button"
              className={styles.accordionHeader}
              onClick={() => toggleAccordion("reservas")}
            >
              <div className={styles.accordionHeaderContent}>
                <p className={styles.textTitle}>Reservas</p>
                <p className={styles.textSubtitle}>
                  Reglas operativas para pagos y comportamiento de las reservas.
                </p>
              </div>
              <ChevronDown
                size={18}
                strokeWidth={1.8}
                className={`${styles.accordionChevron} ${openAccordions.reservas ? styles.accordionChevronOpen : ""}`}
              />
            </button>
            {openAccordions.reservas && <div className={styles.accordionDivider} />}

            <div
              className={`${styles.accordionBody} ${openAccordions.reservas ? styles.accordionBodyOpen : ""}`}
            >
              <div className={styles.settingsStack}>
              <div className={styles.switchContainer}>
                <div className={styles.switchContent}>
                  <p className={styles.textTitle}>
                    Reservas requieren pago obligatorio
                  </p>
                  <p className={styles.textSubtitle}>
                    Exige un pago para confirmar reservas y define un tiempo
                    límite para completarlo.
                  </p>
                </div>
                <Switch
                  name="bookingRequiresPayment"
                  label=""
                  value={formState.bookingRequiresPayment ? "Y" : "N"}
                  onChange={handleSwitchChange}
                  optionValue={["Y", "N"]}
                  checked={formState.bookingRequiresPayment}
                  disabled={!editMode}
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
                  disabled={!editMode}
                />
              )}

              <div className={styles.switchContainer}>
                <div className={styles.switchContent}>
                  <p className={styles.textTitle}>
                    Respetar anticipación mínima por área
                  </p>
                  <p className={styles.textSubtitle}>
                    Bloquea para residentes los turnos que no cumplan las horas
                    de anticipación configuradas en cada área social.
                  </p>
                </div>
                <Switch
                  name="has_reservation_advance_limit"
                  label=""
                  value={formState.has_reservation_advance_limit ? "Y" : "N"}
                  onChange={handleSwitchChange}
                  optionValue={["Y", "N"]}
                  checked={formState.has_reservation_advance_limit}
                  disabled={!editMode}
                />
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchContent}>
                  <p className={styles.textTitle}>Bloquear reservas en soft ban</p>
                  <p className={styles.textSubtitle}>
                    Impide que residentes en soft ban realicen reservas.
                  </p>
                </div>
                <Switch
                  name="has_soft_reservation"
                  label=""
                  value={formState.has_soft_reservation ? "Y" : "N"}
                  onChange={handleSwitchChange}
                  optionValue={["Y", "N"]}
                  checked={formState.has_soft_reservation}
                  disabled={!editMode}
                />
              </div>
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <button
              type="button"
              className={styles.accordionHeader}
              onClick={() => toggleAccordion("finanzas")}
            >
              <div className={styles.accordionHeaderContent}>
                <p className={styles.textTitle}>Finanzas</p>
                <p className={styles.textSubtitle}>
                  Visibilidad del resumen financiero y reglas de deuda del
                  condominio.
                </p>
              </div>
              <ChevronDown
                size={18}
                strokeWidth={1.8}
                className={`${styles.accordionChevron} ${openAccordions.finanzas ? styles.accordionChevronOpen : ""}`}
              />
            </button>
            {openAccordions.finanzas && <div className={styles.accordionDivider} />}

            <div
              className={`${styles.accordionBody} ${openAccordions.finanzas ? styles.accordionBodyOpen : ""}`}
            >
              <div className={styles.settingsStack}>
              <div className={styles.switchContainer}>
                <div className={styles.switchContent}>
                  <p className={styles.textTitle}>
                    Mantenimiento de valor en el condominio
                  </p>
                  <p className={styles.textSubtitle}>
                    Aplica mantenimiento de valor a reservas, deudas y fondos
                    del condominio.
                  </p>
                </div>
                <Switch
                  name="has_maintenance_value"
                  label=""
                  value={formState.has_maintenance_value ? "Y" : "N"}
                  onChange={handleSwitchChange}
                  optionValue={["Y", "N"]}
                  checked={formState.has_maintenance_value}
                  disabled={!editMode}
                />
              </div>

              <div className={styles.sectionDivider} />

              <div className={styles.cardHeader}>
                <p className={styles.textTitle}>Métodos de pago por deuda</p>
                <p className={styles.textSubtitle}>
                  Configura qué alternativas verá el residente según el tipo de
                  deuda seleccionada.
                </p>
              </div>

              <div className={styles.paymentMethodsMatrix}>
                {paymentDebtTypes.map((debtType) => (
                  <div className={styles.paymentMethodRow} key={debtType.id}>
                    <div className={styles.paymentMethodHeader}>
                      <p className={styles.textTitle}>{debtType.name}</p>
                    </div>

                    <div className={styles.paymentMethodToggles}>
                      {paymentMethodOptions.map((method) => (
                        <div
                          className={styles.paymentMethodToggle}
                          key={`${debtType.id}-${method.id}`}
                        >
                          <span>{method.name}</span>
                          <Switch
                            name={`${debtType.id}_${method.id}`}
                            label=""
                            value={
                              paymentMethodsConfig[debtType.id]?.includes(
                                method.id,
                              )
                                ? "Y"
                                : "N"
                            }
                            onChange={handlePaymentMethodSwitch(
                              debtType.id,
                              method.id,
                            )}
                            optionValue={["Y", "N"]}
                            checked={Boolean(
                              paymentMethodsConfig[debtType.id]?.includes(
                                method.id,
                              ),
                            )}
                            disabled={!editMode}
                          />
                        </div>
                      ))}
                    </div>

                    {errors?.[`payment_methods_config_${debtType.id}`] && (
                      <p className={styles.paymentMethodError}>
                        {errors[`payment_methods_config_${debtType.id}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {whatsappPaymentEnabled && (
                <Input
                  type="text"
                  label="Número de WhatsApp para pagos"
                  name="payment_whatsapp_phone"
                  error={errors}
                  value={formState.payment_whatsapp_phone}
                  onChange={handleWhatsAppPhoneChange}
                  className="dark-input"
                  maxLength={20}
                  placeholder="59170000000"
                  disabled={!editMode}
                />
              )}

              <div className={styles.sectionDivider} />

              <div className={styles.switchContainer}>
                <div className={styles.switchContent}>
                  <p className={styles.textTitle}>Mostrar resumen financiero</p>
                  <p className={styles.textSubtitle}>
                    Habilita el resumen financiero en la vista principal del
                    condominio.
                  </p>
                </div>
                <Switch
                  name="has_financial_data"
                  label=""
                  value={formState.has_financial_data ? "1" : "0"}
                  onChange={handleSwitchChange}
                  optionValue={["1", "0"]}
                  checked={formState.has_financial_data}
                  disabled={!editMode}
                />
              </div>

              {formState.has_financial_data && (
                <>
                  <div className={styles.switchContainer}>
                    <div className={styles.switchContent}>
                      <p className={styles.textTitle}>Mostrar deudas</p>
                      <p className={styles.textSubtitle}>
                        Incluye deudas dentro del resumen financiero del
                        condominio.
                      </p>
                    </div>
                    <Switch
                      name="has_financial_debt"
                      label=""
                      value={formState.has_financial_debt ? "1" : "0"}
                      onChange={handleSwitchChange}
                      optionValue={["1", "0"]}
                      checked={formState.has_financial_debt}
                      disabled={!editMode}
                    />
                  </div>

                  {formState.has_financial_debt && (
                    <Select
                      name="financial_mode"
                      label="Modo de finanzas"
                      value={formState.financial_mode}
                      onChange={handleChange}
                      options={[
                        { id: 1, name: "Solo expensas" },
                        { id: 2, name: "Expensas y multas separados" },
                        { id: 3, name: "Expensas y multas juntos" },
                      ]}
                      error={errors}
                      disabled={!editMode}
                    />
                  )}
                </>
              )}
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <button
              type="button"
              className={styles.accordionHeader}
              onClick={() => toggleAccordion("tareas")}
            >
              <div className={styles.accordionHeaderContent}>
                <p className={styles.textTitle}>Tareas y visibilidad</p>
                <p className={styles.textSubtitle}>
                  Define cómo nacen los flujos de tareas para los residentes.
                </p>
              </div>
              <ChevronDown
                size={18}
                strokeWidth={1.8}
                className={`${styles.accordionChevron} ${openAccordions.tareas ? styles.accordionChevronOpen : ""}`}
              />
            </button>
            {openAccordions.tareas && <div className={styles.accordionDivider} />}

            <div
              className={`${styles.accordionBody} ${openAccordions.tareas ? styles.accordionBodyOpen : ""}`}
            >
              <div className={styles.settingsStack}>
              <div className={styles.switchContainer}>
                <div className={styles.switchContent}>
                  <p className={styles.textTitle}>
                    Tareas visibles para residentes por defecto
                  </p>
                  <p className={styles.textSubtitle}>
                    Define si las tareas nuevas nacen públicas o privadas para
                    los residentes.
                  </p>
                </div>
                <Switch
                  name="has_tasks_visible"
                  label=""
                  value={formState.has_tasks_visible ? "Y" : "N"}
                  onChange={handleSwitchChange}
                  optionValue={["Y", "N"]}
                  checked={formState.has_tasks_visible}
                  disabled={!editMode}
                />
              </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default DptoConfig;
