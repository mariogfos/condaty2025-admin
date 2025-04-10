import StepProgressBar from "@/components/StepProgressBar/StepProgressBar";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { Card } from "@/mk/components/ui/Card/Card";
import HeaderBack from "@/mk/components/ui/HeaderBack/HeaderBack";
import { getUrlImages } from "@/mk/utils/string";
import React, { useEffect, useState } from "react";

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
  const [formState, setFormState]: any = useState({ ...item });
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
  //   {
  //     "title": "Área Social",
  //     "description": "Área para eventos sociales y reuniones ",
  //     "max_capacity": 50,
  //     "available_days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
  //     "available_hours": {
  //         "Lunes": ["08:00-22:00"],
  //         "Martes": ["08:00-22:00"],
  //         "Miércoles": ["08:00-22:00"],
  //         "Jueves": ["08:00-22:00"],
  //         "Viernes": ["08:00-22:00"]
  //     },
  //     "booking_mode": "hour",
  //     "price": 100.00,
  //     "is_free": "X",
  //     "max_booking_duration": 4,
  //     "special_restrictions": "No se permiten eventos con sonido alto después de las 10 PM.",
  //     "usage_rules": "Se debe dejar el área limpia después de su uso.",
  //     "max_reservations_per_day": 2,
  //     "max_reservations_per_week": 5,
  //     "penalty_or_debt_restriction": "X",
  //     "requires_approval": "A",
  //     "approval_response_hours": 24,
  //     "auto_approval_available": "X",
  //     "cancellable": "A",
  //     "min_cancel_hours": 12,
  //     "late_cancellation_penalty": "X",
  //     "cancellation_policy": "Si la cancelación se realiza menos de 12 horas antes, se aplicará una penalización.",
  //     "penalty_fee": 50.00,
  //     "enable_survey": "A",
  //     "survey_template": "Plantilla estándar para encuestas de satisfacción",
  //     "show_in_calendar": "A",
  //     "show_real_time_availability": "A"
  // }

  return (
    <div>
      <HeaderBack label="Volver a lista de áreas sociales" onClick={onClose} />
      <StepProgressBar currentStep={1} totalSteps={3} />
      <Card>
        <UploadFile
          name="avatar"
          // value={formState?.avatar}
          value={
            item?.id
              ? getUrlImages(
                  "/" + "ACTIVITY" + "-" + item?.id + ".webp?" + item.updated_at
                )
              : ""
          }
          onChange={handleChange}
          label={"Subir una imagen"}
          error={errors}
          ext={["jpg", "png", "jpeg", "webp"]}
          setError={setErrors}
          img={true}
          item={formState}
          editor={{ width: 720, height: 363 }}
          sizePreview={{ width: "720px", height: "363px" }}
          //   disabled={
          //     getStatus() == "E" ||
          //     getStatus() == "S" ||
          //     item?.participate_task > 0
          //   }
        />
        <Input
          label="Nombre del área social"
          name="title"
          value={formState?.title}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Capacidad máxima de personas"
          name="max_capacity"
          value={formState?.max_capacity}
          onChange={handleChange}
          error={errors}
        />
        <Select
          label="Estado del área "
          name="status"
          value={formState?.status}
          onChange={handleChange}
          options={[
            { id: "A", name: "Activa" },
            { id: "X", name: "Inactiva" },
            { id: "M", name: "En mantenimiento" },
          ]}
          error={errors}
        />
        <TextArea
          label="Descripción"
          name="description"
          value={formState?.description}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Requiere aprobación"
          name="requires_approval"
          value={formState?.requires_approval}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Días disponibles"
          name="available_days"
          value={formState?.available_days}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Horarios disponibles"
          name="available_hours"
          value={formState?.available_hours}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Modo de reserva"
          name="booking_mode"
          value={formState?.booking_mode}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Precio"
          name="price"
          value={formState?.price}
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
          label="Reservas máximas por día"
          name="max_reservations_per_day"
          value={formState?.max_reservations_per_day}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Reservas máximas por semana"
          name="max_reservations_per_week"
          value={formState?.max_reservations_per_week}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Restricción de deuda o penalización"
          name="penalty_or_debt_restriction"
          value={formState?.penalty_or_debt_restriction}
          onChange={handleChange}
          error={errors}
        />

        <Input
          label="Horas de respuesta de aprobación"
          name="approval_response_hours"
          value={formState?.approval_response_hours}
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
          label="Horas mínimas para cancelación"
          name="min_cancel_hours"
          value={formState?.min_cancel_hours}
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
          label="Política de cancelación"
          name="cancellation_policy"
          value={formState?.cancellation_policy}
          onChange={handleChange}
          error={errors}
        />
        <Input
          label="Tarifa de penalización"
          name="penalty_fee"
          value={formState?.penalty_fee}
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
        />
      </Card>
    </div>
  );
};

export default RenderForm;
