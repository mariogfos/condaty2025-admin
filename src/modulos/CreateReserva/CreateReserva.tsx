"use client";
import React, { useState, useEffect, useMemo } from "react";
import styles from "./CreateReserva.module.css";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { IconArrowLeft } from "@/components/layout/icons/IconsBiblioteca";
import CalendarPicker from "./CalendarPicker/CalendarPicker";
import useAxios from "@/mk/hooks/useAxios";
import { getUrlImages } from "@/mk/utils/string";
// Importa TODAS las interfaces necesarias desde Type.ts
import {
    ApiUnidad,
    ApiArea,
    ApiDptosResponse,
    ApiAreasResponse,
    ApiReservationsCalendarResponse,
    Option // Importa Option también
} from "./Type"; // Asegúrate que la ruta sea correcta

// --- Interfaces del Formulario (Definidas localmente) ---
interface FormState {
  unidad: string;
  area_social: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cantidad_personas: string | number;
  motivo: string;
  nombre_responsable: string;
  telefono_responsable: string;
  email_responsable: string;
}

interface FormErrors {
  unidad?: string;
  area_social?: string;
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  cantidad_personas?: string;
  motivo?: string;
  nombre_responsable?: string;
  telefono_responsable?: string;
  email_responsable?: string;
}


// --- Componente Principal ---
const CreateReserva = () => {
  // --- Estados ---
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formState, setFormState] = useState<FormState>({
    unidad: "",
    area_social: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    cantidad_personas: "",
    motivo: "",
    nombre_responsable: "",
    telefono_responsable: "",
    email_responsable: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [busyDays, setBusyDays] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Hooks ---
  const { showToast } = useAuth();

  // --- Peticiones API (Corregido el tipo genérico y acceso a datos) ---
  const { data: unidadesResponse, loaded: unidadesLoaded } = useAxios("/dptos", "GET", { 
    perPage: -1,
    page: 1,
  });

  const { data: areasResponse, loaded: areasLoaded } = useAxios("/areas", "GET", {
    fullType: "L",
  }); 

   const { data: reservaResponse, loaded: reservaLoaded } = useAxios( 
      "/reservations-calendar",
      "GET",
      { area_id: formState.area_social || 'none' },
      !formState.area_social
  );

  // --- Efecto para actualizar busyDays ---
   useEffect(() => {
    if (reservaLoaded && formState.area_social && reservaResponse?.data?.reserved) {
        // Acceso corregido: reservaResponse.data.reserved
        setBusyDays(reservaResponse.data.reserved);
    }
    else if (!formState.area_social) {
         setBusyDays([]);
    }
     // Si cargó pero no hay 'reserved', asegúrate que esté vacío
     else if (reservaLoaded && formState.area_social && !reservaResponse?.data?.reserved) {
        setBusyDays([]);
     }
  }, [reservaResponse, reservaLoaded, formState.area_social]);


  // --- Transformación de datos para Selects (Corregido acceso a datos y tipos implícitos) ---
  const unidadesOptions: Option[] = useMemo(() => {
    // Acceso corregido: unidadesResponse.data
    if (!unidadesLoaded || !unidadesResponse?.data) return [];
    // Tipo explícito para 'unidad'
    return unidadesResponse.data.map((unidad: ApiUnidad): Option => ({
        id: unidad.id,
        name: `Unidad ${unidad.nro}`,
      }));
  }, [unidadesResponse, unidadesLoaded]);

  const areasSocialesOptions: Option[] = useMemo(() => {
     // Acceso corregido: areasResponse.data
    if (!areasLoaded || !areasResponse?.data) return [];
     // Tipo explícito para 'area'
    return areasResponse.data.map((area: ApiArea): Option => ({
        id: area.id,
        name: area.title,
      }));
  }, [areasResponse, areasLoaded]);

  // --- Obtener detalles del área seleccionada (Corregido acceso a datos y tipos implícitos) ---
  const selectedAreaDetails: ApiArea | undefined = useMemo(() => {
     // Acceso corregido: areasResponse.data
    if (!areasLoaded || !areasResponse?.data || !formState.area_social) {
      return undefined;
    }
     // Tipo explícito para 'area'
    return areasResponse.data.find((area: ApiArea) => area.id === formState.area_social);
  }, [formState.area_social, areasResponse, areasLoaded]);


  // --- Horas (Estática) ---
  const horasOptions: Option[] = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8; return { id: `${hour}:00`, name: `${hour}:00` };
  });

  // --- Funciones Handler y Validación (Sin cambios respecto a la versión anterior simplificada) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isAreaChange = name === 'area_social';

    setFormState((prev) => ({
        ...prev,
        [name]: value,
        ...(isAreaChange && { fecha: '', hora_inicio: '', hora_fin: '' }),
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

     if (isAreaChange && !value) {
        setBusyDays([]);
     }
  };

  const handleDateChange = (dateString: string | undefined) => {
    setFormState(prev => ({ ...prev, fecha: dateString || "" }));
    if (errors.fecha && dateString) {
      setErrors(prev => ({ ...prev, fecha: undefined }));
    }
    setFormState(prev => ({ ...prev, hora_inicio: "", hora_fin: ""}));
  };

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!formState.unidad) errs.unidad = "Selecciona tu unidad";
    if (!formState.area_social) errs.area_social = "Selecciona el área social";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    if (!formState.fecha) errs.fecha = "Selecciona una fecha";

    // Solo valida horas si no es reserva por día
    if (selectedAreaDetails?.booking_mode !== 'day') {
        if (!formState.hora_inicio) errs.hora_inicio = "Selecciona la hora de inicio";
        if (!formState.hora_fin) errs.hora_fin = "Selecciona la hora de fin";
        if (formState.hora_inicio && formState.hora_fin && formState.hora_fin <= formState.hora_inicio) {
            errs.hora_fin = "La hora de fin debe ser posterior a la hora de inicio.";
        }
         // Validar duración máxima si existe (opcional)
         /*
         if (formState.hora_inicio && formState.hora_fin && selectedAreaDetails?.max_booking_duration) {
            const start = new Date(`1970-01-01T${formState.hora_inicio}:00`);
            const end = new Date(`1970-01-01T${formState.hora_fin}:00`);
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (durationHours > selectedAreaDetails.max_booking_duration) {
                errs.hora_fin = `La duración máxima permitida es de ${selectedAreaDetails.max_booking_duration} horas.`;
            }
         }
         */
    }

    if (!formState.cantidad_personas) errs.cantidad_personas = "Ingresa la cantidad de personas";
    else if (Number(formState.cantidad_personas) <= 0) errs.cantidad_personas = "La cantidad debe ser mayor a 0.";
    else if (selectedAreaDetails?.max_capacity && Number(formState.cantidad_personas) > selectedAreaDetails.max_capacity) {
       errs.cantidad_personas = `La capacidad máxima es ${selectedAreaDetails.max_capacity}.`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: FormErrors = {};
    if (!formState.nombre_responsable) errs.nombre_responsable = "Este campo es requerido";
    if (!formState.telefono_responsable) errs.telefono_responsable = "Este campo es requerido";
    if (!formState.email_responsable) errs.email_responsable = "Este campo es requerido";
    else if (!/\S+@\S+\.\S+/.test(formState.email_responsable)) errs.email_responsable = "El formato del correo electrónico no es válido.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = (): void => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else {
        // Si hubiera más pasos, se añadirían aquí
        isValid = true; // Asumir válido si no hay validación específica para el paso actual
    }


    if (isValid) {
        setErrors({}); // Limpia errores antes de avanzar
        setCurrentStep(prev => prev + 1);
    } else {
        // Opcional: Mostrar un toast indicando que hay errores
        // showToast("Por favor, corrige los errores antes de continuar.", "warning");
        console.log("Errores de validación:", errors); // Ayuda a depurar
    }
  };

  const prevStep = (): void => {
    if (currentStep > 1) {
      setErrors({}); // Limpia errores al retroceder
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault(); // Prevenir recarga de página
    if (validateStep3()) {
      // --- Aquí iría la lógica para enviar los datos a la API ---
      console.log("Enviando Datos de la reserva:", formState);
      // Ejemplo de llamada API (necesitarías otro useAxios configurado para POST)
      // try {
      //   const response = await createReservaApi.execute(formState);
      //   if (response.success) {
             showToast("Reserva creada exitosamente", "success");
             // Resetear estado del formulario
             setFormState({
                unidad: "", area_social: "", fecha: "", hora_inicio: "", hora_fin: "",
                cantidad_personas: "", motivo: "", nombre_responsable: "",
                telefono_responsable: "", email_responsable: ""
             });
             setCurrentStep(1); // Volver al primer paso
             setErrors({});
             setBusyDays([]); // Limpiar días ocupados
      //   } else {
      //      showToast(response.message || "Error al crear la reserva", "error");
      //   }
      // } catch (error) {
      //    console.error("Error en handleSubmit:", error);
      //    showToast("Ocurrió un error inesperado.", "error");
      // }
      // --- Fin lógica de envío ---

    } else {
       // Opcional: Mostrar un toast indicando que hay errores en el último paso
       showToast("Por favor, revisa los datos del responsable.", "warning");
       console.log("Errores de validación (Paso 3):", errors);
    }
  };

  // --- RENDER (Corregido onError en img) ---
  return (
    <div className={styles.createReservaContainer}>
      {/* --- Header --- */}
      <div className={styles.header}>
        {/* ... (código del header sin cambios) ... */}
        <h1>Reservar un área</h1>
        {/* --- Mover Indicador de Paso aquí, fuera de formCard --- */}
        <div className={styles.progressContainer}>
            {/* Span con el texto del paso */}
            <span className={styles.stepIndicatorText}>{currentStep} de 3 pasos</span>
            <div className={styles.progressBar}>
                <div
                className={styles.progressFill}
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>
            </div>
        </div>
      </div>

      {/* --- Form Card --- */}
      <div className={styles.formContainer}>
        <div className={styles.formCard}>
           {/* El stepIndicator se movió al header */}
           {/* <div className={styles.stepIndicator}> ... </div> */}

          {/* === PASO 1 === */}
          {currentStep === 1 && (
            <div className={`${styles.stepContent} ${styles.step1Content}`}>
              {/* --- Datos Generales (Select Unidad) --- */}
              <div className={styles.formSection}> {/* Agrupador opcional */}
                <h3 className={styles.sectionTitle}>Datos generales</h3>
                <div className={styles.formField}>
                    <Select
                    label="Unidad" name="unidad" value={formState.unidad}
                    options={unidadesOptions}
                    onChange={handleChange} error={errors.unidad}
                    disabled={!unidadesLoaded}
                    placeholder={!unidadesLoaded ? "Cargando unidades..." : "Selecciona tu unidad"}
                    />
                </div>
              </div>

              {/* --- Datos Reserva (Select Área) --- */}
               <div className={styles.formSection}> {/* Agrupador opcional */}
                 <h3 className={styles.sectionTitle}>Datos de la reserva</h3>
                 <div className={styles.formField}>
                    <Select
                    label="Área social" name="area_social" value={formState.area_social}
                    options={areasSocialesOptions}
                    onChange={handleChange} error={errors.area_social}
                    disabled={!areasLoaded}
                    placeholder={!areasLoaded ? "Cargando áreas..." : "Selecciona el área"}
                    />
                 </div>
               </div>

             {/* --- Previsualización del Área (Reestructurada) --- */}
             {selectedAreaDetails && (
                <div className={styles.areaPreview}>
                    {/* Columna Imagen */}
                    {selectedAreaDetails && selectedAreaDetails.images && selectedAreaDetails.images.length > 0 && (
                    <div className={styles.imageContainer}>
                      <img
                        className={styles.previewImage}
                        src={getUrlImages(`/AREA-${selectedAreaDetails.id}-${selectedAreaDetails.images[currentImageIndex].id}.webp?d=${selectedAreaDetails.updated_at}`)}
                        alt={selectedAreaDetails.title}
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/350/280';
                        }}
                      />
                      <div className={styles.imagePagination}>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : (selectedAreaDetails?.images?.length || 0) - 1))}
                          disabled={selectedAreaDetails?.images?.length <= 1}
                        >
                          {"<"}
                        </button>
                        <span>{currentImageIndex + 1} / {selectedAreaDetails?.images?.length}</span>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev < (selectedAreaDetails?.images?.length || 0) - 1 ? prev + 1 : 0))}
                          disabled={selectedAreaDetails?.images?.length <= 1}
                        >
                          {">"}
                        </button>
                      </div>
                    </div>
                  )}

                    {/* Columna Detalles */}
                    <div className={styles.areaInfo}>
                        {/* Título y Status */}
                        <div className={styles.areaHeader}>
                            <h4 className={styles.areaTitle}>{selectedAreaDetails.title}</h4>
                            {/* Lógica simple para el badge de estado */}
                            {selectedAreaDetails.status === 'A' && (
                                <span className={`${styles.statusBadge} ${styles.statusDisponible}`}>
                                    Disponible
                                </span>
                            )}
                            {selectedAreaDetails.status !== 'A' && (
                                <span className={`${styles.statusBadge} ${styles.statusNoDisponible}`}>
                                    No Disponible
                                </span>
                            )}
                        </div>

                        {/* Descripción */}
                        <p className={styles.areaDescription}>
                            {selectedAreaDetails.description || "Sin descripción."}
                        </p>

                        {/* Separador */}
                        <hr className={styles.areaSeparator} />

                        {/* Capacidad Máxima */}
                        <div className={styles.detailBlock}>
                            <span className={styles.detailLabel}>Cantidad máxima de personas</span>
                            <span className={styles.detailValue}>{selectedAreaDetails.max_capacity ?? 'N/A'}</span>
                        </div>

                        {/* Separador */}
                        <hr className={styles.areaSeparator} />

                        {/* Disponibilidad */}
                        <div className={styles.detailBlock}>
                            <span className={styles.detailLabel}>Disponibilidad</span>
                            {/* Mostrar días disponibles (simple) */}
                            <span className={styles.detailValue}>
                                Días: {selectedAreaDetails.available_days?.join(', ') || 'No especificado'}
                            </span>
                            {/* Mostrar duración máxima reserva */}
                            {selectedAreaDetails.max_booking_duration && (
                                <span className={styles.detailValue}>
                                    Máximo {selectedAreaDetails.max_booking_duration} horas por reserva
                                </span>
                            )}
                            {/* TODO: Mostrar resumen de horas si es necesario */}
                        </div>

                         {/* Separador */}
                         <hr className={styles.areaSeparator} />

                        {/* Reglas */}
                        <div className={styles.detailBlock}>
                             <span className={styles.detailLabel}>Reglas y restricciones</span>
                             {/* Podría ser un botón que abre un modal */}
                             <button type='button' className={styles.rulesButton} onClick={() => alert(selectedAreaDetails.usage_rules || 'No hay reglas especificadas.')}>
                                Ver Reglas {/* O un icono */}
                             </button>
                        </div>
                    </div>
                </div>
              )}
            </div>
          )}

          {/* === PASO 2 === */}
          {currentStep === 2 && (
            <div className={`${styles.stepContent} ${styles.step2Content}`}>
              <div className={styles.dateSection}>
                <label className={styles.sectionLabel}>Selecciona la fecha del evento</label>
                {formState.area_social && !reservaLoaded && <span>Cargando disponibilidad...</span>}
                <CalendarPicker
                  selectedDate={formState.fecha}
                  onDateChange={handleDateChange}
                  busyDays={busyDays}
                />
                {errors.fecha && <span className={styles.errorText}>{errors.fecha}</span>}
              </div>

              {formState.fecha && (
                <div className={styles.durationSection}>
                  <label className={styles.sectionLabel}>Selecciona la hora</label>
                  <span className={styles.sectionSubtitle}>Sólo se permite 2h por reserva</span>
                   {selectedAreaDetails?.booking_mode !== 'day' && (
                        <div className={styles.timeSelection}>
                            <div className={styles.timeFields}>
                                <div className={styles.halfWidth}>
                                {/* <Select
                                    options={timeOptions}
                                    name="hora_inicio"
                                    value={formState.hora_inicio}
                                    onChange={handleChange}
                                    error={errors.hora_inicio}
                                /> */}
                                </div>
                                <div className={styles.halfWidth}>
{/*                                 <Select
                                    options={timeOptions}
                                    name="hora_fin"
                                    value={formState.hora_fin}
                                    onChange={handleChange}
                                    error={errors.hora_fin}
                                /> */}
                                </div>
                            </div>
                            {/* ... errores hora ... */}
                        </div>
                   )}
                    {selectedAreaDetails?.booking_mode === 'day' && (
                        <p className={styles.sectionSubtitle}>Esta área se reserva por día completo.</p>
                    )}
                </div>
              )}

              <div className={styles.peopleSection}>
                  <div className={styles.peopleLabelContainer}>
                      <label className={styles.sectionLabel}>Cantidad de personas</label>
                      <span className={styles.sectionSubtitle}>
                        Máx. {selectedAreaDetails?.max_capacity ?? 'N/A'} personas
                      </span>
                  </div>
                  <div className={styles.peopleInputContainer}>
                      <Input
                          label=""
                          name="cantidad_personas"
                          type="number"
                          value={formState.cantidad_personas}
                          onChange={handleChange}
                          error={errors.cantidad_personas}
                          min={1}
                          max={selectedAreaDetails?.max_capacity ?? undefined} // max debe ser number o undefined
                          className={styles.peopleInput}
                          placeholder="Nº"
                      />
                  </div>
                   {errors.cantidad_personas && <span className={styles.errorText}>{errors.cantidad_personas}</span>}
              </div>
            </div>
          )}

          {/* === PASO 3 === */}
          {currentStep === 3 && (
            <div className={`${styles.stepContent} ${styles.step3Content}`}>
              <h2>Datos del responsable</h2>
               {/* ... Inputs responsable ... */}
               <div className={styles.formField}>
                 <Input label="Nombre completo" name="nombre_responsable" value={formState.nombre_responsable} onChange={handleChange} error={errors.nombre_responsable}/>
               </div>
               <div className={styles.formField}>
                 <Input label="Teléfono de contacto" name="telefono_responsable" type="text" value={formState.telefono_responsable} onChange={handleChange} error={errors.telefono_responsable}/>
               </div>
               <div className={styles.formField}>
                 <Input label="Correo electrónico" name="email_responsable" type="email" value={formState.email_responsable} onChange={handleChange} error={errors.email_responsable}/>
               </div>


              <h2 className={styles.summaryTitle}>Resumen de la reserva</h2>
              <div className={styles.summaryContainer}>
                 {selectedAreaDetails ? (
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryImageContainer}>
                        <img
                          className={styles.previewImage}
                          src={getUrlImages(`/AREA-${selectedAreaDetails.id}-${selectedAreaDetails.images?.[currentImageIndex].id}.webp?d=${selectedAreaDetails.updated_at}`)}
                          alt={selectedAreaDetails.title}
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/350/280';
                          }}
                        />
                        </div>
                        <div className={styles.summaryDetailsContainer}>
                            {/* ... Info y Detalles ... */}
                             <div className={styles.summaryAreaInfo}>
                               <span className={styles.summaryAreaName}>{selectedAreaDetails.title}</span>
                               <p className={styles.summaryAreaDescription}>
                                   {selectedAreaDetails.description || "Sin descripci\u00F3n."}
                               </p>
                            </div>
                             <div className={styles.summaryBookingDetails}>
                               <span className={styles.summaryDetailsTitle}>Detalles</span>
                               <div className={styles.summaryDetailItem}>
                                  <span>Icon</span>
                                  <span>{formState.fecha || "Fecha no seleccionada"}</span>
                               </div>
                               <div className={styles.summaryDetailItem}>
                                  <span>Icon</span>
                                  <span>{formState.hora_inicio && formState.hora_fin ? `${formState.hora_inicio} a ${formState.hora_fin}` : (selectedAreaDetails?.booking_mode === 'day' ? 'Día completo' : 'Horario no seleccionado')}</span>
                               </div>
                                <div className={styles.summaryDetailItem}>
                                  <span>Icon</span>
                                  <span>{formState.cantidad_personas || 0} personas</span>
                               </div>
                                <div className={styles.summaryDetailItem}>
                                  <span>Icon</span>
                                  <span className={styles.summaryCostPerHour}>Bs 50/h</span>
                                  <span className={styles.summaryTotalCost}>Total 2h: Bs 100</span>
                               </div>
                            </div>
                        </div>
                    </div>
                 ) : (
                    <p>Selecciona un área para ver el resumen.</p>
                 )}
              </div>
            </div>
          )}

          {/* === Acciones === */}
          <div className={styles.formActions}>
            {/* ... Botones ... */}
             {currentStep > 1 && (
              <button type="button" className={`${styles.button} ${styles.backBtn}`} onClick={prevStep}>
                Atras
              </button>
            )}
            {currentStep < 3 ? (
              <button type="button" className={`${styles.button} ${styles.nextBtn}`} onClick={nextStep}>
                {currentStep === 2 ? "Continuar" : "Siguiente"}
              </button>
            ) : (
              <button type="button" className={`${styles.button} ${styles.submitBtn}`} onClick={handleSubmit}>
                Reservar
              </button>
            )}
          </div>

        </div> {/* Fin formCard */}
      </div> {/* Fin formContainer */}
    </div> // Fin createReservaContainer
  );
};

export default CreateReserva;