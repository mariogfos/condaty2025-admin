"use client";

import React, { useEffect, useMemo, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Select from "@/mk/components/forms/Select/Select";
import Button from "@/mk/components/forms/Button/Button";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./RenderForm.module.css";

const TYPE_OPTIONS = [
  { id: "O", name: "Ordinaria" },
  { id: "E", name: "Extraordinaria" },
  { id: "I", name: "Informativa" },
];

const MODALITY_OPTIONS = [
  { id: "V", name: "Virtual" },
  { id: "P", name: "Presencial" },
  { id: "H", name: "Híbrida" },
];

const TARGET_AUDIENCE_OPTIONS = [
  { id: "all_owners", name: "Todos los propietarios" },
  { id: "residents", name: "Solo residentes" },
  { id: "dependents", name: "Solo dependientes" },
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

  const initialState = useMemo(() => {
    const start = splitDateTime(item?.start_time);
    const end = splitDateTime(item?.end_time);

    return {
      id: item?.id,
      subject: item?.subject || "",
      description: item?.description || "",
      type: item?.type || "O", // O=Ordinaria por defecto
      start_date: start.date,
      start_time: start.time,
      end_time: end.time,
      modality: item?.modality || "V", // V=Virtual por defecto
      meeting_url: item?.meeting_url || "",
      address: item?.address || item?.physical_address || "",
      address_url: item?.address_url || "",
      files: normalizeUrls(item?.files),
      status: item?.status || "S", // S=Scheduled por defecto
      quorum_required: item?.quorum_required ?? 50,
      anonymous_voting: item?.anonymous_voting ?? false,
      target_audience: item?.target_audience || "all_owners",
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
    newErrors = checkRules({ value: formState.start_date, rules: ["required"], key: "start_date", errors: newErrors });
    newErrors = checkRules({ value: formState.start_time, rules: ["required"], key: "start_time", errors: newErrors });
    newErrors = checkRules({ value: formState.end_time, rules: ["required"], key: "end_time", errors: newErrors });
    newErrors = checkRules({ value: formState.modality, rules: ["required"], key: "modality", errors: newErrors });

    if (!isValidDateTimeValue(formState.start_date, formState.start_time)) {
      newErrors.start_time = "La fecha y hora de inicio no es válida";
    }

    if (!isValidDateTimeValue(formState.start_date, formState.end_time)) {
      newErrors.end_time = "La fecha y hora de finalización no es válida";
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

    if (formState.start_time && formState.end_time && formState.start_time >= formState.end_time) {
      newErrors.end_time = "La finalización debe ser posterior al inicio";
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
    if (hasErrors(validateStep1())) return;
    setLevel(2);
  };

  const onSave = async () => {
    if (hasErrors(validateStep2())) return;

    const payload = {
      subject: formState.subject,
      description: formState.description,
      type: formState.type,
      start_time: joinDateTime(formState.start_date, formState.start_time),
      end_time: joinDateTime(formState.start_date, formState.end_time),
      modality: formState.modality,
      files: buildFileObjects(formState.files, "documento_asamblea"),
      status: formState.status || "Scheduled",
      ...(formState.modality !== "P" ? { meeting_url: formState.meeting_url } : {}),
      ...(formState.modality !== "V"
        ? {
            address: formState.address,
            address_url: formState.address_url,
          }
        : {}),
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
    level === 1 ? (
      <>
        <Button variant="secondary" onClick={closeModal} style={{ height: 44, fontSize: 15, fontWeight: 600 }}>
          Anterior
        </Button>
        <Button variant="primary" onClick={onNext} style={{ height: 44, fontSize: 15, fontWeight: 600 }}>
          Siguiente
        </Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={() => setLevel(1)} style={{ height: 44, fontSize: 15, fontWeight: 600 }}>
          Anterior
        </Button>
        <Button variant="primary" onClick={onSave} style={{ height: 44, fontSize: 15, fontWeight: 600 }}>
          Crear asamblea
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
          <div className={`${styles.stepperStep} ${level === 2 ? styles.active : ""}`}>
            <div className={styles.stepperCircle}>2</div>
            <p>Programación</p>
          </div>
        </div>
      </section>

      {level === 1 && (
        <>
          <section className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>¿Qué asamblea deseas convocar?</h3>
            <p className={styles.sectionSubtitle}>
              Define la información básica para identificar esta asamblea.
            </p>

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

            <Select
              name="type"
              label="Tipo de asamblea"
              value={formState.type}
              options={TYPE_OPTIONS}
              onChange={handleChange}
              error={errors}
              required
            />
          </section>

          <section className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>¿Deseas adjuntar documentos para los residentes?</h3>
            <p className={styles.sectionSubtitle}>
              Agrega archivos que los residentes puedan revisar antes de la asamblea.
            </p>
            <UploadFileV3
              formState={formState}
              setFormState={setFormState}
              name="files"
              mode="all"
              error={errors}
              maxMB={5}
            />
          </section>

        </>
      )}

      {level === 2 && (
        <section className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>¿Cuándo se realizará la asamblea?</h3>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Input
              type="time"
              name="start_time"
              label="Hora de inicio"
              value={formState.start_time}
              onChange={handleChange}
              error={errors}
              required
            />

            <Input
              type="time"
              name="end_time"
              label="Hora de finalización"
              value={formState.end_time}
              onChange={handleChange}
              error={errors}
              required
            />
          </div>

          <h3 className={styles.sectionTitle}>¿Cómo se realizará la asamblea?</h3>
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

          <h3 className={styles.sectionTitle}>¿Dónde podrán participar los residentes?</h3>
          <p className={styles.sectionSubtitle}>
            Completa la ubicación física o el enlace de acceso según la modalidad.
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
    </DataModal>
  );
};

export default RenderForm;
