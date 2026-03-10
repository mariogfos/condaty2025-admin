"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderForm.module.css";
import React, { useEffect, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconEye,
} from "@/components/layout/icons/IconsBiblioteca";
import Check from "@/mk/components/forms/Check/Check";
import Switch from "@/mk/components/forms/Switch/Switch";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { GMT, compareDate, getDateStrMes } from "@/mk/utils/date";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";
import SurveyQuestionTypePanel from "../SurveyQuestionTypePanel/SurveyQuestionTypePanel";
import SurveyFactory from "../SurveyFactory/SurveyModalFactory";
import SurveyList from "../SurveyList/SurveyList";
import SurveyTargeting from "./SurveyTargeting";

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  reLoad,
  action,
  extraData,
}: any) => {
  const [formState, setFormState]: any = useState({ ...item });
  const [_open, setOpen] = useState(open);
  const [errors, setErrors] = useState({});
  const [surveyType, setSurveyType] = useState("");
  const [level, setLevel] = useState(1);
  const { showToast } = useAuth();

  useEffect(() => {
    if (formState.id && formState.squestions && formState.squestions[0] && formState.squestions[0].soptions) {
      formState.questions = formState.squestions.map((q: any) => ({
        id: q.id,
        name: q.name,
        description: q.description,
        type: q.type,
        options: q.soptions.map((o: any) => ({
          id: o.id,
          name: o.name,
        })),
        min: q.min,
        max: q.max,
        order: q.order,
        is_mandatory: q.is_mandatory,
        switch: q.switch,
      }));
    }
  }, []);

  const openSurveyType = (type: string) => {
    setSurveyType(type);
  };

  const progressBarStyle =
    level === 1
      ? { background: `linear-gradient(to right, var(--cSuccess) 50%, var(--cBlackV1) 50%)` }
      : { backgroundColor: "var(--cSuccess)" };

  const handleChange = (e: any) => {
    let value = e.target.value;
    setFormState({ ...formState, [e.target.name]: value });
  };

  const disabled = () => {
    let hoy: any = new Date();
    hoy.setHours(hoy.getHours() - GMT);
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return item?.begin_at && new Date(item?.begin_at) <= hoy;
  };

  const validateLevel1 = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState.name,
      rules: ["required"],
      key: "name",
      errors,
    });
    
    // Check if target_criteria exists and has at least one role
    if (!formState.target_criteria?.roles || formState.target_criteria.roles.length === 0) {
      errors.target_criteria = "Selecciona al menos un rol";
      showToast("Selecciona al menos un rol en la segmentación", "error");
    }

    if (formState.switch === "Y") {
      errors = checkRules({
        value: formState.begin_at,
        rules: ["required", "greaterDate"],
        key: "begin_at",
        errors,
      });
      errors = checkRules({
        value: formState.end_at,
        rules: ["greaterDate", "greaterDate:begin_at", "required"],
        key: "end_at",
        errors,
        data: formState,
      });
    }

    setErrors(errors);
    return errors;
  };

  const _onSave = async () => {
    if (hasErrors(validateLevel1())) return;
    setLevel(2);

    if (level === 2) {
      const qs = formState.questions || [];
      if (qs.length === 0) {
        showToast("La encuesta debe tener al menos una pregunta.", "error");
        return;
      }

      const missingOptions = qs.some((q: any) => 
        ["S", "M"].includes(q.type) && (!q.options || q.options.length === 0)
      );

      if (missingOptions) {
        showToast("Las preguntas de selección deben tener al menos una opción.", "error");
        return;
      }

      let method = formState.id ? "PUT" : "POST";
      const { data } = await execute(
        "/surveys" + (formState.id ? "/" + formState.id : ""),
        method,
        {
          title: formState.name || formState.title, // Map correctly to DTO 
          description: formState.description,
          target_criteria: formState.target_criteria || { roles: [], unit_types: [], only_arrears: false, vote_per_unit: true },
          scheduled_at: formState.switch === "Y" ? formState.begin_at : null,
          expires_at: formState.switch === "Y" ? formState.end_at : null,
          is_mandatory: formState.is_mandatory === "Y",
          questions: (formState.questions || []).map((q: any) => ({
            id: q.id,
            question_text: q.name,
            description: q.description,
            type: q.type,
            options: q.options?.map((o: any) => ({
              id: o.id,
              option_text: o.name,
              ...o
            })),
            min_options: q.min,
            max_options: q.max,
            order: q.order,
            is_required: q.is_mandatory === "Y" || q.is_mandatory === true,
          })),
        }
      );

      if (data?.success === true || (data && !data.error)) { // API Might return 'success' or just data
        onClose();
        setLevel(1);
        setItem(formState);
        reLoad();
        showToast(data.message || "Encuesta guardada con éxito", "success");
      } else {
        showToast(data.message || "Ocurrió un error al guardar", "error");
      }
    }
  };

  const _onClose = () => {
    setOpen(false);
    onClose();
    setLevel(1);
  };

  const valueDate = (date: any) => {
    let val = date || "";
    val = val.split(" ")[0];
    val = val.split("T")[0];
    return val;
  };

  return (
    <>
      <DataModal
        title={formState.id ? "Editar encuesta" : "Crear encuesta"}
        open={_open}
        onClose={_onClose}
        buttonText={level === 1 ? "Siguiente" : "Guardar"}
        className={styles.renderFormLevel1}
        onSave={_onSave}
      >
        <section>
          <div>
            Vista previa
            <IconEye />
          </div>
          <div
            style={{
              ...progressBarStyle,
              height: "3px",
              width: "100%",
              borderRadius: "var(--bRadius)",
            }}
          ></div>
          <div style={{ marginTop: 12 }}>
            <section>
              <p>{level}/2</p>
              <p>Define los datos de información y segmentación de tu encuesta</p>
            </section>
            <div>
              <IconArrowLeft
                onClick={() => {
                  if (level === 2) setLevel(1);
                }}
              />
              <IconArrowRight
                onClick={() => {
                  if (level === 1) _onSave();
                }}
              />
            </div>
          </div>
        </section>

        {level === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
            <SurveyTargeting
              formState={formState}
              setFormState={setFormState}
              execute={execute}
              errors={errors}
              extraData={extraData}
            />

            <div style={{ paddingBottom: "16px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h3 className={styles.title}>Detalles de la encuesta</h3>
                <p className={styles.subtitle}>Información general de la encuesta</p>
              </div>
              <Input
                label="Título"
                type="text"
                name="name"
                value={formState?.name || formState?.title}
                onChange={handleChange}
                error={errors}
              />
              <TextArea
                label="Descripción"
                name="description"
                value={formState?.description}
                onChange={handleChange}
                error={errors}
                isLimit={true}
                maxLength={255}
                style={{ marginBottom: "16px" }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--borderV1)", borderBottom: "1px solid var(--borderV1)" }}>
                <div>
                  <p className={styles.title}>Obligatoriedad</p>
                  <p className={styles.subtitle}>
                    Marca aquí para requerir que el usuario responda la encuesta sin posibilidad de omitirla
                  </p>
                </div>
                <Check
                  name="is_mandatory"
                  disabled={
                    (formState.begin_at && new Date(formState.begin_at) < new Date()) ||
                    formState?.sanswerscount > 0
                  }
                  value={formState.is_mandatory}
                  error={errors}
                  checked={formState.is_mandatory === "Y"}
                  onChange={(e: any) => {
                    handleChange({
                      target: { name: "is_mandatory", value: e.target.checked ? "Y" : "N" },
                    });
                  }}
                />
              </div>

              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p className={styles.title}>Programar encuesta</p>
                    <p className={styles.subtitle}>
                      Selecciona este campo para programar el envío en una fecha específica
                    </p>
                  </div>
                  <Switch
                    name="switch"
                    optionValue={["Y", "N"]}
                    value={formState.switch || "N"}
                    onChange={(e: any) => {
                      handleChange({
                        target: { name: "switch", value: e.target.checked ? "Y" : "N" },
                      });
                    }}
                  />
                </div>
                {formState.switch === "Y" && (
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <Input
                      type="date"
                      name="begin_at"
                      label="Fecha de inicio"
                      value={valueDate(formState?.begin_at)}
                      onChange={handleChange}
                      disabled={disabled()}
                      error={errors}
                    />
                    <Input
                      type="date"
                      name="end_at"
                      label="Fecha de fin"
                      value={valueDate(formState?.end_at)}
                      error={errors}
                      onChange={handleChange}
                      disabled={
                        item?.end_at && compareDate(item?.end_at, new Date(), "<") ? true : false
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {level === 2 && (
          <div className={styles.renderFormLevel2}>
            <section>
              {formState.begin_at && formState.end_at && (
                <div className={styles.titleDate}>
                  Programada para el {getDateStrMes(formState.begin_at)} hasta el {getDateStrMes(formState.end_at)}{" "}
                </div>
              )}
              <div className={styles.titleFormLv2}>
                <div>{formState.name}</div> {formState.is_mandatory === "Y" && <div> • Obligatoria</div>}
              </div>
              <div className={styles.subtitleFormLv2}>{formState.description}</div>
            </section>
            <div>
              <SurveyList formState={formState} setFormState={setFormState} />
            </div>
            <SurveyQuestionTypePanel openSurveyType={openSurveyType} />
          </div>
        )}
      </DataModal>

      {surveyType !== "" && (
        <SurveyFactory
          type={surveyType}
          formState={formState}
          setFormState={setFormState}
          setType={setSurveyType}
        />
      )}
    </>
  );
};

export default RenderForm;
