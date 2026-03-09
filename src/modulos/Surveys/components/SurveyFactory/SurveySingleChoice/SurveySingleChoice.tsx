import React, { useState } from "react";
import styles from "./SurveySingleChoice.module.css";
import Input from "@/mk/components/forms/Input/Input";
import Button from "@/mk/components/forms/Button/Button";
import { IconRatioOn, IconX } from "@/components/layout/icons/IconsBiblioteca";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import TextArea from "@/mk/components/forms/TextArea/TextArea";

const SurveySingleChoice = ({
  formState,
  setFormState,
  setType,
  editingQuestion,
  editingIndex,
}: any) => {
  const [errors, setErrors]: any = useState({});
  const [formStateSingleChoice, setFormStateSingleChoice]: any = useState(
    editingQuestion
      ? { ...editingQuestion }
      : {
          options: [
            { id: -1, name: "" },
            { id: -2, name: "" },
          ],
          type: "S",
          nresp: 1,
          order:
            editingIndex !== undefined
              ? editingIndex
              : formState?.questions?.length,
        }
  );

  const handleChange = (e: any) => {
    let value = e.target.value;
    if (e.target.name.includes("options")) {
      const index = e.target.name.split(".")[1];
      const opt: any = formStateSingleChoice.options;
      opt[index].name = value;
      setFormStateSingleChoice({ ...formStateSingleChoice, options: opt });
      return;
    }

    setFormStateSingleChoice({
      ...formStateSingleChoice,
      [e.target.name]: value,
    });
  };

  const onDelOption = (index: number) => {
    const opt: any = formStateSingleChoice.options;
    opt.splice(index, 1);
    setFormStateSingleChoice({ ...formStateSingleChoice, options: opt });
  };

  const validate = (field: any = "") => {
    let errors: any = {};

    errors = checkRules({
      value: formStateSingleChoice.name,
      rules: ["required"],
      key: "name",
      errors,
    });

    errors = checkRules({
      value: formStateSingleChoice.options,
      rules: ["optionSurvey"],
      key: "options",
      errors,
      data: formStateSingleChoice,
    });

    setErrors(errors);
    return errors;
  };

  const _onSave = () => {
    if (hasErrors(validate())) return;

    const updatedQuestion = {
      ...formStateSingleChoice,
      order:
        editingIndex !== undefined
          ? editingIndex
          : formState?.questions?.length, // Agrega el orden basado en el índice
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
      // Agregar nueva pregunta con order
      setFormState((prevFormState: any) => ({
        ...prevFormState,
        questions: [...(prevFormState.questions || []), updatedQuestion],
      }));
    }
    setType("");
  };

  return (
    <DataModal
      open={true}
      style={{ width: editingQuestion ? "100%" : "" }}
      onClose={() => setType("")}
      onSave={_onSave}
    >
      <div className={styles.surveySingleChoice}>
        <p>Escuchamos tus necesidades</p>
        <p>Encuesta para mejorar la forma de vida en nuestro país</p>
        <p>• Opción única</p>
        <div>
          <p>Pregunta</p>
          <Input
            type="text"
            value={formStateSingleChoice.name}
            onChange={handleChange}
            name="name"
            label="Escribe tu pregunta aquí"
            error={errors}
          />
        </div>
        <div>
          <p>Descripción</p>
          <TextArea
            value={formStateSingleChoice.description}
            onChange={handleChange}
            name="description"
            label="Escribe una descripción"
            required={false}
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
          {formStateSingleChoice?.options?.map((o: any, i: number) => (
            <div key={i} className={styles.option}>
              <Input
                type="text"
                name={"options." + i}
                value={o.name || ""}
                onChange={handleChange}
                label={"Opción " + (i + 1)}
                error={errors}
                iconLeft={<IconRatioOn color="var(--cWhite)" />}
                iconRight={
                  i > formStateSingleChoice.nresp && (
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
              const opt: any = formStateSingleChoice.options;
              opt.push({
                id: (formStateSingleChoice.options.length + 1) * -1,
                name: "",
              });
              setFormStateSingleChoice({
                ...formStateSingleChoice,
                options: opt,
              });
            }}
          >
            + Añadir opción
          </Button>
        </div>
      </div>
    </DataModal>
  );
};

export default SurveySingleChoice;
