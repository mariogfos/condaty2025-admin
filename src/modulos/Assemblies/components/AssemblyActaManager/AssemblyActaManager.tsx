"use client";

import { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import styles from "./AssemblyActaManager.module.css";
import { Assembly } from "../../types/assemblies.types";
import useAxios from "@/mk/hooks/useAxios";

interface AssemblyActaManagerProps {
  assembly: Assembly;
  onActaChange: (assembly: Assembly) => void;
}

const AssemblyActaManager: React.FC<AssemblyActaManagerProps> = ({
  assembly,
  onActaChange,
}) => {
  const [files, setFiles] = useState<string[]>(assembly.declarations || []);
  const [isSaving, setIsSaving] = useState(false);
  const { execute: saveActa } = useAxios();

  // Por ahora, el acta se maneja como "declarations" en la API
  // En una versión futura, podría ser un campo específico "acta_file"

  const handleFilesChange = (newFiles: string[]) => {
    setFiles(newFiles);
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Por ahora usamos el endpoint de update config para guardar el acta
      // En el futuro, podría ser un endpoint específico
      const response = await saveActa(
        `/assemblies/${assembly.id}`,
        "PUT",
        {
          declarations: files,
        },
        false,
        true
      );

      if (response?.data) {
        onActaChange({
          ...assembly,
          declarations: files,
        });
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
          Sube el archivo del acta de la asamblea. Puede ser un PDF, documento, o cualquier archivo relevante.
        </p>

        <div className={styles.uploadArea}>
          <UploadFileV3
            formState={{ files }}
            setFormState={(state: any, callback?: any) => {
              if (callback) {
                callback();
              }
            }}
            name="files"
            mode="all"
            maxMB={10}
          />
        </div>

        {files.length > 0 && (
          <div className={styles.fileList}>
            <h4>Archivos subidos:</h4>
            <ul>
              {files.map((file, index) => (
                <li key={index}>
                  <a href={file} target="_blank" rel="noopener noreferrer">
                    Ver archivo {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar acta"}
        </Button>
      </div>

      <div className={styles.info}>
        <p>
          <strong>Nota:</strong> El acta se guarda en el campo "declaraciones" de la asamblea.
          En futuras versiones, se podrá generar automáticamente desde audio transcrito con IA.
        </p>
      </div>
    </div>
  );
};

export default AssemblyActaManager;