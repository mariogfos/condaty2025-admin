"use client";

import React, { useEffect, useMemo, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Select from "@/mk/components/forms/Select/Select";
import Button from "@/mk/components/forms/Button/Button";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import Check from "@/mk/components/forms/Check/Check";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./RenderForm.module.css";

const TYPE_OPTIONS = [
  { id: "O", name: "Ordinaria" },
  { id: "E", name: "Extraordinaria" },
  { id: "I", name: "Informativa" },
];

const MODALITY_OPTIONS = [
  { id: "P", name: "Presencial" },
  { id: "V", name: "Virtual" },
  { id: "H", name: "Híbrida" },
];

const TARGET_AUDIENCE_OPTIONS = [
  { id: "owner_homeowner", name: "Propietarios" },
  { id: "owner_tenant", name: "Inquilinos" },
  { id: "dependent_of_homeowner", name: "Dependientes de propietarios" },
  { id: "dependent_of_tenant", name: "Dependientes de inquilinos" },
];

const normalizeUrls = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.url) return item.url;
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") return [value];
  return [];
};

const getFilenameFromUrl = (url: string, fallback: string) => {
  const base = url?.split("?")[0]?.split("/").pop() || "";
  return base || fallback;
};

const splitDateTime = (value: any) => {
  if (!value) return { date: "", time: "" };
  // Safer to split string than use new Date() to avoid browser timezone adjustments
  const parts = String(value).split(/[T ]/);
  const date = parts[0] || "";
  const time = parts[1] ? parts[1].slice(0, 5) : "";
  return { date, time };
};

const joinDateTime = (date: string, time: string) => {
  if (!date || !time) return "";
  return `${date}T${time}`;
};

const isValidDateTimeValue = (date: string, time: string) => {
  if (!date || !time) return false;
  // still use Date for validity check only
  const d = new Date(`${date}T${time}`);
  return !isNaN(d.getTime());
};

