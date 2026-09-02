import React from "react";
import styles from "../RenderForm.module.css";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Switch from "@/mk/components/forms/Switch/Switch";
import Input from "@/mk/components/forms/Input/Input";
import Br from "@/components/Detail/Br";
import { AreaApproval, AreaDebtRestriction, AreaMembership } from "../../Type/AreaEnums";
interface PropsType {
  handleChange: any;
  errors: any;
  formState: any;
}
const ThirdPart = ({ handleChange, errors, formState }: PropsType) => {
  return (
    <div className={styles.partStack}>
      <div className={styles.switchRow}>
        <div className={styles.switchContent}>
          <p className={styles.title}>¿Restringir reserva por mora?</p>
          <p className={styles.subtitle}>
            Activa el botón si quieres que los residentes morosos no puedan
            reservar esta área.
          </p>
        </div>
        <Switch
          name="penalty_or_debt_restriction"
          optionValue={[AreaDebtRestriction.BLOCKS, AreaDebtRestriction.NONE]}
          onChange={(e: any) => {
            handleChange({
              target: {
                name: "penalty_or_debt_restriction",
                value: e.target.checked
                  ? AreaDebtRestriction.BLOCKS
                  : AreaDebtRestriction.NONE,
              },
            });
          }}
          value={formState?.penalty_or_debt_restriction}
        />
      </div>
      <Br />
      <div className={styles.sectionBlock}>
        <p className={styles.title}>Anticipación de reservas</p>
        <p className={styles.subtitle}>
          Define cuántas horas antes del turno puede reservar un residente.
        </p>
      </div>
      <Input
        type="number"
        label="Horas mínimas de anticipación"
        name="min_reservation_advance_hours"
        value={formState?.min_reservation_advance_hours ?? 0}
        onChange={handleChange}
        error={errors}
        min={0}
      />
      <Br />
      <div className={styles.sectionBlock}>
        <p className={styles.title}>Políticas de uso</p>
        <p className={styles.subtitle}>
          Describe las reglas y restricciones de uso y proporciona directrices
          para el uso adecuado del área social.
        </p>
      </div>
      <TextArea
        label="Descripción"
        name="usage_rules"
        value={formState?.usage_rules}
        onChange={handleChange}
        error={errors}
      />
      <Br />
      <div className={styles.sectionBlock}>
        <p className={styles.title}>Política de reembolso</p>
        <p className={styles.subtitle}>
          Describe las políticas de reembolso para reservas rechazadas (cómo,
          cuándo y qué porcentaje se devuelve al residente).
        </p>
      </div>
      <TextArea
        label="Descripción"
        name="cancellation_policy"
        value={formState?.cancellation_policy}
        onChange={handleChange}
        error={errors}
      />
      <Br />
      <div className={styles.switchRow}>
        <div className={styles.switchContent}>
          <p className={styles.title}>¿Aprobación de administración?</p>
          <p className={styles.subtitle}>
            Si activas esta opción, cada solicitud de reserva pasará por tu
            gestión.
          </p>
        </div>
        <Switch
          name="requires_approval"
          optionValue={[AreaApproval.REQUIRED, AreaApproval.AUTOMATIC]}
          onChange={(e: any) => {
            handleChange({
              target: {
                name: "requires_approval",
                value: e.target.checked
                  ? AreaApproval.REQUIRED
                  : AreaApproval.AUTOMATIC,
              },
            });
          }}
          value={formState?.requires_approval}
        />
      </div>
      <Br />
      {/*
        🔴 Este interruptor NO EXISTÍA, y el API aplica la regla completa desde
        que `VisibilidadDeAreasPorMembresia` llegó a `dev`: el listado del
        residente recorta las áreas que piden membresía, `AreaWriteRequest`
        acepta el campo y la migración dejó la columna en `OPEN`.

        Sin pantalla que lo escriba, `requires_membership` se quedaba en `OPEN`
        para siempre: el servicio, el enum, sus tests y su doc corrían sin
        recortar nada. Una feature entera, completa en el API e inalcanzable.
      */}
      <div className={styles.switchRow}>
        <div className={styles.switchContent}>
          <p className={styles.title}>¿Requiere membresía?</p>
          <p className={styles.subtitle}>
            Si activas esta opción, solo las unidades con membresía verán esta
            área social en la app de residentes.
          </p>
        </div>
        <Switch
          name="requires_membership"
          optionValue={[AreaMembership.REQUIRED, AreaMembership.OPEN]}
          onChange={(e: any) => {
            handleChange({
              target: {
                name: "requires_membership",
                value: e.target.checked
                  ? AreaMembership.REQUIRED
                  : AreaMembership.OPEN,
              },
            });
          }}
          value={formState?.requires_membership}
        />
      </div>
      <Br />
    </div>
  );
};

export default ThirdPart;
