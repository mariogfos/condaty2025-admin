"use client";
import React, { useState, useEffect, useMemo } from "react";
import styles from "./CreateReserva.module.css";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import TextArea from "@/mk/components/forms/TextArea/TextArea"; // Asegúrate si lo usas
import { IconArrowLeft } from "@/components/layout/icons/IconsBiblioteca";
import CalendarPicker from "./CalendarPicker/CalendarPicker";
import useAxios from "@/mk/hooks/useAxios";
import { getUrlImages } from "@/mk/utils/string";
import { useRouter } from 'next/navigation';
// Importa TODAS las interfaces necesarias desde Type.ts
import {
    ApiUnidad,
    ApiArea,
    ApiDptosResponse,
    ApiAreasResponse,
    ApiReservationsCalendarResponse,
    Option, // Importa Option también
    FormState
} from "./Type"; // Asegúrate que la ruta sea correcta
import DataModal from "@/mk/components/ui/DataModal/DataModal";

// --- Interfaces del Formulario (Definidas localmente) ---

// Estado inicial para resetear el formulario
const initialState: FormState = {
  unidad: "",
  area_social: "",
  fecha: "",
  // REMOVIDOS: hora_inicio, hora_fin
  cantidad_personas: "",
  motivo: "",
  nombre_responsable: "",
  telefono_responsable: "",
  email_responsable: "",
};

// Interfaz de Errores (MODIFICADO)
interface FormErrors {
  unidad?: string;
  area_social?: string;
  fecha?: string;
  // REMOVIDOS: hora_inicio, hora_fin
  // AÑADIDO: para error de selección de periodos
  selectedPeriods?: string;
  cantidad_personas?: string;
  motivo?: string;
  nombre_responsable?: string;
  telefono_responsable?: string;
  email_responsable?: string;
}

// --- Interfaz para la respuesta de disponibilidad horaria ---
interface ApiAvailabilityResponse {
  data?: {
    reserved?: string[];
    available?: string[]; // ["HH:mm-HH:mm", ...]
  };
  success?: boolean;
  message?: string;
}

// --- Interfaz para la respuesta de creación de reserva ---
interface ApiCreateReservationResponse {
    success: boolean;
    data?: any; // O una interfaz más específica si la tienes
    message?: string;
}


