"use client";

import { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./AssemblyStatusActions.module.css";
import { Assembly, AssemblyStatus, STATUS_LABELS } from "../../types/assemblies.types";
import useAxios from "@/mk/hooks/useAxios";

interface AssemblyStatusActionsProps {
  assembly: Assembly;
  onStatusChange: (assembly: Assembly) => void;
}

const STATUS_FLOW: Record<AssemblyStatus, AssemblyStatus[]> = {
  S: ["P", "X"], // Scheduled -> InProgress or Cancelled
  P: ["C", "X"], // InProgress -> Completed or Cancelled
  C: ["S"],      // Completed -> Scheduled (reabrir)
  X: ["S"],     // Cancelled -> Scheduled (reabrir)
};

const AssemblyStatusActions: React.FC<AssemblyStatusActionsProps> = ({
  assembly,
  onStatusChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { execute: changeStatus, loading } = useAxios();

  const currentStatus = assembly.status as AssemblyStatus;
  const allowedTransitions = STATUS_FLOW[currentStatus] || [];

  const handleStatusChange = async (newStatus: AssemblyStatus) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await changeStatus(
        `/assemblies/${assembly.id}/status`,
        "PATCH",
        { status: newStatus },
        false,
        true
      );

      if (response?.data) {
        onStatusChange({
          ...assembly,
          status: newStatus,
        });
      }
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: AssemblyStatus) => STATUS_LABELS[status];

  return (
    <div className={styles.container}>
      <span className={styles.currentStatus}>
        Estado: {getStatusLabel(currentStatus)}
      </span>
      
      <div className={styles.actions}>
        {allowedTransitions.map((status) => (
          <Button
            key={status}
            variant="secondary"
            size="small"
            onClick={() => handleStatusChange(status)}
            disabled={isLoading}
          >
            {status === "P" && "Iniciar"}
            {status === "C" && "Completar"}
            {status === "X" && "Cancelar"}
            {status === "S" && "Reagendar"}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AssemblyStatusActions;