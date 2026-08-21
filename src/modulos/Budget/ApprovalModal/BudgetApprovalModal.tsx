"use client";
import React from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';
import styles from './BudgetApprovalModal.module.css'; // Crea este archivo CSS si necesitas estilos específicos

interface BudgetApprovalModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean; // Opcional: para deshabilitar botones mientras se procesa
}

const BudgetApprovalModal: React.FC<BudgetApprovalModalProps> = ({
  open,
  onClose,
  onConfirm,
  isLoading = false // Valor por defecto
}) => {
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Confirmar Envío a Aprobación"
      buttonText="" // Ocultamos botones por defecto de DataModal
      buttonCancel="" // Ocultamos botones por defecto de DataModal
    >
      {/* Contenedor para el contenido y padding */}
      <div className={styles.contentContainer}>
        <p>
          <strong>¿Estás seguro de enviar este presupuesto a aprobación?</strong>
        </p>
        <p>
          Una vez enviado, no podrás editar ni modificar su contenido.
          El presupuesto será revisado por el directorio para su validación.
        </p>
        <p>
          Solo podrá ser editado nuevamente si es rechazado.
        </p>
      </div>

      {/* Contenedor para los botones de acción personalizados */}
      <div className={styles.actionButtonsContainer}>
        <Button
          onClick={onClose} // Botón Cancelar simplemente cierra el mod
          variant="secondary"
          disabled={isLoading}
          className={styles.cancelButton} // Clase opcional para estilos
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm} // Botón Confirmar ejecuta la acción
          variant="primary"
          disabled={isLoading}
          className={styles.confirmButton} // Clase opcional para estilos
        >
          Confirmar y enviar a aprobación
        </Button>
      </div>
    </DataModal>
  );
};

export default BudgetApprovalModal;
