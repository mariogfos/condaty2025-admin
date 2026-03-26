import React, { useState } from "react";
import styles from "./SurveyScaleChoice.module.css";
import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

import TextArea from "@/mk/components/forms/TextArea/TextArea";
import WidgetScale from "@/components/WidgetScale/WidgetScale";

const SurveyScaleChoice = ({
  formState,
  setFormState,
  setType,
  editingQuestion,
  editingIndex,
}: any) => {
  const [errors, setErrors]: any = useState({});

  const [formStateScaleChoice, setFormStateScaleChoice]: any = useState(
    editingQuestion
      ? { ...editingQuestion }
      : {
          soptions: [
            { id: -1, option_text: "", order: 0 },
            { id: -2, option_text: "", order: 1 },
          ],
          min_options: "1",
          type: "E",
          order:
            editingIndex !== undefined
              ? editingIndex
              : formState?.squestions?.length,
        }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: any = e.target.value;

    if (e.target.name === "max_options") {
      // Permitir el campo vacío
      if (value === "") {
        setFormStateScaleChoice({
          ...formStateScaleChoice,
          max_options: "",
        });
        return;
      }

      // Verificar que solo se ingresen dígitos
      if (/^\d+$/.test(value)) {
        const numValue = parseInt(value, 10);

        if (numValue === 1) {
          // Permitir "1" como parte de "10"
          setFormStateScaleChoice({
            ...formStateScaleChoice,
            max_options: value,
          });
        } else if (numValue >= 2 && numValue < 10) {
          // Valores válidos entre 2 y 9
          setFormStateScaleChoice({
            ...formStateScaleChoice,
            max_options: numValue,
          });
        } else if (numValue === 10) {
          // Limitar a 10
          setFormStateScaleChoice({
            ...formStateScaleChoice,
            max_options: 10,
          });
        } else if (numValue > 10) {
          // Si el usuario ingresa un número mayor que 10, limitar a 10
          setFormStateScaleChoice({
            ...formStateScaleChoice,
            max_options: 10,
          });
        }
      }
      return;
    }

    if (e.target.name.includes("soptions")) {
      const index = Number(e.target.name.split(".")[1]);
      const opt: any = [...formStateScaleChoice.soptions];
      opt[index] = { ...opt[index], option_text: value };
      setFormStateScaleChoice({ ...formStateScaleChoice, soptions: opt });
      return;
    }

    setFormStateScaleChoice({
      ...formStateScaleChoice,
      [e.target.name]: value,
    });
  };

  const validate = (field: any = "") => {
    let errors: any = {};

    errors = checkRules({
      value: formStateScaleChoice.question_text,
      rules: ["required"],
      key: "question_text",
      errors,
    });

    errors = checkRules({
      value: formStateScaleChoice.min_options,
      rules: ["required"],
      key: "min_options",
      errors,
      data: formStateScaleChoice,
    });
    errors = checkRules({
      value: formStateScaleChoice.max_options,
      rules: ["required", "greater:min_options"],
      key: "max_options",
      errors,
    });

    errors = checkRules({
      value: formStateScaleChoice.soptions[0].option_text,
      rules: ["required"],
      key: "soptions.0",
      errors,
    });
    errors = checkRules({
      value: formStateScaleChoice.soptions[1].option_text,
      rules: ["required"],
      key: "soptions.1",
      errors,
    });

    setErrors(errors);
    return errors;
  };

  const _onSave = () => {
    if (hasErrors(validate())) return;

    const updatedQuestion = {
      ...formStateScaleChoice,
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

  return (
    <DataModal
      open={true}
      onClose={() => setType("")}
      onSave={_onSave}
      style={{ width: editingQuestion ? "100%" : "" }}
      buttonCancel=""
    >
      <div className={styles.widgetscale}>
        <div>
          <h1>Escuchamos tus necesidades</h1>
          <p>Encuesta para mejorar la forma de vida en nuestro país</p>
          <p>• Opción en escala</p>
        </div>
        <div>
          <div>
            <div>
              <p>Pregunta</p>
              <Input
                type="text"
                label="Escribe tu pregunta aquí"
                value={formStateScaleChoice?.question_text}
                required={true}
                onChange={handleChange}
                error={errors}
                name="question_text"
              />
            </div>
            <div>
              <p>Descripción</p>
              <TextArea
                value={formStateScaleChoice?.description}
                onChange={handleChange}
                required={false}
                error={errors}
                name="description"
                label="Escribe una descripción"
                isLimit={true}
                maxLength={255}
              />
            </div>
            <div>
              <WidgetScale
                minValue={formStateScaleChoice.min_options}
                maxValue={formStateScaleChoice.max_options}
                minLabel={formStateScaleChoice.soptions[0].option_text}
                maxLabel={
                  formStateScaleChoice?.soptions[
                    formStateScaleChoice.soptions.length - 1
                  ].option_text
                }
              />
            </div>
          </div>

          <div>
            <p>Configuraciones</p>
            <div>
              <div>
                <p>Desde</p>
                <Input
                  value={formStateScaleChoice?.min_options}
                  onChange={handleChange}
                  name="min_options"
                  placeholder="1"
                  disabled={true}
                  type="number"
                  error={errors}
                />
              </div>
              <div>
                <p>Hasta</p>
                <Input
                  value={formStateScaleChoice?.max_options}
                  onChange={handleChange}
                  name="max_options"
                  // placeholder="0"
                  type="number"
                  maxLength={2} // Limitar a 2 caracteres
                  error={errors}
                />
              </div>
            </div>
            <p>Define los nombres para cada escala</p>
            <div>
              <div>
                <p>Lado Izquierdo</p>
                <Input
                  type="text"
                  value={formStateScaleChoice?.soptions[0].option_text}
                  onChange={handleChange}
                  name={"soptions.0"}
                  error={errors}
                />
              </div>
              <div>
                <p>Lado Derecho</p>
                <Input
                  type="text"
                  value={
                    formStateScaleChoice?.soptions[
                      formStateScaleChoice.soptions.length - 1
                    ].option_text
                  }
                  onChange={handleChange}
                  name={`soptions.${formStateScaleChoice.soptions.length - 1}`}
                  error={errors}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DataModal>
  );
};

export default SurveyScaleChoice;
