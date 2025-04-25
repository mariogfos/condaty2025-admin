// ./RenderView/RenderView.tsx (Este es tu ReservationDetailModal)
"use client"; // Asegúrate que esté si usas hooks de cliente
import React, { useState, useEffect } from 'react'; // Quita useState/useEffect si ya no los necesitas aquí
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';

// import useAxios from '@/mk/hooks/useAxios'; // <--- YA NO SE NECESITA AQUÍ
// import { useAuth } from '@/mk/contexts/AuthProvider'; // <--- YA NO SE NECESITA AQUÍ (a menos que uses showToast para acciones internas)
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './ReservationDetailModal.module.css'; // Asume que este es el CSS correcto
import {
    IconCalendar,
    IconClock,

    IconCash,
    IconX,
    IconGroup
} from '@/components/layout/icons/IconsBiblioteca';
// import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen'; // <--- YA NO SE NECESITA AQUÍ

// --- INTERFAZ DE PROPS MODIFICADA ---
interface ReservationDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: ReservationData | null; // <-- RECIBE 'item' CON LOS DATOS COMPLETOS
  onAccept?: (reservationId: string | number) => void;
  onReject?: (reservationId: string | number) => void;
  reLoad?: () => void; // Prop de useCrud, puede o no ser útil aquí
  // extraData?: any; // Prop de useCrud, puedes recibirla si la necesitas
}

// Interfaz de datos (mantenla o mejórala)
interface ReservationData {
    id: string | number;
    status: string;
    created_at: string;
    owner: { name: string; last_name?: string; /* ... */ };
    dpto: { nro?: string; description?: string; /* ... */ } | null;
    area: {
        id: string | number;
        title: string;
        description: string;
        price: string;
        is_free: string;
        booking_mode: string;
        images: { id: string | number; area_id: string | number; ext: string }[];
        updated_at?: string;
    };
    date_at: string;
    start_time: string;
    people_count: number;
    amount: string;
    periods: { id: string | number; time_from: string; time_to: string }[];
}
// --- FIN INTERFAZ DE PROPS ---

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  open,
  onClose,
  item: reservationData, // <-- Renombra la prop 'item' a 'reservationData' para uso interno
  onAccept,
  onReject,
  reLoad
}) => {

  // --- ESTADOS Y EFECTOS PARA FETCH INTERNO ELIMINADOS ---
  // const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const { execute } = useAxios();
  // useEffect(() => { fetchDetails... }, []);
  // --- FIN ELIMINACIÓN ---


  // --- Funciones Helper (sin cambios, ahora usan 'reservationData' directamente) ---
  const getFormattedRequestTime = (isoDate: string): string => {
    try { return formatDistanceToNowStrict(parseISO(isoDate), { addSuffix: true, locale: es }); }
    catch { return 'Fecha inválida'; }
  };
  const getFormattedReservationDate = (dateStr: string): string => {
    try { const date = parseISO(dateStr + 'T00:00:00'); return format(date, "EEEE, d 'de' MMMM", { locale: es }); }
    catch { return 'Fecha inválida'; }
  };
  const getFormattedReservationTime = (periods: ReservationData['periods'] | undefined | null, startTime: string): string => { // Added null check
    if (!periods || periods.length === 0) return 'Horario no especificado';
     try { /* ... (lógica igual) ... */ return `...`; } // Tu lógica aquí
     catch { return 'Horario inválido'; }
  };
  const getPriceDetails = (area: ReservationData['area'] | undefined | null, totalAmount: string): string => { // Added null check
      if(!area) return '...';
      if (area.is_free === 'A') return 'Gratis';
      const price = parseFloat(area.price);
      const mode = area.booking_mode === 'hour' ? '/h' : '/día';
      const total = parseFloat(totalAmount);
      if (isNaN(price)) return 'Precio no disponible';
      if(price > 0) return `Bs ${price.toFixed(2)}${mode} - Total: Bs ${total.toFixed(2)}`;
      return `Total: Bs ${total.toFixed(2)}`;
  };

  // --- Handlers (sin cambios) ---
  const handleAcceptClick = () => { /* ... */ };
  const handleRejectClick = () => { /* ... */ };

  // --- Renderizado ---
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de la reserva"
      buttonText=""
      buttonCancel=""
 
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
         
        
        </div>

        {/* Muestra contenido SOLO si reservationData (antes 'item') existe */}
        {!reservationData ? (
          // Muestra un mensaje o spinner si 'item' es null (podría pasar brevemente)
          <div className={styles.loadingContainer}>Cargando datos...</div>
        ) : (
          // Si hay datos, renderiza el contenido
          <>
            <div className={styles.reservationBlock}>
              {/* Info Solicitante */}
              <div className={styles.requesterSection}>
                 <div className={styles.requesterInfoContainer}>
                    <div className={styles.requesterText}>
                      <span className={styles.requesterName}>{getFullName(reservationData.owner)}</span>
                      <span className={styles.requesterApt}>{/* ... Depto ... */}</span>
                    </div>
                  </div>
                  <span className={styles.requestTime}>{getFormattedRequestTime(reservationData.created_at)}</span>
              </div>

              {/* Imagen + Detalles */}
              <div className={styles.mainDetailsContainer}>
                {/* Imagen */}
                <div className={styles.imageWrapper}>
                  {reservationData.area?.images?.length > 0 ? ( // Acceso seguro
                    <img
                      src={getUrlImages(`/AREA-${reservationData.area.id}-${reservationData.area.images[0].id}.webp?d=${reservationData.area.updated_at || Date.now()}`)}
                      alt={`Imagen de ${reservationData.area.title}`}
                      className={styles.areaImage}
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
                       <span className={styles.areaTitle}>{reservationData.area?.title}</span> {/* Acceso seguro */}
                       <span className={styles.areaDescription}>{reservationData.area?.description}</span> {/* Acceso seguro */}
                    </div>
                     <div className={styles.specificDetails}>
                       <span className={styles.detailsHeader}>Detalles</span>
                       <div className={styles.detailsList}>
                         {/* Fecha */}
                         <div className={styles.detailItem}>
                            <IconCalendar size={18} className={styles.detailIcon} />
                            <span className={styles.detailText}>{getFormattedReservationDate(reservationData.date_at)}</span>
                         </div>
                         {/* Hora */}
                         <div className={styles.detailItem}>
                            <IconClock size={18} className={styles.detailIcon} />
                            <span className={styles.detailText}>{getFormattedReservationTime(reservationData.periods, reservationData.start_time)}</span>
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
                       </div>
                     </div>
                </div>
              </div>
            </div> {/* Fin reservationBlock */}

            {/* Botones Condicionales */}
            {reservationData.status === 'W' && (
              <div className={styles.actionButtonsContainer}>
                <Button onClick={handleRejectClick} variant="secondary"> {/* Ajusta variant si es necesario */}
                  Rechazar solicitud
                </Button>
                <Button onClick={handleAcceptClick} variant="primary">
                  Aprobar solicitud
                </Button>
              </div>
            )}
          </> // Fin del renderizado condicional de datos
        )}
      </div> {/* Fin modalContent */}
    </DataModal>
  );
};

// Asegúrate de exportar el componente
export default ReservationDetailModal; // O RenderView si mantienes ese nombre de archivo