import React, { useEffect, useState } from "react";
import styles from "./RenderForm.module.css";
import Switch from "@/mk/components/forms/Switch/Switch";
import Select from "@/mk/components/forms/Select/Select";
import { formatNumber } from "@/mk/utils/numbers";
import Input from "@/mk/components/forms/Input/Input";

const ROLES_OPTIONS = [
  // Propietarios
  { id: "owner_homeowner", name: "Propietarios (dueños)", hasUnits: true },
  {
    id: "owner_homeowner_resident",
    name: "Propietarios residentes",
    hasUnits: true,
  },
  {
    id: "owner_homeowner_non_resident",
    name: "Propietarios no residentes",
    hasUnits: true,
  },

  // Inquilinos/Residentes
  { id: "owner_titular", name: "Inquilinos", hasUnits: true },
  { id: "resident", name: "Todos los residentes", hasUnits: true },

  // Dependientes
  { id: "owner_dependiente", name: "Dependientes", hasUnits: true },
  {
    id: "dependent_of_homeowner",
    name: "Dependientes de propietarios",
    hasUnits: true,
  },
  {
    id: "dependent_of_tenant",
    name: "Dependientes de inquilininos",
    hasUnits: true,
  },

  // Staff
  { id: "guard_supervisor", name: "Supervisor de guardias", hasUnits: false },
  { id: "guard", name: "Guardias", hasUnits: false },
  { id: "directive", name: "Mesa directiva", hasUnits: false },
  { id: "admin", name: "Administradores", hasUnits: false },
];

const OWNER_ROLES = [
  "owner_homeowner",
  "owner_homeowner_resident",
  "owner_homeowner_non_resident",
  "owner_titular",
  "resident",
  "owner_dependiente",
  "dependent_of_homeowner",
  "dependent_of_tenant",
];

/** Convert roles object { owner_homeowner: "1", ... } → string[] of active role IDs */
function rolesToArray(roles: any): string[] {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles.map(String);
  return Object.entries(roles)
    .filter(([, v]) => v === "1" || v === 1 || v === true)
    .map(([k]) => k);
}

