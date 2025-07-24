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
  execute,
  setOpenList,
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

    errors = checkRules({
      value: formState?.avatar,
      rules: ["requiredImageMultiple"],
      key: "avatar",
      errors,
      data: formState,
    });

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
      rules: ["required", "number", "max:5", "integer"],
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
        rules: ["required", "integer", "less:20"],
        key: "max_reservations_per_day",
        errors,
      });
    }
    errors = checkRules({
      value: formState?.max_reservations_per_week,
      rules: ["required", "integer", "less:140"],
      key: "max_reservations_per_week",
      errors,
    });
    if (formState?.has_price == "S") {
      errors = checkRules({
        value: formState?.price,
        rules: ["required", "number", "positive", "less:10000"],
        key: "price",
        errors,
      });
      errors = checkRules({
        value: formState?.min_cancel_hours,
        rules: ["required", "less:200", "integer"],
        key: "min_cancel_hours",
        errors,
      });
      errors = checkRules({
        value: formState?.penalty_fee,
        rules: ["required", "number", "positive", "less:500"],
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
    setErrors(errors);
    return errors;
  };

  const onNext = () => {
    if (level === 1) {
      if (hasErrors(validateLevel1())) return;
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
        is_free: formState?.has_price == "S" ? "A" : "X",
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
        </Card>
      </div>
    </div>
  );
};

export default RenderForm;
