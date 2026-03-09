import React, { useEffect, useState } from "react";
import styles from "./RenderForm.module.css";
import Check from "@/mk/components/forms/Check/Check";
import Switch from "@/mk/components/forms/Switch/Switch";
import CardContent from "./CardContent";
import { formatNumber } from "@/mk/utils/numbers";
import Input from "@/mk/components/forms/Input/Input";
import { IconWorld } from "@/components/layout/icons/IconsBiblioteca";

const ROLES_OPTIONS = [
  { id: "OWN", name: "Propietarios" },
  { id: "RES", name: "Residentes" },
  { id: "GUA", name: "Guardias" },
  { id: "ADM", name: "Administradores" },
];

export default function SurveyTargeting({ formState, setFormState, execute, errors }: any) {
  const [affCount, setAffCount] = useState<number | null>(null);
  const [affMeta, setAffMeta] = useState(0);

  // Parse default from formState or initiate
  const targetCriteria = formState.target_criteria || {
    roles: [],
    unit_types: [],
    only_arrears: false,
    vote_per_unit: true,
  };

  const calculateAudience = async (criteria: any) => {
    try {
      const { data } = await execute("/surveys/calculate-audience", "POST", { target_criteria: criteria }, false, true);
      if (data?.success) {
        setAffCount(data.data?.count || 0);
      }
    } catch (error) {
      console.error("Error calculating audience", error);
    }
  };

  // Debounce the calculateAudience
  useEffect(() => {
    const handler = setTimeout(() => {
      calculateAudience(targetCriteria);
    }, 500);
    return () => clearTimeout(handler);
  }, [
    targetCriteria.roles?.join(","),
    targetCriteria.only_arrears,
    targetCriteria.vote_per_unit,
  ]);

  useEffect(() => {
    if (affCount !== null && formState.meta === undefined) {
      setAffMeta(Math.ceil((affCount * 10) / 100));
    } else if (formState.meta !== undefined) {
      setAffMeta(formState.meta);
    }
  }, [affCount, formState.meta]);

  const updateCriteria = (key: string, value: any) => {
    const newCriteria = { ...targetCriteria, [key]: value };
    setFormState({ ...formState, target_criteria: newCriteria });
  };

  const handleRoleToggle = (roleId: string) => {
    const currentRoles = targetCriteria.roles || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter((r: string) => r !== roleId)
      : [...currentRoles, roleId];
    updateCriteria("roles", newRoles);
  };

  const calculatePercentage = (total: number, percentage: number): number => {
    return Math.ceil((total * percentage) / 100);
  };

  const _onClickCardPercentage = (percentage: number) => {
    if (affCount === null) return;
    const newAff = calculatePercentage(affCount, percentage);
    setAffMeta(newAff);
    setFormState({ ...formState, meta: newAff });
  };

  return (
    <CardContent
      title="Segmentación y Público Objetivo"
      subtitle="Selecciona el público al que se mostrará tu encuesta"
      style={{ marginBottom: "16px" }}
    >
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", marginTop: "16px" }}>
        <IconWorld size={48} color="var(--cWhiteV1)" style={{ minWidth: 30 }} />
        
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <p className={styles.title} style={{ marginBottom: "8px" }}>Roles permitidos</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {ROLES_OPTIONS.map((role) => (
                <Check
                  key={role.id}
                  name={`role_${role.id}`}
                  label={role.name}
                  value={role.id}
                  checked={(targetCriteria.roles || []).includes(role.id)}
                  onChange={() => handleRoleToggle(role.id)}
                  reverse
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--borderL)", paddingTop: 16 }}>
            <div>
              <p className={styles.title}>Solo morosos</p>
              <p className={styles.subtitle}>Limitar encuesta únicamente a unidades con deudas atrasadas</p>
            </div>
            <Switch
              name="only_arrears"
              optionValue={["Y", "N"]}
              value={targetCriteria.only_arrears ? "Y" : "N"}
              onChange={(e: any) => updateCriteria("only_arrears", e.target.checked)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--borderL)", paddingTop: 16 }}>
            <div>
              <p className={styles.title}>Un voto por unidad</p>
              <p className={styles.subtitle}>Permitir solo una respuesta por departamento</p>
            </div>
            <Switch
              name="vote_per_unit"
              optionValue={["Y", "N"]}
              value={targetCriteria.vote_per_unit ? "Y" : "N"}
              onChange={(e: any) => updateCriteria("vote_per_unit", e.target.checked)}
            />
          </div>
        </div>
      </div>

      {affCount !== null && (
        <div style={{ marginTop: 24, padding: "16px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--bRadius)" }}>
          <p className={styles.title}>IA de Elekta</p>
          <p className={styles.subtitle}>
            Cuentas con un público de {formatNumber(affCount, 0)} afiliados. 
            Te sugerimos alcanzar una muestra del 10% ({formatNumber(calculatePercentage(affCount, 10), 0)} afiliados) 
            para obtener resultados estadísticamente relevantes.
          </p>
          <p className={styles.title} style={{ marginBottom: 8, marginTop: 16 }}>
            ¿Qué meta quieres fijar?
          </p>
          <div className={styles.metas} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
            {[10, 20, 100].map((pct) => (
              <div
                key={pct}
                onClick={() => _onClickCardPercentage(pct)}
                style={{
                  padding: "12px",
                  borderRadius: "var(--bRadius)",
                  cursor: "pointer",
                  border: "1px solid var(--borderL)",
                  flex: 1,
                  minWidth: "100px",
                  textAlign: "center",
                  backgroundColor: affMeta === calculatePercentage(affCount, pct) ? "var(--cHover)" : "transparent",
                }}
              >
                <p className={styles.title}>{pct}%</p>
                <p className={styles.subtitle}>{formatNumber(calculatePercentage(affCount, pct), 0)} Afiliados</p>
              </div>
            ))}
            <div style={{ flex: 1, minWidth: "150px" }}>
              <Input
                type="number"
                name="meta"
                label="Personalizado"
                value={formState?.meta}
                style={{ margin: 0 }}
                onChange={(e: any) => setFormState({ ...formState, meta: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </CardContent>
  );
}
