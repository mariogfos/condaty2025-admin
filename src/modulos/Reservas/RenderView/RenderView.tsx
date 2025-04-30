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
// Eliminado import de TextArea si no se usa directamente en ReservationDetailModal
import Input from '@/mk/components/forms/Input/Input';

// --- INICIO: Nuevo Componente Memoizado ---

// 1. Define las props que este componente necesita
interface ReservationDetailsViewProps {
  details: any; // El objeto displayedData
  isActionLoading: boolean;
  actionError: string | null;
  onAcceptClick: () => void; // Función para manejar el clic en Aceptar
  onRejectClick: () => void; // Función para manejar el clic en Rechazar
  // Funciones auxiliares pasadas como props
  getFormattedRequestTime: (isoDate: string) => string;
  getFormattedReservationDate: (dateStr: string) => string;
  getFormattedReservationTime: (periods: any[] | undefined | null) => string;
  getPriceDetails: (area: any | undefined | null, totalAmount: string) => string;
}

// 2. El componente funcional que contiene la vista de detalles
const ReservationDetailsView: React.FC<ReservationDetailsViewProps> = ({
  details,
  isActionLoading,
  actionError,
  onAcceptClick,
  onRejectClick,
  getFormattedRequestTime,
  getFormattedReservationDate,
  getFormattedReservationTime,
  getPriceDetails
}) => {

  // El JSX es el mismo que tenías dentro de renderContent()
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
              {/* Usa la función pasada por props */}
              <span className={styles.requestTime}>{details.created_at ? getFormattedRequestTime(details.created_at): ''}</span>
          </div>

          <div className={styles.mainDetailsContainer}>
             <div className={styles.imageWrapper}>
              {details.area?.images?.length > 0 ? (
                <img
                  // Asegúrate de tener getUrlImages disponible (ya está importado globalmente)
                  src={getUrlImages(`/AREA-${details.area.id}-${details.area.images[0].id}.${details.area.images[0].ext}?d=${details.area.updated_at || Date.now()}`)}
                  alt={`Imagen de ${details.area.title}`}
                  className={styles.areaImage}
                  onError={(e: any) => { e.currentTarget.src = '/placeholder-image.png'; }} // Considera un placeholder local
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
                        {/* Usa la función pasada por props */}
                        <span className={styles.detailText}>{details.date_at ? getFormattedReservationDate(details.date_at) : ''}</span>
                     </div>
                     <div className={styles.detailItem}>
                        <IconClock size={18} className={styles.detailIcon} />
                        {/* Usa la función pasada por props */}
                        <span className={styles.detailText}>{getFormattedReservationTime(details.periods)}</span>
                     </div>
                     <div className={styles.detailItem}>
                        <IconGroup size={18} className={styles.detailIcon} />
                        <span className={styles.detailText}>{details.people_count ?? 0} persona{details.people_count !== 1 ? 's' : ''}</span>
                     </div>
                     <div className={styles.detailItem}>
                        <IconCash size={18} className={styles.detailIcon} />
                        {/* Usa la función pasada por props */}
                        <span className={styles.priceDetailText}>{getPriceDetails(details.area, details.amount)}</span>
                     </div>
                     {details.obs && (
                        <div className={styles.detailItem}>
                            {/* Podrías usar un ícono aquí también si tienes uno para notas/observaciones */}
                            <span className={styles.detailIcon}>📝</span>
                            <span className={styles.detailText}>Obs: {details.obs}</span>
                         </div>
                     )}
                   </div>
                 </div>
            </div>
          </div>
        </div>

        {/* Muestra el error de acción */}
        {actionError && (
            <div className={styles.errorText} style={{color: 'red', marginTop: '10px', textAlign: 'center', padding: '5px', border: '1px solid red', borderRadius: '4px'}}>
                Error: {actionError}
            </div>
        )}

        {/* Muestra los botones de acción si el estado es 'W' */}
        {details.status === 'W' && (
          <div className={styles.actionButtonsContainer}>
            <Button
              onClick={onRejectClick} // Usa la prop
              variant="secondary"
              disabled={isActionLoading}
            >
              Rechazar
            </Button>
            <Button
              onClick={onAcceptClick} // Usa la prop
              variant="primary"
              disabled={isActionLoading}
            >
              Aprobar
            </Button>
          </div>
        )}
      </>
  );
};

// 3. Envolver con React.memo para la optimización
const MemoizedReservationDetailsView = React.memo(ReservationDetailsView);

// --- FIN: Nuevo Componente Memoizado ---


// --- INICIO: Componente Principal ReservationDetailModal ---

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

  // --- Estados ---
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [displayedData, setDisplayedData] = useState<any | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectErrors, setRejectErrors] = useState<any>({});

  // --- Hooks ---
  const {
    execute: fetchDetails,
    data: fetchedData,
    error: detailsError,
    loaded: detailsLoaded
  } = useAxios();
  const {
    execute: executeAction
  } = useAxios();

  // --- Efectos ---
  useEffect(() => {
    if (open) {
      setActionError(null);
      setIsActionLoading(false); // Resetear carga de acción al abrir/cambiar item
      setRejectErrors({}); // Limpiar errores de rechazo
      setRejectionReason(""); // Limpiar razón de rechazo

      if (item && item.id) {
        setDisplayedData(item);
        // Resetear estado de carga/error del fetch por si acaso
        // No podemos resetear el hook directamente, pero el 'loaded' cambiará si hacemos fetch
      } else if (reservationId) {
         setDisplayedData(null); // Limpiar datos previos antes de buscar
         const paramsInitial = { fullType: "DET", searchBy: reservationId };
         fetchDetails(
          '/reservations',
          'GET',
          paramsInitial, // Params en el tercer argumento para GET con useAxios (si así lo maneja tu hook)
          true,
          false,
          paramsInitial // O pasar como query params si tu hook lo requiere así para GET
         );
      } else {
        setDisplayedData(null);
      }
    } else {
       // Limpiar todo al cerrar el modal principal
      setDisplayedData(null);
      setActionError(null);
      setIsActionLoading(false);
      setIsRejectModalOpen(false); // Asegurarse que el modal de rechazo también se cierre
      setRejectionReason("");
      setRejectErrors({});
      // No es necesario limpiar el estado del hook fetchDetails aquí explícitamente
    }
  }, [open, item, reservationId]); // Ejecutar si cambia la apertura, el item o el ID

  // Efecto para actualizar displayedData cuando el fetch (GET) termina
  useEffect(() => {
    // Solo actualizar si NO se usó 'item' (es decir, se hizo fetch)
    if (!item && detailsLoaded) {
        if (fetchedData?.data && Array.isArray(fetchedData.data) && fetchedData.data.length > 0) {
            setDisplayedData(fetchedData.data[0]);
            setActionError(null); // Limpiar errores previos si el fetch es exitoso
        } else if (detailsError) {
            setDisplayedData(null);
            // Podrías poner el error del fetch en actionError si quieres mostrarlo
            // setActionError(`Error al cargar detalles: ${detailsError.message || 'Error desconocido'}`);
            console.error("Error fetching details:", detailsError); // Mantener log de error
        } else {
             // Caso: fetch exitoso pero no devolvió datos (raro si buscas por ID)
             setDisplayedData(null);
        }
    }
  }, [fetchedData, detailsLoaded, detailsError, item]); // Dependencias clave

  // --- Funciones Auxiliares (se quedan en el padre y se pasan como props) ---
  const getFormattedRequestTime = (isoDate: string): string => {
    if (!isoDate) return 'Fecha inválida';
    try { return formatDistanceToNowStrict(parseISO(isoDate), { addSuffix: true, locale: es }); }
    catch { return 'Fecha inválida'; }
  };

  const getFormattedReservationDate = (dateStr: string): string => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Fecha inválida';
    try {
        const date = parseISO(dateStr + 'T00:00:00'); // Asumir inicio del día
        return format(date, "EEEE, d 'de' MMMM", { locale: es });
    } catch {
        return 'Fecha inválida';
    }
  };

  const getFormattedReservationTime = (periods: any[] | undefined | null): string => {
    if (!periods || periods.length === 0) return 'Horario no especificado';
    try {
      // Asegurarse de que periods sea un array antes de ordenar
      const validPeriods = Array.isArray(periods) ? periods : [];
      const sortedPeriods = [...validPeriods].sort((a, b) => (a.time_from || "").localeCompare(b.time_from || ""));
      const formattedPeriodStrings = sortedPeriods.map(period => {
        const startTime = (period.time_from || "00:00:00").substring(0, 5);
        const endTime = (period.time_to || "00:00:00").substring(0, 5);
        return `${startTime} - ${endTime}`;
      });
      return formattedPeriodStrings.join(' / ');
    } catch (error) {
      console.error("Error formateando horario de reserva:", error);
      return 'Horario inválido';
    }
  };

  const getPriceDetails = (area: any | undefined | null, totalAmount: string | number | undefined | null): string => {
      const safeTotalAmount = totalAmount ?? 0; // Valor por defecto si es null/undefined
      if (!area) return 'Detalles de precio no disponibles';

      // Convertir a número y validar
      const price = parseFloat(area.price);
      const total = parseFloat(String(safeTotalAmount)); // Convertir a string primero

      if (isNaN(price)) return 'Precio base inválido'; // O manejar de otra forma
      if (isNaN(total)) return 'Monto total inválido'; // O manejar de otra forma

      const isFreeExplicit = area.is_free === 'A'; // Asumiendo 'X' significa gratis
      const isPriceZero = price <= 0;

      if (isFreeExplicit || isPriceZero) {
           // Si es explícitamente gratis O el precio es 0 o menos
           if (total > 0) {
               // Si aun así hay un total (quizás por otros cargos?), mostrarlo
               return `Gratis - Total: Bs ${total.toFixed(2)}`;
           } else {
               // Si no hay total o es 0, simplemente "Gratis"
               return 'Gratis';
           }
      } else {
           // Si tiene precio > 0
          const mode = area.booking_mode === 'hour' ? '/h' : '/día'; // O '/reserva' si no es por hora/día
          return `Bs ${price.toFixed(2)}`;
      }
  };


  // --- Handlers de Acción ---
  const handleAcceptClick = async () => {
    if (!displayedData?.id || isActionLoading) return;
    setIsActionLoading(true);
    setActionError(null);
    const now = new Date();
    const formattedDate = formatDateFns(now, 'yyyy-MM-dd HH:mm:ss');
    const payload = { approved_at: formattedDate, is_approved: 'Y', obs: 'Aprobado' };
    try {
      await executeAction(`/reservations/${displayedData.id}`, 'PUT', payload, false, false);
      if (reLoad) reLoad();
      onClose(); // Cierra el modal principal al tener éxito
    } catch (error: any) {
      console.error("Error al aprobar reserva:", error);
      setActionError(error?.response?.data?.message || error?.message || 'Ocurrió un error al aprobar.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectClick = () => {
    // Solo abre el modal de rechazo, reseteando su estado interno
    if (!displayedData?.id) return;
    setRejectionReason("");
    setRejectErrors({});
    setIsRejectModalOpen(true);
  };

  const confirmRejection = async () => {
    if (!displayedData?.id || isActionLoading) return;

    if (!rejectionReason || rejectionReason.trim() === "") {
      setRejectErrors({ reason: "Debe ingresar un motivo para el rechazo." });
      return;
    }
    setRejectErrors({}); // Limpiar error si la validación pasa

    setIsActionLoading(true);
    setActionError(null); // Limpiar error principal por si acaso

    const payload = { is_approved: 'N', obs: rejectionReason.trim() };

    try {
      await executeAction(`/reservations/${displayedData.id}`, 'PUT', payload, false, false);
      // Éxito: cerrar ambos modales y recargar
      setIsRejectModalOpen(false);
      onClose(); // Cierra el modal principal
      if (reLoad) reLoad();
    } catch (error: any) {
      console.error("Error al confirmar rechazo:", error);
      // Mostrar error en el modal principal después de cerrar el de rechazo
      setActionError(error?.response?.data?.message || error?.message || 'Ocurrió un error al rechazar.');
      setIsRejectModalOpen(false); // Asegurarse de cerrar el modal de rechazo incluso si hay error
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- Lógica de Renderizado Principal ---
  const isLoadingDetails = !item && !detailsLoaded && !detailsError;
  // El error de carga de detalles se maneja dentro del useEffect ahora
  // const hasLoadingError = !item && detailsLoaded && detailsError;

  return (
    <>
      {/* --- PRIMER MODAL (DETALLES) --- */}
      <DataModal
        open={open}
        onClose={onClose}
        title="Detalle de la Reserva"
        buttonText="" // Ocultar botones por defecto del DataModal
        buttonCancel="" // Ocultar botones por defecto del DataModal
      >
        <div className={styles.modalContent}>
          {/* Renderizado condicional principal */}
          {isLoadingDetails ? (
            <div className={styles.loadingContainer}>Cargando detalles...</div>
          ) : !displayedData ? (
             // Esto cubre tanto el error de carga como el caso de no encontrar datos
             <div className={styles.loadingContainer}>
               {detailsError ? `Error al cargar: ${detailsError.message || 'Error desconocido'}` : 'No hay datos de reserva para mostrar.'}
             </div>
          ) : (
            // --- USA EL COMPONENTE MEMOIZADO ---
            <MemoizedReservationDetailsView
              details={displayedData}
              isActionLoading={isActionLoading} // Estado de carga de las *acciones* (Aprobar/Rechazar)
              actionError={actionError} // Error de las *acciones*
              onAcceptClick={handleAcceptClick}
              onRejectClick={handleRejectClick}
              // Pasa las funciones auxiliares
              getFormattedRequestTime={getFormattedRequestTime}
              getFormattedReservationDate={getFormattedReservationDate}
              getFormattedReservationTime={getFormattedReservationTime}
              getPriceDetails={getPriceDetails}
            />
          )}
        </div>
      </DataModal>

      {/* --- SEGUNDO MODAL (RECHAZO) --- */}
      {/* Este modal solo se renderiza si isRejectModalOpen es true */}
      {isRejectModalOpen && (
        <DataModal
            open={isRejectModalOpen}
            onClose={() => {
                // Solo cierra el modal de rechazo, no el principal
                setIsRejectModalOpen(false);
                // Opcional: limpiar errores si el usuario cierra sin confirmar
                setRejectErrors({});
            }}
            title="Cancelar Solicitud"
            buttonText="" // Sin botones por defecto
            buttonCancel="" // Sin botones por defecto
            style={{ width: '486px', maxWidth: '80%' }}
          >
            <div className={styles.divider}></div>
            <div className={styles.modalContentContainer}> {/* Contenedor para padding/gap interno */}
              <p>Por favor indica el motivo para que el residente pueda comprender e intente solicitar esta área social de manera correcta</p>
              <Input
                  name="reason"
                  value={rejectionReason}
                  onChange={(e) => {
                      setRejectionReason(e.target.value);
                      // Limpiar error al empezar a escribir de nuevo
                      if (rejectErrors.reason) {
                          setRejectErrors({});
                      }
                  }}
                  placeholder="Escribe aquí por qué se rechaza la reserva..."
                  required // Añade indicación visual si tu CSS lo soporta
                  // Podrías añadir aria-invalid si hay error
                  aria-invalid={!!rejectErrors.reason}
                  aria-describedby={rejectErrors.reason ? "rejection-error-message" : undefined}
                  // Considera usar <TextArea /> si el motivo puede ser largo
              />
              {/* Mensaje de error específico para el campo de motivo */}
              {rejectErrors.reason && (
                <span id="rejection-error-message" style={{ color: 'var(--cError, #e46055)', fontSize: '12px', marginTop: '4px' }}>
                  {rejectErrors.reason}
                </span>
              )}
            </div>

            {/* Footer con botones de acción específicos para este modal */}
            <div className={styles.actionButtonsContainer} style={{ marginTop: 'var(--spL, 16px)' }}> {/* Añadir margen superior si es necesario */}
                {/* Botón secundario (Salir/Cancelar) */}
                <Button
                  className={styles.secondaryActionButton} // Clase para estilo (flex-grow: 1)
                  onClick={() => setIsRejectModalOpen(false)} // Solo cierra este modal
                  variant="secondary"
                  disabled={isActionLoading} // Deshabilitar durante la acción
                >
                  Salir
                </Button>

                {/* Botón primario (Confirmar Rechazo) */}
                <Button
                  className={styles.primaryActionButton} // Clase para estilo (flex-grow: 2)
                  onClick={confirmRejection} // Ejecuta la acción de rechazo
                  variant="primary" // O el variant que corresponda al botón de confirmación
                  disabled={isActionLoading} // Deshabilitar durante la acción
                >
                  Confirmar cancelación
                </Button>
            </div>
          </DataModal>
      )}
    </>
  );
};

export default ReservationDetailModal;
