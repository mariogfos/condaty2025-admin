"use client";

import { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import styles from "./AssemblyActaManager.module.css";
import { Assembly } from "../../types/assemblies.types";
import { useAssemblies } from "../../hooks/useAssemblies";
import { IconDOC } from "@/components/layout/icons/IconsBiblioteca";
import { getDateStrMes } from "@/mk/utils/date";

interface AssemblyActaManagerProps {
  assembly: Assembly;
  onActaChange: (assembly: Assembly) => void;
}

const AssemblyActaManager: React.FC<AssemblyActaManagerProps> = ({
  assembly,
  onActaChange,
}) => {
  const [formState, setFormState] = useState<{ acta_file: string[] }>({
    acta_file: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const { uploadActa } = useAssemblies();

  const handleSave = async () => {
    if (isSaving || formState.acta_file.length === 0) return;

    setIsSaving(true);
    try {
      const success = await uploadActa(assembly.id, formState.acta_file[0]);

      if (success) {
        onActaChange({
          ...assembly,
          acta_file: formState.acta_file[0],
          acta_uploaded_at: new Date().toISOString(),
        });
        setFormState({ acta_file: [] }); // Limpiar estado de subida
      }
    } catch (error) {
      console.error("Error saving acta:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3>Acta de la asamblea</h3>
        <p className={styles.description}>
          Sube el archivo final del acta de la asamblea.
        </p>

        <div className={styles.uploadArea}>
          <UploadFileV3
            name="acta_file"
            formState={formState}
            setFormState={setFormState}
            cant={1}
            mode="documents"
            maxMB={10}
            title="Arrastra el acta aquí"
            subtitle="o haz clic para seleccionar (solo 1 archivo)"
          />
        </div>

        {formState.acta_file.length > 0 && (
          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar acta"}
            </Button>
          </div>
        )}

        {assembly.acta_file && (
          <div className={styles.currentActa}>
            <h4>Acta Actual:</h4>
            <div className={styles.fileCard}>
              <IconDOC />
              <div className={styles.fileInfo}>
                <a href={assembly.acta_file} target="_blank" rel="noopener noreferrer">
                  Ver documento
                </a>
                {assembly.acta_uploaded_at && (
                  <span className={styles.uploadDate}>
                    Subida el: {getDateStrMes(assembly.acta_uploaded_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssemblyActaManager;