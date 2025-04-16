// Imports (sin cambios)
"use client";
import React, { useState } from "react"; // useEffect no se usa, se puede quitar si no hay efectos
import styles from "./CreateReserva.module.css";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { IconArrowLeft } from "@/components/layout/icons/IconsBiblioteca";
import CalendarPicker from "./CalendarPicker/CalendarPicker";


// Interfaces (sin cambios)
interface FormState {
  unidad: string;
  area_social: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cantidad_personas: string | number;
  motivo: string; // Asegúrate de que el motivo se pida en algún paso si es necesario
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

interface Option {
  id: number | string;
  name: string;
}

const CreateReserva = () => {
  // Estados y Hooks (sin cambios)
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
  const { showToast } = useAuth();
  // Mock de días ocupados (debería venir de una API o lógica)
// Formato 'yyyy-MM-dd'
const busyDaysForCalendar = ["2025-04-18", "2025-04-22", "2025-05-01"]; // Ejemplo - ¡Usa tus propias fechas!

  // Funciones handleChange, validaciones, prevStep, handleSubmit (sin cambios en lógica principal)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  // Función para manejar el cambio de fecha desde CalendarPicker
const handleDateChange = (dateString: string | undefined) => {
  setFormState(prev => ({ ...prev, fecha: dateString || "" }));
  // Limpia el error de fecha si el usuario selecciona una fecha válida
  if (errors.fecha && dateString) {
    setErrors(prev => ({ ...prev, fecha: undefined }));
  }
  // Limpia hora inicio/fin si cambia la fecha, ya que la disponibilidad puede cambiar
  setFormState(prev => ({ ...prev, hora_inicio: "", hora_fin: ""}));

  // TODO: Aquí podrías llamar a una función para cargar las horas disponibles
  //       para la nueva fecha seleccionada (`dateString`) si la lógica es dinámica.
  // loadAvailableHours(dateString);
};

  const validateStep1 = () => {
    const errs: FormErrors = {};
    if (!formState.unidad) errs.unidad = "Este campo es requerido";
    if (!formState.area_social) errs.area_social = "Este campo es requerido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: FormErrors = {};
    if (!formState.fecha) errs.fecha = "Este campo es requerido";
    if (!formState.hora_inicio) errs.hora_inicio = "Este campo es requerido";
    if (!formState.hora_fin) errs.hora_fin = "Este campo es requerido";
    if (formState.hora_inicio && formState.hora_fin && formState.hora_fin <= formState.hora_inicio) {
      errs.hora_fin = "La hora de fin debe ser posterior a la hora de inicio.";
    }
    if (!formState.cantidad_personas) errs.cantidad_personas = "Este campo es requerido";
    else if (Number(formState.cantidad_personas) <= 0) errs.cantidad_personas = "La cantidad debe ser mayor a 0.";
    // Añadir validación de cantidad máxima si es necesario
    // const maxPersonas = 16; // Ejemplo
    // if (Number(formState.cantidad_personas) > maxPersonas) {
    //   errs.cantidad_personas = `La cantidad máxima es ${maxPersonas}.`;
    // }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: FormErrors = {};
    if (!formState.nombre_responsable) errs.nombre_responsable = "Este campo es requerido";
    if (!formState.telefono_responsable) errs.telefono_responsable = "Este campo es requerido";
    if (!formState.email_responsable) errs.email_responsable = "Este campo es requerido";
    else if (!/\S+@\S+\.\S+/.test(formState.email_responsable)) errs.email_responsable = "El formato del correo electrónico no es válido.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();

    if (isValid) {
        setErrors({});
        setCurrentStep(prev => prev + 1);
    } else {
        // Opcional: Mostrar un toast indicando que hay errores
        // showToast("Por favor, corrige los errores.", "error");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (validateStep3()) {
      console.log("Datos de la reserva:", formState);
      showToast("Reserva creada exitosamente", "success");
      setFormState({ /* Resetear estado */
        unidad: "", area_social: "", fecha: "", hora_inicio: "", hora_fin: "",
        cantidad_personas: "", motivo: "", nombre_responsable: "",
        telefono_responsable: "", email_responsable: ""
      });
      setCurrentStep(1);
      setErrors({});
    } else {
       // Opcional: Mostrar un toast indicando que hay errores
       // showToast("Por favor, revisa los datos del responsable.", "error");
    }
  };


  // Mock data (sin cambios)
  const unidadesOptions: Option[] = [ { id: 1, name: "Torre A - Apto 101" }, /* ... */ ];
  const areasSocialesOptions: Option[] = [ { id: 1, name: "Piscina exclusiva" }, /* ... */ ];
  const horasOptions: Option[] = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8; return { id: `${hour}:00`, name: `${hour}:00` };
  });
  // Datos para el ejemplo del paso 3
  const selectedAreaInfo = areasSocialesOptions.find(a => a.id === Number(formState.area_social)) || { name: "Área no seleccionada", description: "" };


  // --- RENDER ---
  return (
    <div className={styles.createReservaContainer}> {/* Cambiado nombre clase contenedora principal */}
      {/* --- Header (común a todos los pasos) --- */}
      <div className={styles.header}>
        <div onClick={() => window.history.back()} className={styles.backButton} style={{ cursor: 'pointer' }}>
          <IconArrowLeft />
          <span>Volver a lista de reservas</span>
        </div>
        <h1>Reservar un área</h1> {/* Título principal */}
        <div className={styles.progressContainer}>
           {/* El texto "X de 3 pasos" se moverá dentro del formCard según el diseño */}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
               // Ajuste para que llene 0%, 50%, 100% en los pasos 1, 2, 3
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* --- Contenedor de la tarjeta del formulario --- */}
      <div className={styles.formContainer}>
        <div className={styles.formCard}> {/* Clase base para la tarjeta */}

           {/* --- Indicador de Paso (dentro de la tarjeta ahora) --- */}
           <div className={styles.stepIndicator}>
             {currentStep} de 3 pasos
           </div>

          {/* === PASO 1: Datos generales === */}
          {currentStep === 1 && (
            <div className={`${styles.stepContent} ${styles.step1Content}`}>
              <h2>Datos generales</h2>
              <div className={styles.formField}>
                <Select
                  label="Unidad" name="unidad" value={formState.unidad}
                  options={unidadesOptions} onChange={handleChange} error={errors.unidad}
                />
              </div>

              <h2>Datos de la reserva</h2>
              <div className={styles.formField}>
                <Select
                  label="Área social" name="area_social" value={formState.area_social}
                  options={areasSocialesOptions} onChange={handleChange} error={errors.area_social}
                />
              </div>

              {/* Previsualización del Área (como estaba antes) */}
              {formState.area_social && (
                <div className={styles.areaPreview}>
                   {/* ... (imagen, info, detalles, precio) ... */}
                   <div className={styles.imageContainer}>
                     <img src="/api/placeholder/400/250" alt="Área social" />
                     {/* ... controles de flecha ... */}
                   </div>
                   <div className={styles.areaInfo}>
                     {/* ... h3, p, detalles, precio ... */}
                   </div>
                </div>
              )}
            </div>
          )}

          {/* === PASO 2: Detalles de la reserva (Basado en Figma) === */}
          {currentStep === 2 && (
            <div className={`${styles.stepContent} ${styles.step2Content}`}>
              {/* --- Sección Fecha --- */}
              <div className={styles.dateSection}>
                <label className={styles.sectionLabel}>Selecciona la fecha del evento</label>
                {/* *** REEMPLAZO DEL PLACEHOLDER *** */}
                <CalendarPicker
                  selectedDate={formState.fecha}
                  onDateChange={handleDateChange}
                  busyDays={busyDaysForCalendar} // Pasa los días ocupados
                  styles={styles} // Pasa el objeto de estilos CSS Module
                />
                {/* Muestra el error específico de fecha si existe */}
                {errors.fecha && <span className={styles.errorText}>{errors.fecha}</span>}
              </div>

              {/* --- Sección Duración/Hora (Adaptada para mostrarse si hay fecha) --- */}
              {/* Solo muestra esta sección si se ha seleccionado una fecha */}
              {formState.fecha && (
                <div className={styles.durationSection}>
                  <label className={styles.sectionLabel}>Selecciona la hora</label>
                  <span className={styles.sectionSubtitle}>Sólo se permite 2h por reserva</span>
                  <div className={styles.timeSelection}>
                     {/* TODO: Idealmente, 'horasOptions' debería cargarse dinámicamente
                                 basándose en la `formState.fecha` seleccionada.
                                 Por ahora, usamos las opciones estáticas. */}
                     <div className={styles.timeFields}>
                        <div className={styles.halfWidth}>
                           <Select
                              label="Hora de inicio" name="hora_inicio" value={formState.hora_inicio}
                              options={horasOptions} onChange={handleChange} error={errors.hora_inicio}
                           />
                        </div>
                        <div className={styles.halfWidth}>
                           <Select
                              label="Hora de fin" name="hora_fin" value={formState.hora_fin}
                              options={horasOptions.filter(h => !formState.hora_inicio || h.id > formState.hora_inicio)}
                              onChange={handleChange} error={errors.hora_fin}
                              disabled={!formState.hora_inicio}
                           />
                        </div>
                     </div>
                     {errors.hora_fin && errors.hora_fin.includes("posterior") && <span className={styles.errorText}>{errors.hora_fin}</span>}
                     {/* Mostrar error de hora_inicio si existe */}
                     {errors.hora_inicio && <span className={styles.errorText}>{errors.hora_inicio}</span>}
                  </div>
                </div>
              )}

               {/* --- Sección Cantidad Personas --- */}
              <div className={styles.peopleSection}>
                  <div className={styles.peopleLabelContainer}>
                      <label className={styles.sectionLabel}>Cantidad de personas</label>
                      <span className={styles.sectionSubtitle}>Máx. 16 personas</span> {/* Hacer dinámico */}
                  </div>
                  <div className={styles.peopleInputContainer}>
                      {/* Aquí irían botones +/- según Figma, por ahora Input */}
                      <Input
                          label="" // El label ya está arriba
                          name="cantidad_personas"
                          type="number"
                          value={formState.cantidad_personas}
                          onChange={handleChange}
                          error={errors.cantidad_personas}
                          min={1}
                          // max="16" // Hacer dinámico
                          className={styles.peopleInput} // Clase específica si se necesita
                      />
                      {/* Placeholder para los botones +/- */}
                       {/* <div className={styles.peopleControls}>
                           <button type="button">-</button>
                           <span>{formState.cantidad_personas || 0}</span>
                           <button type="button">+</button>
                       </div> */}
                  </div>
                   {errors.cantidad_personas && <span className={styles.errorText}>{errors.cantidad_personas}</span>}
              </div>

              {/* MOTIVO: Añadir aquí si es necesario en este paso */}
              {/* <div className={styles.formField}>
                  <TextArea label="Motivo (opcional)" name="motivo" value={formState.motivo} onChange={handleChange} error={errors.motivo} />
              </div> */}
            </div>
          )}

          {/* === PASO 3: Datos Responsable y Resumen (Basado en Figma) === */}
          {currentStep === 3 && (
            <div className={`${styles.stepContent} ${styles.step3Content}`}>
              {/* --- Sección Datos del Responsable (Mantenida de antes) --- */}
              <h2>Datos del responsable</h2>
              <div className={styles.formField}>
                <Input label="Nombre completo" name="nombre_responsable" value={formState.nombre_responsable} onChange={handleChange} error={errors.nombre_responsable}/>
              </div>
              <div className={styles.formField}>
                 <Input label="Teléfono de contacto" name="telefono_responsable" type="text" value={formState.telefono_responsable} onChange={handleChange} error={errors.telefono_responsable}/>
              </div>
              <div className={styles.formField}>
                 <Input label="Correo electrónico" name="email_responsable" type="email" value={formState.email_responsable} onChange={handleChange} error={errors.email_responsable}/>
              </div>

              {/* --- Sección Resumen de la Reserva (Basado en Figma) --- */}
              <h2 className={styles.summaryTitle}>Resumen de la reserva</h2>
              <div className={styles.summaryContainer}>
                 <div className={styles.summaryContent}>
                    <div className={styles.summaryImageContainer}>
                       {/* Idealmente, la imagen viene del área seleccionada */}
                       <img src="/api/placeholder/220/220" alt={selectedAreaInfo.name} className={styles.summaryImage} />
                    </div>
                    <div className={styles.summaryDetailsContainer}>
                        <div className={styles.summaryAreaInfo}>
                           <span className={styles.summaryAreaName}>{selectedAreaInfo.name}</span>
                           {/* La descripción puede ser larga, quizás truncar con CSS */}
                           <p className={styles.summaryAreaDescription}>
                               Disfruta de una agradable y refrescante tarde en nuestra piscina exclusiva que incluye sauna a vapor, zona de masaje y gimnasio. {/* Hacer dinámico */}
                           </p>
                        </div>
                        <div className={styles.summaryBookingDetails}>
                           <span className={styles.summaryDetailsTitle}>Detalles</span>
                           <div className={styles.summaryDetailItem}>
                              {/* <IconCalendar className={styles.summaryDetailIcon} /> */}
                              <span>Icon</span> {/* Placeholder Icono */}
                              {/* Formatear fecha si es posible */}
                              <span>{formState.fecha ? new Date(formState.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Fecha no seleccionada"}</span>
                           </div>
                           <div className={styles.summaryDetailItem}>
                              {/* <IconClock className={styles.summaryDetailIcon} /> */}
                              <span>Icon</span> {/* Placeholder Icono */}
                              {/* Calcular duración */}
                              <span>{formState.hora_inicio && formState.hora_fin ? `2h / ${formState.hora_inicio} a ${formState.hora_fin}` : "Horario no seleccionado"}</span> {/* Asumiendo 2h */}
                           </div>
                            <div className={styles.summaryDetailItem}>
                              {/* <IconUsers className={styles.summaryDetailIcon} /> */}
                              <span>Icon</span> {/* Placeholder Icono */}
                              <span>{formState.cantidad_personas || 0} personas</span>
                           </div>
                            <div className={styles.summaryDetailItem}>
                              {/* <IconInfo className={styles.summaryDetailIcon} /> */}
                              <span>Icon</span> {/* Placeholder Icono */}
                              {/* Calcular costo total */}
                              <span className={styles.summaryCostPerHour}>Bs 50/h</span> {/* Hacer dinámico */}
                              <span className={styles.summaryTotalCost}>Total 2h: Bs 100</span> {/* Hacer dinámico */}
                           </div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* === Acciones del Formulario (Botones) === */}
          {/* Se muestran fuera del stepContent pero dentro del formCard */}
          <div className={styles.formActions}>
            {currentStep > 1 && (
              <button type="button" className={`${styles.button} ${styles.backBtn}`} onClick={prevStep}>
                Atrás
              </button>
            )}
            {currentStep < 3 ? (
              <button type="button" className={`${styles.button} ${styles.nextBtn}`} onClick={nextStep}>
                {/* El texto del botón del paso 2 era "Continuar" */}
                {currentStep === 2 ? "Continuar" : "Siguiente"}
              </button>
            ) : (
              <button type="button" className={`${styles.button} ${styles.submitBtn}`} onClick={handleSubmit}>
                Reservar {/* Texto del botón del paso 3 */}
              </button>
            )}
          </div>

        </div> {/* Fin de formCard */}
      </div> {/* Fin de formContainer */}
    </div> // Fin de createReservaContainer
  );
};

export default CreateReserva;