const isValidHttpUrl = (value: string) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const RenderForm = ({ open, onClose, item, setItem, execute, reLoad }: any) => {
  const { showToast } = useAuth();
  const [level, setLevel] = useState(1);
  const [errors, setErrors] = useState<any>({});

  // P.1: Calcula la duración en horas y minutos a partir de start_time y end_time
  const calcDuration = (
    start: string,
    end: string,
  ): { hours: string; minutes: string } => {
    if (!start || !end) return { hours: "", minutes: "" };
    const [sh, sm] = start.split(":").map(Number);
    let [eh, em] = end.split(":").map(Number);
    let totalMinutes = eh * 60 + em - (sh * 60 + sm);
    if (totalMinutes <= 0) totalMinutes += 24 * 60; // cruzó medianoche
    return {
      hours: String(Math.floor(totalMinutes / 60)),
      minutes: String(totalMinutes % 60).padStart(2, "0"),
    };
  };

  const initialState = useMemo(() => {
    const start = splitDateTime(item?.start_time);
    const end = splitDateTime(item?.end_time);
    const dur = item?.id
      ? calcDuration(start.time, end.time)
      : { hours: "", minutes: "00" };

    return {
      id: item?.id,
      subject: item?.subject || "",
      description: item?.description || "",
      type: item?.type || "O", // O=Ordinaria por defecto
      start_date: start.date,
      start_time: start.time,
      // P.1: Duración en lugar de hora de fin directa
      duration_hours: dur.hours,
      duration_minutes: dur.minutes,
      modality: item?.modality || "P", // P=Presencial por defecto
      meeting_url: item?.meeting_url || "",
      address: item?.address || item?.physical_address || "",
      address_url: item?.address_url || "",
      files: normalizeUrls(item?.files),
      status: item?.status || "S", // S=Scheduled por defecto
      quorum_required: item?.quorum_required ?? 50,
      anonymous_voting: item?.anonymous_voting ?? false,
      target_audience: Array.isArray(item?.target_audience)
        ? item.target_audience
        : item?.target_audience
          ? String(item.target_audience).split(",")
          : TARGET_AUDIENCE_OPTIONS.map((o) => o.id),
    };
  }, [item]);

  const [formState, setFormState] = useState(initialState);

  useEffect(() => {
    setFormState(initialState);
    setErrors({});
    setLevel(1);
  }, [initialState, open]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  const toggleTargetAudience = (id: string) => {
    setFormState((prev: any) => {
      let current = prev.target_audience || [];
      const isSelecting = !current.includes(id);

      if (isSelecting) {
        current = [...current, id];
        // Jerarquía: Al seleccionar dependiente, se debe seleccionar al titular
        if (
          id === "dependent_of_homeowner" &&
          !current.includes("owner_homeowner")
        ) {
          current.push("owner_homeowner");
        }
        if (id === "dependent_of_tenant" && !current.includes("owner_tenant")) {
          current.push("owner_tenant");
        }
      } else {
        current = current.filter((item: string) => item !== id);
        // Jerarquía: Al deseleccionar titular, se deselecciona al dependiente
        if (id === "owner_homeowner") {
          current = current.filter(
            (item: string) => item !== "dependent_of_homeowner",
          );
        }
        if (id === "owner_tenant") {
          current = current.filter(
            (item: string) => item !== "dependent_of_tenant",
          );
        }
      }
      return { ...prev, target_audience: current };
    });
  };

  const validateStep1 = () => {
    let newErrors: any = {};
    newErrors = checkRules({
      value: formState.subject,
      rules: ["required"],
      key: "subject",
      errors: newErrors,
    });
    newErrors = checkRules({
      value: formState.description,
      rules: ["required"],
      key: "description",
      errors: newErrors,
    });
    newErrors = checkRules({
      value: formState.type,
      rules: ["required"],
      key: "type",
      errors: newErrors,
    });
    setErrors(newErrors);
    return newErrors;
  };

  const validateStep2 = () => {
    let newErrors: any = {};
    newErrors = checkRules({
      value: formState.start_date,
      rules: ["required"],
      key: "start_date",
      errors: newErrors,
    });
    newErrors = checkRules({
      value: formState.start_time,
      rules: ["required"],
      key: "start_time",
      errors: newErrors,
    });
    // La duración ya no es obligatoria
    newErrors = checkRules({
      value: formState.modality,
      rules: ["required"],
      key: "modality",
      errors: newErrors,
    });

    if (!isValidDateTimeValue(formState.start_date, formState.start_time)) {
      newErrors.start_time = "La fecha y hora de inicio no es válida";
    }

    // P.2: Validar que la fecha+hora completa no sea pasada
    if (formState.start_date && formState.start_time) {
      const startFull = new Date(
        `${formState.start_date}T${formState.start_time}`,
      );
      if (startFull < new Date()) {
        newErrors.start_time = "La fecha y hora de inicio no puede ser pasada";
      }
    }

    if (["V", "H"].includes(formState.modality)) {
      newErrors = checkRules({
        value: formState.meeting_url,
        rules: ["required"],
        key: "meeting_url",
        errors: newErrors,
      });

      if (formState.meeting_url && !isValidHttpUrl(formState.meeting_url)) {
        newErrors.meeting_url = "Debe ser un enlace válido (https://...)";
      }
    }

    if (["P", "H"].includes(formState.modality)) {
      newErrors = checkRules({
        value: formState.address,
        rules: ["required"],
        key: "address",
        errors: newErrors,
      });

      newErrors = checkRules({
        value: formState.address_url,
        rules: ["googleMapsLink"],
        key: "address_url",
        errors: newErrors,
      });
    }

    // P.21a: Validar que el quórum esté entre 0 y 100
    const quorum = Number(formState.quorum_required);
    if (isNaN(quorum) || quorum < 0 || quorum > 100) {
      newErrors.quorum_required = "El quórum debe ser entre 0 y 100";
    }

    // P.23: Validar duración máxima de 12 horas (720 min)
    if (
      formState.duration_hours ||
      (formState.duration_minutes && Number(formState.duration_minutes) > 0)
    ) {
      const totalDurationMins =
        Number(formState.duration_hours || 0) * 60 +
        Number(formState.duration_minutes || 0);

      if (totalDurationMins > 12 * 60) {
        newErrors.duration_hours = "La duración no puede exceder las 12 horas";
      }
      if (totalDurationMins <= 0) {
        newErrors.duration_hours = "La duración debe ser mayor a 0";
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  const buildFileObjects = (urls: string[], prefix: string) => {
    return (urls || []).map((url, index) => ({
      name: getFilenameFromUrl(url, `${prefix}_${index + 1}`),
      url,
    }));
  };

  const onNext = () => {
    if (level === 1) {
      if (hasErrors(validateStep1())) return;
      setLevel(2);
    } else if (level === 2) {
      if (hasErrors(validateStep2())) return;
      setLevel(3);
    }
  };

  const validateStep3 = () => {
    let newErrors: any = {};
    if (!formState.target_audience || formState.target_audience.length === 0) {
      newErrors.target_audience = "Debe seleccionar al menos una audiencia";
    }
    setErrors(newErrors);
    return newErrors;
  };

  const onSave = async () => {
    if (hasErrors(validateStep1())) {
      setLevel(1);
      return;
    }
    if (hasErrors(validateStep2())) {
      setLevel(2);
      return;
    }
    if (hasErrors(validateStep3())) {
      setLevel(3);
      return;
    }

    // P.1: Calcular end_time a partir de start_time + duración
    const calcEndTimeFromDuration = () => {
      if (!formState.start_date || !formState.start_time) return "";
      const [sh, sm] = formState.start_time.split(":").map(Number);
      const durationMins =
        Number(formState.duration_hours || 0) * 60 +
        Number(formState.duration_minutes || 0);

      if (durationMins === 0) return "";

      const endTotalMins = sh * 60 + sm + durationMins;
      const endDay =
        endTotalMins >= 24 * 60
          ? new Date(
              new Date(`${formState.start_date}T00:00:00`).getTime() +
                24 * 60 * 60 * 1000,
            )
              .toISOString()
              .split("T")[0]
          : formState.start_date;
      const h = Math.floor((endTotalMins % (24 * 60)) / 60);
      const m = endTotalMins % 60;
      return `${endDay}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const payload = {
      subject: formState.subject,
      description: formState.description,
      type: formState.type,
      start_time: joinDateTime(formState.start_date, formState.start_time),
      end_time: calcEndTimeFromDuration(),
      modality: formState.modality,
      files: buildFileObjects(formState.files, "documento_asamblea"),
      status: formState.status || "Scheduled",
      ...(formState.modality !== "P"
        ? { meeting_url: formState.meeting_url }
        : {}),
      ...(formState.modality !== "V"
        ? {
            address: formState.address,
            address_url: formState.address_url,
          }
        : {}),
      quorum_required: formState.quorum_required,
      target_audience: Array.isArray(formState.target_audience)
        ? formState.target_audience.join(",")
        : formState.target_audience,
      anonymous_voting: formState.anonymous_voting,
    };

    const method = formState.id ? "PUT" : "POST";
    const endpoint = `/assemblies${formState.id ? `/${formState.id}` : ""}`;

    const { data } = await execute(endpoint, method, payload);

    if (data?.success === true || (data && !data?.error)) {
      showToast(data?.message || "Asamblea guardada con éxito", "success");
      if (setItem) setItem(formState);
      reLoad();
      onClose();
      setLevel(1);
      return;
    }

    showToast(data?.message || "No se pudo guardar la asamblea", "error");
  };

  const closeModal = () => {
    setLevel(1);
    onClose();
  };

  const footerButtons =
    level < 3 ? (
      <>
        <Button
          variant="secondary"
          onClick={level === 1 ? closeModal : () => setLevel(level - 1)}
          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
        >
          Anterior
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
        >
          Siguiente
        </Button>
      </>
    ) : (
      <>
        <Button
          variant="secondary"
          onClick={() => setLevel(2)}
          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
        >
          Anterior
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
        >
          {formState.id ? "Guardar cambios" : "Crear asamblea"}
        </Button>
      </>
    );

  return (
    <DataModal
      title={formState.id ? "Editar asamblea" : "Crear asamblea"}
      open={open}
      onClose={closeModal}
      buttonText=""
      buttonCancel=""
      buttonExtra={footerButtons}
      className={styles.renderForm}
      onSave={onSave}
      maxWidth={760}
    >
      <section className={styles.stepperHeader}>
        <div className={styles.stepperTrack}>
          <div className={styles.stepperLine} />
          <div className={`${styles.stepperStep} ${styles.active}`}>
            <div className={styles.stepperCircle}>1</div>
            <p>Información</p>
          </div>
          <div
            className={`${styles.stepperStep} ${level >= 2 ? styles.active : ""}`}
          >
            <div className={styles.stepperCircle}>2</div>
            <p>Programación</p>
          </div>
          <div
            className={`${styles.stepperStep} ${level >= 3 ? styles.active : ""}`}
          >
            <div className={styles.stepperCircle}>3</div>
            <p>Configuración</p>
          </div>
        </div>
      </section>

      {level === 1 && (
        <>
          <section className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              ¿Qué asamblea deseas convocar?
            </h3>
            <p className={styles.sectionSubtitle}>
              Define la información básica para identificar esta asamblea.
            </p>
            <Select
              name="type"
              label="Tipo de asamblea"
              value={formState.type}
              options={TYPE_OPTIONS}
              onChange={handleChange}
              error={errors}
              required
            />
            <Input
              name="subject"
              label="Título o asunto"
              value={formState.subject}
              onChange={handleChange}
              error={errors}
              required
            />

            <TextArea
              name="description"
              label="Descripción o motivo"
              value={formState.description}
              onChange={handleChange}
              error={errors}
              required
              isLimit
              maxLength={255}
            />
          </section>
          <section className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              ¿Deseas adjuntar documentos para los residentes?
            </h3>
            <p className={styles.sectionSubtitle}>
              Agrega archivos que los residentes puedan revisar antes de la
              asamblea.
            </p>
            {open && (
              <UploadFileV3
                formState={formState}
                setFormState={setFormState}
                name="files"
                mode="all"
                error={errors}
                maxMB={5}
              />
            )}
          </section>
        </>
      )}

      {level === 2 && (
        <section className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            ¿Cuándo se realizará la asamblea?
          </h3>
          <p className={styles.sectionSubtitle}>
            Selecciona la fecha y horario en que se llevará a cabo la reunión.
          </p>

          <Input
            type="date"
            name="start_date"
            label="Fecha de la asamblea"
            value={formState.start_date}
            onChange={handleChange}
            error={errors}
            required
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              type="time"
              name="start_time"
              label="Hora de inicio"
              value={formState.start_time}
              onChange={handleChange}
              error={errors}
              required
            />

            {/* P.1: Duración en lugar de hora de fin — permite cruzar medianoche */}
            <div>
              {/* <label style={{ fontSize: 13, color: "var(--cWhiteV2)", display: "block", marginBottom: 6 }}>
                Duración de la asamblea <span style={{ color: "var(--cError)" }}>*</span>
              </label> */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <Input
                  type="number"
                  name="duration_hours"
                  label="Duración en Horas"
                  value={formState.duration_hours}
                  onChange={handleChange}
                  error={errors}
                  min={0}
                  max={23}
                />
                <Input
                  type="number"
                  name="duration_minutes"
                  label="Minutos"
                  value={formState.duration_minutes}
                  onChange={handleChange}
                  error={errors}
                  min={0}
                  max={59}
                />
              </div>
              {formState.start_time &&
                (formState.duration_hours || formState.duration_minutes) && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--cWhiteV2)",
                      marginTop: 4,
                    }}
                  >
                    ⏱ Finalizaría aprox. a las{" "}
                    {(() => {
                      const [sh, sm] = formState.start_time
                        .split(":")
                        .map(Number);
                      const total =
                        sh * 60 +
                        sm +
                        Number(formState.duration_hours || 0) * 60 +
                        Number(formState.duration_minutes || 0);
                      const h = Math.floor((total % (24 * 60)) / 60);
                      const m = total % 60;
                      const nextDay = total >= 24 * 60;
                      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}${nextDay ? " (día siguiente)" : ""}`;
                    })()}
                  </p>
                )}
            </div>
          </div>

          <h3 className={styles.sectionTitle}>
            ¿Cómo se realizará la asamblea?
          </h3>
          <p className={styles.sectionSubtitle}>
            Indica si la reunión será presencial, virtual o híbrida.
          </p>

          <div className={styles.modalityGrid}>
            {MODALITY_OPTIONS.map((option) => {
              const selected = formState.modality === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.modalityBtn} ${selected ? styles.modalityBtnActive : ""}`}
                  onClick={() =>
                    setFormState((prev: any) => ({
                      ...prev,
                      modality: option.id,
                    }))
                  }
                >
                  {option.name}
                </button>
              );
            })}
          </div>

          <h3 className={styles.sectionTitle}>
            ¿Dónde podrán participar los residentes?
          </h3>
          <p className={styles.sectionSubtitle}>
            Completa la ubicación física o el enlace de acceso según la
            modalidad.
          </p>

          {["V", "H"].includes(formState.modality) && (
            <Input
              type="text"
              name="meeting_url"
              label="Enlace de reunión (Meet, Zoom, Teams, etc.)"
              value={formState.meeting_url}
              onChange={handleChange}
              error={errors}
              required
            />
          )}

          {["P", "H"].includes(formState.modality) && (
            <Input
              type="text"
              name="address"
              label="Dirección física"
              value={formState.address}
              onChange={handleChange}
              error={errors}
              required
            />
          )}

          {["P", "H"].includes(formState.modality) && (
            <Input
              type="text"
              name="address_url"
              label="URL de ubicación (Google Maps)"
              value={formState.address_url}
              onChange={handleChange}
              error={errors}
            />
          )}
        </section>
      )}

      {level === 3 && (
        <section className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Configuración de la asamblea</h3>
          <p className={styles.sectionSubtitle}>
            Define quiénes pueden participar y el quórum necesario.
          </p>

          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 14,
                color: "var(--cWhiteV1)",
                marginBottom: 12,
              }}
            >
              Audiencia objetivo (puedes marcar varias):
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              {TARGET_AUDIENCE_OPTIONS.map((option) => (
                <Check
                  key={option.id}
                  name={`target_${option.id}`}
                  label={option.name}
                  value={option.id}
                  reverse={true}
                  checked={formState.target_audience?.includes(option.id)}
                  onChange={() => toggleTargetAudience(option.id)}
                />
              ))}
            </div>
            {errors.target_audience && (
              <p style={{ color: "var(--cError)", fontSize: 12, marginTop: 8 }}>
                {errors.target_audience}
              </p>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Input
              type="number"
              name="quorum_required"
              label="Quórum mínimo (%)"
              value={formState.quorum_required}
              onChange={handleChange}
              error={errors}
              min={0}
              max={100}
              required
            />
          </div>
        </section>
      )}
    </DataModal>
  );
};

export default RenderForm;
