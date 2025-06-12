"use client";
import React, { useState, useEffect, useMemo } from "react";
import styles from "./CreateReserva.module.css";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import TextArea from "@/mk/components/forms/TextArea/TextArea"; // Asegúrate si lo usas
import {
  IconArrowLeft,
  IconBackAround,
  IconCalendar,
  IconClock,
  IconGroup,
  IconMonedas,
  IconNextAround,
  IconX,
  IconZoomDetail,
} from "@/components/layout/icons/IconsBiblioteca";
import CalendarPicker from "./CalendarPicker/CalendarPicker";
import useAxios from "@/mk/hooks/useAxios";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { useRouter } from "next/navigation";
// Importa TODAS las interfaces necesarias desde Type.ts
import {
  ApiUnidad,
  ApiArea,
  ApiDptosResponse,
  ApiAreasResponse,
  ApiReservationsCalendarResponse,
  Option, // Importa Option también
  FormState,
  ApiCalendarAvailabilityData,
} from "./Type"; // Asegúrate que la ruta sea correcta
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import Button from "@/mk/components/forms/Button/Button";

// --- Interfaces del Formulario (Definidas localmente) ---

// Estado inicial para resetear el formulario
const initialState: FormState = {
  unidad: "",
  area_social: "",
  fecha: "",
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
    unavailable?: string[]; // ["HH:mm-HH:mm", ...]
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
  const [unavailableTimeSlots, setUnavailableTimeSlots] = useState<string[]>(
    []
  );
  const [loadingTimes, setLoadingTimes] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [isRulesModalVisible, setIsRulesModalVisible] =
    useState<boolean>(false);
  const router = useRouter();
  const [canMakeReservationForDate, setCanMakeReservationForDate] = useState<
    boolean | null
  >(null); // null = no data yet, true = puede, false = no puede
  const [reservationBlockMessage, setReservationBlockMessage] =
    useState<string>("");
  const [imageLoadError, setImageLoadError] = useState(false);

  // --- Hooks ---
  const { showToast } = useAuth();

  // --- Peticiones API ---
  // Hook para obtener Unidades
  const {
    data: unidadesResponse,
    loaded: unidadesLoaded,
    execute: executeUnidadesApi,
  } = useAxios("/dptos", "GET", {
    perPage: -1,
    page: 1,
    fullType: "L", // Asegúrate que esto traiga la info del titular
  });

  // Hook para obtener Áreas
  const { data: areasResponse, loaded: areasLoaded } = useAxios(
    "/areas",
    "GET",
    {
      fullType: "L",
    }
  );

  // Hook para obtener DÍAS OCUPADOS y HORAS DISPONIBLES
  const {
    data: reservaCalendarResponse,
    loaded: reservaCalendarLoaded,
    execute: executeCalendarApi,
  } = useAxios(
    "/reservations-calendar",
    "GET",
    { area_id: formState.area_social || "none" },
    !formState.area_social
  );

  // NUEVO: Hook para ENVIAR la reserva (configurado para no ejecutar al inicio)
  // Usamos 'execute' directamente, no necesitamos el estado 'data' aquí
  // En CreateReserva.tsx, donde defines los hooks

  // Hook para ENVIAR la reserva (MODIFICADO: URL inicial es null)
  const { execute: executeCreateReservation } = useAxios(
    null, // <-- CAMBIO AQUÍ: Pasa null en lugar de la URL
    "POST", // Método (se usará como default si no se pasa a execute)
    {}, // Payload inicial (no se usa si la URL es null)
    true // Este flag ahora es menos relevante, pero mantenlo por consistencia
  );

  // --- Efecto para actualizar busyDays ---
  useEffect(() => {
    // <---- AÑADE UN CONSOLE.LOG AQUÍ para ver qué llega
    console.log(
      "useEffect [busyDays] - Response:",
      JSON.stringify(reservaCalendarResponse),
      "Loaded:",
      reservaCalendarLoaded,
      "Area:",
      formState.area_social
    );

    if (
      reservaCalendarLoaded &&
      formState.area_social &&
      reservaCalendarResponse?.data &&
      "reserved" in reservaCalendarResponse.data
    ) {
      console.log(
        "useEffect [busyDays] - Setting busyDays:",
        reservaCalendarResponse.data.reserved
      ); // Verifica qué se va a setear
      setBusyDays(reservaCalendarResponse.data.reserved || []);
    } else if (!formState.area_social) {
      console.log("useEffect [busyDays] - Resetting busyDays (no area)");
      setBusyDays([]);
    } else if (reservaCalendarLoaded && formState.area_social) {
      // Si loaded es true y hay area, pero la condición principal falló, loguea por qué
      console.log(
        "useEffect [busyDays] - Condition failed. Response data:",
        reservaCalendarResponse?.data
      );
      if (!reservaCalendarResponse?.data) {
        console.log(
          "useEffect [busyDays] - Reason: reservaCalendarResponse.data is falsy"
        );
      } else if (!("reserved" in reservaCalendarResponse.data)) {
        console.log(
          "useEffect [busyDays] - Reason: 'reserved' key NOT found in reservaCalendarResponse.data. Keys:",
          Object.keys(reservaCalendarResponse.data)
        );
      }
      setBusyDays([]);
    }
  }, [reservaCalendarResponse, reservaCalendarLoaded, formState.area_social]);

  // --- Transformación de datos para Selects (Unidades, Areas) ---
  const unidadesOptions: Option[] = useMemo(() => {
    if (!unidadesLoaded || !unidadesResponse?.data) return [];
    // Convierte ID numérico a string para el Select si es necesario, o ajusta el tipo de Option
    return unidadesResponse.data.map(
      (unidad: ApiUnidad): Option => ({
        id: String(unidad.id), // Asegura que ID sea string si <Select> lo espera así
        name: `Unidad ${unidad.nro}`,
      })
    );
  }, [unidadesResponse, unidadesLoaded]);

  const areasSocialesOptions: Option[] = useMemo(() => {
    if (!areasLoaded || !areasResponse?.data) return [];
    return areasResponse.data.map(
      (area: ApiArea): Option => ({
        id: area.id, // ID de área es string
        name: area.title,
      })
    );
  }, [areasResponse, areasLoaded]);

  // --- Obtener detalles del área seleccionada ---
  const selectedAreaDetails: ApiArea | undefined = useMemo(() => {
    if (!areasLoaded || !areasResponse?.data || !formState.area_social) {
      return undefined;
    }
    return areasResponse.data.find(
      (area: ApiArea) => area.id === formState.area_social
    );
  }, [formState.area_social, areasResponse, areasLoaded]);

  // --- Función para obtener horas disponibles ---
  // --- Función para obtener horas disponibles (MODIFICADA PARA owner_id y reservations/message) ---
  const fetchAvailableTimes = async (
    areaId: string,
    dateString: string,
    ownerId: string
  ) => {
    // Estado inicial de la carga y reseteo de datos previos
    setLoadingTimes(true);
    setAvailableTimeSlots([]); // Limpia siempre al iniciar
    setUnavailableTimeSlots([]); // Limpia también los no disponibles
    setSelectedPeriods([]); // Limpia selección previa de periodos
    setCanMakeReservationForDate(null); // Resetea permiso
    setReservationBlockMessage(""); // Resetea mensaje

    try {
      // Llamada a la API con todos los parámetros necesarios
      const response: any = await executeCalendarApi(
        "/reservations-calendar",
        "GET",
        {
          area_id: areaId,
          date_at: dateString,
          owner_id: ownerId, // Incluye owner_id
        },
        false, // skipAbort
        false // skipLoading
      );

      // Declaraciones de variables para guardar los datos procesados
      // Usa el tipo importado ApiCalendarAvailabilityData para apiData
      let apiData: ApiCalendarAvailabilityData | null = null;
      let canReserve: boolean | undefined | null = null;
      let message: string = "";
      let availableSlots: string[] | undefined = undefined;
      let processed = false; // Flag para saber si encontramos un objeto de datos válido

      // CASO 1: La respuesta directa de la API es un array vacío []
      if (Array.isArray(response) && response.length === 0) {
        apiData = null; // No hay objeto de datos
      }
      // CASO 2: Busca datos en response.data.data (estructura anidada)
      else if (
        typeof response?.data?.data === "object" &&
        response.data.data !== null &&
        !Array.isArray(response.data.data)
      ) {
        // Asigna el objeto encontrado. TypeScript debería reconocer el tipo si la importación es correcta.
        apiData = response.data.data;
        console.log("Datos leídos desde response.data.data");
        processed = true;
      }
      // CASO 3: Busca datos en response.data (estructura menos anidada, fallback)
      // Verifica también que tenga una propiedad esperada como 'reservations'
      else if (
        typeof response?.data === "object" &&
        response.data !== null &&
        !Array.isArray(response.data) &&
        "reservations" in response.data
      ) {
        // Asigna el objeto encontrado.
        apiData = response.data;
        console.warn("Usando datos de fallback response.data");
        processed = true;
      }
      // CASO 4: La respuesta no es [] ni un objeto válido en las ubicaciones esperadas
      else {
        console.error(
          "Respuesta inválida o estructura no reconocida:",
          response
        );
        apiData = null; // No se encontraron datos válidos
      }
      // FIN: Lógica para encontrar los datos

      // Extrae la información si encontramos un objeto de datos válido (apiData no es null)
      if (apiData) {
        // Solo necesitamos chequear si apiData no es null aquí
        canReserve = apiData.reservations; // Accede a las propiedades (TS usará el tipo ApiCalendarAvailabilityData)
        message = apiData.message ?? "";
        availableSlots = apiData.available;
        const unavailableSlots = apiData.unavailable;
        if (Array.isArray(unavailableSlots)) {
          setUnavailableTimeSlots(unavailableSlots);
          console.log(">>> Setting unavailableTimeSlots:", unavailableSlots);
        } else {
          setUnavailableTimeSlots([]);
        }
      }
      // Si apiData es null (porque la respuesta fue [] o inválida),
      // las variables canReserve, message, availableSlots mantendrán sus valores (null, '', undefined)

      // Establece el estado del componente basado en los datos procesados
      // Si canReserve no se pudo leer (es null o undefined), se tratará como 'false'
      setCanMakeReservationForDate(canReserve === true);
      // El mensaje solo se muestra si explícitamente 'reservations' es false
      setReservationBlockMessage(canReserve === false ? message : "");

      // Establece los slots disponibles solo si 'availableSlots' es realmente un array
      if (Array.isArray(availableSlots)) {
        setAvailableTimeSlots(availableSlots);
        console.log(">>> Setting availableTimeSlots:", availableSlots);
      } else {
        // Si no es un array (undefined, null, etc.), asegura que el estado sea un array vacío
        setAvailableTimeSlots([]);
        console.log(
          ">>> Setting availableTimeSlots: [] (Input not a valid array)"
        );
      }
    } catch (error) {
      // Captura errores de red o fallos inesperados durante el proceso
      console.error("Error en fetchAvailableTimes:", error);
      setAvailableTimeSlots([]);
      setUnavailableTimeSlots([]);
      setCanMakeReservationForDate(false); // Asume no disponible si hay error
      setReservationBlockMessage("Error al cargar horarios. Intenta de nuevo.");
    } finally {
      // Siempre quita el indicador de carga al finalizar (éxito o error)
      console.log(">>> Setting loadingTimes: false");
      setLoadingTimes(false);
    }
  };
  // --- Funciones Handler ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const isAreaChange = name === "area_social";

    // Actualiza el estado del formulario
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      // Si cambia el área, OBLIGATORIAMENTE resetea la fecha
      ...(isAreaChange && { fecha: "" }),
    }));

    // Limpia el error del campo que cambió
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Lógica específica cuando cambia el ÁREA SOCIAL
    if (isAreaChange) {
      // 1. Resetea estados dependientes del área y fecha
      setBusyDays([]); // Resetea días ocupados inmediatamente para feedback visual
      setAvailableTimeSlots([]); // Resetea horarios disponibles
      setSelectedPeriods([]); // Resetea periodos seleccionados
      // Limpia errores relacionados con fecha y periodos
      setErrors((prev) => ({
        ...prev,
        fecha: undefined,
        selectedPeriods: undefined,
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
          "GET", // Método
          { area_id: value }, // Parámetros: SOLO el area_id
          true, // skipAbort (normalmente false)
          false // skipLoading (ajusta si usas el estado 'loading' del hook)
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
  //PARA ERROR EN IMAGEN
  useEffect(() => {
    setImageLoadError(false);
  }, [currentImageIndex, selectedAreaDetails?.id]);

  const handlePeriodToggle = (period: string) => {
    setSelectedPeriods((prevSelected) => {
      // Verifica si el periodo clickeado ya era el único seleccionado
      const isCurrentlySelected =
        prevSelected.length === 1 && prevSelected[0] === period;

      if (isCurrentlySelected) {
        // Si se hace clic en el ya seleccionado, se deselecciona (queda vacío)
        return [];
      } else {
        // Si se hace clic en uno nuevo (o no había selección), se selecciona SOLO ese
        return [period];
      }
    });

    // Limpia el error de selección de periodo si el usuario interactúa
    if (errors.selectedPeriods) {
      setErrors((prev) => ({ ...prev, selectedPeriods: undefined }));
    }
  };

  // --- FIN Modificación handlePeriodToggle ---

  const handleDateChange = (dateString: string | undefined) => {
    const newDate = dateString || "";

    // Actualiza fecha y resetea periodos seleccionados
    setFormState((prev) => ({ ...prev, fecha: newDate }));
    setSelectedPeriods([]);

    // Resetea estados de disponibilidad y errores relacionados
    setAvailableTimeSlots([]); // Limpia slots anteriores
    setCanMakeReservationForDate(null);
    setReservationBlockMessage("");
    setErrors((prev) => ({
      ...prev,
      fecha: newDate ? undefined : prev.fecha, // Limpia error fecha si hay nueva fecha
      selectedPeriods: undefined, // Limpia error de periodo
    }));

    // --- 👇 LÓGICA MEJORADA PARA OBTENER owner_id Y LLAMAR fetch 👇 ---
    // Solo procede si tenemos área, fecha Y unidad seleccionadas
    if (formState.area_social && newDate && formState.unidad) {
      // Encuentra la unidad seleccionada para obtener el owner_id
      const selectedUnit = unidadesResponse?.data?.find(
        (u: ApiUnidad) => String(u.id) === formState.unidad
      );
      const ownerId = selectedUnit?.titular?.owner_id;

      if (ownerId) {
        // Llama a fetchAvailableTimes PASANDO el ownerId
        fetchAvailableTimes(formState.area_social, newDate, ownerId);
      } else {
        // Manejo de error si no se encuentra el owner_id
        console.error(
          "Error: No se pudo encontrar owner_id para la unidad seleccionada:",
          formState.unidad
        );
        showToast(
          "No se pudo verificar la disponibilidad (error propietario).",
          "error"
        );
        // Asegura que los estados reflejen que no se pudo cargar
        setAvailableTimeSlots([]);
        setCanMakeReservationForDate(false); // Asume no disponible
        setReservationBlockMessage(
          "No se encontró información del propietario para validar límites."
        );
      }
    } else {
      // Si falta área, fecha o unidad, simplemente limpia los slots
      setAvailableTimeSlots([]);
      setCanMakeReservationForDate(null); // Resetea
      setReservationBlockMessage(""); // Resetea
    }
    // --- 👆 FIN LÓGICA MEJORADA 👆 ---
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
    const errs: FormErrors = {}; // Inicia objeto de errores vacío

    // Validación de Fecha (sin cambios)
    if (!formState.fecha) errs.fecha = "Selecciona una fecha";

    // Validación de Periodos Seleccionados (sin cambios)
    if (selectedAreaDetails?.booking_mode !== "day") {
      if (selectedPeriods.length === 0) {
        // Usa la nueva clave de error
        errs.selectedPeriods =
          "Debes seleccionar al menos un periodo disponible";
      }
    }

    // --- VALIDACIÓN DE CANTIDAD DE PERSONAS (CORREGIDA Y COMPLETA) ---
    const maxCapacity = selectedAreaDetails?.max_capacity; // Obtiene la capacidad máxima del área seleccionada

    if (!formState.cantidad_personas) {
      // 1. Verifica si el campo está vacío
      errs.cantidad_personas = "Ingresa la cantidad de personas";
    } else {
      // 2. Si no está vacío, convierte el valor a número
      const numPeople = Number(formState.cantidad_personas);

      if (isNaN(numPeople)) {
        // 3. Verifica si la conversión a número fue exitosa
        errs.cantidad_personas = "Ingresa un número válido";
      } else if (numPeople < 1) {
        // 4. Verifica si el número es menor que el mínimo permitido (1)
        errs.cantidad_personas = "La cantidad debe ser al menos 1";
      } else if (
        maxCapacity !== undefined &&
        maxCapacity !== null &&
        numPeople > maxCapacity
      ) {
        // 5. Verifica si se definió una capacidad máxima Y si el número ingresado la excede
        errs.cantidad_personas = `La cantidad máxima de personas permitida para esta área es ${maxCapacity}.`; // Mensaje de error específico
      }
      // Si ninguna de las condiciones anteriores se cumple, el valor es válido respecto a la capacidad.
    }
    // --- FIN VALIDACIÓN PERSONAS ---

    setErrors(errs); // Actualiza el estado de errores con los encontrados
    return Object.keys(errs).length === 0; // Devuelve true solo si NO hubo errores
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
      if (currentStep < 3) {
        // Asumiendo 3 pasos totales
        setCurrentStep((prev) => prev + 1);
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
      setCurrentStep((prev) => prev - 1);
    }
  };

  // --- MODIFICADO: `handleSubmit` con lógica de API POST ---
  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
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
    const selectedUnit = unidadesResponse?.data?.find(
      (u: any) => String(u.id) === formState.unidad
    );
    const ownerId = selectedUnit?.titular?.owner_id;
    if (!ownerId) {
      /* ... manejo de error ... */ setIsSubmitting(false);
      return;
    }

    // 2. MODIFICADO: Obtener start_time del primer periodo seleccionado (si existe)
    let startTime = "";
    // Asegura que los periodos estén ordenados antes de tomar el primero
    const sortedSelectedPeriods = [...selectedPeriods].sort();
    if (sortedSelectedPeriods.length > 0) {
      startTime = sortedSelectedPeriods[0].split("-")[0];
    }

    // 3. Construir Payload (MODIFICADO: usa selectedPeriods)

    const payload = {
      area_id: formState.area_social,
      owner_id: ownerId,
      date_at: formState.fecha,
      people_count: Number(formState.cantidad_personas),
      amount: Number(selectedAreaDetails?.price || 0),
      obs:
        formState.motivo ||
        `Reserva de ${selectedAreaDetails?.title || "área"}`,
      start_time: startTime, // Usa el startTime calculado
      // MODIFICADO: Envía SIEMPRE los periodos seleccionados
      Periods: sortedSelectedPeriods,
    };

    console.log("Payload a enviar:", payload);

    try {
      // Llama a execute pasando la URL y el Método explícitamente
      const response = await executeCreateReservation(
        "/reservations", // <-- Argumento 1: URL real
        "POST", // <-- Argumento 2: Método real
        payload, // Argumento 3: Payload (tu objeto con los datos)
        false, // Argumento 4: 'Act' (generalmente false si no necesitas que este hook actualice su propio estado 'data')
        false // Argumento 5: 'notWaiting' (generalmente false para indicar que sí quieres manejar el estado de carga global si existe)
      );
      console.log("Respuesta API Reserva:", JSON.stringify(response));

      // El resto del manejo de la respuesta sigue igual...
      if (response?.data?.success) {
        showToast(
          response?.data?.message || "Reserva creada exitosamente",
          "success"
        );
        // ... resetear estado ...
        router.push("/reservas");
      } else {
        showToast(
          response?.data?.message || "Error al crear la reserva.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      showToast("Ocurrió un error inesperado al crear la reserva.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  // Dentro del componente CreateReserva, antes del return

  const handleQuantityChange = (newValue: number | string) => {
    console.log(
      `[HQC Start] newValue: "${newValue}", typeof: ${typeof newValue}, max_capacity: ${
        selectedAreaDetails?.max_capacity
      }`
    ); // DEBUG
    let finalValue: string;

    // CASO 1: El usuario borró el contenido o es un string vacío.
    if (String(newValue).trim() === "") {
      finalValue = ""; // Permitir que el campo se quede vacío
      console.log("[HQC Logic] Path: empty string input by user"); // DEBUG
    } else {
      // CASO 2: El input no está vacío, procesar como número.
      const numValue = Number(newValue);
      const min = 1; // El mínimo lógico para la cantidad sigue siendo 1
      const max = selectedAreaDetails?.max_capacity;
      console.log(
        `[HQC Logic] numValue: ${numValue}, min: ${min}, max: ${max}`
      ); // DEBUG

      if (isNaN(numValue)) {
        // Si se tecleó algo no numérico (ej. "abc")
        finalValue = ""; // Dejar vacío para que el usuario corrija, o podrías usar el valor anterior: formState.cantidad_personas
        console.log(
          "[HQC Logic] Path: isNaN after attempting to parse non-empty string"
        ); // DEBUG
      } else if (max !== undefined && max !== null && numValue > max) {
        finalValue = String(max);
        console.log(
          `[HQC Logic] Path: numValue > max. Corrected to max: ${finalValue}`
        ); // DEBUG
      } else if (numValue < min) {
        // Si el número es explícitamente < 1 (ej. el usuario tipeó "0" o "-5")
        finalValue = String(min);
        console.log(
          `[HQC Logic] Path: numValue < min (but not an initially empty input). Corrected to min: ${finalValue}`
        ); // DEBUG
      } else {
        // Es un número válido dentro de los rangos
        finalValue = String(newValue); // Usar newValue directamente si ya es un string numérico válido
        console.log(
          "[HQC Logic] Path: else (valid number). Set to input newValue:",
          finalValue
        ); // DEBUG
      }
    }

    console.log(`[HQC END] Determined finalValue: "${finalValue}"`); // DEBUG

    setFormState((prev) => ({
      ...prev,
      cantidad_personas: finalValue,
    }));

    // Limpiar error si el campo ahora es válido o si se está manejando de otra forma
    if (errors.cantidad_personas) {
      if (finalValue.trim() === "") {
        // Si el campo está vacío, la validación del paso (validateStep2) lo marcará como error al intentar continuar.
        // No necesariamente limpiamos el error aquí si "vacío" es un estado inválido para la sumisión.
      } else {
        const numValCheck = Number(finalValue);
        const maxCap = selectedAreaDetails?.max_capacity;
        if (
          !isNaN(numValCheck) &&
          numValCheck >= 1 &&
          (maxCap === undefined || maxCap === null || numValCheck <= maxCap)
        ) {
          setErrors((prev) => ({ ...prev, cantidad_personas: undefined }));
        }
      }
    }
  };

  const incrementPeople = () => {
    const currentValue = Number(formState.cantidad_personas || 0); // Si está vacío, empieza desde 0
    const max = selectedAreaDetails?.max_capacity;
    const newValue = currentValue + 1;

    // Aplicar la nueva lógica de manejo de cambio que respeta límites
    handleQuantityChange(newValue);
  };

  const decrementPeople = () => {
    const currentValue = Number(formState.cantidad_personas || 1); // Si está vacío, empieza desde 1
    const min = 1;
    const newValue = currentValue - 1;

    // Aplicar la nueva lógica de manejo de cambio que respeta límites
    handleQuantityChange(newValue);
  };
  const allTimeSlots = useMemo(() => {
    const available = availableTimeSlots.map((period) => ({
      period,
      isAvailable: true,
    }));
    const unavailable = unavailableTimeSlots.map((period) => ({
      period,
      isAvailable: false,
    }));

    // Combina y ordena los periodos cronológicamente
    return [...available, ...unavailable].sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }, [availableTimeSlots, unavailableTimeSlots]);

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
            <span className={styles.stepIndicatorText}>
              {currentStep} de 3 pasos
            </span>
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
                      label="Unidad"
                      name="unidad"
                      value={formState.unidad}
                      options={unidadesOptions}
                      onChange={handleChange}
                      error={errors}
                      disabled={!unidadesLoaded}
                      placeholder={
                        !unidadesLoaded
                          ? "Cargando unidades..."
                          : "Selecciona tu unidad"
                      }
                    />
                  </div>
                </div>

                {/* Sección Datos Reserva (Área Social) */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Datos de la reserva</h3>
                  <div className={styles.formField}>
                    <Select
                      label="Área social"
                      name="area_social"
                      value={formState.area_social}
                      options={areasSocialesOptions}
                      onChange={handleChange}
                      error={errors}
                      disabled={!areasLoaded}
                      placeholder={
                        !areasLoaded
                          ? "Cargando áreas..."
                          : "Selecciona el área"
                      }
                    />
                  </div>
                </div>

                {/* Previsualización del Área Seleccionada */}
                {selectedAreaDetails && (
                  <div className={styles.areaPreview}>
                    {/* Columna Imagen */}
                    {selectedAreaDetails.images &&
                      selectedAreaDetails.images.length > 0 && (
                        <div className={styles.imageContainer}>
                          <img
                            key={
                              selectedAreaDetails.images[currentImageIndex].id
                            } // Add key for re-render on change
                            className={styles.previewImage}
                            src={getUrlImages(
                              `/AREA-${selectedAreaDetails.id}-${selectedAreaDetails.images[currentImageIndex].id}.webp?d=${selectedAreaDetails.updated_at}`
                            )}
                            alt={`Imagen ${currentImageIndex + 1} de ${
                              selectedAreaDetails.title
                            }`}
                          />
                          {/* Paginación de Imagen */}
                          <div className={styles.imagePagination}>
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentImageIndex((prev) =>
                                  prev > 0
                                    ? prev - 1
                                    : (selectedAreaDetails?.images?.length ||
                                        1) - 1
                                )
                              }
                              disabled={
                                selectedAreaDetails?.images?.length <= 1
                              }
                              aria-label="Imagen anterior"
                            >
                              {/* Añade la className aquí */}
                              <IconBackAround
                                className={styles.paginationIcon}
                              />
                            </button>

                            <span>
                              {currentImageIndex + 1} /{" "}
                              {selectedAreaDetails?.images?.length || 1}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setCurrentImageIndex((prev) =>
                                  prev <
                                  (selectedAreaDetails?.images?.length || 1) - 1
                                    ? prev + 1
                                    : 0
                                )
                              }
                              disabled={
                                selectedAreaDetails?.images?.length <= 1
                              }
                              aria-label="Siguiente imagen"
                            >
                              {/* Añade la className aquí */}
                              <IconNextAround
                                className={styles.paginationIcon}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    {/* Si no hay imágenes */}
                    {(!selectedAreaDetails.images ||
                      selectedAreaDetails.images.length === 0) && (
                      <div className={styles.imageContainer}>
                        <img
                          src="/assets/no-image.png"
                          alt="Sin imagen"
                          className={styles.previewImage}
                        />
                      </div>
                    )}
                    {/* Columna Detalles */}
                    <div className={styles.areaInfo}>
                      {/* Título y Estado */}
                      <div className={styles.areaHeader}>
                        <h4 className={styles.areaTitle}>
                          {selectedAreaDetails.title}
                        </h4>
                        {selectedAreaDetails.status === "A" ? (
                          <span
                            className={`${styles.statusBadge} ${styles.statusDisponible}`}
                          >
                            Disponible
                          </span>
                        ) : (
                          <span
                            className={`${styles.statusBadge} ${styles.statusNoDisponible}`}
                          >
                            No Disponible
                          </span>
                        )}
                      </div>
                      {/* Descripción */}
                      <p className={styles.areaDescription}>
                        {selectedAreaDetails.description || "Sin descripción."}
                      </p>
                      <hr className={styles.areaSeparator} />
                      {/* Capacidad */}
                      <div className={styles.detailBlock}>
                        <span className={styles.detailLabel}>
                          Capacidad máxima
                        </span>
                        <span className={styles.detailValue}>
                          {selectedAreaDetails.max_capacity ??
                            "No especificada"}{" "}
                          personas
                        </span>
                      </div>
                      <hr className={styles.areaSeparator} />
                      {/* Disponibilidad */}
                      <div className={styles.detailBlock}>
                        <span className={styles.detailLabel}>
                          Disponibilidad
                        </span>
                        <span className={styles.detailValue}>
                          Días:{" "}
                          {selectedAreaDetails.available_days?.length
                            ? selectedAreaDetails.available_days.join(", ")
                            : "No especificados"}
                        </span>
                        {/* Aquí podrías añadir las horas si available_hours tuviera un formato usable */}
                        {selectedAreaDetails.max_booking_duration && (
                          <span className={styles.detailValue}>
                            Máximo {selectedAreaDetails.max_booking_duration}h
                            por reserva
                          </span>
                        )}
                        <span className={styles.detailValue}>
                          Modo:{" "}
                          {selectedAreaDetails.booking_mode === "day"
                            ? "Por día"
                            : "Por hora"}
                        </span>
                      </div>
                      <hr className={styles.areaSeparator} />
                      {/* Reglas */}
                      <div className={styles.detailBlock}>
                        <span className={styles.detailLabel}>
                          Reglas y restricciones
                        </span>
                        {/* Botón ahora contiene solo el icono */}
                        <button
                          type="button"
                          className={styles.rulesButton} // Mantenemos la clase para aplicar estilos CSS
                          onClick={() => setIsRulesModalVisible(true)}
                          aria-label="Ver reglas de uso" // IMPORTANTE para accesibilidad
                        >
                          <IconZoomDetail /> {/* <-- Icono en lugar de texto */}
                        </button>
                      </div>
                    </div>{" "}
                    {/* Fin areaInfo */}
                  </div> // Fin areaPreview
                )}
              </div> // Fin Step 1
            )}

            {/* === PASO 2: Selección de Fecha, Hora y Personas === */}
            {currentStep === 2 && (
              <div className={`${styles.stepContent} ${styles.step2Content}`}>
                {/* Sección Fecha */}
                <div className={styles.dateSection}>
                  <label className={styles.sectionLabel}>
                    Selecciona la fecha del evento
                  </label>
                  {/* Indicador carga días ocupados */}
                  {formState.area_social && !reservaCalendarLoaded && (
                    <span className={styles.loadingText}>
                      Cargando disponibilidad de días...
                    </span>
                  )}
                  <CalendarPicker
                    selectedDate={formState.fecha}
                    onDateChange={handleDateChange}
                    busyDays={busyDays}
                  />
                  {/* Error de fecha */}
                  {errors.fecha && (
                    <span className={styles.errorText}>{errors.fecha}</span>
                  )}
                </div>

                {/* Sección Hora (Condicional si hay fecha) */}
                {formState.fecha && (
                  <>
                    {/* Mostrar solo si hay fecha seleccionada */}
                    {formState.fecha && (
                      <div className={styles.durationSection}>
                        <label className={styles.sectionLabel}>
                          {selectedAreaDetails?.booking_mode === "day"
                            ? "Periodo disponible (Día completo)"
                            : "Selecciona los periodos disponibles"}
                        </label>

                        {/* 1. Muestra el mensaje de bloqueo si aplica */}
                        {canMakeReservationForDate === false &&
                        reservationBlockMessage ? (
                          <div
                            className={styles.warningText}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              border: "1px solid var(--cWarning)",
                              padding: "8px",
                              borderRadius: "var(--brStandard)",
                              background: "rgba(228, 96, 85, 0.1)",
                            }}
                          >
                            {" "}
                            {/* Estilo inline o clase CSS */}
                            <IconX color="var(--cWarning)" size={16} />{" "}
                            {/* Icono X o similar */}
                            <span>{reservationBlockMessage}</span>
                          </div>
                        ) : null}

                        {/* 2. Muestra el Loader O el Contenido */}
                        {loadingTimes ? (
                          <div
                            style={{ padding: "20px 0", textAlign: "center" }}
                          >
                            {" "}
                            {/* Contenedor para loader */}
                            {/* Puedes usar un componente Spinner si tienes uno */}
                            <span className={styles.loadingText}>
                              Cargando periodos...
                            </span>
                          </div>
                        ) : (
                          // Si NO está cargando:
                          <>
                            {/* 3. Muestra los slots SI existen en el estado */}

                            {allTimeSlots.length > 0 ? (
                              <div className={styles.periodSelectionContainer}>
                                {allTimeSlots.map((slot) => {
                                  // `slot` ahora es un objeto: { period: string, isAvailable: boolean }

                                  const isSelected = selectedPeriods.includes(
                                    slot.period
                                  );

                                  // El botón está deshabilitado si el slot NO está disponible O si hay un bloqueo general.
                                  const isDisabled =
                                    !slot.isAvailable ||
                                    canMakeReservationForDate === false;

                                  return (
                                    <button
                                      type="button"
                                      key={slot.period}
                                      className={`${styles.periodButton} ${
                                        isSelected && slot.isAvailable
                                          ? styles.selectedPeriod
                                          : ""
                                      } ${
                                        // Usa una clase específica para los no disponibles para darles un estilo diferente
                                        !slot.isAvailable
                                          ? styles.unavailablePeriod
                                          : ""
                                      }`}
                                      onClick={() => {
                                        // Solo permite seleccionar si está disponible
                                        if (slot.isAvailable) {
                                          handlePeriodToggle(slot.period);
                                        }
                                      }}
                                      // Deshabilita el botón si no está disponible o por bloqueo general
                                      disabled={isDisabled}
                                      // ¡AQUÍ ESTÁ LA MAGIA! Añade el title si no está disponible
                                      title={
                                        !slot.isAvailable
                                          ? "Este período ya fue reservado"
                                          : ""
                                      }
                                    >
                                      {slot.period.replace("-", " a ")}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              // La lógica para cuando no hay NINGÚN periodo (ni disponible ni ocupado)
                              canMakeReservationForDate === true && (
                                <span className={styles.warningText}>
                                  No hay periodos definidos para esta área en
                                  esta fecha.
                                </span>
                              )
                            )}

                            {/* 5. Muestra error de validación si el usuario intentó continuar sin seleccionar */}
                            {errors.selectedPeriods && (
                              <span className={styles.errorText}>
                                {errors.selectedPeriods}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Sección Cantidad Personas */}
                <div className={styles.peopleSection}>
                  <div className={styles.peopleLabelContainer}>
                    <label className={styles.sectionLabel}>
                      Cantidad de personas
                    </label>
                    <span className={styles.sectionSubtitle}>
                      Máx. {selectedAreaDetails?.max_capacity ?? "N/A"} personas
                    </span>
                  </div>

                  <div className={styles.peopleInputContainer}>
                    <div className={styles.quantitySelector}>
                      <button
                        type="button"
                        onClick={decrementPeople}
                        className={styles.quantityButton}
                        disabled={
                          Number(formState.cantidad_personas || "1") <= 1 ||
                          isSubmitting
                        } // Asegura que no baje de 1
                        aria-label="Disminuir cantidad"
                      >
                        -
                      </button>
                      <Input
                        type="number"
                        name="cantidad_personas_input"
                        value={formState.cantidad_personas}
                        onChange={(e) => {
                          handleQuantityChange(e.target.value);
                        }}
                        onBlur={(e) => {
                          const currentValue = e.target.value;
                          console.log(
                            `[CreateReserva Input onBlur] Value: "${currentValue}", Max capacity: ${selectedAreaDetails?.max_capacity}`
                          );
                          // Simplemente llama a handleQuantityChange.
                          // Si el campo está vacío, HQC lo dejará vacío.
                          // Si tiene un valor, HQC lo validará (min, max, NaN).
                          handleQuantityChange(currentValue);
                        }}
                        min={1} // Atributo HTML5 para mínimo
                        max={selectedAreaDetails?.max_capacity || undefined} // Atributo HTML5 para máximo
                        aria-label="Cantidad de personas"
                        style={{ textAlign: "center" }} // Estilo básico, ajusta en tu CSS
                      />
                      <button
                        type="button"
                        onClick={incrementPeople}
                        className={styles.quantityButton}
                        disabled={
                          (selectedAreaDetails?.max_capacity !== undefined &&
                            selectedAreaDetails?.max_capacity !== null &&
                            Number(formState.cantidad_personas || "0") >=
                              selectedAreaDetails.max_capacity) ||
                          isSubmitting
                        }
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {errors.cantidad_personas && (
                    <div
                      className={styles.errorText}
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      {errors.cantidad_personas}
                    </div>
                  )}
                </div>
                {/* --- FIN REEMPLAZO --- */}

                {/* Opcional: Campo Motivo/Observaciones */}
                <div
                  className={styles.formSection}
                  style={{ marginTop: "var(--spL)" }}
                >
                  <h3 className={styles.sectionTitle}>Motivo</h3>
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

            {/* === PASO 3: Resumen === */}
            {currentStep === 3 && (
              <div className={`${styles.stepContent} ${styles.step3Content}`}>
                <h2 className={styles.summaryTitle}>Resumen de la reserva</h2>
                {(() => {
                  // Encuentra los detalles de la unidad seleccionada
                  const selectedUnitDetails = unidadesResponse?.data?.find(
                    (u: ApiUnidad) => String(u.id) === formState.unidad
                  );

                  // Accede a titular y LUEGO a owner
                  const ownerData = selectedUnitDetails?.titular?.owner;
                  const unitNumber = selectedUnitDetails?.nro;

                  // Solo renderiza si tenemos los datos del owner
                  if (!ownerData || !unitNumber) {
                    return (
                      <div
                        style={{
                          minHeight: "56px",
                          display: "flex",
                          alignItems: "center",
                          color: "var(--cWhiteV1)",
                        }}
                      >
                        Cargando datos del propietario...
                      </div>
                    ); // Placeholder
                  }

                  // Renderiza la información del propietario
                  return (
                    <div className={styles.summaryOwnerInfoContainer}>
                      <div className={styles.summaryOwnerInfo}>
                        <div className={styles.ownerIdentifier}>
                          <Avatar
                            src={getUrlImages(
                              `/OWNER-${ownerData.id}.webp?d=${ownerData.updated_at}`
                            )}
                            name={getFullName(ownerData)}
                            w={40}
                            h={40}
                          />
                          <div className={styles.ownerText}>
                            <span className={styles.ownerName}>
                              {getFullName(ownerData)}
                            </span>
                            <span className={styles.ownerUnit}>
                              Unidad {unitNumber}
                            </span>
                          </div>
                        </div>
                        <span className={styles.reservationStatus}>
                          Reservación: En proceso
                        </span>
                      </div>
                    </div>
                  );
                })()}
                {/* --- FIN BLOQUE INFO DEL OWNER --- */}

                <div className={styles.summaryContainer}>
                  {selectedAreaDetails ? (
                    <div className={styles.summaryContent}>
                      {/* Imagen del Resumen */}
                      <div className={styles.summaryImageContainer}>
                        {selectedAreaDetails.images &&
                        selectedAreaDetails.images.length > 0 ? (
                          <img
                            className={styles.previewImage} // Reutiliza estilo
                            src={getUrlImages(
                              `/AREA-${selectedAreaDetails.id}-${selectedAreaDetails.images[0].id}.webp?d=${selectedAreaDetails.updated_at}`
                            )} // Muestra siempre la primera imagen o la actual si tienes carrusel aquí
                            alt={selectedAreaDetails.title}
                            onError={(
                              e: React.SyntheticEvent<HTMLImageElement, Event>
                            ) => {
                              (e.target as HTMLImageElement).src =
                                "/api/placeholder/150/120"; // Placeholder más pequeño
                            }}
                          />
                        ) : (
                          <img
                            src="/api/placeholder/150/120"
                            alt="Sin imagen"
                            className={styles.previewImage}
                          />
                        )}
                      </div>
                      {/* Detalles del Resumen */}
                      <div className={styles.summaryDetailsContainer}>
                        <div className={styles.summaryAreaInfo}>
                          <span className={styles.summaryAreaName}>
                            {selectedAreaDetails.title}
                          </span>
                          {/* <p className={styles.summaryAreaDescription}> ... </p> */}
                        </div>
                        <div className={styles.summaryBookingDetails}>
                          <span className={styles.summaryDetailsTitle}>
                            Detalles de tu reserva
                          </span>
                          {/* Fecha */}
                          <div className={styles.summaryDetailItem}>
                            <span className={styles.detailIcon}>
                              <IconCalendar />
                            </span>
                            <span>
                              {formState.fecha || "Fecha no seleccionada"}
                            </span>
                          </div>
                          {/* Hora/Periodos */}
                          {selectedAreaDetails.booking_mode !== "day" && (
                            <div className={styles.summaryDetailItem}>
                              <span className={styles.detailIcon}>
                                <IconClock />
                              </span>
                              <span>
                                {selectedPeriods.length > 0
                                  ? selectedPeriods
                                      .map((p) => p.replace("-", " a "))
                                      .join(", ")
                                  : "Ningún periodo seleccionado"}
                              </span>
                            </div>
                          )}
                          {selectedAreaDetails.booking_mode === "day" && (
                            <div className={styles.summaryDetailItem}>
                              <span className={styles.detailIcon}>
                                <IconClock />
                              </span>
                              <span>Día completo</span>
                            </div>
                          )}
                          {/* Personas */}
                          <div className={styles.summaryDetailItem}>
                            <span className={styles.detailIcon}>
                              <IconGroup />
                            </span>
                            <span>
                              {formState.cantidad_personas || 0} personas
                            </span>
                          </div>
                          {/* --- Costo (MODIFICADO) --- */}
                          <div className={styles.summaryDetailItem}>
                            <span className={styles.detailIcon}>
                              <IconMonedas />
                            </span>{" "}
                            {/* Icono */}
                            {selectedAreaDetails.is_free === "A" ? (
                              // Si es Gratis
                              <span className={styles.summaryPricePerUnit}>
                                Gratis
                              </span>
                            ) : selectedAreaDetails.price != null ? (
                              // Si tiene precio
                              <>
                                {/* Precio por Unidad (Hora/Día/Periodo) */}
                                <span className={styles.summaryPricePerUnit}>
                                  Bs{" "}
                                  {Number(selectedAreaDetails.price).toFixed(2)}
                                  {selectedAreaDetails.booking_mode === "day"
                                    ? "/día"
                                    : "/h"}{" "}
                                  {/* Muestra /h o /día */}
                                </span>

                                {/* Costo Total (Calculado) */}
                                <span className={styles.summaryTotalCost}>
                                  {(() => {
                                    // Calcula el total
                                    let total = Number(
                                      selectedAreaDetails.price
                                    );
                                    let quantityLabel = "";
                                    // Si no es por día, multiplica por número de periodos
                                    if (
                                      selectedAreaDetails.booking_mode !== "day"
                                    ) {
                                      const numPeriods =
                                        selectedPeriods.length || 1; // Asume 1 si no hay seleccionados (aunque debería haber validación)
                                      // Intenta calcular la duración total en horas si es posible (esto es un extra opcional)
                                      // Por defecto, 1 periodo = 1 hora (simplificación)
                                      // Podrías intentar parsear HH:mm para calcular duración real si lo necesitas
                                      // Etiqueta para el total
                                    } else {
                                      quantityLabel = `Total: `; // Etiqueta simple para reserva por día
                                    }
                                    return `${quantityLabel}Bs ${total.toFixed(
                                      2
                                    )}`;
                                  })()}
                                </span>
                              </>
                            ) : (
                              // Si no es gratis y no hay precio
                              <span className={styles.summaryPricePerUnit}>
                                Precio no disponible
                              </span>
                            )}
                          </div>
                          {/* --- Fin Costo (MODIFICADO) --- */}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>No se pudo cargar el resumen.</p>
                  )}
                </div>
                {/* ----- FIN DE TU CÓDIGO ORIGINAL DEL RESUMEN ----- */}
              </div> // Fin Step 3
            )}

            {/* === Acciones (Botones) y Precio Condicional === */}
            <div className={styles.formActions}>
              {" "}
              {/* CSS: justify-content: space-between; align-items: center; */}
              {/* --- Contenedor para Info de Precio (SOLO EN PASO 1) --- */}
              {currentStep === 1 &&
                selectedAreaDetails && ( // <-- **CONDICIÓN AÑADIDA AQUÍ**
                  <div className={styles.priceInfoBottom}>
                    <span className={styles.priceValueBottom}>
                      {selectedAreaDetails.is_free === "A"
                        ? "Gratis"
                        : `Bs ${Number(selectedAreaDetails.price || 0).toFixed(
                            2
                          )}`}
                    </span>
                  </div>
                )}
              {/* Si no es paso 1 o no hay area, no muestra nada aquí (a la izquierda) */}
              {/* Opcional: podrías poner un div vacío o un spacer si necesitas mantener el espacio */}
              {currentStep !== 1 && <div style={{ flexGrow: 1 }}></div>}{" "}
              {/* Placeholder para empujar botones a la derecha en otros pasos */}
              {/* --- FIN Contenedor Precio --- */}
              {/* --- Contenedor para los Botones (siempre a la derecha) --- */}
              <div className={styles.actionButtonsContainer}>
                {/* Botón Atrás (visible desde paso 2 en adelante) */}
                {currentStep > 1 && (
                  <button
                    type="button"
                    className={`${styles.button} ${styles.backBtn}`}
                    onClick={prevStep}
                    disabled={isSubmitting}
                  >
                    Atras
                  </button>
                )}
                {/* Botón Siguiente (visible solo en Paso 1) */}
                {currentStep === 1 && (
                  <Button
                    className={`${styles.button} ${styles.nextBtn}`}
                    onClick={nextStep}
                    disabled={isSubmitting || !selectedAreaDetails}
                  >
                    Reservar
                  </Button>
                )}
                {/* Botón Continuar (visible solo en Paso 2) */}
                {currentStep === 2 && (
                  <button
                    type="button"
                    className={`${styles.button} ${styles.nextBtn}`}
                    onClick={nextStep}
                    disabled={isSubmitting}
                  >
                    Continuar
                  </button>
                )}
                {/* Botón Reservar (visible solo en el último paso - Paso 3) */}
                {currentStep === 3 && (
                  <button
                    type="button"
                    className={`${styles.button} ${styles.submitBtn}`}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Reservando..." : "Reservar"}
                  </button>
                )}
              </div>
              {/* --- FIN Contenedor Botones --- */}
            </div>
          </div>{" "}
          {/* Fin formCard */}
        </div>{" "}
        {/* Fin formContainer */}
        {selectedAreaDetails && ( // Renderiza el modal solo si hay detalles del área
          <DataModal
            open={isRulesModalVisible}
            onClose={() => setIsRulesModalVisible(false)} // Función para cerrar
            title={`Reglas de Uso - ${selectedAreaDetails.title}`} // Título del modal
            buttonText="" // Oculta el botón de "Guardar"
            buttonCancel="" // Texto del botón para cerrar
            iconClose={true} // Muestra el icono 'X' para cerrar si no es fullscreen
            // fullScreen={false} // Puedes ajustar si lo necesitas a pantalla completa
          >
            {/* Contenido del modal (los hijos) */}
            <div className={styles.rulesModalContent}>
              {" "}
              {/* Puedes añadir un estilo específico si quieres */}
              <p>
                {selectedAreaDetails.usage_rules ||
                  "No hay reglas de uso especificadas para esta área."}
              </p>
            </div>
          </DataModal>
        )}
      </div>
    </div>
  );
};

export default CreateReserva;
