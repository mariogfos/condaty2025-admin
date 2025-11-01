import React from "react";
import styles from "../RenderForm.module.css";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Switch from "@/mk/components/forms/Switch/Switch";
import Br from "@/components/Detail/Br";
interface PropsType {
  handleChange: any;
  errors: any;
  formState: any;
}
const ThirdPart = ({ handleChange, errors, formState }: PropsType) => {
  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <p className={styles.title}>¿Restringir reserva por mora?</p>
          <p className={styles.subtitle}>
            Activa el botón si quieres que los residentes morosos no puedan
            reservar esta área.
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
      <Br />
      <p className={styles.title}>Políticas de uso</p>
      <p className={styles.subtitle}>
        Describe las reglas y restricciones de uso y proporciona directrices
        para el uso adecuado del área social.
      </p>
      <TextArea
        label="Descripción"
        name="usage_rules"
        value={formState?.usage_rules}
        onChange={handleChange}
        error={errors}
      />
      <Br />
      <p className={styles.title}>Política de reembolso</p>
      <p className={styles.subtitle}>
        Describe las políticas de reembolso para reservas rechazadas (cómo,
        cuándo y qué porcentaje se devuelve al residente).
      </p>
      <TextArea
        label="Descripción"
        name="cancellation_policy"
        value={formState?.cancellation_policy}
        onChange={handleChange}
        error={errors}
      />
      <Br />
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p className={styles.title}>¿Aprobación de administración?</p>
          <p className={styles.subtitle}>
            Si activas esta opción, cada solicitud de reserva pasará por tu
            gestión.
          </p>
        </div>
        <Switch
          name="requires_approval"
          optionValue={["A", "X"]}
          onChange={(e: any) => {
            handleChange({
              target: {
                name: "requires_approval",
                value: e.target.checked ? "A" : "X",
              },
            });
          }}
          value={formState?.requires_approval}
        />
      </div>
      <Br />
    </>
  );
};

export default ThirdPart;
