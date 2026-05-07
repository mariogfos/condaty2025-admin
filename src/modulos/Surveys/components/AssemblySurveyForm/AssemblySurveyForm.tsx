import React, { useState, useEffect } from "react";
import styles from "./AssemblySurveyForm.module.css";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Button from "@/mk/components/forms/Button/Button";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import {
  IconTrash,
  IconAdd,
  IconArrowLeft,
} from "@/components/layout/icons/IconsBiblioteca";
import { useAuth } from "@/mk/contexts/AuthProvider";

const ROLES_OPTIONS = [
  { id: "owner_homeowner", name: "Propietarios (dueños)" },
  { id: "owner_homeowner_resident", name: "Propietarios residentes" },
  { id: "owner_homeowner_non_resident", name: "Propietarios no residentes" },
  { id: "owner_titular", name: "Inquilinos" },
  { id: "resident", name: "Todos los residentes" },
  { id: "owner_dependiente", name: "Dependientes" },
  { id: "dependent_of_homeowner", name: "Dependientes de propietarios" },
  { id: "dependent_of_tenant", name: "Dependientes de inquilinos" },
];

interface AssemblySurveyFormProps {
  open: boolean;
  onClose: () => void;
  assemblyId: string | number;
  execute: any;
  onSuccess?: () => void;
  editItem?: any;
  action?: "add" | "edit";
}

