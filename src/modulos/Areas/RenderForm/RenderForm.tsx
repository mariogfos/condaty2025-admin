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
import DataModal from "@/mk/components/ui/DataModal/DataModal";

const hasCoordinateValue = (value: unknown) => {
  if (value === 0 || value === "0") {
    return true;
  }

  return value !== null && value !== undefined && String(value).trim() !== "";
};

const normalizeCoordinateValue = (value: unknown) => {
  if (!hasCoordinateValue(value)) {
    return "";
  }

  return String(value).trim().replace(/\s/g, "").replace(",", ".");
};

const parseCoordinateValue = (value: unknown) => {
  const normalized = normalizeCoordinateValue(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildCoordinatesValue = (latitude: unknown, longitude: unknown) => {
  const latitudeValue = hasCoordinateValue(latitude)
    ? String(latitude).trim()
    : "";
  const longitudeValue = hasCoordinateValue(longitude)
    ? String(longitude).trim()
    : "";

  if (!latitudeValue || !longitudeValue) {
    return "";
  }

  return `${latitudeValue}, ${longitudeValue}`;
};

const extractCoordinatesPair = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) {
    return null;
  }

  return {
    latitude: parts[0],
    longitude: parts[1],
  };
};

const RenderForm = ({ onClose, item, execute, setOpenList, reLoad }: any) => {
  const [formState, setFormState]: any = useState({
    ...item,
    coordinates:
      item?.coordinates || buildCoordinatesValue(item?.latitude, item?.longitude),
    booking_mode: item?.booking_mode || "day",
    has_price: item?.price ? "S" : "N",
    requires_approval: item?.requires_approval || "X",
    penalty_or_debt_restriction: item?.penalty_or_debt_restriction || "X",
  });
  const { showToast } = useAuth();
  const [level, setLevel] = useState(1);
  const [errors, setErrors]: any = useState({});
  const [openComfirm, setOpenComfirm] = useState(false);

  useEffect(() => {
    setOpenList(false);
  }, []);

  const handleChange = (e: any) => {
    if (e.target.name === "coordinates") {
      const coordinates = e.target.value;
      const parsedCoordinates = extractCoordinatesPair(coordinates);

      setFormState({
        ...formState,
        coordinates,
        latitude: parsedCoordinates?.latitude ?? "",
        longitude: parsedCoordinates?.longitude ?? "",
      });
      return;
    }

    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const validateLevel1 = () => {
    let errors: any = {};
    const coordinatesValue = String(formState?.coordinates ?? "").trim();
    const parsedCoordinates = extractCoordinatesPair(coordinatesValue);
    const latitudeValue = normalizeCoordinateValue(
      parsedCoordinates?.latitude ?? formState?.latitude,
    );
    const longitudeValue = normalizeCoordinateValue(
      parsedCoordinates?.longitude ?? formState?.longitude,
    );
    const hasCoordinates = coordinatesValue !== "";

    // errors = checkRules({
    //   value: formState?.avatar,
    //   rules: ["requiredImageMultiple"],
    //   key: "avatar",
    //   errors,
    //   data: formState,
    // });
    errors = checkRules({
      value: formState?.images,
      rules: ["required"],
      key: "images",
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

    if (hasCoordinates && !parsedCoordinates) {
      errors.coordinates =
        "Ingresa las coordenadas en formato latitud, longitud";
    }

    if (hasCoordinates && parsedCoordinates) {
      errors = checkRules({
        value: latitudeValue,
        rules: ["required", "number", "between:-90,90"],
        key: "latitude",
        errors,
      });
      errors = checkRules({
        value: longitudeValue,
        rules: ["required", "number", "between:-180,180"],
        key: "longitude",
        errors,
      });
    }

    setErrors(errors);
    return errors;
  };
  const validateLevel2 = () => {
    let errors: any = {};

    if (formState?.booking_mode === "hour") {
      errors = checkRules({
        value: formState?.max_reservations_per_day,
        rules: [
          "required",
          "integer",
          "less:20",
          `less:${formState?.max_reservations_per_week}`,
        ],
        key: "max_reservations_per_day",
        errors,
        data: formState,
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
        rules: ["required", "number", "positive", "less:10000", "greater:0"],
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
        rules: ["required", "number", "positive", "less:100"],
        key: "penalty_fee",
        errors,
      });
    }
    setErrors(errors);
    return errors;
  };
  const validateLevel3 = () => {
    let errors: any = {};
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
      if (formState?.available_days?.length <= 0) {
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
    let method = formState.id ? "PUT" : "POST";
    const { data, error } = await execute(
      "/areas" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        // avatar: formState?.avatar,
        images: formState?.images,
        title: formState?.title,
        description: formState?.description,
        latitude: parseCoordinateValue(formState?.latitude),
        longitude: parseCoordinateValue(formState?.longitude),
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
        is_free: formState?.has_price == "S" ? "X" : "A",
      },
    );

    if (data?.success) {
      onClose();
      reLoad();
      showToast(data.message, "success");
    } else {
      showToast(
        error?.data?.message ||
          error?.message ||
          data?.message ||
          "No se pudo guardar el área social",
        "error",
      );
    }
  };

  const _onClose = () => {
    if (level == 4) {
      setOpenComfirm(true);
      return;
    }
    onClose();
  };
  return (
    <div className={styles.RenderForm}>
      <HeaderBack label="Volver a lista de áreas sociales" onClick={_onClose} />
      <div className={styles.formShell}>
        <div className={styles.headerBlock}>
          <p className={styles.pageTitle}>Creación de área social</p>
          <StepProgressBar currentStep={level} totalSteps={4} />
        </div>
        <Card className={styles.formCard}>
          {level === 1 && (
            <FirstPart
              errors={errors}
              setErrors={setErrors}
              formState={formState}
              setFormState={setFormState}
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
          {level === 4 && <FourPart item={formState} />}
          <div className={styles.footerActions}>
            {level > 1 && (
              <div
                className={styles.backAction}
                onClick={() => {
                  setLevel(level - 1);
                }}
              >
                <IconArrowLeft color="var(--cWhiteV1)" />
              </div>
            )}
            <Button className={styles.continueButton} onClick={onNext}>
              Continuar
            </Button>
          </div>
        </Card>
      </div>
      {openComfirm && (
        <DataModal
          title="Volver a lista de áreas sociales"
          open={openComfirm}
          onClose={() => setOpenComfirm(false)}
          maxWidth={800}
          onSave={() => onClose()}
          buttonText="Volver"
          buttonCancel="Continuar creación"
        >
          <p>
            ¿Seguro que quieres volver? Recuerda que si realizas esta acción,
            los cambios que has cargado en todos los pasos se eliminarán y el
            área social no será creada
          </p>
        </DataModal>
      )}
    </div>
  );
};

export default RenderForm;
