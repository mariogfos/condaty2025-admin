'use client';
import React, { useState, useEffect } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import CancelReasonModal from './CancelReasonModal/CancelReasonModal';
import styles from './ReservaModal.module.css';

// --- Iconos (Sin cambios) ---
const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6667 4.27337L11.7267 3.33337L8.00001 7.06004L4.27334 3.33337L3.33334 4.27337L7.06001 8.00004L3.33334 11.7267L4.27334 12.6667L8.00001 8.94004L11.7267 12.6667L12.6667 11.7267L8.94001 8.00004L12.6667 4.27337Z" fill="currentColor"/></svg>;
const CalendarIcon = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.66667 1.66663V4.16663M13.3333 1.66663V4.16663M2.91667 7.58329H17.0833M17.5 6.66663V13.3333C17.5 15 16.6667 16.6666 15 16.6666H5C3.33333 16.6666 2.5 15 2.5 13.3333V6.66663C2.5 5 3.33333 3.33333 5 3.33333H15C16.6667 3.33333 17.5 5 17.5 6.66663Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ClockIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.99999 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33334 7.99999 1.33334C4.31809 1.33334 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.31809 14.6667 7.99999 14.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 4V8L10.6667 9.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const UsersIcon = () => <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.49984 8.125C10.4304 8.125 11.9998 6.55556 11.9998 4.625C11.9998 2.69444 10.4304 1.125 8.49984 1.125C6.56928 1.125 4.99984 2.69444 4.99984 4.625C4.99984 6.55556 6.56928 8.125 8.49984 8.125ZM8.49984 8.125C5.82664 8.125 1.12484 9.1625 1.12484 11.875V13.25C1.12484 13.649 1.45084 13.975 1.84984 13.975H15.1498C15.5488 13.975 15.8748 13.649 15.8748 13.25V11.875C15.8748 9.1625 11.173 8.125 8.49984 8.125Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PriceIcon = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 12.5L12.5 7.5M7.5 7.5H12.5V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

// --- Helper Functions (Placeholder - Implementar con librería de fechas) ---
const formatDate = (dateString:any) => {
  if (!dateString) return 'Fecha no disponible';
  try {
    // Implementación básica - ¡Usar librería para formato localizado!
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString; // Devuelve el string original si falla
  }
};

const formatTime = (timeString:any) => {
    if (!timeString) return '';
    // Asume formato HH:MM:SS
    return timeString.substring(0, 5);
};

const timeAgo = (dateString:any) => {
  if (!dateString) return 'hace un momento';
  try {
    // Implementación MUY básica - ¡Usar librería como date-fns (formatDistanceToNow)!
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `hace ${diffSeconds} segundos`;
    if (diffSeconds < 3600) return `hace ${Math.floor(diffSeconds / 60)} minutos`;
    if (diffSeconds < 86400) return `hace ${Math.floor(diffSeconds / 3600)} horas`;
    return `el ${formatDate(dateString)}`; // O devuelve la fecha si es más antiguo
  } catch (e) {
      return 'Fecha inválida';
  }
};

const getFullName = (owner:any) => {
    if (!owner) return 'Usuario Desconocido';
    const parts = [owner.name, owner.middle_name, owner.last_name, owner.mother_last_name];
    return parts.filter(Boolean).join(' '); // Filtra nulls/vacíos y une con espacio
}

// IMPORTANTE: Debes definir cómo se construyen las URLs de tus imágenes
const getImageUrl = (image:any, areaId:any) => {
    if (!image || !areaId) return 'https://via.placeholder.com/218'; // Imagen placeholder
    // Ejemplo: Asume una estructura de URL (¡AJUSTA ESTO!)
    // return `/api/images/areas/${areaId}/${image.id}.${image.ext}`;
    // O si tienes la URL completa en otro lado:
    // return image.url;
    // Por ahora, un placeholder más específico:
    return `https://via.placeholder.com/218?text=Area+${areaId}+Img+${image.id}`;
}
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---


