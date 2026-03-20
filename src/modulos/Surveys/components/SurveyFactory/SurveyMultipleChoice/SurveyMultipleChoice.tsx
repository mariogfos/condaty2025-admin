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
          soptions: [
            { id: -1, option_text: "" },
            { id: -2, option_text: "" },
          ],
          type: "M",
          order:
            editingIndex !== undefined
              ? editingIndex
              : formState?.squestions?.length,
        }
  );

  const handleChange = (e: any) => {
    let value = e.target.value;
    if (e.target.name === "min_options" || e.target.name === "max_options") {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        value = "";
      } else {
        if (numValue < 0) {
          value = 0;
        }
      }
    }
    if (e.target.name.includes("soptions")) {
      const index = parseInt(e.target.name.split(".")[1]);
      const opt = formStateMultipleChoice.soptions.map((o: any, i: number) =>
        i === index ? { ...o, option_text: value } : o
      );
      setFormStateMultipleChoice({ ...formStateMultipleChoice, soptions: opt });
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
      value: formStateMultipleChoice.question_text,
      rules: ["required"],
      key: "question_text",
      errors,
    });

    errors = checkRules({
      value: formStateMultipleChoice.soptions,
      rules: ["optionSurvey"],
      key: "soptions",
      errors,
      data: formStateMultipleChoice,
    });

    errors = checkRules({
      value: formStateMultipleChoice.min_options,
      rules: ["required", "lessOrEqual:max_options,Máximo"],
      key: "min_options",
      errors,
      data: formStateMultipleChoice,
    });
    errors = checkRules({
      value: formStateMultipleChoice.max_options,
      rules: ["required"],
      key: "max_options",
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
          : formState?.squestions?.length, // Define el orden basado en el índice
    };

    if (editingIndex !== undefined && editingIndex !== null) {
      // Actualizar pregunta existente
      setFormState((prevFormState: any) => {
        const updatedQuestions = [...prevFormState.squestions];
        updatedQuestions[editingIndex] = updatedQuestion;
        return {
          ...prevFormState,
          squestions: updatedQuestions,
        };
      });
    } else {
      // Agregar nueva pregunta
      setFormState((prevFormState: any) => ({
        ...prevFormState,
        squestions: [...(prevFormState.squestions || []), updatedQuestion],
      }));
    }
    setType("");
  };

  const onDelOption = (index: number) => {
    const opt = formStateMultipleChoice.soptions.filter((_: any, i: number) => i !== index);
    setFormStateMultipleChoice({ ...formStateMultipleChoice, soptions: opt });
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
                value={formStateMultipleChoice.question_text}
                onChange={handleChange}
                name="question_text"
                label="Escribe tu pregunta aquí"
                error={errors}
              />
            </div>
            <div>
              <p>Descripción</p>
              <TextArea
                value={formStateMultipleChoice.description}
                onChange={handleChange}
                name="description"
                required={false}
                label="Escribe una descripción"
                error={errors}
                isLimit={true}
                maxLength={255}
              />
            </div>
            <div>
              <p>Opciones</p>
              {errors?.soptions && (
                <span style={{ color: "var(--cError)", fontSize: "10px" }}>
                  {errors.soptions}
                </span>
              )}
              {formStateMultipleChoice?.soptions?.map((o: any, i: number) => (
                <div key={i} className={styles.option}>
                  <Input
                    type="text"
                    name={"soptions." + i}
                    value={o.option_text || ""}
                    onChange={handleChange}
                    label={"Opción " + (i + 1)}
                    error={errors}
                    iconLeft={<IconCheckOff color="var(--cBlackV2)" />}
                    iconRight={
                      i >= formStateMultipleChoice.min_options && (
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
                    ...formStateMultipleChoice.soptions,
                    {
                      id: (formStateMultipleChoice.soptions.length + 1) * -1,
                      option_text: "",
                    },
                  ];
                  setFormStateMultipleChoice({
                    ...formStateMultipleChoice,
                    soptions: opt,
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
                  value={formStateMultipleChoice.min_options}
                  onChange={handleChange}
                  name="min_options"
                  label="Mínimo"
                  error={errors}
                />
                <Input
                  type="number"
                  value={formStateMultipleChoice.max_options}
                  onChange={handleChange}
                  name="max_options"
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
