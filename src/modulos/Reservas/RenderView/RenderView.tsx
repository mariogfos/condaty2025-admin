// ./RenderView/RenderView.tsx (O ReservationDetailModal.tsx)
"use client";
import React, { useState } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';

import useAxios from '@/mk/hooks/useAxios'; // Asegúrate que la ruta sea correcta
// import { useAuth } from '@/mk/contexts/AuthProvider'; // Descomenta si useAxios lo necesita o si usas showToast
import { getFullName, getUrlImages } from '@/mk/utils/string'; // Asegúrate que las rutas sean correctas
import { format, parseISO, formatDistanceToNowStrict, format as formatDateFns } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './ReservationDetailModal.module.css'; // Asegúrate que la ruta sea correcta
import {
    IconCalendar,
    IconClock,
    IconCash,
    IconGroup
    // IconX, // No se usa, se puede quitar si no se prevé usar
} from '@/components/layout/icons/IconsBiblioteca'; // Asegúrate que la ruta sea correcta

// --- INTERFAZ DE DATOS ACTUALIZADA ---
interface Image {
    id: number | string;
    area_id: string;
    ext: string;
}

interface Area {
    id: string;
    title: string;
    description: string;
    price: string; // Puede ser '0.00' o un valor numérico como string
    is_free: 'A' | 'X' | string; // 'A' podría ser Gratis, 'X' No Gratis (basado en tu ejemplo)
    booking_mode: 'hour' | 'day' | string;
    cancellable?: 'A' | 'X' | string; // Añadido desde la API
    min_cancel_hours?: number | null; // Añadido desde la API
    late_cancellation_penalty?: 'A' | 'X' | string; // Añadido desde la API
    cancellation_policy?: string | null; // Añadido desde la API
    penalty_fee?: string | null; // Añadido desde la API
    images: Image[];
    updated_at?: string; // Manteniendo como opcional
}

interface Dpto {
    id: number | string;
    nro?: string | null;
    description?: string | null;
}

interface Owner {
    id: string;
    name?: any;
    middle_name?: any;
    last_name?: any;
    mother_last_name?: any;
    created_at: any; // ISO 8601
    updated_at: any; // ISO 8601
}

interface Period {
    id: number | string;
    area_id: string;
    time_from: string; // HH:MM:SS
    time_to: string; // HH:MM:SS
    // pivot no es necesario usualmente en el frontend
}

interface ReservationData {
    id: string | number;
    area_id: string;
    owner_id: string;
    client_id: string;
    dpto_id: number | null;
    date_at: string; // YYYY-MM-DD
    date_end?: string | null; // Puede no estar presente o ser null
    people_count: number;
    amount: string; // Monto total como string
    paid_at?: string | null; // Fecha de pago
    approved_at?: string | null; // YYYY-MM-DD HH:MM:SS
    is_approved?: 'Y' | 'N' | string | null; // Estado de aprobación
    approved_by?: string | null; // ID del usuario que aprobó
    obs?: string | null; // Observaciones
    reason?: string | null; // Razón (quizás para rechazo)
    start_time: string; // HH:MM:SS
    status: string; // 'A' (Approved), 'W' (Waiting), 'R' (Rejected), etc.
    created_at: string; // ISO 8601
    updated_at: string; // ISO 8601
    deleted_at?: string | null; // Fecha de borrado lógico
    periods: Period[];
    area: Area; // Area es obligatoria según la API de ejemplo
    dpto: Dpto | null; // Dpto puede ser null según la API de ejemplo
    owner: Owner; // Owner es obligatorio según la API de ejemplo
}
// --- FIN INTERFAZ DE DATOS ---