export default function SurveyTargeting({
  formState,
  setFormState,
  execute,
  extraData,
  errors,
}: any) {
  const targetCriteria = formState.target_criteria || {
    roles: {},
    unit_types: [],
    only_arrears: false,
    only_current: false,
    vote_per_unit: true,
  };

  const [affCount, setAffCount] = useState<number | null>(
    formState.estimated_audience != null
      ? Number(formState.estimated_audience)
      : null,
  );
  const [hasInitialized, setHasInitialized] = useState(false);

  const targetCriteriaKey = JSON.stringify([
    targetCriteria.roles,
    targetCriteria.only_arrears,
    targetCriteria.only_current,
    targetCriteria.vote_per_unit,
    targetCriteria.unit_types,
  ]);

  // Derive role selection from roles object
  const selectedRoleIds = rolesToArray(targetCriteria.roles);
  const hasOwnerRole = selectedRoleIds.some((id) => OWNER_ROLES.includes(id));

  const calculateAudience = async (criteria: any) => {
    try {
      const { data } = await execute(
        "/surveys/calculate-audience",
        "POST",
        { target_criteria: criteria },
        false,
        true,
      );
      if (data?.success) setAffCount(data.data?.count ?? 0);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      // Even if we have a value, let's refresh it once on mount to be sure
    }
    const t = setTimeout(() => calculateAudience(targetCriteria), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCriteriaKey]);

  const updateCriteria = (key: string, value: any) => {
    // Mutual exclusion: only_arrears and only_current cannot be both true
    if (key === "only_arrears" && value === true) {
      setFormState({
        ...formState,
        target_criteria: {
          ...targetCriteria,
          only_arrears: true,
          only_current: false,
        },
      });
    } else if (key === "only_current" && value === true) {
      setFormState({
        ...formState,
        target_criteria: {
          ...targetCriteria,
          only_current: true,
          only_arrears: false,
        },
      });
    } else {
      setFormState({
        ...formState,
        target_criteria: { ...targetCriteria, [key]: value },
      });
    }
  };

  /** Multiselect roles handler — builds roles object from selected array */
  const handleRolesChange = (e: any) => {
    const selected: string[] = (e.target.value as string[])
      .map(String)
      .filter((v) => v !== "");

    const newRoles: Record<string, string> = {};
    ROLES_OPTIONS.forEach((r) => {
      newRoles[r.id] = selected.includes(r.id) ? "1" : "0";
    });

    const stillHasOwner = selected.some((id) => OWNER_ROLES.includes(id));
    const newCriteria = {
      ...targetCriteria,
      roles: newRoles,
      vote_per_unit: stillHasOwner ? targetCriteria.vote_per_unit : false,
      only_arrears: stillHasOwner ? targetCriteria.only_arrears : false,
      only_current: stillHasOwner ? targetCriteria.only_current : false,
      unit_types: stillHasOwner ? targetCriteria.unit_types : [],
    };
    setFormState({ ...formState, target_criteria: newCriteria });
  };

  const handleUnitTypeChange = (e: any) => {
    let selected = (e.target.value as string[]).map(String);
    const wasEmpty = !targetCriteria.unit_types?.length;
    if (wasEmpty) {
      selected = selected.filter((v) => v !== "-1");
    } else if (selected.includes("-1")) {
      selected = [];
    }
    updateCriteria("unit_types", selected);
  };

  const CardRow = ({
    label,
    subtitle,
    children,
  }: {
    label: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 24,
        padding: "14px 0",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div>
        <p className={styles.title} style={{ margin: 0 }}>
          {label}
        </p>
        {subtitle && (
          <p
            className={styles.subtitle}
            style={{ margin: 0, fontSize: "0.8rem" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ─── Card 1: Grupo + toggles ─── */}
      <div
        style={{
          background: "var(--cBlackV1)",
          borderRadius: "var(--bRadius)",
          padding: "16px",
        }}
      >
        {/* Multiselect roles */}
        <p className={styles.title} style={{ marginBottom: 10 }}>
          Selecciona el grupo que recibirá la encuesta
        </p>
        <Select
          name="target_roles"
          label="Selecciona uno o más grupos"
          value={selectedRoleIds.length ? selectedRoleIds : []}
          options={ROLES_OPTIONS}
          optionValue="id"
          optionLabel="name"
          onChange={handleRolesChange}
          multiSelect
        />

        {/* Conditional: unit types (owner/resident only) */}
        {hasOwnerRole && extraData?.unit_types?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Select
              name="unit_types"
              label="Tipos de unidad (opcional)"
              value={
                !targetCriteria.unit_types?.length
                  ? ["-1"]
                  : targetCriteria.unit_types
              }
              options={[
                { id: "-1", name: "Todas las unidades" },
                ...extraData.unit_types.map((ut: any) => ({
                  ...ut,
                  id: String(ut.id),
                })),
              ]}
              optionValue="id"
              optionLabel="name"
              onChange={handleUnitTypeChange}
              multiSelect
            />
          </div>
        )}

        {/* Owner-only toggles */}
        {hasOwnerRole && (
          <>
            <CardRow
              label="Un voto por unidad"
              subtitle="Permitir solo una respuesta por departamento"
            >
              <Switch
                name="vote_per_unit"
                optionValue={["Y", "N"]}
                value={targetCriteria.vote_per_unit ? "Y" : "N"}
                onChange={(e: any) =>
                  updateCriteria("vote_per_unit", e.target.checked)
                }
              />
            </CardRow>

            <CardRow
              label="Solo morosos"
              subtitle="Limitar encuesta únicamente a unidades con deudas atrasadas"
            >
              <Switch
                name="only_arrears"
                optionValue={["Y", "N"]}
                value={targetCriteria.only_arrears ? "Y" : "N"}
                onChange={(e: any) =>
                  updateCriteria("only_arrears", e.target.checked)
                }
              />
            </CardRow>

            <CardRow
              label="Solo al día"
              subtitle="Limitar encuesta únicamente a unidades sin deudas atrasadas"
            >
              <Switch
                name="only_current"
                optionValue={["Y", "N"]}
                value={targetCriteria.only_current ? "Y" : "N"}
                onChange={(e: any) =>
                  updateCriteria("only_current", e.target.checked)
                }
              />
            </CardRow>
          </>
        )}

        {/* Audience preview */}
        {affCount !== null && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "var(--bRadius)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <p
              className={styles.subtitle}
              style={{ margin: 0, fontSize: "0.82rem" }}
            >
              Audiencia estimada:
            </p>
            <p className={styles.title} style={{ margin: 0 }}>
              {formatNumber(affCount, 0)} personas
            </p>
          </div>
        )}
        {/* Toggle: obligatoria */}
        <CardRow
          label="¿Quieres asegurarte de que todos respondan?"
          subtitle="Activa para que los usuarios respondan la encuesta sin posibilidad de omitirla"
        >
          <Switch
            name="is_mandatory"
            optionValue={["Y", "N"]}
            value={formState.is_mandatory === "Y" ? "Y" : "N"}
            onChange={(e: any) =>
              setFormState({
                ...formState,
                is_mandatory: e.target.checked ? "Y" : "N",
              })
            }
          />
        </CardRow>

        {/* Toggle: programar */}
        <CardRow
          label="Programar encuesta"
          subtitle="Elige una fecha específica para enviar la encuesta"
        >
          <Switch
            name="switch"
            optionValue={["Y", "N"]}
            value={formState.switch || "N"}
            onChange={(e: any) =>
              setFormState({
                ...formState,
                switch: e.target.checked ? "Y" : "N",
              })
            }
          />
        </CardRow>

        {/* Date inputs (shown when scheduling is ON) */}
        {formState.switch === "Y" && (
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Input
              type="datetime-local"
              name="scheduled_at"
              label="Fecha de inicio"
              error={errors}
              value={(formState?.scheduled_at || "")
                .replace(" ", "T")
                .substring(0, 16)}
              onChange={(e: any) =>
                setFormState({ ...formState, scheduled_at: e.target.value })
              }
            />
            <Input
              type="datetime-local"
              name="expires_at"
              label="Fecha de fin"
              value={(formState?.expires_at || "")
                .replace(" ", "T")
                .substring(0, 16)}
              error={errors}
              onChange={(e: any) =>
                setFormState({ ...formState, expires_at: e.target.value })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