// --- Componente Principal ---
const CreateReserva = () => {
  // --- Estados ---
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Usa el estado inicial definido arriba
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busyDays, setBusyDays] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState<boolean>(false);
  // NUEVO: Estado para indicar si se está enviando el formulario
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState<boolean>(false); 
  const router = useRouter();


  // --- Hooks ---
  const { showToast } = useAuth();

  // --- Peticiones API ---
  // Hook para obtener Unidades
  const { data: unidadesResponse, loaded: unidadesLoaded, execute: executeUnidadesApi } = useAxios("/dptos", "GET", {
    perPage: -1,
    page: 1,
    fullType: "L" // Asegúrate que esto traiga la info del titular
  });

  // Hook para obtener Áreas
  const { data: areasResponse, loaded: areasLoaded } = useAxios("/areas", "GET", {
    fullType: "L",
  });

  // Hook para obtener DÍAS OCUPADOS y HORAS DISPONIBLES
  const { data: reservaCalendarResponse, loaded: reservaCalendarLoaded, execute: executeCalendarApi } = useAxios(
      "/reservations-calendar", "GET",
      { area_id: formState.area_social || 'none' },
      !formState.area_social
  );

  // NUEVO: Hook para ENVIAR la reserva (configurado para no ejecutar al inicio)
  // Usamos 'execute' directamente, no necesitamos el estado 'data' aquí
  const { execute: executeCreateReservation } = useAxios(
      '/reservations', // Endpoint POST
      'POST',         // Método
      {},             // Payload inicial vacío
      true            // No ejecutar al montar (implícito al no pasar params y usar execute)
  );


  // --- Efecto para actualizar busyDays ---
  useEffect(() => {
    // <---- AÑADE UN CONSOLE.LOG AQUÍ para ver qué llega
    console.log("useEffect [busyDays] - Response:", JSON.stringify(reservaCalendarResponse), "Loaded:", reservaCalendarLoaded, "Area:", formState.area_social);

    if (reservaCalendarLoaded && formState.area_social && reservaCalendarResponse?.data && 'reserved' in reservaCalendarResponse.data) {
        console.log("useEffect [busyDays] - Setting busyDays:", reservaCalendarResponse.data.reserved); // Verifica qué se va a setear
        setBusyDays(reservaCalendarResponse.data.reserved || []);
    } else if (!formState.area_social) {
         console.log("useEffect [busyDays] - Resetting busyDays (no area)");
        setBusyDays([]);
    } else if (reservaCalendarLoaded && formState.area_social) {
        // Si loaded es true y hay area, pero la condición principal falló, loguea por qué
        console.log("useEffect [busyDays] - Condition failed. Response data:", reservaCalendarResponse?.data);
        if (!reservaCalendarResponse?.data) {
             console.log("useEffect [busyDays] - Reason: reservaCalendarResponse.data is falsy");
        } else if (!('reserved' in reservaCalendarResponse.data)) {
             console.log("useEffect [busyDays] - Reason: 'reserved' key NOT found in reservaCalendarResponse.data. Keys:", Object.keys(reservaCalendarResponse.data));
        }
        setBusyDays([]);
    }
  }, [reservaCalendarResponse, reservaCalendarLoaded, formState.area_social]);


  // --- Transformación de datos para Selects (Unidades, Areas) ---
  const unidadesOptions: Option[] = useMemo(() => {
    if (!unidadesLoaded || !unidadesResponse?.data) return [];
    // Convierte ID numérico a string para el Select si es necesario, o ajusta el tipo de Option
    return unidadesResponse.data.map((unidad: ApiUnidad): Option => ({
        id: String(unidad.id), // Asegura que ID sea string si <Select> lo espera así
        name: `Unidad ${unidad.nro}`,
      }));
  }, [unidadesResponse, unidadesLoaded]);

  const areasSocialesOptions: Option[] = useMemo(() => {
    if (!areasLoaded || !areasResponse?.data) return [];
    return areasResponse.data.map((area: ApiArea): Option => ({
        id: area.id, // ID de área es string
        name: area.title,
      }));
  }, [areasResponse, areasLoaded]);

  // --- Obtener detalles del área seleccionada ---
  const selectedAreaDetails: ApiArea | undefined = useMemo(() => {
    if (!areasLoaded || !areasResponse?.data || !formState.area_social) {
      return undefined;
    }
    return areasResponse.data.find((area: ApiArea) => area.id === formState.area_social);
  }, [formState.area_social, areasResponse, areasLoaded]);


  // --- Función para obtener horas disponibles ---
  const fetchAvailableTimes = async (areaId: string, dateString: string) => {
    if (!areaId || !dateString) {
        setAvailableTimeSlots([]); return;
    }
    setLoadingTimes(true); setAvailableTimeSlots([]);
    // Dentro de fetchAvailableTimes, después de la llamada a executeCalendarApi
// Dentro de fetchAvailableTimes
try {
  const response = await executeCalendarApi(
    "/reservations-calendar", "GET",
    { area_id: areaId, date_at: dateString }, false, false
  ) as any; // Puedes quitar el cast específico o ajustarlo si tienes una interfaz para { data: { data: ... } }

  console.log("Respuesta API Horas:", JSON.stringify(response));

  // --- CONDICIÓN CORREGIDA ---
  // Verifica la ruta completa: response.data.data.available
  if (response?.data?.data?.available && Array.isArray(response.data.data.available)) {
                                       // ^^ ACCESO CORRECTO ^^
    console.log("Datos 'available' encontrados - Estableciendo availableTimeSlots:", response.data.data.available);
    setAvailableTimeSlots(response.data.data.available); // <-- ACCESO CORRECTO
                                // ^^ ACCESO CORRECTO ^^
  } else {
    console.log("Datos 'available' NO encontrados en response.data.data o formato incorrecto, limpiando availableTimeSlots");
    setAvailableTimeSlots([]);
     if (response && response.success === false) {
        showToast(response.message || "No se pudo cargar la disponibilidad horaria.", "warning");
     }
  }
  // --- FIN CONDICIÓN CORREGIDA ---


} catch (error) {
  console.error("Error fetching available times:", error);
  showToast("Error al cargar horarios disponibles.", "error");
  setAvailableTimeSlots([]);
} finally {
  setLoadingTimes(false);
}
  };

  // --- Funciones Handler ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isAreaChange = name === 'area_social';

    // Actualiza el estado del formulario
    setFormState((prev) => ({
        ...prev,
        [name]: value,
        // Si cambia el área, OBLIGATORIAMENTE resetea la fecha
        ...(isAreaChange && { fecha: '' }),
    }));

    // Limpia el error del campo que cambió
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Lógica específica cuando cambia el ÁREA SOCIAL
     if (isAreaChange) {
        // 1. Resetea estados dependientes del área y fecha
        setBusyDays([]); // Resetea días ocupados inmediatamente para feedback visual
        setAvailableTimeSlots([]); // Resetea horarios disponibles
        setSelectedPeriods([]); // Resetea periodos seleccionados
        // Limpia errores relacionados con fecha y periodos
        setErrors(prev => ({
            ...prev,
            fecha: undefined,
            selectedPeriods: undefined
        }));
        // Asegura que el estado de la fecha se limpie (aunque ya se hizo en setFormState)
        // setFormState(prev => ({...prev, fecha: ''})); // Redundante si ya se hizo arriba

        // 2. === LA CORRECCIÓN ES AQUÍ ===
        // Si se seleccionó un área válida (no se deseleccionó a vacío)
        if (value) {
            console.log(`Área cambiada a ${value}. Obteniendo días ocupados...`);
            // Ejecuta la llamada a la API para obtener los días ocupados (SIN date_at)
            executeCalendarApi(
                "/reservations-calendar", // URL (ya definida en el hook, pero podemos pasarla)
                "GET",                   // Método
                { area_id: value },      // Parámetros: SOLO el area_id
                true,                   // skipAbort (normalmente false)
                false                    // skipLoading (ajusta si usas el estado 'loading' del hook)
            );
            // El useEffect que depende de reservaCalendarResponse se encargará
            // de actualizar busyDays cuando esta llamada termine.
        } else {
             // Si se deseleccionó el área, asegura que busyDays esté vacío
             setBusyDays([]);
        }
        // 3. Resetea el índice de la imagen del carrusel si cambias de área
        setCurrentImageIndex(0);
     }
  };
  // --- NUEVO: Handler para click en los botones de periodo ---
  const handlePeriodToggle = (period: string) => {
    setSelectedPeriods(prevSelected => {
        const isSelected = prevSelected.includes(period);
        if (isSelected) {
            // Si ya estaba seleccionado, lo quita
            return prevSelected.filter(p => p !== period);
        } else {
            // Si no estaba, lo añade
            // Opcional: ordenar al añadir para mantener consistencia
            return [...prevSelected, period].sort();
        }
    });
    // Limpia el error de selección de periodo si el usuario interactúa
    if (errors.selectedPeriods) {
        setErrors(prev => ({ ...prev, selectedPeriods: undefined }));
    }
  };

  const handleDateChange = (dateString: string | undefined) => {
    const newDate = dateString || "";
    // MODIFICADO: Resetea los periodos seleccionados
    setFormState(prev => ({ ...prev, fecha: newDate }));
    setSelectedPeriods([]); // Limpia la selección de periodos
    // Limpia errores relacionados a la selección de tiempo/periodo
    if (errors.fecha && newDate) setErrors(prev => ({ ...prev, fecha: undefined }));
    setErrors(prev => ({ ...prev, selectedPeriods: undefined })); // Limpia error de periodo también

    if (formState.area_social && newDate) {
      fetchAvailableTimes(formState.area_social, newDate);
    } else {
        setAvailableTimeSlots([]);
    }
  };


