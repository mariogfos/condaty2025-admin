'use client';
import React, { useState } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal'; // Asegúrate que la ruta sea correcta
import TextArea from '@/mk/components/forms/TextArea/TextArea'; // Asumiendo que tienes un componente TextArea
// Si no tienes TextArea, puedes usar un <textarea> normal y estilizarlo.
import styles from '../ReservaModal.module.css'; // Reutiliza los estilos o crea uno nuevo si prefieres

// --- Iconos (Placeholder - Reemplaza con tus iconos reales SVG o de una librería) ---
const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6667 4.27337L11.7267 3.33337L8.00001 7.06004L4.27334 3.33337L3.33334 4.27337L7.06001 8.00004L3.33334 11.7267L4.27334 12.6667L8.00001 8.94004L11.7267 12.6667L12.6667 11.7267L8.94001 8.00004L12.6667 4.27337Z" fill="currentColor"/></svg>;
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

const CancelReasonModal = ({ open, onClose, onSubmit }: any) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleReasonChange = (e: any) => {
    setReason(e.target.value);
    if (error) setError(''); // Limpia el error al empezar a escribir
  };

  const handleSubmitClick = () => {
    if (!reason.trim()) {
      setError('El motivo es requerido.');
      return;
    }
    onSubmit(reason); // Llama a la función onSubmit pasada como prop
  };

  // Limpia el estado cuando el modal se cierra
  const handleClose = () => {
      setReason('');
      setError('');
      onClose();
  }

  return (
    <DataModal
      open={open}
      onClose={handleClose}
      onSave={handleSubmitClick}
      buttonCancel=''
      buttonText=''
      
    >
      {/* Cabecera personalizada */}
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <span className={styles.title}>Cancelar solicitud</span>
        </div>
       
      </div>

      {/* Instrucciones */}
      <span className={styles.instructionText}>
        Por favor indica el motivo para que el residente pueda comprender e intente solicitar esta área social de manera correcta
      </span>

      {/* Campo de Motivo */}
      {/* Usando un componente TextArea existente */}
       <TextArea
         label="Motivo*" // La etiqueta se maneja dentro del componente TextArea
         name="reason"
         value={reason}
         onChange={handleReasonChange}
         placeholder="Escribe aquí el motivo..." // Placeholder opcional
         error={error ? { reason: error } : {}} // Pasa el error si existe
         required
         className={styles.reasonTextArea} // Clase para estilizar el contenedor del TextArea si es necesario
         // Clase para estilizar el input/textarea interno
       />

      {/* Alternativa con <textarea> básico si no tienes componente TextArea
      <div className={styles.reasonInputContainer}>
        <label htmlFor="cancelReason" className={styles.reasonLabel}>Motivo*</label>
        <textarea
          id="cancelReason"
          name="reason"
          value={reason}
          onChange={handleReasonChange}
          className={`${styles.reasonTextAreaInput} ${error ? styles.inputError : ''}`}
          placeholder="Escribe aquí el motivo..."
          rows={3} // Ajusta según necesites
        />
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
      */}


      {/* Botones de Acción */}
      <div className={styles.buttonRow}>
        <button className={styles.exitButton} onClick={handleClose}>
          Salir
        </button>
        <button className={styles.confirmCancelButton} onClick={handleSubmitClick}>
          Cancelar solicitud
        </button>
      </div>
    </DataModal>
  );
};

export default CancelReasonModal;