const ReservaModal = ({ open, onClose, reservaData, onApprove, onCancel }: any) => {
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);

  // Accede a los datos reales desde la prop
  const data = reservaData?.data; // Usamos el objeto 'data' dentro de la respuesta

  // --- Lógica de los handlers (sin cambios, pero usan 'data' actualizado) ---
  const handleOpenCancelReason = () => {
    setShowCancelReasonModal(true);
  };

  const handleCloseCancelReasonOnly = () => {
    setShowCancelReasonModal(false);
  };

  const handleCancelSubmit = (reason: string) => {
    console.log("Motivo de cancelación:", reason);
    if (onCancel && data?.id) { // Verifica que tengamos ID
        onCancel(data.id, reason);
    }
    handleCloseCancelReasonOnly();
    onClose();
  };

  const handleApproveClick = () => {
    console.log("Reserva aprobada:", data?.id);
    if (onApprove && data?.id) { // Verifica que tengamos ID
        onApprove(data.id);
    }
    onClose();
  };
  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

  // Renderizado Condicional si no hay datos
  if (!open) return null; // No renderizar si no está abierto
  if (!data) {
      // Puedes mostrar un estado de carga o un mensaje si los datos aún no llegan
      // o si la estructura no es la esperada
      return (
          <DataModal open={open} onClose={onClose} buttonText="" buttonCancel="">
              <div>Cargando datos de la reserva o datos inválidos...</div>
          </DataModal>
      );
  }

  // Determinar la URL de la imagen principal
  const mainImage = data.area?.images?.[0];
  const imageUrl = getImageUrl(mainImage, data.area?.id);

  // Formatear datos para mostrar
  const userName = getFullName(data.owner);
  const userUnit = `${data.dpto?.nro ?? 'N/A'}${data.dpto?.description ? ` (${data.dpto.description})` : ''}`;
  const requestTimeFormatted = timeAgo(data.created_at);
  const reservationDateFormatted = formatDate(data.date_at);
  const startTimeFormatted = formatTime(data.start_time);
  // const timeRangeFormatted = startTimeFormatted; // Solo tenemos hora de inicio
  // ¡Falta la duración o la hora de fin en los datos! Mostramos solo inicio por ahora.
  const timeRangeText = `Inicia: ${startTimeFormatted}`;
  const peopleText = `${data.people_count ?? '?'} personas`;
  // Precio - Asumimos que 'amount' es el total. Falta precio/h y horas.
  const amountValue = parseFloat(data.amount);
  const priceText = amountValue > 0 ? `Total: Bs ${amountValue.toFixed(2)}` : 'Sin costo asociado';
  const priceMutedText = ''; // No tenemos precio por hora en los datos


  return (
    <>
      <DataModal
        open={open}
        onClose={onClose}
        buttonText="" // Oculta botones por defecto
        buttonCancel="" // Oculta botones por defecto

      >
        {/* Cabecera personalizada */}
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <span className={styles.title}>Detalle de la reserva</span>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
             <CloseIcon />
           </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className={styles.detailsCard}>
          {/* Info Usuario */}
          <div className={styles.userInfoRow}>
            <div className={styles.userInfo}>
              {/* Avatar Placeholder - API no provee imagen de usuario */}
              <img className={styles.avatar} src="https://via.placeholder.com/40?text=User" alt="Avatar" />
              <div className={styles.userNameUnit}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userUnit}>{userUnit}</span>
              </div>
            </div>
            <span className={styles.requestTime}>Solicitado: {requestTimeFormatted}</span>
          </div>

          {/* Contenido Principal (Imagen y Detalles) */}
          <div className={styles.mainContent}>
            <img className={styles.areaImage} src={imageUrl} alt={data.area?.title ?? 'Imagen del área'} />
            <div className={styles.detailsColumn}>
              {/* Descripción Area */}
              <div className={styles.descriptionArea}>
                 <span className={styles.areaName}>{data.area?.title ?? 'Área sin nombre'}</span>
                 {/* Mostrar descripción si existe */}
                 {data.area?.description && (
                    <span className={styles.areaDescription}>{data.area.description}</span>
                 )}
                 {/* Mostrar observación de la reserva si existe */}
                 {data.obs && (
                    <div className={styles.observationSection}>
                        <span className={styles.detailsTitle}>Observación:</span>
                        <span className={styles.areaDescription}>{data.obs}</span>
                    </div>
                 )}
              </div>

              {/* Lista de Detalles */}
              <div className={styles.detailsListSection}>
                <span className={styles.detailsTitle}>Detalles</span>
                <div className={styles.detailsList}>
                  {/* Fecha */}
                  <div className={styles.detailItem}>
                    <div className={styles.iconWrapper}><CalendarIcon /></div>
                    <span className={styles.detailText}>{reservationDateFormatted}</span>
                  </div>
                  {/* Hora */}
                  <div className={styles.detailItem}>
                    <div className={styles.iconWrapper}><ClockIcon /></div>
                    <span className={styles.detailText}>{timeRangeText}</span>
                  </div>
                  {/* Personas */}
                  <div className={styles.detailItem}>
                     <div className={styles.iconWrapper}><UsersIcon /></div>
                    <span className={styles.detailText}>{peopleText}</span>
                  </div>
                  {/* Precio */}
                   {/* Mostramos el precio solo si es relevante (mayor a 0 o si siempre quieres mostrarlo) */}
                   {amountValue >= 0 && ( // O cambia la condición si quieres mostrar "Sin costo"
                       <div className={styles.detailItem}>
                         <div className={styles.iconWrapper}><PriceIcon /></div>
                         {/* <span className={styles.detailTextMuted}>{priceMutedText}</span> */}
                         <span className={styles.detailText}>{priceText}</span>
                       </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción Personalizados */}
        <div className={styles.buttonRow}>
          <button className={styles.cancelButton} onClick={handleOpenCancelReason}>
            Cancelar solicitud
          </button>
          <button className={styles.approveButton} onClick={handleApproveClick}>
            Aprobar solicitud
          </button>
        </div>
      </DataModal>

      {/* Modal de Motivo de Cancelación */}
      <CancelReasonModal
        open={showCancelReasonModal}
        onClose={handleCloseCancelReasonOnly}
        onSubmit={handleCancelSubmit}
      />
    </>
  );
};

export default ReservaModal;

// --- Añade estilos para la observación si es necesario en ReservaModal.module.css ---
/*
.observationSection {
    margin-top: var(--spS, 8px);
    padding-top: var(--spS, 8px);
    border-top: 1px solid var(--cWhiteV2, #4a4a4a); // Separador opcional
}
*/