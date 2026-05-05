"use client";

import { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import styles from "./AssemblyStatusActions.module.css";
import { Assembly, AssemblyStatus, STATUS_LABELS } from "../../types/assemblies.types";
import useAxios from "@/mk/hooks/useAxios";

interface AssemblyStatusActionsProps {
  assembly: Assembly;
  onStatusChange: (assembly: Assembly) => void;
}

const STATUS_FLOW: Record<AssemblyStatus, AssemblyStatus[]> = {
  [AssemblyStatus.Scheduled]: [AssemblyStatus.InProgress, AssemblyStatus.Cancelled],
  [AssemblyStatus.InProgress]: [AssemblyStatus.Completed, AssemblyStatus.Cancelled],
  [AssemblyStatus.Completed]: [AssemblyStatus.Scheduled],
  [AssemblyStatus.Cancelled]: [AssemblyStatus.Scheduled],
};

const AssemblyStatusActions: React.FC<AssemblyStatusActionsProps> = ({
  assembly,
  onStatusChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationObservation, setCancellationObservation] = useState("");
  const { execute: changeStatus } = useAxios();

  const currentStatus = assembly.status as AssemblyStatus;
  const allowedTransitions = STATUS_FLOW[currentStatus] || [];

  const handleStatusChange = async (newStatus: AssemblyStatus) => {
    if (isLoading) return;

    // If cancelling, open the modal to collect observation
    if (newStatus === AssemblyStatus.Cancelled) {
      setIsCancelModalOpen(true);
      return;
    }

    await performStatusChange(newStatus, undefined);
  };

  const performStatusChange = async (
    newStatus: AssemblyStatus,
    cancellationObservation?: string
  ) => {
    setIsLoading(true);
    try {
      const payload: Record<string, any> = { status: newStatus };
      if (
        newStatus === AssemblyStatus.Cancelled &&
        cancellationObservation?.trim()
      ) {
        payload.cancellation_observation = cancellationObservation.trim();
      }

      const response = await changeStatus(
        `/assemblies/${assembly.id}/status`,
        "PATCH",
        payload,
        false,
        true
      );

      if (response?.data) {
        onStatusChange({
          ...assembly,
          status: newStatus,
        });
      }
      setIsCancelModalOpen(false);
      setCancellationObservation("");
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: AssemblyStatus) => STATUS_LABELS[status];

  return (
    <>
      <div className={styles.container}>
        <span className={styles.currentStatus}>
          Estado: {getStatusLabel(currentStatus)}
        </span>

        <div className={styles.actions}>
          {allowedTransitions.map((status) => (
            <Button
              key={status}
              variant="secondary"
              small={true}
              onClick={() => handleStatusChange(status)}
              disabled={isLoading}
            >
              {status === AssemblyStatus.InProgress && "Iniciar"}
              {status === AssemblyStatus.Completed && "Completar"}
              {status === AssemblyStatus.Cancelled && "Cancelar"}
              {status === AssemblyStatus.Scheduled && "Reagendar"}
            </Button>
          ))}
        </div>
      </div>

      <DataModal
        title="Cancelar Asamblea"
        open={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancellationObservation("");
        }}
        onSave={() => performStatusChange(AssemblyStatus.Cancelled, cancellationObservation)}
        buttonText={isLoading ? "Cancelando..." : "Confirmar Cancelación"}
        disabled={isLoading}
        maxWidth={500}
      >
        <TextArea
          name="cancellation_observation"
          label="Motivo de cancelación"
          value={cancellationObservation}
          onChange={(e) => setCancellationObservation(e.target.value)}
          placeholder="Escribe el motivo por el cual se cancela esta asamblea..."
          required={false}
        />
      </DataModal>
    </>
  );
};

export default AssemblyStatusActions;