// --- INTERFAZ DE PROPS (Sin cambios respecto a la versión anterior) ---
interface ReservationDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: ReservationData | null;
  reLoad?: () => void; // Para refrescar la lista en el componente padre
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  open,
  onClose,
  item: reservationData,
  reLoad
}) => {

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { execute } = useAxios();
  // const { showToast } = useAuth(); // Descomenta si usas notificaciones

  // --- Funciones Helper (Ajuste en getPriceDetails) ---
  const getFormattedRequestTime = (isoDate: string): string => {
    try { return formatDistanceToNowStrict(parseISO(isoDate), { addSuffix: true, locale: es }); }
    catch { return 'Fecha inválida'; }
  };

  const getFormattedReservationDate = (dateStr: string): string => {
    // Asegurarse que dateStr es solo la fecha YYYY-MM-DD
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Fecha inválida';
    try {
        // Añadir hora fija para evitar problemas de zona horaria al parsear solo fecha
        const date = parseISO(dateStr + 'T00:00:00');
        return format(date, "EEEE, d 'de' MMMM", { locale: es });
    } catch {
        return 'Fecha inválida';
    }
  };

  const getFormattedReservationTime = (periods: Period[] | undefined | null): string => {
    // 1. Validar entrada (sin cambios)
    if (!periods || periods.length === 0) return 'Horario no especificado';

    try {
      // 2. Ordenar periodos (buena práctica, sin cambios)
      const sortedPeriods = [...periods].sort((a, b) => a.time_from.localeCompare(b.time_from));

      // 3. Mapear CADA periodo a su string formateado "HH:MM - HH:MM"
      const formattedPeriodStrings = sortedPeriods.map(period => {
        // Extraer solo HH:MM de las horas
        const startTime = period.time_from.substring(0, 5);
        const endTime = period.time_to.substring(0, 5);
        // Devolver el string para este periodo específico
        return `${startTime} - ${endTime}`;
      });

      // 4. Unir todos los strings formateados con " / " como separador
      return formattedPeriodStrings.join(' / ');

    } catch (error) {
      // Manejo de error (sin cambios)
      console.error("Error formateando horario de reserva:", error);
      return 'Horario inválido';
    }
  };

  const getPriceDetails = (area: Area | undefined | null, totalAmount: string): string => {
      if (!area) return 'Detalles de precio no disponibles';
      // Ajuste: Asumiendo 'X' significa No Gratis, y cualquier otra cosa (o 'A') es Gratis
      if (area.is_free !== 'X' && parseFloat(area.price) <= 0) return 'Gratis';

      const price = parseFloat(area.price);
      const mode = area.booking_mode === 'hour' ? '/h' : '/día';
      const total = parseFloat(totalAmount);

      if (isNaN(price) || isNaN(total)) return 'Precio no disponible';

      // Mostrar precio por unidad solo si es mayor a 0
      if (price > 0) {
          return `Bs ${price.toFixed(2)}${mode} - Total: Bs ${total.toFixed(2)}`;
      } else {
          // Si el precio por unidad es 0 pero hay un total, mostrar solo el total
          return `Total: Bs ${total.toFixed(2)}`;
      }
  };

  // --- Handlers (Sin cambios respecto a la versión anterior) ---
  const handleAcceptClick = async () => {
    if (!reservationData) return;

    setIsActionLoading(true);
    setActionError(null);

    const now = new Date();
    const formattedDate = formatDateFns(now, 'yyyy-MM-dd HH:mm:ss');

    const payload = {
      approved_at: formattedDate,
      is_approved: 'Y',
      obs: 'Aprobado' // Opcional: Cambiar o añadir input
    };

    try {
      await execute({
        url: `/reservations/${reservationData.id}`,
        method: 'PUT',
        data: payload,
      });
      // showToast('Reserva aprobada exitosamente.', 'success');
      if (reLoad) reLoad();
      onClose();
    } catch (error: any) {
      console.error("Error al aprobar reserva:", error);
      setActionError(error?.response?.data?.message || error?.message || 'Ocurrió un error al aprobar.');
      // showToast(`Error: ${error?.response?.data?.message || 'No se pudo aprobar'}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectClick = async () => {
    if (!reservationData) return;

     // Usar un prompt simple para la observación (mejorar UX si es necesario)
     const obs = prompt("Por favor, introduce un motivo para el rechazo (opcional):");
     // Si el usuario cancela el prompt, no continuar
     // if (obs === null) return; // Descomenta si quieres que cancelar el prompt detenga la acción

    setIsActionLoading(true);
    setActionError(null);

    const payload = {
      is_approved: 'N',
      obs: obs || 'Rechazado' // Usar observación o valor por defecto
    };

    try {
      await execute({
        url: `/reservations/${reservationData.id}`,
        method: 'PUT',
        data: payload,
      });
      // showToast('Reserva rechazada.', 'info');
      if (reLoad) reLoad();
      onClose();
    } catch (error: any) {
      console.error("Error al rechazar reserva:", error);
      setActionError(error?.response?.data?.message || error?.message || 'Ocurrió un error al rechazar.');
      // showToast(`Error: ${error?.response?.data?.message || 'No se pudo rechazar'}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- Renderizado ---
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de la Reserva"
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.modalContent}>

        {!reservationData ? (
          <div className={styles.loadingContainer}>Cargando datos...</div>
        ) : (
          <>
            <div className={styles.reservationBlock}>
              {/* Info Solicitante */}
              <div className={styles.requesterSection}>
                 <div className={styles.requesterInfoContainer}>
                    <div className={styles.requesterText}>
                      {/* Usa getFullName que debería manejar nombres/apellidos nulos */}
                      <span className={styles.requesterName}>{getFullName(reservationData.owner)}</span>
                      {/* Muestra Dpto solo si existe */}
                      {reservationData.dpto && (
                        <span className={styles.requesterApt}>
                           Dpto: {reservationData.dpto.nro || reservationData.dpto.description || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Muestra hace cuánto se creó */}
                  <span className={styles.requestTime}>{getFormattedRequestTime(reservationData.created_at)}</span>
              </div>

              {/* Imagen + Detalles */}
              <div className={styles.mainDetailsContainer}>
                {/* Imagen */}
                <div className={styles.imageWrapper}>
                  {reservationData.area?.images?.length > 0 ? (
                    <img
                      // Construye la URL de la imagen (ajusta getUrlImages si es necesario)
                      src={getUrlImages(`/AREA-${reservationData.area.id}-${reservationData.area.images[0].id}.${reservationData.area.images[0].ext}?d=${reservationData.area.updated_at || Date.now()}`)}
                      alt={`Imagen de ${reservationData.area.title}`}
                      className={styles.areaImage}
                      onError={(e) => { e.currentTarget.src = '/placeholder-image.png'; /* Opcional: Imagen por defecto */ }}
                    />
                  ) : (
                    <div className={`${styles.areaImage} ${styles.imagePlaceholder}`}>
                      <span className={styles.imagePlaceholderText}>Sin Imagen</span>
                    </div>
                  )}
                </div>
                {/* Detalles */}
                <div className={styles.detailsColumn}>
                    <div className={styles.areaTextInfo}>
                       <span className={styles.areaTitle}>{reservationData.area?.title ?? 'Área desconocida'}</span>
                       <span className={styles.areaDescription}>{reservationData.area?.description ?? 'Sin descripción'}</span>
                    </div>
                     <div className={styles.specificDetails}>
                       <span className={styles.detailsHeader}>Detalles de la Reserva</span>
                       <div className={styles.detailsList}>
                         {/* Fecha */}
                         <div className={styles.detailItem}>
                            <IconCalendar size={18} className={styles.detailIcon} />
                            <span className={styles.detailText}>{getFormattedReservationDate(reservationData.date_at)}</span>
                         </div>
                         {/* Hora */}
                         <div className={styles.detailItem}>
                            <IconClock size={18} className={styles.detailIcon} />
                            <span className={styles.detailText}>{getFormattedReservationTime(reservationData.periods)}</span>
                         </div>
                         {/* Personas */}
                         <div className={styles.detailItem}>
                            <IconGroup size={18} className={styles.detailIcon} />
                            <span className={styles.detailText}>{reservationData.people_count} persona{reservationData.people_count !== 1 ? 's' : ''}</span>
                         </div>
                          {/* Precio */}
                         <div className={styles.detailItem}>
                            <IconCash size={18} className={styles.detailIcon} />
                            <span className={styles.priceDetailText}>{getPriceDetails(reservationData.area, reservationData.amount)}</span>
                         </div>
                         {/* Observación del usuario (si existe) */}
                         {reservationData.obs && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailIcon}>📝</span> {/* Puedes usar un icono real */}
                                <span className={styles.detailText}>Obs: {reservationData.obs}</span>
                             </div>
                         )}
                       </div>
                     </div>
                </div>
              </div>
            </div> {/* Fin reservationBlock */}

             {/* Mensaje de error de la acción */}
            {actionError && (
                <div className={styles.errorText} style={{color: 'red', marginTop: '10px', textAlign: 'center', padding: '5px', border: '1px solid red', borderRadius: '4px'}}>
                    Error: {actionError}
                </div>
            )}

            {/* Botones Condicionales (Solo si status es 'W' - Waiting/Pendiente) */}
            {reservationData.status === 'W' && (
              <div className={styles.actionButtonsContainer}>
                <Button
                  onClick={handleRejectClick}
                  variant="secondary"
                  disabled={isActionLoading}
                >
                  Rechazar
                </Button>
                <Button
                  onClick={handleAcceptClick}
                  variant="primary"
                  disabled={isActionLoading}
                >
                  Aprobar
                </Button>
              </div>
            )}
            

          </>
        )}
      </div>
    </DataModal>
  );
};

export default ReservationDetailModal;