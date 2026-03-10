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
          soptions: [
            { id: -1, option_text: "" },
            { id: -2, option_text: "" },
          ],
          type: "S",
          nresp: 1,
          order:
            editingIndex !== undefined
              ? editingIndex
              : formState?.squestions?.length,
        }
  );

  const handleChange = (e: any) => {
    let value = e.target.value;
    if (e.target.name.includes("soptions")) {
      const index = e.target.name.split(".")[1];
      const opt: any = formStateSingleChoice.soptions;
      opt[index].option_text = value;
      setFormStateSingleChoice({ ...formStateSingleChoice, soptions: opt });
      return;
    }

    setFormStateSingleChoice({
      ...formStateSingleChoice,
      [e.target.name]: value,
    });
  };

  const onDelOption = (index: number) => {
    const opt: any = formStateSingleChoice.soptions;
    opt.splice(index, 1);
    setFormStateSingleChoice({ ...formStateSingleChoice, soptions: opt });
  };

  const validate = (field: any = "") => {
    let errors: any = {};

    errors = checkRules({
      value: formStateSingleChoice.question_text,
      rules: ["required"],
      key: "question_text",
      errors,
    });

    errors = checkRules({
      value: formStateSingleChoice.soptions,
      rules: ["optionSurvey"],
      key: "soptions",
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
          : formState?.squestions?.length, // Agrega el orden basado en el índice
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
      // Agregar nueva pregunta con order
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
            value={formStateSingleChoice.question_text}
            onChange={handleChange}
            name="question_text"
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
          {errors?.soptions && (
            <span style={{ color: "var(--cError)", fontSize: "10px" }}>
              {errors.soptions}
            </span>
          )}
          {formStateSingleChoice?.soptions?.map((o: any, i: number) => (
            <div key={i} className={styles.option}>
              <Input
                type="text"
                name={"soptions." + i}
                value={o.option_text || ""}
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
              const opt: any = formStateSingleChoice.soptions;
              opt.push({
                id: (formStateSingleChoice.soptions.length + 1) * -1,
                option_text: "",
              });
              setFormStateSingleChoice({
                ...formStateSingleChoice,
                soptions: opt,
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