const AssemblySurveyForm: React.FC<AssemblySurveyFormProps> = ({
  open,
  onClose,
  assemblyId,
  execute,
  onSuccess,
  editItem,
  action = "add",
}) => {
  const { showToast } = useAuth();
  const [level, setLevel] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [formState, setFormState] = useState({
    title: "",
    target_criteria: {
      roles: {} as Record<string, any>,
      vote_per_unit: true,
      only_current: false,
      only_arrears: false,
    },
    question: "",
    options: ["", ""],
    is_weighted: false,
    weighted_by_area: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setLevel(1);
      if (action === "edit" && editItem) {
        const question = editItem.squestions?.[0];
        setFormState({
          title: editItem.title || "",
          target_criteria: {
            roles: editItem.target_criteria?.roles || {},
            vote_per_unit: editItem.target_criteria?.vote_per_unit ?? true,
            only_current: editItem.target_criteria?.only_current ?? false,
            only_arrears: editItem.target_criteria?.only_arrears ?? false,
          },
          question: question?.question_text || "",
          options: question?.soptions?.map((opt: any) => opt.option_text) || [
            "",
            "",
          ],
          is_weighted: editItem.is_weighted ?? false,
          weighted_by_area: editItem.weighted_by_area ?? false,
        });
      } else {
        setFormState({
          title: "",
          target_criteria: {
            roles: {},
            vote_per_unit: true,
            only_current: false,
            only_arrears: false,
          },
          question: "",
          options: ["", ""],
          is_weighted: false,
          weighted_by_area: false,
        });
      }
      setErrors({});
    }
  }, [open, action, editItem]);

  const handleRolesChange = (e: any) => {
    const selected = e.target.value as string[];
    const newRoles: Record<string, string> = {};
    ROLES_OPTIONS.forEach((r) => {
      newRoles[r.id] = selected.includes(r.id) ? "1" : "0";
    });
    setFormState({
      ...formState,
      target_criteria: { ...formState.target_criteria, roles: newRoles },
    });
  };

  const rolesToArray = (roles: Record<string, any>) => {
    return Object.entries(roles || {})
      .filter(([, v]) => v === "1" || v === 1 || v === true)
      .map(([k]) => k);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const rolesArr = rolesToArray(formState.target_criteria.roles);
    if (rolesArr.length === 0) {
      newErrors.roles = "Selecciona al menos un grupo";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.question.trim()) {
      newErrors.question = "La pregunta es requerida";
    }
    const validOptions = formState.options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      newErrors.options = "Se requieren al menos 2 opciones";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setLevel(2);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formState.options];
    newOptions[index] = value;
    setFormState({ ...formState, options: newOptions });
  };

  const addOption = () => {
    setFormState({ ...formState, options: [...formState.options, ""] });
  };

  const removeOption = (index: number) => {
    if (formState.options.length <= 2) return;
    const newOptions = formState.options.filter((_, i) => i !== index);
    setFormState({ ...formState, options: newOptions });
  };

  const handleSave = async () => {
    if (!validateStep2()) return;

    setIsSaving(true);
    try {
      // 1. Create or Update Survey
      const payload = {
        title: formState.question.substring(0, 50), // API Title
        type: "assembly",
        target_criteria: formState.target_criteria,
        is_weighted: formState.is_weighted,
        weighted_by_area: formState.weighted_by_area,
        squestions: [
          {
            id: action === "edit" ? editItem.squestions?.[0]?.id : undefined,
            question_text: formState.question,
            type: "S", // Single choice
            order: 1,
            is_mandatory: true,
            soptions: formState.options
              .filter((opt) => opt.trim() !== "")
              .map((opt, idx) => ({
                id:
                  action === "edit"
                    ? editItem.squestions?.[0]?.soptions?.[idx]?.id
                    : undefined,
                option_text: opt,
                order: idx + 1,
              })),
          },
        ],
      };

      const url = action === "edit" ? `/surveys/${editItem.id}` : "/surveys";
      const method = action === "edit" ? "PUT" : "POST";

      const { data } = await execute(url, method, payload);

      if (data?.success || (data && !data.error)) {
        const surveyId = data?.data?.id || data?.id || editItem?.id;

        // 2. Attach to Assembly (only if adding)
        if (action === "add") {
          const attachRes = await execute(
            `/assemblies/${assemblyId}/surveys`,
            "POST",
            {
              survey_id: surveyId,
            },
          );

          if (
            attachRes.data?.success ||
            (attachRes.data && !attachRes.data.error)
          ) {
            showToast("Votación creada con éxito", "success");
            onSuccess?.();
            onClose();
          } else {
            showToast("Error al asociar la votación", "error");
          }
        } else {
          showToast("Votación actualizada con éxito", "success");
          onSuccess?.();
          onClose();
        }
      } else {
        showToast("Error al procesar la votación", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Ocurrió un error inesperado", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={action === "edit" ? "Editar pregunta" : "Crear pregunta"}
      buttonText=""
      buttonCancel=""
      maxWidth={520}
    >
      <div className={styles.container}>
        {level === 1 && (
          <div className={styles.step}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                ¿Quiénes recibirán esta pregunta?
              </label>
              <p className={styles.subtext}>
                Selecciona qué grupos de usuarios podrán verla y responderla.
              </p>
              <Select
                name="roles"
                options={ROLES_OPTIONS}
                value={rolesToArray(formState.target_criteria.roles)}
                onChange={handleRolesChange}
                optionValue="id"
                optionLabel="name"
                multiSelect
                placeholder="Selecciona uno o más grupos"
              />
              {errors.roles && (
                <p className={styles.errorText}>{errors.roles}</p>
              )}
            </div>

            {/* <div className={styles.fieldGroup}>
                <label className={styles.label}>¿La respuesta será por unidad o por persona?</label>
                <p className={styles.subtext}>Residentes</p>
                <div className={styles.radioGrid}>
                    <div 
                        className={`${styles.radioCard} ${formState.target_criteria.vote_per_unit ? styles.active : ""}`}
                        onClick={() => setFormState({...formState, target_criteria: {...formState.target_criteria, vote_per_unit: true}})}
                    >
                        <div className={styles.radioCircle} />
                        <span>Un voto por unidad</span>
                    </div>
                    <div 
                        className={`${styles.radioCard} ${!formState.target_criteria.vote_per_unit ? styles.active : ""}`}
                        onClick={() => setFormState({...formState, target_criteria: {...formState.target_criteria, vote_per_unit: false}})}
                    >
                        <div className={styles.radioCircle} />
                        <span>Un voto por persona</span>
                    </div>
                </div>
            </div> */}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Ponderación del voto</label>
              <p className={styles.subtext}>
                Elige cómo se calculará el peso de cada voto.
              </p>
              <div className={styles.optionList}>
                {[
                  {
                    id: "unit",
                    label: "Por Unidad (1 voto = 1 unidad)",
                    weighted: false,
                    area: false,
                  },
                  {
                    id: "area",
                    label: "Por M2 (Ponderado por superficie)",
                    weighted: true,
                    area: true,
                  },
                ].map((opt) => {
                  const isActive =
                    formState.is_weighted === opt.weighted &&
                    formState.weighted_by_area === opt.area;
                  return (
                    <div
                      key={opt.id}
                      className={`${styles.optionItem} ${isActive ? styles.active : ""}`}
                      onClick={() =>
                        setFormState({
                          ...formState,
                          is_weighted: opt.weighted,
                          weighted_by_area: opt.area,
                        })
                      }
                    >
                      <div className={styles.radioCircle} />
                      <span>{opt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                ¿Qué unidades podrán participar?
              </label>
              <p className={styles.subtext}>
                Elige si todas las unidades podrán responder o solo algunas
                según su estado de pago.
              </p>
              <div className={styles.optionList}>
                {[
                  {
                    id: "all",
                    label: "Todas las unidades",
                    cr: { only_current: false, only_arrears: false },
                  },
                  {
                    id: "current",
                    label: "Solo unidades al día",
                    cr: { only_current: true, only_arrears: false },
                  },
                  {
                    id: "arrears",
                    label: "Solo unidades con mora",
                    cr: { only_current: false, only_arrears: true },
                  },
                ].map((opt) => {
                  const isActive =
                    formState.target_criteria.only_current ===
                      opt.cr.only_current &&
                    formState.target_criteria.only_arrears ===
                      opt.cr.only_arrears;
                  return (
                    <div
                      key={opt.id}
                      className={`${styles.optionItem} ${isActive ? styles.active : ""}`}
                      onClick={() =>
                        setFormState({
                          ...formState,
                          target_criteria: {
                            ...formState.target_criteria,
                            ...opt.cr,
                          },
                        })
                      }
                    >
                      <div className={styles.radioCircle} />
                      <span>{opt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.footer}>
              <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                style={{ flex: 1 }}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {level === 2 && (
          <div className={styles.step}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>¿Cuál será la pregunta?</label>
              <p className={styles.subtext}>
                Escribe la pregunta que verán los participantes.
              </p>
              <TextArea
                name="question"
                value={formState.question}
                onChange={(e: any) =>
                  setFormState({ ...formState, question: e.target.value })
                }
                placeholder="¿Aumentamos el monto de las expensas un 15%?"
                className={styles.questionInput}
              />
              {errors.question && (
                <p className={styles.errorText}>{errors.question}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                ¿Qué opciones podrán elegir?
              </label>
              <p className={styles.subtext}>
                Agrega las opciones que los participantes podrán seleccionar.
              </p>
              <div className={styles.optionInputs}>
                {formState.options.map((option, idx) => (
                  <div key={idx} className={styles.optionRow}>
                    <div style={{ flex: 1 }}>
                      <Input
                        name={`option_${idx}`}
                        type="text"
                        value={option}
                        onChange={(e: any) =>
                          handleOptionChange(idx, e.target.value)
                        }
                        placeholder="Ingresa una opción..."
                        className={styles.optionInput}
                      />
                    </div>
                    {formState.options.length > 2 && (
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeOption(idx)}
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {errors.options && (
                  <p className={styles.errorText}>{errors.options}</p>
                )}
                <button className={styles.addBtn} onClick={addOption}>
                  <IconAdd size={16} /> Añadir opción
                </button>
              </div>
            </div>

            <div className={styles.footer}>
              <Button
                variant="secondary"
                onClick={() => setLevel(1)}
                style={{ flex: 1 }}
              >
                Anterior
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                style={{ flex: 1 }}
              >
                {isSaving
                  ? "Guardando..."
                  : action === "edit"
                    ? "Actualizar pregunta"
                    : "Crear pregunta"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DataModal>
  );
};

export default AssemblySurveyForm;
