"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderForm.module.css";
import React, { useEffect, useState } from "react";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Button from "@/mk/components/forms/Button/Button";
import { GMT, getDateTimeStrMes } from "@/mk/utils/date";
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
  const normalizeFormState = (s: any) => ({
    ...s,
    is_mandatory: s.is_mandatory === true || s.is_mandatory === "Y" ? "Y" : "N",
  });
  const [formState, setFormState]: any = useState(
    normalizeFormState({ ...item }),
  );
  const [_open, setOpen] = useState(open);
  const [errors, setErrors] = useState({});
  const [surveyType, setSurveyType] = useState("");
  const [level, setLevel] = useState(1);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { showToast } = useAuth();

  useEffect(() => {
    const fetchDetails = async () => {
      if (item.id && !formState.fullLoaded) {
        setIsLoadingDetails(true);
        try {
          const { data } = await execute(
            "/surveys",
            "GET",
            {
              fullType: "DET",
              searchBy: item.id,
            },
            false,
            true,
          );
          if (data?.success && data?.data?.survey) {
            let newState = { ...data.data.survey, fullLoaded: true };
            setFormState((prev: any) => ({
              ...prev,
              ...normalizeFormState(newState),
            }));
          }
        } catch (error) {
          console.error("Error cargando detalles encuesta:", error);
        } finally {
          setIsLoadingDetails(false);
        }
      }
    };
    fetchDetails();
  }, [item.id]);

  const openSurveyType = (type: string) => {
    setSurveyType(type);
  };

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
      value: formState.title,
      rules: ["required"],
      key: "title",
      errors,
    });

    // Check if target_criteria exists and has at least one role selected
    const rolesObj = formState.target_criteria?.roles || {};
    const hasSelectedRole = Object.values(rolesObj).some((v) => v === "1");
    if (!hasSelectedRole) {
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
      const qs = formState.squestions || [];
      if (qs.length === 0) {
        showToast("La encuesta debe tener al menos una pregunta.", "error");
        return;
      }

      const missingOptions = qs.some(
        (q: any) =>
          ["S", "M"].includes(q.type) &&
          (!q.soptions || q.soptions.length === 0),
      );

      if (missingOptions) {
        showToast(
          "Las preguntas de selección deben tener al menos una opción.",
          "error",
        );
        return;
      }

      let method = formState.id ? "PUT" : "POST";
      const { data } = await execute(
        "/surveys" + (formState.id ? "/" + formState.id : ""),
        method,
        {
          title: formState.title,
          description: formState.description,
          target_criteria: formState.target_criteria || {
            roles: [],
            unit_types: [],
            only_arrears: false,
            only_current: false,
            vote_per_unit: true,
          },
          scheduled_at: formState.switch === "Y" ? formState.begin_at : null,
          expires_at: formState.switch === "Y" ? formState.end_at : null,
          is_mandatory: formState.is_mandatory === "Y",
          squestions: formState.squestions || [],
        },
      );

      if (data?.success === true || (data && !data.error)) {
        // API Might return 'success' or just data
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

  const footerButtons =
    level === 1 ? (
      <>
        <Button
          variant="secondary"
          onClick={() => _onClose()}
          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={() => _onSave()}
          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
        >
          Siguiente
        </Button>
      </>
    ) : (
      <>
        <Button
          variant="secondary"
          onClick={() => setLevel(1)}
          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
        >
          Volver
        </Button>
        <Button
          variant="primary"
          onClick={() => _onSave()}
          style={{ height: 44, fontSize: 15, fontWeight: 600 }}
        >
          Guardar encuesta
        </Button>
      </>
    );

  return (
    <>
      <DataModal
        title={formState.id ? "Editar encuesta" : "Crear encuesta"}
        open={_open}
        onClose={_onClose}
        buttonText=""
        buttonCancel=""
        buttonExtra={footerButtons}
        className={styles.renderFormLevel1}
        onSave={_onSave}
      >
        <section className={styles.stepperHeader}>
          <div className={styles.stepperTrack}>
            <div className={styles.stepperLine} />
            <div className={`${styles.stepperStep} ${styles.active}`}>
              <div className={styles.stepperCircle}>1</div>
              <p>Configuración</p>
            </div>
            <div
              className={`${styles.stepperStep} ${level === 2 ? styles.active : ""}`}
            >
              <div className={styles.stepperCircle}>2</div>
              <p>Preguntas</p>
            </div>
          </div>
          <div className={styles.stepperStatus}>
            {isLoadingDetails && <span>Sincronizando detalles...</span>}
          </div>
        </section>

        {level === 1 && (
          <div className={styles.levelOneContent}>
            <SurveyTargeting
              formState={formState}
              setFormState={setFormState}
              execute={execute}
              errors={errors}
              extraData={extraData}
            />
            <div className={styles.blockCard}>
              <h3 className={styles.title}>Detalles de la encuesta</h3>
              <Input
                label="Título"
                type="text"
                name="title"
                value={formState?.title}
                onChange={handleChange}
                error={errors}
              />
              <TextArea
                label="Observaciones (Opc)"
                name="description"
                value={formState?.description}
                onChange={handleChange}
                error={errors}
                isLimit={true}
                maxLength={255}
              />
            </div>
          </div>
        )}

        {level === 2 && (
          <div className={styles.renderFormLevel2}>
            <section className={styles.surveyHeader}>
              {formState.begin_at && formState.end_at && (
                <div className={styles.titleDate}>
                  Programada para el {getDateTimeStrMes(formState.begin_at)}{" "}
                  hasta el {getDateTimeStrMes(formState.end_at)}{" "}
                </div>
              )}
              <div className={styles.titleFormLv2}>
                <div>{formState.title}</div>{" "}
                {formState.is_mandatory === "Y" && <div> • Obligatoria</div>}
              </div>
              <div className={styles.subtitleFormLv2}>
                {formState.description}
              </div>
            </section>
            <div className={styles.questionsSection}>
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