// --- Funciones de Validación ---
const validateStep1 = (): boolean => {
  const errs: FormErrors = {};
  // El ID de la unidad ahora se compara como string si viene de un Select
  if (!formState.unidad) errs.unidad = "Selecciona tu unidad";
  if (!formState.area_social) errs.area_social = "Selecciona el área social";
  setErrors(errs); // Actualiza el estado de errores
  return Object.keys(errs).length === 0; // Devuelve true si no hay errores
};

const validateStep2 = (): boolean => {
  const errs: FormErrors = {};
  if (!formState.fecha) errs.fecha = "Selecciona una fecha";

  // MODIFICADO: Validar que se haya seleccionado al menos un periodo si no es reserva por día
  if (selectedAreaDetails?.booking_mode !== 'day') {
      if (selectedPeriods.length === 0) {
          // Usa la nueva clave de error
          errs.selectedPeriods = "Debes seleccionar al menos un periodo disponible";
      }
      // Opcional: Podrías añadir validación de contigüidad aquí si es un requisito estricto
      // const isContiguous = checkContiguity(selectedPeriods);
      // if (!isContiguous) errs.selectedPeriods = "La selección de periodos debe ser continua";
  }

  // Validación de cantidad de personas (sin cambios)
  if (!formState.cantidad_personas) {
    errs.cantidad_personas = "Ingresa la cantidad de personas";
  } else { /* ... validación de número y capacidad ... */ }

  setErrors(errs);
  return Object.keys(errs).length === 0;
};

const validateStep3 = (): boolean => {
  const errs: FormErrors = {};
  
  // Validación de motivo/observaciones si es requerida
  // if (!formState.motivo.trim()) errs.motivo = "El motivo es requerido";

  setErrors(errs); // Actualiza el estado de errores
  return Object.keys(errs).length === 0; // Devuelve true si no hay errores
};

