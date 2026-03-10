import React, { useEffect, useState } from "react";
import styles from "./RenderForm.module.css";
import Check from "@/mk/components/forms/Check/Check";
import Switch from "@/mk/components/forms/Switch/Switch";
import Select from "@/mk/components/forms/Select/Select";
import { formatNumber } from "@/mk/utils/numbers";
import Input from "@/mk/components/forms/Input/Input";
import { IconWorld } from "@/components/layout/icons/IconsBiblioteca";

const ROLES_OPTIONS = [
  { id: "admin", name: "Administrador del Sistema" },
  { id: "directive", name: "Mesa Directiva" },
  { id: "owner_homeowner", name: "Propietarios (Dueños)" },
  { id: "owner_titular", name: "Residentes Titulares" },
  { id: "owner_dependiente", name: "Residentes Dependientes" },
  { id: "guard_supervisor", name: "Supervisor de Guardias" },
  { id: "guard", name: "Guardia" },
];

export default function SurveyTargeting({ formState, setFormState, execute, errors, extraData }: any) {
  const [affCount, setAffCount] = useState<number | null>(null);
  const [affMeta, setAffMeta] = useState(0);

  // Parse default from formState or initiate
  const targetCriteria = formState.target_criteria || {
    roles: {},
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
    JSON.stringify(targetCriteria.roles),
    targetCriteria.only_arrears,
    targetCriteria.vote_per_unit,
    JSON.stringify(targetCriteria.unit_types),
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
    const currentRoles = targetCriteria.roles || {};
    const currentVal = currentRoles[roleId] === "1" ? "0" : "1";
    const newRoles = { ...currentRoles, [roleId]: currentVal };
    updateCriteria("roles", newRoles);
  };

  const handleUnitTypeChange = (e: any) => {
    // Select returns an array of strings/numbers when multiSelect is true
    let selected = e.target.value.map(String);
    const previouslyEmpty = !targetCriteria.unit_types || targetCriteria.unit_types.length === 0;

    if (previouslyEmpty) {
      selected = selected.filter((v: string) => v !== "-1");
    } else {
      if (selected.includes("-1")) {
        selected = [];
      }
    }
    updateCriteria("unit_types", selected);
  };

  const hasOwnerSelected = ["owner_homeowner", "owner_titular", "owner_dependiente"].some(
    r => (targetCriteria.roles || {})[r] === "1"
  );

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
    <div style={{ marginBottom: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 className={styles.title}>Segmentación y Público Objetivo</h3>
        <p className={styles.subtitle}>Selecciona el público al que se mostrará tu encuesta</p>
      </div>
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
                  checked={(targetCriteria.roles || {})[role.id] === "1"}
                  onChange={() => handleRoleToggle(role.id)}
                  reverse
                />
              ))}
            </div>
          </div>

          {hasOwnerSelected && extraData?.unit_types && extraData.unit_types.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--borderL)", paddingTop: 16 }}>
              <div>
                <p className={styles.title}>Tipos de Unidad (Opcional)</p>
                <p className={styles.subtitle}>Aplica por defecto a todas las unidades. Selecciona para limitar a tipos específicos.</p>
              </div>
              <div style={{ flex: 1, maxWidth: "400px" }}>
                <Select
                  name="unit_types"
                  label="Seleccionar Tipos (Múltiple)"
                  value={(!targetCriteria.unit_types || targetCriteria.unit_types.length === 0) ? ["-1"] : targetCriteria.unit_types}
                  options={[
                    { id: "-1", name: "Todas las unidades" },
                    ...extraData.unit_types.map((ut: any) => ({ ...ut, id: String(ut.id) }))
                  ]}
                  optionValue="id"
                  optionLabel="name"
                  onChange={handleUnitTypeChange}
                  multiSelect={true}
                />
              </div>
            </div>
          )}

          {hasOwnerSelected && (
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
          )}

          {hasOwnerSelected && (
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
          )}
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
    </div>
  );
}
