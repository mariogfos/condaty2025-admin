import React from "react";
import styles from "../RenderForm.module.css";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Input from "@/mk/components/forms/Input/Input";
import Switch from "@/mk/components/forms/Switch/Switch";
interface PropsType {
  handleChange: any;
  errors: any;
  formState: any;
}
const ThirdPart = ({ handleChange, errors, formState }: PropsType) => {
  return (
    <>
      <p className={styles.title}>Reglas de uso</p>
      <p className={styles.subtitle}>
        Describe las reglas de uso y proporciona directrices para el uso
        adecuado de las áreas comunes
      </p>
      <TextArea
        label="Descripción"
        required
        name="usage_rules"
        value={formState?.usage_rules}
        onChange={handleChange}
        error={errors}
      />
      <p className={styles.title}>Política de reembolso</p>
      <p className={styles.subtitle}>
        Describe las políticas de reembolso para reservas rechazadas (cómo,
        cuándo y qué porcentaje se devuelve al residente)
      </p>
      <TextArea
        label="Descripción"
        name="cancellation_policy"
        required
        value={formState?.cancellation_policy}
        onChange={handleChange}
        error={errors}
      />
      <p className={styles.title}>Aprobación automática</p>
      <p className={styles.subtitle}>
        Establece el tiempo máximo (en horas) que administración tiene para
        aprobar una reserva. Si se supera este límite, la reserva se aprobará
        automáticamente.
      </p>
      <Input
        type="number"
        label="Horas de respuesta de aprobación"
        required
        name="approval_response_hours"
        value={formState?.approval_response_hours}
        onChange={handleChange}
        error={errors}
      />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <p className={styles.title}>¿Restringir reserva por mora?</p>
          <p className={styles.subtitle}>
            Activa el botón si quieres que los residentes morosos no puedan
            reservar esta área
          </p>
        </div>
        <Switch
          name="penalty_or_debt_restriction"
          optionValue={["A", "X"]}
          onChange={(e: any) => {
            handleChange({
              target: {
                name: "penalty_or_debt_restriction",
                value: e.target.checked ? "A" : "X",
              },
            });
          }}
          value={formState?.penalty_or_debt_restriction}
        />
      </div>
    </>
  );
};

export default ThirdPart;
