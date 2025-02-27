import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useEffect, useState } from "react";
import styles from "./SurveyMultipleChoice.module.css";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import { IconCheckOff, IconX } from "@/components/layout/icons/IconsBiblioteca";
import TextArea from "@/mk/components/forms/TextArea/TextArea";

const SurveyMultipleChoice = ({
  formState,
  setFormState,
  setType,
  editingQuestion,
  editingIndex,
}: any) => {
  const [formStateMultipleChoice, setFormStateMultipleChoice]: any = useState(
    editingQuestion
      ? { ...editingQuestion }
      : {
          options: [
            { id: -1, name: "" },
            { id: -2, name: "" },
          ],
          type: "S",
          order:
            editingIndex !== undefined
              ? editingIndex
              : formState?.questions?.length,
        }
  );

  const handleChange = (e: any) => {
    let value = e.target.value;
    if (e.target.name === "min" || e.target.name === "max") {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        value = "";
      } else {
        if (numValue < 0) {
          value = 0;
        }
      }
    }
    if (e.target.name.includes("options")) {
      const index = e.target.name.split(".")[1];
      const opt: any = [...formStateMultipleChoice.options];
      opt[index].name = value;
      setFormStateMultipleChoice({ ...formStateMultipleChoice, options: opt });
      return;
    }

    setFormStateMultipleChoice({
      ...formStateMultipleChoice,
      [e.target.name]: value,
    });
  };

  const [errors, setErrors]: any = useState({});
  const validate = (field: any = "") => {
    let errors: any = {};

    errors = checkRules({
      value: formStateMultipleChoice.name,
      rules: ["required"],
      key: "name",
      errors,
    });

    errors = checkRules({
      value: formStateMultipleChoice.options,
      rules: ["optionSurvey"],
      key: "options",
      errors,
      data: formStateMultipleChoice,
    });

    errors = checkRules({
      value: formStateMultipleChoice.min,
      rules: ["required", "minMax:max"],
      key: "min",
      errors,
      data: formStateMultipleChoice,
    });
    errors = checkRules({
      value: formStateMultipleChoice.max,
      rules: ["required"],
      key: "max",
      errors,
    });

    setErrors(errors);
    return errors;
  };

  const _onSave = () => {
    if (hasErrors(validate())) return;

    const updatedQuestion = {
      ...formStateMultipleChoice,
      order:
        editingIndex !== undefined
          ? editingIndex
          : formState?.questions?.length, // Define el orden basado en el índice
    };

    if (editingIndex !== undefined && editingIndex !== null) {
      // Actualizar pregunta existente
      setFormState((prevFormState: any) => {
        const updatedQuestions = [...prevFormState.questions];
        updatedQuestions[editingIndex] = updatedQuestion;
        return {
          ...prevFormState,
          questions: updatedQuestions,
        };
      });
    } else {
      // Agregar nueva pregunta
      setFormState((prevFormState: any) => ({
        ...prevFormState,
        questions: [...(prevFormState.questions || []), updatedQuestion],
      }));
    }
    setType("");
  };

  const onDelOption = (index: number) => {
    const opt: any = [...formStateMultipleChoice.options];
    opt.splice(index, 1);
    setFormStateMultipleChoice({ ...formStateMultipleChoice, options: opt });
  };

  return (
    <DataModal
      open={true}
      style={{ width: editingQuestion ? "100%" : "" }}
      onClose={() => setType("")}
      onSave={_onSave}
    >
      <div className={styles.surveyMultipleChoice}>
        <p>Escuchamos tus necesidades</p>
        <p>Encuesta para mejorar la forma de vida en nuestro país</p>
        <p>• Opción múltiple</p>
        <section>
          <div>
            <div>
              <p>Pregunta</p>
              <Input
                type="text"
                value={formStateMultipleChoice.name}
                onChange={handleChange}
                name="name"
                label="Escribe tu pregunta aquí"
                error={errors}
              />
            </div>
            <div>
              <p>Descripción (Opcional)</p>
              <TextArea
                value={formStateMultipleChoice.description}
                onChange={handleChange}
                name="description"
                label="Escribe una descripción"
                error={errors}
                isLimit={true}
                maxLength={255}
              />
            </div>
            <div>
              <p>Opciones</p>
              {errors?.options && (
                <span style={{ color: "var(--cError)", fontSize: "10px" }}>
                  {errors.options}
                </span>
              )}
              {formStateMultipleChoice?.options?.map((o: any, i: number) => (
                <div key={i} className={styles.option}>
                  <Input
                    type="text"
                    name={"options." + i}
                    value={o.name || ""}
                    onChange={handleChange}
                    label={"Opción " + (i + 1)}
                    error={errors}
                    iconLeft={<IconCheckOff color="var(--cBlackV2)" />}
                    iconRight={
                      i >= formStateMultipleChoice.min && (
                        <IconX
                          color="var(--cBlackV2)"
                          onClick={() => {
                            onDelOption(i);
                          }}
                        />
                      )
                    }
                  />
                </div>
              ))}
              <Button
                variant="terciary"
                style={{ justifyContent: "flex-start", paddingLeft: 0 }}
                small
                onClick={() => {
                  const opt: any = [
                    ...formStateMultipleChoice.options,
                    {
                      id: (formStateMultipleChoice.options.length + 1) * -1,
                      name: "",
                    },
                  ];
                  setFormStateMultipleChoice({
                    ...formStateMultipleChoice,
                    options: opt,
                  });
                }}
              >
                + Añadir opción
              </Button>
            </div>
          </div>
          <div>
            <div>
              <p>Configuraciones</p>
              <p>Cantidad de respuestas permitida</p>
              <div>
                <Input
                  type="number"
                  value={formStateMultipleChoice.min}
                  onChange={handleChange}
                  name="min"
                  label="Mínimo"
                  error={errors}
                />
                <Input
                  type="number"
                  value={formStateMultipleChoice.max}
                  onChange={handleChange}
                  name="max"
                  label="Máximo"
                  error={errors}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </DataModal>
  );
};

export default SurveyMultipleChoice;
