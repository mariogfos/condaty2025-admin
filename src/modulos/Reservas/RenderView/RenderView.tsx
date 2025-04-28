"use client";
import React, { useState, useEffect } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';
import useAxios from '@/mk/hooks/useAxios';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { format, parseISO, formatDistanceToNowStrict, format as formatDateFns } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './ReservationDetailModal.module.css';
import {
    IconCalendar,
    IconClock,
    IconCash,
    IconGroup
} from '@/components/layout/icons/IconsBiblioteca';

const ReservationDetailModal = ({
  open,
  onClose,
  item,
  reservationId,
  reLoad
}: {
  open: boolean;
  onClose: () => void;
  item?: any | null;
  reservationId?: string | number | null;
  reLoad?: () => void;
}) => {

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [displayedData, setDisplayedData] = useState<any | null>(null);

  const {
    execute: fetchDetails,
    data: fetchedData,
    error: detailsError,
    loaded: detailsLoaded // Usamos 'loaded' para saber si el GET inicial terminó
    // No usamos clearAxiosState porque no existe
  } = useAxios();
  const paramsInitial = {
    fullType: "DET",
    searchBy: reservationId,
  };
  const {
    execute: executeAction
    // No usamos 'loading' porque no existe; usaremos isActionLoading local
  } = useAxios();

  // Efecto para decidir si usar 'item' o buscar por 'reservationId'
  useEffect(() => {
    if (open) {
      setActionError(null);

      if (item && item.id) {
        setDisplayedData(item);
        // No podemos limpiar el estado del hook fetchDetails directamente
      }
      else if (reservationId) {
         setDisplayedData(null); // Limpiar datos previos antes de buscar
         // Llamar a execute con la firma correcta
         fetchDetails(
          '/reservations', // URL base sin ID en la ruta
          'GET',
          paramsInitial,             // Cuerpo vacío para GET
          true,
          false,
          paramsInitial  // Pasar los parámetros como objeto separado
        );
      }
      else {
        setDisplayedData(null);
      }
    } else {
      setDisplayedData(null); // Limpiar al cerrar
      setActionError(null);
      // No podemos limpiar el estado del hook fetchDetails directamente al cerrar
    }
  }, [open, item, reservationId]);

  // Efecto para actualizar displayedData cuando el fetch (GET) termina
  useEffect(() => {
    // Verifica si NO se usó 'item', el fetch terminó (detailsLoaded),
    // Y si fetchedData.data existe, ES un array Y tiene al menos un elemento
    if (!item && detailsLoaded && fetchedData?.data && Array.isArray(fetchedData.data) && fetchedData.data.length > 0) {
       // CORREGIDO: Accede al primer elemento del array devuelto por la API
       setDisplayedData(fetchedData.data[0]);
    }
    // Manejo de error si no se usó 'item' y el fetch falló
    else if (!item && detailsLoaded && detailsError) {
       setDisplayedData(null);
    }
    // Podrías añadir un caso si el array viene vacío, aunque no debería pasar si buscas por ID
    // else if (!item && detailsLoaded && fetchedData?.data && Array.isArray(fetchedData.data) && fetchedData.data.length === 0) {
    //   setDisplayedData(null); // O manejar como "No encontrado"
    // }

  }, [fetchedData, detailsLoaded, detailsError, item]);// Depende del resultado del fetch y si se usó 'item'


  const getFormattedRequestTime = (isoDate: string): string => {
    if (!isoDate) return 'Fecha inválida';
    try { return formatDistanceToNowStrict(parseISO(isoDate), { addSuffix: true, locale: es }); }
    catch { return 'Fecha inválida'; }
  };

  const getFormattedReservationDate = (dateStr: string): string => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Fecha inválida';
    try {
        const date = parseISO(dateStr + 'T00:00:00');
        return format(date, "EEEE, d 'de' MMMM", { locale: es });
    } catch {
        return 'Fecha inválida';
    }
  };

  const getFormattedReservationTime = (periods: any[] | undefined | null): string => {
    if (!periods || periods.length === 0) return 'Horario no especificado';
    try {
      const sortedPeriods = [...periods].sort((a, b) => a.time_from.localeCompare(b.time_from));
      const formattedPeriodStrings = sortedPeriods.map(period => {
        const startTime = period.time_from.substring(0, 5);
        const endTime = period.time_to.substring(0, 5);
        return `${startTime} - ${endTime}`;
      });
      return formattedPeriodStrings.join(' / ');
    } catch (error) {
      console.error("Error formateando horario de reserva:", error);
      return 'Horario inválido';
    }
  };

  const getPriceDetails = (area: any | undefined | null, totalAmount: string): string => {
      if (!area) return 'Detalles de precio no disponibles';
      if (area.is_free !== 'X' && parseFloat(area.price) <= 0) return 'Gratis';
      const price = parseFloat(area.price);
      const mode = area.booking_mode === 'hour' ? '/h' : '/día';
      const total = parseFloat(totalAmount);
      if (isNaN(price) || isNaN(total)) return 'Precio no disponible';
      if (price > 0) {
          return `Bs ${price.toFixed(2)}${mode} - Total: Bs ${total.toFixed(2)}`;
      } else {
          return `Total: Bs ${total.toFixed(2)}`;
      }
  };

  const handleAcceptClick = async () => {
    if (!displayedData?.id) return;

    setIsActionLoading(true); // <- Usamos estado local
    setActionError(null);

    const now = new Date();
    const formattedDate = formatDateFns(now, 'yyyy-MM-dd HH:mm:ss');

    const payload = {
      approved_at: formattedDate,
      is_approved: 'Y',
      obs: 'Aprobado'
    };

    try {
      await executeAction(
        `/reservations/${displayedData.id}`,
        'PUT',
        payload,
        false,
        false
      );
      if (reLoad) reLoad();
      onClose();
    } catch (error: any) {
      console.error("Error al aprobar reserva:", error);
      setActionError(error?.response?.data?.message || error?.message || 'Ocurrió un error al aprobar.');
    } finally {
      setIsActionLoading(false); // <- Usamos estado local
    }
  };

  const handleRejectClick = async () => {
    if (!displayedData?.id) return;

    const obs = prompt("Por favor, introduce un motivo para el rechazo (opcional):");

    setIsActionLoading(true); // <- Usamos estado local
    setActionError(null);

    const payload = {
      is_approved: 'N',
      obs: obs || 'Rechazado'
    };

    try {
      await executeAction(
        `/reservations/${displayedData.id}`,
        'PUT',
        payload,
        false,
        false
      );
      if (reLoad) reLoad();
      onClose();
    } catch (error: any) {
      console.error("Error al rechazar reserva:", error);
      setActionError(error?.response?.data?.message || error?.message || 'Ocurrió un error al rechazar.');
    } finally {
      setIsActionLoading(false); // <- Usamos estado local
    }
  };

  const renderContent = () => {
    // Estado de carga: si no se pasó 'item' Y el hook de fetch aún no ha 'loaded' Y no hay error
    const isLoading = !item && !detailsLoaded && !detailsError;

    if (isLoading) {
      return <div className={styles.loadingContainer}>Cargando detalles...</div>;
    }

    // Estado de error: Si no se pasó 'item' Y el hook de fetch ya 'loaded' Y hay un 'detailsError'
    if (!item && detailsLoaded && detailsError) {
      return <div className={styles.errorText} style={{ color: 'red', textAlign: 'center', padding: '10px' }}>Error al cargar detalles: {detailsError.message || 'Error desconocido'}</div>;
    }

    // Si no hay datos para mostrar (ni de 'item' ni de fetch exitoso)
    if (!displayedData) {
       // Podríamos diferenciar si es porque no se pasó nada o porque el fetch falló (ya cubierto arriba)
       return <div className={styles.loadingContainer}>No hay datos de reserva para mostrar.</div>;
    }

    const details = displayedData;

    return (
      <>
        <div className={styles.reservationBlock}>
          <div className={styles.requesterSection}>
             <div className={styles.requesterInfoContainer}>
                <div className={styles.requesterText}>
                  <span className={styles.requesterName}>{getFullName(details.owner)}</span>
                  {details.dpto && (
                    <span className={styles.requesterApt}>
                       Dpto: {details.dpto.nro || details.dpto.description || '-'}
                    </span>
                  )}
                </div>
              </div>
              <span className={styles.requestTime}>{details.created_at ? getFormattedRequestTime(details.created_at): ''}</span>
          </div>

          <div className={styles.mainDetailsContainer}>
            <div className={styles.imageWrapper}>
              {details.area?.images?.length > 0 ? (
                <img
                  src={getUrlImages(`/AREA-${details.area.id}-${details.area.images[0].id}.${details.area.images[0].ext}?d=${details.area.updated_at || Date.now()}`)}
                  alt={`Imagen de ${details.area.title}`}
                  className={styles.areaImage}
                  onError={(e: any) => { e.currentTarget.src = '/placeholder-image.png'; }}
                />
              ) : (
                <div className={`${styles.areaImage} ${styles.imagePlaceholder}`}>
                  <span className={styles.imagePlaceholderText}>Sin Imagen</span>
                </div>
              )}
            </div>
            <div className={styles.detailsColumn}>
                <div className={styles.areaTextInfo}>
                   <span className={styles.areaTitle}>{details.area?.title ?? 'Área desconocida'}</span>
                   <span className={styles.areaDescription}>{details.area?.description ?? 'Sin descripción'}</span>
                </div>
                 <div className={styles.specificDetails}>
                   <span className={styles.detailsHeader}>Detalles de la Reserva</span>
                   <div className={styles.detailsList}>
                     <div className={styles.detailItem}>
                        <IconCalendar size={18} className={styles.detailIcon} />
                        <span className={styles.detailText}>{details.date_at ? getFormattedReservationDate(details.date_at) : ''}</span>
                     </div>
                     <div className={styles.detailItem}>
                        <IconClock size={18} className={styles.detailIcon} />
                        <span className={styles.detailText}>{getFormattedReservationTime(details.periods)}</span>
                     </div>
                     <div className={styles.detailItem}>
                        <IconGroup size={18} className={styles.detailIcon} />
                        <span className={styles.detailText}>{details.people_count ?? 0} persona{details.people_count !== 1 ? 's' : ''}</span>
                     </div>
                     <div className={styles.detailItem}>
                        <IconCash size={18} className={styles.detailIcon} />
                        <span className={styles.priceDetailText}>{getPriceDetails(details.area, details.amount)}</span>
                     </div>
                     {details.obs && (
                        <div className={styles.detailItem}>
                            <span className={styles.detailIcon}>📝</span>
                            <span className={styles.detailText}>Obs: {details.obs}</span>
                         </div>
                     )}
                   </div>
                 </div>
            </div>
          </div>
        </div>

        {actionError && (
            <div className={styles.errorText} style={{color: 'red', marginTop: '10px', textAlign: 'center', padding: '5px', border: '1px solid red', borderRadius: '4px'}}>
                Error: {actionError}
            </div>
        )}

        {details.status === 'W' && (
          <div className={styles.actionButtonsContainer}>
            <Button
              onClick={handleRejectClick}
              variant="secondary"
              disabled={isActionLoading} // <- Deshabilitar basado en estado local
            >
              Rechazar
            </Button>
            <Button
              onClick={handleAcceptClick}
              variant="primary"
              disabled={isActionLoading} // <- Deshabilitar basado en estado local
            >
              Aprobar
            </Button>
          </div>
        )}
      </>
    );
  };


  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de la Reserva"
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.modalContent}>
        {renderContent()}
      </div>
    </DataModal>
  );
};

export default ReservationDetailModal;