"use client";

import { useState } from "react";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./AssemblyConfigForm.module.css";
import {
  Assembly,
  TargetAudience,
  AUDIENCE_LABELS,
} from "../../types/assemblies.types";
import useAxios from "@/mk/hooks/useAxios";

interface AssemblyConfigFormProps {
  assembly: Assembly;
  onConfigChange: (assembly: Assembly) => void;
}

const AssemblyConfigForm: React.FC<AssemblyConfigFormProps> = ({
  assembly,
  onConfigChange,
}) => {
  const [quorumRequired, setQuorumRequired] = useState(
    assembly.quorum_required || 50,
  );
  const [anonymousVoting, setAnonymousVoting] = useState(
    assembly.anonymous_voting || false,
  );
  const [countAbstention, setCountAbstention] = useState(
    assembly.count_abstention || false,
  );
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(
    (assembly.target_audience as TargetAudience) || "all_owners",
  );
  const [isSaving, setIsSaving] = useState(false);
  const { execute: saveConfig } = useAxios();

  const audienceOptions = [
    { id: "all_owners", name: AUDIENCE_LABELS.all_owners },
    { id: "residents", name: AUDIENCE_LABELS.residents },
    { id: "dependents", name: AUDIENCE_LABELS.dependents },
  ];

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await saveConfig(
        `/assemblies/${assembly.id}/config`,
        "PUT",
        {
          quorum_required: quorumRequired,
          anonymous_voting: anonymousVoting,
          target_audience: targetAudience,
          count_abstention: countAbstention,
        },
        false,
        true,
      );

      if (response?.data) {
        onConfigChange({
          ...assembly,
          quorum_required: quorumRequired,
          anonymous_voting: anonymousVoting,
          target_audience: targetAudience,
          count_abstention: countAbstention,
        });
      }
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3>Configuración de votación</h3>

        <div className={styles.field}>
          <label className={styles.label}>Quórum requerido (%)</label>
          <Input
            name="quorum_required"
            type="number"
            value={quorumRequired}
            onChange={(e) => setQuorumRequired(parseInt(e.target.value) || 0)}
            min={0}
            max={100}
            placeholder="50"
          />
          <span className={styles.hint}>
            Porcentaje mínimo de asistencia para que las votaciones sean
            válidas.
          </span>
        </div>

        <div className={styles.field} style={{ display: "none" }}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={anonymousVoting}
              onChange={(e) => setAnonymousVoting(e.target.checked)}
              className={styles.checkbox}
            />
            Votación anónima
          </label>
          <span className={styles.hint}>
            Los administradores no podrán identificar votos específicos.
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={countAbstention}
              onChange={(e) => setCountAbstention(e.target.checked)}
              className={styles.checkbox}
            />
            Contar abstenciones en los resultados
          </label>
          <span className={styles.hint}>
            Si está activo, las abstenciones aparecerán como una opción en las
            gráficas de votación (Sí 40%, No 40%, Abstención 20%). Si está
            inactivo, se muestran solo como dato informativo debajo de la gráfica.
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Audiencia objetivo</h3>

        <div className={styles.field}>
          <Select
            name="target_audience"
            label="Notificar a"
            value={targetAudience}
            options={audienceOptions}
            onChange={(e) =>
              setTargetAudience(e.target.value as TargetAudience)
            }
          />
          <span className={styles.hint}>
            Define qué tipo de residentes serán notificados sobre esta asamblea.
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </div>
  );
};

export default AssemblyConfigForm;
