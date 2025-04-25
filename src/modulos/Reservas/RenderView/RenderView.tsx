// Asume que este archivo se llama ReservationDetailModal.tsx o RenderView.tsx
// Ajusta la ruta de importación en el componente padre según el nombre real del archivo.
import React, { useState, useEffect } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';
import Icon from '@/mk/components/ui/Icon/Icon';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { format, parseISO, differenceInHours, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './ReservationDetailModal.module.css'; // Asegúrate que el nombre del archivo CSS coincida
import {
    IconCalendar,
   /*  IconClock,
    IconUsers,
    IconCash, */
    IconX
} from '@/components/layout/icons/IconsBiblioteca'; // Ajusta la ruta
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen';

interface ReservationData {
    id: string | number;
    status: string;
    created_at: string;
    owner: { name: string; last_name?: string; updated_at?: string; id?: string; }; // Added optional fields used by getFullName/Avatar maybe
    dpto: { nro?: string; description?: string; } | null;
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

interface ReservationDetailModalProps {
  open: boolean;
  onClose: () => void;
  item?: ReservationData | null; // Optional: Datos directos
  reservationId?: string | number | null; // Optional: ID para buscar
  onAccept?: (reservationId: string | number) => void;
  onReject?: (reservationId: string | number) => void;
  reLoad?: () => void;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  open,
  onClose,
  item: propItem,
  reservationId: propReservationId,
  onAccept,
  onReject,
  reLoad
}) => {
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { execute } = useAxios();
  const { showToast } = useAuth();

  useEffect(() => {
    if (open) {
      setError(null);
      if (propItem) {
        setReservationData(propItem);
        setLoading(false);
      } else if (propReservationId) {
        const fetchDetails = async () => {
          setLoading(true);
          setReservationData(null);
          try {
            const response = await execute(`/reservations/${propReservationId}?fullType=DET`, "GET", {}, false, true);
            let data: ReservationData | null = null;
            if (response.success) {
                if (Array.isArray(response.data) && response.data.length > 0) { data = response.data[0]; }
                else if (typeof response.data === 'object' && response.data !== null && !Array.isArray(response.data)) { data = response.data; }
            }
            if (data) { setReservationData(data); }
            else { throw new Error(response.message || `No se encontraron detalles para la reserva ID: ${propReservationId}.`); }
          } catch (err: any) {
            console.error("Error fetching reservation details by ID:", err);
            setError(err.message || "Ocurrió un error al buscar detalles.");
          } finally {
            setLoading(false);
          }
        };
        fetchDetails();
      } else {
        console.error("ReservationDetailModal: Se requiere la prop 'item' o 'reservationId'.");
        setError("Falta información para cargar los detalles.");
        setReservationData(null);
        setLoading(false);
      }
    }
  }, [open, propItem, propReservationId, execute]);


  const getFormattedRequestTime = (isoDate: string): string => {
    try { return formatDistanceToNowStrict(parseISO(isoDate), { addSuffix: true, locale: es }); }
    catch { return 'Fecha inválida'; }
  };

  const getFormattedReservationDate = (dateStr: string): string => {
    try { const date = parseISO(dateStr + 'T00:00:00'); return format(date, "EEEE, d 'de' MMMM", { locale: es }); }
    catch { return 'Fecha inválida'; }
  };

  const getFormattedReservationTime = (periods: ReservationData['periods'] | undefined | null, startTime: string): string => {
    if (!periods || periods.length === 0) return 'Horario no especificado';
     try {
       const firstPeriodStart = periods[0].time_from;
       const lastPeriodEnd = periods[periods.length - 1].time_to;
       const startH = parseInt(firstPeriodStart.split(':')[0]);
       const endH = parseInt(lastPeriodEnd.split(':')[0]);
       const startM = parseInt(firstPeriodStart.split(':')[1]);
       const endM = parseInt(lastPeriodEnd.split(':')[1]);
       let durationHours = endH - startH;
       if (endM < startM) durationHours -= 1;
        if (durationHours <= 0) durationHours = 1;
       const displayStartTime = firstPeriodStart.substring(0, 5);
       const displayEndTime = lastPeriodEnd.substring(0, 5);
      return `${durationHours}h / ${displayStartTime} a ${displayEndTime}`;
    } catch { return 'Horario inválido'; }
  };

  const getPriceDetails = (area: ReservationData['area'] | undefined | null, totalAmount: string): string => {
      if(!area) return '...';
      if (area.is_free === 'A') return 'Gratis';
      const price = parseFloat(area.price);
      const mode = area.booking_mode === 'hour' ? '/h' : '/día';
      const total = parseFloat(totalAmount);
      if (isNaN(price)) return 'Precio no disponible';
      if(price > 0) {
          return `Bs ${price.toFixed(2)}${mode} - Total: Bs ${total.toFixed(2)}`;
      }
      return `Total: Bs ${total.toFixed(2)}`;
  };

  const handleAcceptClick = () => {
    if (onAccept && reservationData) { onAccept(reservationData.id); onClose(); }
  };

  const handleRejectClick = () => {
    if (onReject && reservationData) { onReject(reservationData.id); onClose(); }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title=""

    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Detalle de la reserva</span>
          <button onClick={onClose} className={styles.closeButton}>
             <Icon name={IconX} size={18} />
          </button>
        </div>

        {loading && <LoadingScreen />}
        {error && <div className={styles.errorText}>{error}</div>}

        {!loading && !error && reservationData && (
          <>
            <div className={styles.reservationBlock}>
              <div className={styles.requesterSection}>
                 <div className={styles.requesterInfoContainer}>
                    <div className={styles.requesterText}>
                      <span className={styles.requesterName}>{getFullName(reservationData.owner)}</span>
                      <span className={styles.requesterApt}>{reservationData.dpto ? `${reservationData.dpto.nro || ''} ${reservationData.dpto.description || ''}`.trim() : 'Depto. no especificado'}</span>
                    </div>
                  </div>
                  <span className={styles.requestTime}>{getFormattedRequestTime(reservationData.created_at)}</span>
              </div>

              <div className={styles.mainDetailsContainer}>
                <div className={styles.imageWrapper}>
                  {reservationData.area?.images?.length > 0 ? (
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
                <div className={styles.detailsColumn}>
                    <div className={styles.areaTextInfo}>
                       <span className={styles.areaTitle}>{reservationData.area?.title}</span>
                       <span className={styles.areaDescription}>{reservationData.area?.description}</span>
                    </div>
                     <div className={styles.specificDetails}>
                       <span className={styles.detailsHeader}>Detalles</span>
                       <div className={styles.detailsList}>
                         <div className={styles.detailItem}>
                            <Icon name={IconCalendar} size={18} className={styles.detailIcon} />
                            <span className={styles.detailText}>{getFormattedReservationDate(reservationData.date_at)}</span>
                         </div>
                         <div className={styles.detailItem}>
                            <Icon name={IconClock} size={18} className={styles.detailIcon} />
                            <span className={styles.detailText}>{getFormattedReservationTime(reservationData.periods, reservationData.start_time)}</span>
                         </div>
                         <div className={styles.detailItem}>
                            <Icon name={IconUsers} size={18} className={styles.detailIcon} />
                            <span className={styles.detailText}>{reservationData.people_count} persona{reservationData.people_count !== 1 ? 's' : ''}</span>
                         </div>
                         <div className={styles.detailItem}>
                            <Icon name={IconCash} size={18} className={styles.detailIcon} />
                            <span className={styles.priceDetailText}>{getPriceDetails(reservationData.area, reservationData.amount)}</span>
                         </div>
                       </div>
                     </div>
                </div>
              </div>
            </div>

            {reservationData.status === 'W' && (
              <div className={styles.actionButtonsContainer}>
                <Button onClick={handleRejectClick} variant="secondary">
                  Rechazar solicitud
                </Button>
                <Button onClick={handleAcceptClick} variant="primary">
                  Aprobar solicitud
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