// --- Funciones de Navegación ---
const nextStep = (): void => {
  let isValid = false;
  // Valida el paso actual antes de intentar avanzar
  if (currentStep === 1) {
    isValid = validateStep1();
  } else if (currentStep === 2) {
    isValid = validateStep2();
  } else {
    // Si hubiera más pasos, la validación iría aquí
    isValid = true; // No hay validación explícita necesaria para pasar del 3 (ya se valida en submit)
  }

  // Si el paso actual es válido, avanza al siguiente
  if (isValid) {
      // Limpia los errores antes de cambiar de paso para evitar mostrar errores viejos
      setErrors({});
      // Incrementa el paso si no estamos en el último
      if (currentStep < 3) { // Asumiendo 3 pasos totales
           setCurrentStep(prev => prev + 1);
      }
  } else {
      // Si no es válido, muestra un mensaje general o confía en que los errores individuales se muestren
      showToast("Por favor, corrige los errores marcados.", "warning");
      console.log("Errores de validación en nextStep:", errors); // Ayuda a depurar
  }
};

const prevStep = (): void => {
  // Solo permite retroceder si no estamos en el primer paso
  if (currentStep > 1) {
    // Limpia los errores al retroceder
    setErrors({});
    setCurrentStep(prev => prev - 1);
  }
};



  // --- MODIFICADO: `handleSubmit` con lógica de API POST ---
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
     // VALIDACIÓN IMPORTANTE: Re-validar paso 2 y paso 3 antes de enviar
     const isStep2Valid = validateStep2(); // Revalida por si acaso
     const isStep3Valid = validateStep3();
     if (!isStep2Valid || !isStep3Valid || isSubmitting) {
        if (!isSubmitting) {
            showToast("Por favor, revisa los campos requeridos.", "warning");
            // Los errores específicos ya se setearon en las funciones de validación
        }
        return;
    }

    setIsSubmitting(true);

    // 1. Obtener owner_id (sin cambios)
    const selectedUnit = unidadesResponse?.data?.find((u: any) => String(u.id) === formState.unidad);
    const ownerId = selectedUnit?.titular?.owner_id;
    if (!ownerId) { /* ... manejo de error ... */ setIsSubmitting(false); return; }

    // 2. MODIFICADO: Obtener start_time del primer periodo seleccionado (si existe)
    let startTime = "";
    // Asegura que los periodos estén ordenados antes de tomar el primero
    const sortedSelectedPeriods = [...selectedPeriods].sort();
    if (sortedSelectedPeriods.length > 0) {
        startTime = sortedSelectedPeriods[0].split('-')[0];
    }

    // 3. Construir Payload (MODIFICADO: usa selectedPeriods)

   const payload = {
    area_id: formState.area_social,
    owner_id: ownerId,
    date_at: formState.fecha,
    people_count: Number(formState.cantidad_personas),
    amount: Number(selectedAreaDetails?.price || 0),
    obs: formState.motivo || `Reserva de ${selectedAreaDetails?.title || 'área'}`,
    start_time: startTime, // Usa el startTime calculado
    // MODIFICADO: Envía SIEMPRE los periodos seleccionados
    Periods: sortedSelectedPeriods,
};

    console.log("Payload a enviar:", payload);

    // 4. Llamar a la API POST (sin cambios en la llamada)
    try {
        const response = await executeCreateReservation('/reservations', 'POST', payload, false, false);
        console.log("Respuesta API Reserva:", JSON.stringify(response));
        if (response?.data?.success) {
            showToast(response?.data?.message || "Reserva creada exitosamente", "success");
            // Resetear estado y selección
            setFormState(initialState);
            setSelectedPeriods([]); // Resetea periodos seleccionados
            setCurrentStep(1);
            setErrors({});
            setBusyDays([]);
            setAvailableTimeSlots([]);
        } else {
            showToast(response?.data?.message || "Error al crear la reserva.", "error");
        }
    } catch (error) {
        console.error("Error en handleSubmit:", error);
        showToast("Ocurrió un error inesperado.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };
  console.log("RENDERIZANDO - Fecha:", formState.fecha);
  console.log("RENDERIZANDO - Loading Times:", loadingTimes);
  console.log("RENDERIZANDO - AvailableTimeSlots:", availableTimeSlots);
  console.log("RENDERIZANDO - SelectedPeriods:", selectedPeriods);
// --- RENDER ---
return (
  <div className={styles.pageWrapper}>

  {/* === Botón Volver (Ahora dentro del wrapper, posicionado absolutamente respecto a él) === */}
  <button onClick={() => router.back()} className={styles.backButton}>
      <IconArrowLeft /> Volver a lista de reservas {/* O solo "Volver" */}
  </button>
  <div className={styles.createReservaContainer}>
    {/* --- Header --- */}
    <div className={styles.header}>
       {/* Botón para volver atrás */}
 
       {/* Indicador de Paso */}
      <div className={styles.progressContainer}>
          <span className={styles.stepIndicatorText}>{currentStep} de 3 pasos</span>
          <div className={styles.progressBar}>
              <div
              className={styles.progressFill}
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }} // Asume 3 pasos totales (0%, 50%, 100%)
              ></div>
          </div>
      </div>
    </div>

    {/* --- Form Card --- */}
    <div className={styles.formContainer}>
      <div className={styles.formCard}>

        {/* === PASO 1: Selección de Unidad y Área === */}
        {currentStep === 1 && (
          <div className={`${styles.stepContent} ${styles.step1Content}`}>
            {/* Sección Datos Generales (Unidad) */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Datos generales</h3>
              <div className={styles.formField}>
                  <Select
                    label="Unidad" name="unidad" value={formState.unidad}
                    options={unidadesOptions} onChange={handleChange} error={errors.unidad}
                    disabled={!unidadesLoaded}
                    placeholder={!unidadesLoaded ? "Cargando unidades..." : "Selecciona tu unidad"}
                  />
              </div>
            </div>

            {/* Sección Datos Reserva (Área Social) */}
             <div className={styles.formSection}>
               <h3 className={styles.sectionTitle}>Datos de la reserva</h3>
               <div className={styles.formField}>
                  <Select
                    label="Área social" name="area_social" value={formState.area_social}
                    options={areasSocialesOptions} onChange={handleChange} error={errors.area_social}
                    disabled={!areasLoaded}
                    placeholder={!areasLoaded ? "Cargando áreas..." : "Selecciona el área"}
                  />
               </div>
             </div>

           {/* Previsualización del Área Seleccionada */}
           {selectedAreaDetails && (
              <div className={styles.areaPreview}>
                  {/* Columna Imagen */}
                  {selectedAreaDetails.images && selectedAreaDetails.images.length > 0 && (
                  <div className={styles.imageContainer}>
                    <img
                      key={selectedAreaDetails.images[currentImageIndex].id} // Add key for re-render on change
                      className={styles.previewImage}
                      src={getUrlImages(`/AREA-${selectedAreaDetails.id}-${selectedAreaDetails.images[currentImageIndex].id}.webp?d=${selectedAreaDetails.updated_at}`)}
                      alt={`Imagen ${currentImageIndex + 1} de ${selectedAreaDetails.title}`}
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        // Intenta cargar la siguiente imagen si hay error, o un placeholder
                        if (selectedAreaDetails.images && selectedAreaDetails.images.length > 1) {
                            // Simple fallback, podría ser más robusto
                            setCurrentImageIndex((prev) => (prev + 1) % (selectedAreaDetails.images?.length || 1));
                        } else {
                            target.src = '/api/placeholder/350/280'; // Placeholder genérico
                        }
                      }}
                    />
                    {/* Paginación de Imagen */}
                    <div className={styles.imagePagination}>
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : (selectedAreaDetails?.images?.length || 1) - 1))}
                        disabled={selectedAreaDetails?.images?.length <= 1}
                        aria-label="Imagen anterior"
                      >
                        {"<"}
                      </button>
                      <span>{currentImageIndex + 1} / {selectedAreaDetails?.images?.length || 1}</span>
                      <button
                         type="button"
                         onClick={() => setCurrentImageIndex((prev) => (prev < (selectedAreaDetails?.images?.length || 1) - 1 ? prev + 1 : 0))}
                         disabled={selectedAreaDetails?.images?.length <= 1}
                         aria-label="Siguiente imagen"
                      >
                        {">"}
                      </button>
                    </div>
                  </div>
                  )}
                  {/* Si no hay imágenes */}
                  {(!selectedAreaDetails.images || selectedAreaDetails.images.length === 0) && (
                       <div className={styles.imageContainer}>
                          <img src="/api/placeholder/350/280" alt="Sin imagen" className={styles.previewImage} />
                       </div>
                  )}

                  {/* Columna Detalles */}
                  <div className={styles.areaInfo}>
                      {/* Título y Estado */}
                      <div className={styles.areaHeader}>
                          <h4 className={styles.areaTitle}>{selectedAreaDetails.title}</h4>
                          {selectedAreaDetails.status === 'A' ? (
                              <span className={`${styles.statusBadge} ${styles.statusDisponible}`}>Disponible</span>
                          ) : (
                              <span className={`${styles.statusBadge} ${styles.statusNoDisponible}`}>No Disponible</span>
                          )}
                      </div>
                      {/* Descripción */}
                      <p className={styles.areaDescription}>{selectedAreaDetails.description || "Sin descripción."}</p>
                      <hr className={styles.areaSeparator} />
                      {/* Capacidad */}
                      <div className={styles.detailBlock}>
                          <span className={styles.detailLabel}>Capacidad máxima</span>
                          <span className={styles.detailValue}>{selectedAreaDetails.max_capacity ?? 'No especificada'} personas</span>
                      </div>
                      <hr className={styles.areaSeparator} />
                      {/* Disponibilidad */}
                      <div className={styles.detailBlock}>
                          <span className={styles.detailLabel}>Disponibilidad</span>
                          <span className={styles.detailValue}>
                              Días: {selectedAreaDetails.available_days?.length ? selectedAreaDetails.available_days.join(', ') : 'No especificados'}
                          </span>
                          {/* Aquí podrías añadir las horas si available_hours tuviera un formato usable */}
                           {selectedAreaDetails.max_booking_duration && (
                              <span className={styles.detailValue}>
                                  Máximo {selectedAreaDetails.max_booking_duration}h por reserva
                              </span>
                          )}
                           <span className={styles.detailValue}>
                              Modo: {selectedAreaDetails.booking_mode === 'day' ? 'Por día' : 'Por hora'}
                          </span>
                      </div>
                       <hr className={styles.areaSeparator} />
                       {/* Reglas */}
                    <div className={styles.detailBlock}>
                        <span className={styles.detailLabel}>Reglas y restricciones</span>
                        {/* MODIFICAR onClick */}
                        <button
                          type='button'
                          className={styles.rulesButton}
                          onClick={() => setIsRulesModalVisible(true)} // <-- CAMBIAR AQUÍ
                        >
                          Ver Reglas
                        </button>
                    </div>
                  </div> {/* Fin areaInfo */}
              </div> // Fin areaPreview
            )}
          </div> // Fin Step 1
        )}

        {/* === PASO 2: Selección de Fecha, Hora y Personas === */}
        {currentStep === 2 && (
          <div className={`${styles.stepContent} ${styles.step2Content}`}>
            {/* Sección Fecha */}
            <div className={styles.dateSection}>
              <label className={styles.sectionLabel}>Selecciona la fecha del evento</label>
              {/* Indicador carga días ocupados */}
              {formState.area_social && !reservaCalendarLoaded && <span className={styles.loadingText}>Cargando disponibilidad de días...</span>}
              <CalendarPicker
                selectedDate={formState.fecha}
                onDateChange={handleDateChange}
                busyDays={busyDays}
              />
              {/* Error de fecha */}
              {errors.fecha && <span className={styles.errorText}>{errors.fecha}</span>}
            </div>

            {/* Sección Hora (Condicional si hay fecha) */}
            {formState.fecha && (
               <>
                 {/* === MODIFICADO: Sección de Selección de Periodos como Botones === */}
                  {/* Sección Hora (Condicional si hay fecha) */}
            {formState.fecha && (
               <>
                 {/* === MODIFICADO: Sección de Selección de Periodos === */}
                  {/* Mostrar solo si hay fecha */}
                  {formState.fecha && (
                     <div className={styles.durationSection}> {/* Contenedor general */}
                        <label className={styles.sectionLabel}>
                            {selectedAreaDetails?.booking_mode === 'day'
                                ? "Periodo disponible (Día completo)"
                                : "Selecciona los periodos disponibles"}
                        </label>

                        {/* Indicador carga horas */}
                        {loadingTimes && <span className={styles.loadingText}>Cargando periodos...</span>}

                        {/* --- LÓGICA DE VISUALIZACIÓN CORREGIDA --- */}
                        {/* Renderiza el contenido SOLO cuando NO esté cargando */}
                        {!loadingTimes && (
                            <>
                                {/* Verifica si hay slots DESPUÉS de que la carga terminó */}
                                {availableTimeSlots.length > 0 ? (
                                    // Si hay slots, muestra los botones
                                    <div className={styles.periodSelectionContainer}>
                                        {availableTimeSlots
                                          .sort((a,b) => a.localeCompare(b))
                                          .map((period) => {
                                            const isSelected = selectedPeriods.includes(period);
                                            return (
                                                <button
                                                    type="button"
                                                    key={period}
                                                    className={`${styles.periodButton} ${isSelected ? styles.selectedPeriod : ''}`}
                                                    onClick={() => handlePeriodToggle(period)}
                                                >
                                                    {period.replace('-', ' a ')}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    // Si NO hay slots (y ya no está cargando), muestra el mensaje
                                    // Añadimos una comprobación extra por si la fecha se deseleccionó mientras cargaba
                                    formState.fecha && (
                                        <span className={styles.warningText}>No hay periodos disponibles para esta fecha.</span>
                                    )
                                )}
                                {/* Muestra el error de validación si existe (fuera del if/else de slots) */}
                                {errors.selectedPeriods && <span className={styles.errorText}>{errors.selectedPeriods}</span>}
                            </>
                        )}
                        {/* --- FIN LÓGICA CORREGIDA --- */}
                     </div>
                  )}
                  {/* === FIN Sección de Selección de Periodos === */}

                 {/* Mensaje si SÍ es reserva por día (sin cambios) */}
                 {/* Nota: Este mensaje podría ser redundante si el label ya lo indica */}
                 {/* {selectedAreaDetails?.booking_mode === 'day' && (
                     <p className={styles.sectionSubtitle}>Esta área se reserva por día completo.</p>
                 )} */}
               </>
            )}
               </>
            )}

            {/* Sección Cantidad Personas */}
            <div className={styles.peopleSection}>
                <div className={styles.peopleLabelContainer}>
                    <label className={styles.sectionLabel}>Cantidad de personas</label>
                    <span className={styles.sectionSubtitle}>
                      Máx. {selectedAreaDetails?.max_capacity ?? 'N/A'} personas
                    </span>
                </div>
                <div className={styles.peopleInputContainer}>
                    <Input
                        label="" // Sin label flotante visible
                        name="cantidad_personas" type="number"
                        value={formState.cantidad_personas} onChange={handleChange}
                        error={errors.cantidad_personas} min={1}
                        max={selectedAreaDetails?.max_capacity ?? undefined}
                        className={styles.peopleInput} placeholder="Nº"
                    />
                </div>
                 {errors.cantidad_personas && <span className={styles.errorText}>{errors.cantidad_personas}</span>}
            </div>

            {/* Opcional: Campo Motivo/Observaciones */}
            <div className={styles.formSection} style={{ marginTop: 'var(--spL)' }}>
               <h3 className={styles.sectionTitle}>Motivo (Opcional)</h3>
               <div className={styles.formField}>
                  <TextArea
                      label="Describe brevemente el motivo de tu reserva"
                      name="motivo"
                      value={formState.motivo}
                      onChange={handleChange}
                      error={errors.motivo}
                      placeholder="Ej: Cumpleaños, reunión familiar..."
                      // Ajusta las filas según necesites
                  />
               </div>
            </div>

          </div> // Fin Step 2
        )}

        {/* === PASO 3: Datos del Responsable y Resumen === */}
        {currentStep === 3 && (
          <div className={`${styles.stepContent} ${styles.step3Content}`}>
            

            {/* Resumen de la reserva */}
            <h2 className={styles.summaryTitle}>Resumen de la reserva</h2>
            <div className={styles.summaryContainer}>
               {selectedAreaDetails ? (
                  <div className={styles.summaryContent}>
                      {/* Imagen del Resumen */}
                      <div className={styles.summaryImageContainer}>
                         {selectedAreaDetails.images && selectedAreaDetails.images.length > 0 ? (
                             <img
                              className={styles.previewImage} // Reutiliza estilo
                              src={getUrlImages(`/AREA-${selectedAreaDetails.id}-${selectedAreaDetails.images[currentImageIndex].id}.webp?d=${selectedAreaDetails.updated_at}`)}
                              alt={selectedAreaDetails.title}
                             onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                 (e.target as HTMLImageElement).src = '/api/placeholder/150/120'; // Placeholder más pequeño
                             }}
                             />
                         ) : (
                              <img src="/api/placeholder/150/120" alt="Sin imagen" className={styles.previewImage} />
                         )}
                      </div>
                      {/* Detalles del Resumen */}
                      <div className={styles.summaryDetailsContainer}>
                           <div className={styles.summaryAreaInfo}>
                             <span className={styles.summaryAreaName}>{selectedAreaDetails.title}</span>
                             {/* Opcional: Descripción corta si quieres */}
                             {/* <p className={styles.summaryAreaDescription}>
                                 {selectedAreaDetails.description?.substring(0, 50) || "Sin descripci\u00F3n."}...
                             </p> */}
                          </div>
                           <div className={styles.summaryBookingDetails}>
                             <span className={styles.summaryDetailsTitle}>Detalles de tu reserva</span>
                             {/* Fecha */}
                             <div className={styles.summaryDetailItem}>
                                {/* Placeholder para Icono Calendario */}
                                <span className={styles.detailIcon}>📅</span>
                                <span>{formState.fecha || "Fecha no seleccionada"}</span>
                             </div>
                             {/* Hora (si aplica) */}
                             {/* Hora/Periodos (si aplica) - MODIFICADO */}
                             {selectedAreaDetails.booking_mode !== 'day' && (
                                 <div className={styles.summaryDetailItem}>
                                    <span className={styles.detailIcon}>🕒</span>
                                    {/* Muestra los periodos seleccionados, separados por coma o como prefieras */}
                                    <span>
                                        {selectedPeriods.length > 0
                                            ? selectedPeriods.map(p => p.replace('-', ' a ')).join(', ')
                                            : 'Ningún periodo seleccionado'
                                        }
                                    </span>
                                 </div>
                             )}
                             {selectedAreaDetails.booking_mode === 'day' && (
                                  <div className={styles.summaryDetailItem}>
                                    <span className={styles.detailIcon}>🕒</span>
                                    <span>Día completo</span>
                                 </div>
                             )}
                              {/* Personas */}
                              <div className={styles.summaryDetailItem}>
                                {/* Placeholder para Icono Personas */}
                                <span className={styles.detailIcon}>👥</span>
                                <span>{formState.cantidad_personas || 0} personas</span>
                             </div>
                              {/* Costo (Ejemplo estático/simple) */}
                              <div className={styles.summaryDetailItem}>
                                 {/* Placeholder para Icono Dinero */}
                                <span className={styles.detailIcon}>💲</span>
                                {selectedAreaDetails.is_free === 'X' ? (
                                    <span className={styles.summaryTotalCost}>Gratis</span>
                                ) : (
                                   <>
                                     {/* Aquí necesitarías lógica para calcular el costo real */}
                                     {/* <span className={styles.summaryCostPerHour}>Bs {selectedAreaDetails.price || 0}/h</span> */}
                                     <span className={styles.summaryTotalCost}>Total: Bs {Number(selectedAreaDetails.price || 0)}</span>
                                   </>
                                )}
                             </div>
                          </div>
                      </div>
                  </div>
               ) : (
                  <p>No se pudo cargar el resumen.</p>
               )}
            </div>
          </div> // Fin Step 3
        )}

        {/* === Acciones (Botones) y Precio Condicional === */}
    <div className={styles.formActions}> {/* CSS: justify-content: space-between; align-items: center; */}

        {/* --- Contenedor para Info de Precio (SOLO EN PASO 1) --- */}
        {currentStep === 1 && selectedAreaDetails && ( // <-- **CONDICIÓN AÑADIDA AQUÍ**
          <div className={styles.priceInfoBottom}>
              <span className={styles.priceValueBottom}>
                {selectedAreaDetails.is_free === 'X'
                  ? 'Gratis'
                  : `Bs ${Number(selectedAreaDetails.price || 0).toFixed(2)}`
                }
              </span>
          </div>
          )}  
        {/* Si no es paso 1 o no hay area, no muestra nada aquí (a la izquierda) */}
        {/* Opcional: podrías poner un div vacío o un spacer si necesitas mantener el espacio */}
        {currentStep !== 1 && <div style={{ flexGrow: 1 }}></div>} {/* Placeholder para empujar botones a la derecha en otros pasos */}
        {/* --- FIN Contenedor Precio --- */}


        {/* --- Contenedor para los Botones (siempre a la derecha) --- */}
        <div className={styles.actionButtonsContainer}>
            {/* Botón Atrás (visible desde paso 2 en adelante) */}
            {currentStep > 1 && (
              <button type="button" className={`${styles.button} ${styles.backBtn}`} onClick={prevStep} disabled={isSubmitting}>
                Atras
              </button>
            )}
            {/* Botón Siguiente (visible solo en Paso 1) */}
            {currentStep === 1 && (
              <button type="button" className={`${styles.button} ${styles.nextBtn}`} onClick={nextStep} disabled={isSubmitting || !selectedAreaDetails}>
                Siguiente
              </button>
            )}
            {/* Botón Continuar (visible solo en Paso 2) */}
            {currentStep === 2 && (
              <button type="button" className={`${styles.button} ${styles.nextBtn}`} onClick={nextStep} disabled={isSubmitting}>
                Continuar
              </button>
            )}
            {/* Botón Reservar (visible solo en el último paso - Paso 3) */}
            {currentStep === 3 && (
              <button type="button" className={`${styles.button} ${styles.submitBtn}`} onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Reservando..." : "Reservar"}
              </button>
            )}
        </div>
        {/* --- FIN Contenedor Botones --- */}

        </div>

      </div> {/* Fin formCard */}
    </div> {/* Fin formContainer */}

    {selectedAreaDetails && ( // Renderiza el modal solo si hay detalles del área
     <DataModal
       open={isRulesModalVisible}
       onClose={() => setIsRulesModalVisible(false)} // Función para cerrar
       title={`Reglas de Uso - ${selectedAreaDetails.title}`} // Título del modal
       buttonText="" // Oculta el botón de "Guardar"
       buttonCancel="Cerrar" // Texto del botón para cerrar
       iconClose={true} // Muestra el icono 'X' para cerrar si no es fullscreen
       // fullScreen={false} // Puedes ajustar si lo necesitas a pantalla completa
     >
       {/* Contenido del modal (los hijos) */}
       <div className={styles.rulesModalContent}> {/* Puedes añadir un estilo específico si quieres */}
         <p>{selectedAreaDetails.usage_rules || 'No hay reglas de uso especificadas para esta área.'}</p>
       </div>
     </DataModal>
   )}
  </div> 
  </div>  
);
};

export default CreateReserva;

