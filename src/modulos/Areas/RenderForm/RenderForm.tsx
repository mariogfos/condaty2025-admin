import StepProgressBar from "@/components/StepProgressBar/StepProgressBar";
import { Card } from "@/mk/components/ui/Card/Card";
import HeaderBack from "@/mk/components/ui/HeaderBack/HeaderBack";
import React, { useEffect, useState } from "react";
import styles from "./RenderForm.module.css";
import Button from "@/mk/components/forms/Button/Button";
import FirstPart from "./Partes/FirstPart";
import SecondPart from "./Partes/SecondPart";
import ThirdPart from "./Partes/ThirdPart";
import { IconArrowLeft } from "@/components/layout/icons/IconsBiblioteca";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";
import FourPart from "./Partes/FourPart";

const RenderForm = ({
  onClose,
  open,
  item,
  setItem,
  // errors,
  extraData,
  user,
  execute,
  openList,
  setOpenList,
  // setErrors,
  reLoad,
  action,
}: any) => {
  const [formState, setFormState]: any = useState({
    ...item,
    booking_mode: item?.booking_mode || "day",
    has_price: item?.price ? "S" : "N",
  });
  const { showToast } = useAuth();
  const [level, setLevel] = useState(1);
  const [errors, setErrors]: any = useState({});
  useEffect(() => {
    setOpenList(false);
  }, []);

  const handleChange = (e: any) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const validateLevel1 = () => {
    let errors: any = {};
    if (!formState?.avatar && !formState.id) {
      errors["avatar"] = "Debe seleccionar una imagen";
    }
    errors = checkRules({
      value: formState?.title,
      rules: ["required", "textDash"],
      key: "title",
      errors,
    });

    errors = checkRules({
      value: formState?.description,
      rules: ["required"],
      key: "description",
      errors,
    });
    errors = checkRules({
      value: formState?.max_capacity,
      rules: ["required", "number", "max:5"],
      key: "max_capacity",
      errors,
    });
    errors = checkRules({
      value: formState?.status,
      rules: ["required"],
      key: "status",
      errors,
    });

    setErrors(errors);
    return errors;
  };
  const validateLevel2 = () => {
    let errors: any = {};

    if (formState?.booking_mode === "hour") {
      errors = checkRules({
        value: formState?.max_reservations_per_day,
        rules: ["required", "max:5"],
        key: "max_reservations_per_day",
        errors,
      });
    }
    errors = checkRules({
      value: formState?.max_reservations_per_week,
      rules: ["required", "max:5"],
      key: "max_reservations_per_week",
      errors,
    });
    if (formState?.has_price == "S") {
      errors = checkRules({
        value: formState?.price,
        rules: ["required", "max:10", "number"],
        key: "price",
        errors,
      });
      errors = checkRules({
        value: formState?.min_cancel_hours,
        rules: ["required", "max:2"],
        key: "min_cancel_hours",
        errors,
      });
      errors = checkRules({
        value: formState?.penalty_fee,
        rules: ["required", "less:100"],
        key: "penalty_fee",
        errors,
      });
    }
    setErrors(errors);
    return errors;
  };
  const validateLevel3 = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState?.usage_rules,
      rules: ["required"],
      key: "usage_rules",
      errors,
    });
    errors = checkRules({
      value: formState?.cancellation_policy,
      rules: ["required"],
      key: "cancellation_policy",
      errors,
    });
    // errors = checkRules({
    //   value: formState?.approval_response_hours,
    //   rules: ["required", "max:3"],
    //   key: "approval_response_hours",
    //   errors,
    // });
    // errors = checkRules({
    //   value: formState?.penalty_or_debt_restriction,
    //   rules: ["required"],
    //   key: "penalty_or_debt_restriction",
    //   errors,
    // })
    setErrors(errors);
    return errors;
  };

  const onNext = () => {
    if (level === 1) {
      if (hasErrors(validateLevel1())) return;
      if (!formState?.avatar && !formState.id) {
        showToast("Debe seleccionar una imagen", "error");
        return;
      }
    }
    if (level === 2) {
      if (hasErrors(validateLevel2())) return;
      if (!formState?.booking_mode) {
        showToast("Seleccione el modo de reserva", "error");
        return;
      }
      if (formState?.available_days.length <= 0) {
        showToast("Seleccione los días y periodos disponibles", "error");
        return;
      }
    }
    if (level === 3) {
      if (hasErrors(validateLevel3())) return;
    }
    if (level == 4) {
      onSave();
      return;
    }
    setLevel(level + 1);
  };
  const onSave = async () => {
    setOpenList(true);
    let method = formState.id ? "PUT" : "POST";
    const { data } = await execute(
      "/areas" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        avatar: formState?.avatar,
        title: formState?.title,
        description: formState?.description,
        max_capacity: formState?.max_capacity,
        status: formState?.status,
        requires_approval: formState?.requires_approval,
        price: formState?.price,
        max_reservations_per_week: formState?.max_reservations_per_week,
        min_cancel_hours: formState?.min_cancel_hours,
        penalty_fee: formState?.penalty_fee,
        available_days: formState?.available_days,
        available_hours: formState?.available_hours,
        usage_rules: formState?.usage_rules,
        cancellation_policy: formState?.cancellation_policy,
        approval_response_hours: formState?.approval_response_hours,
        penalty_or_debt_restriction: formState?.penalty_or_debt_restriction,
        booking_mode: formState?.booking_mode,
        max_reservations_per_day: formState?.max_reservations_per_day,
        reservation_duration: parseFloat(formState?.reservation_duration),
      }
    );

    if (data?.success == true) {
      onClose();
      reLoad();
      showToast(data.message, "success");
    } else {
      showToast(data.message, "error");
    }
  };
  return (
    <div className={styles.RenderForm}>
      <HeaderBack label="Volver a lista de áreas sociales" onClick={onClose} />
      <div
        style={{
          width: "800px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <p style={{ fontSize: 24, fontWeight: 600 }}>Creación de área social</p>
        <StepProgressBar currentStep={level} totalSteps={4} />
        <Card>
          {level === 1 && (
            <FirstPart
              errors={errors}
              setErrors={setErrors}
              formState={formState}
              handleChange={handleChange}
            />
          )}
          {level === 2 && (
            <SecondPart
              handleChange={handleChange}
              errors={errors}
              formState={formState}
              setFormState={setFormState}
            />
          )}
          {level === 3 && (
            <ThirdPart
              handleChange={handleChange}
              errors={errors}
              formState={formState}
            />
          )}
          {level === 4 && (
            <FourPart
              // handleChange={handleChange}
              // errors={errors}
              item={formState}
            />
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "end",
              marginTop: 24,
            }}
          >
            {level > 1 && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--cWhiteV1)",
                }}
                onClick={() => {
                  setLevel(level - 1);
                }}
              >
                <IconArrowLeft color="var(--cWhiteV1)" />
              </div>
            )}
            <Button style={{ width: 304 }} onClick={onNext}>
              Continuar
            </Button>
          </div>
          {/* <Input
            label="Días disponibles"
            name="available_days"
            value={formState?.available_days}
            onChange={handleChange}
            error={errors}
          />  
          <Input
            label="Es gratis"
            name="is_free"
            value={formState?.is_free}
            onChange={handleChange}
            error={errors}
          />
          <Input
            label="Duración máxima de reserva"
            name="max_booking_duration"
            value={formState?.max_booking_duration}
            onChange={handleChange}
            error={errors}
          />
          <Input
            label="Restricciones especiales"
            name="special_restrictions"
            value={formState?.special_restrictions}
            onChange={handleChange}
            error={errors}
          />
          <Input
            label="Reglas de uso"
            name="usage_rules"
            value={formState?.usage_rules}
            onChange={handleChange}
            error={errors}
          />
     
          <Input
            label="Aprobación automática disponible"
            name="auto_approval_available"
            value={formState?.auto_approval_available}
            onChange={handleChange}
            error={errors}
          />
          <Input
            label="Cancelable"
            name="cancellable"
            value={formState?.cancellable}
            onChange={handleChange}
            error={errors}
          />
   
          <Input
            label="Penalización por cancelación tardía"
            name="late_cancellation_penalty"
            value={formState?.late_cancellation_penalty}
            onChange={handleChange}
            error={errors}
          />

          <Input
            label="Habilitar encuesta"
            name="enable_survey"
            value={formState?.enable_survey}
            onChange={handleChange}
            error={errors}
          />
          <Input
            label="Plantilla de encuesta"
            name="survey_template"
            value={formState?.survey_template}
            onChange={handleChange}
            error={errors}
          />
          <Input
            label="Mostrar en el calendario"
            name="show_in_calendar"
            value={formState?.show_in_calendar}
            onChange={handleChange}
            error={errors}
          />
          <Input
            label="Mostrar disponibilidad en tiempo real"
            name="show_real_time_availability"
            value={formState?.show_real_time_availability}
            onChange={handleChange}
            error={errors}
          /> */}
        </Card>
      </div>
    </div>
  );
};

export default RenderForm;
