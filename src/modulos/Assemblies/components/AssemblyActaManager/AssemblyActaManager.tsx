"use client";

import { Assembly } from "../../types/assemblies.types";
import { IconDOC, IconDownload } from "@/components/layout/icons/IconsBiblioteca";
import { getDateStrMes } from "@/mk/utils/date";
import styles from "./AssemblyActaManager.module.css";

interface AssemblyActaManagerProps {
  assembly: Assembly;
}

const AssemblyActaManager: React.FC<AssemblyActaManagerProps> = ({
  assembly,
}) => {
  if (!assembly.acta_file) {
    return (
      <div className={styles.noActa}>
        No hay acta aún para visualizar.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <a
        href={assembly.acta_file}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.actaItem}
      >
        <div className={styles.actaInfo}>
          <IconDOC size={18} color="var(--cAccent)" />
          <div className={styles.textContainer}>
            <span className={styles.actaName}>
              Acta de la asamblea
            </span>
            {assembly.acta_uploaded_at && (
              <span className={styles.actaDate}>
                Subida el: {getDateStrMes(assembly.acta_uploaded_at)}
              </span>
            )}
          </div>
        </div>
        <div className={styles.actaDownload}>
          <IconDownload size={16} />
        </div>
      </a>
    </div>
  );
};

export default AssemblyActaManager;