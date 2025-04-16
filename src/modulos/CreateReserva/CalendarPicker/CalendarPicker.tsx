import React, { useState, useEffect } from 'react';
import { DayPicker, SelectSingleEventHandler } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Estilos base (los personalizaremos)
import { format, parse, isSameDay, startOfMonth, isValid, isDate } from 'date-fns';
import { es } from 'date-fns/locale'; // Para nombres en español
import styles from '../CreateReserva.module.css';

// Importa tus iconos de flecha si los tienes
// import { IconChevronLeft, IconChevronRight } from '@/components/layout/icons/IconsBiblioteca';

// Props que recibirá el componente
interface CalendarPickerProps {
  selectedDate?: string; // Fecha seleccionada en formato 'yyyy-MM-dd'
  onDateChange: (dateString: string | undefined) => void; // Función para actualizar la fecha
  busyDays?: string[]; // Array de fechas ocupadas 'yyyy-MM-dd'
  styles: { [key: string]: string }; // Objeto de CSS Modules
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
    selectedDate,
    onDateChange,
    busyDays = [],
    styles,
  }) => {
    // Convierte string a Date, asegurando que sea válido o undefined
    const parsedInitialDate = selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : undefined;
    const initialValidDate = parsedInitialDate && isValid(parsedInitialDate) ? parsedInitialDate : undefined;
  
    const [selected, setSelected] = useState<Date | undefined>(initialValidDate);
  
    // --- CORRECCIÓN 1: Inicialización robusta de currentMonth ---
    // Siempre inicializa con una fecha válida: la seleccionada o la actual.
    const [currentMonth, setCurrentMonth] = useState<Date>(
        initialValidDate ? startOfMonth(initialValidDate) : startOfMonth(new Date())
    );
  
    useEffect(() => {
      const newParsedDate = selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : undefined;
      const newValidSelectedDate = newParsedDate && isValid(newParsedDate) ? newParsedDate : undefined;
  
      // --- CORRECCIÓN 2: Comprobar antes de llamar a isSameDay ---
      let shouldUpdate = true; // Por defecto, actualiza
  
      // Solo comprueba isSameDay si AMBAS fechas son válidas
      if (newValidSelectedDate && selected && isDate(newValidSelectedDate) && isDate(selected)) {
         // Si son el mismo día, NO actualices el estado interno (evita bucles)
         if (isSameDay(newValidSelectedDate, selected)) {
             shouldUpdate = false;
         }
      } else if (!newValidSelectedDate && !selected) {
          // Si ambas son undefined, tampoco actualices
          shouldUpdate = false;
      }
  
      if (shouldUpdate) {
        setSelected(newValidSelectedDate);
        // Opcional: Cambiar mes visible solo si la fecha seleccionada es válida y diferente
        // if (newValidSelectedDate && (!currentMonth || !isSameMonth(newValidSelectedDate, currentMonth))) {
        //    setCurrentMonth(startOfMonth(newValidSelectedDate));
        // }
      }
    // Quita 'selected' de las dependencias para evitar posibles bucles si la lógica no es perfecta.
    // Solo depende del cambio de la prop 'selectedDate'.
    }, [selectedDate]);
  
  
    const handleSelect: SelectSingleEventHandler = (day) => {
      // 'day' ya viene como Date | undefined de la librería
      setSelected(day);
      onDateChange(day && isValid(day) ? format(day, 'yyyy-MM-dd') : undefined);
    };
  
    const busyDates = busyDays
        .map(dateStr => parse(dateStr, 'yyyy-MM-dd', new Date()))
        .filter(isValid); // Asegura que solo fechas válidas entren al modifier
  
    const modifiers = {
      busy: busyDates,
      disabled: { before: new Date() }
    };
  
    const modifiersClassNames = {
      selected: styles.selectedDay || 'rdp-day_selected',
      busy: styles.busyDay || 'rdp-day_busy',
      today: styles.today || 'rdp-day_today',
      disabled: styles.disabledDay || 'rdp-day_disabled'
    };
  
  return (
    <div className={styles.calendarContainer}> {/* Contenedor general del calendario */}
      {/* Controles Mes/Semanas (como en Figma, funcionalidad Mes por ahora) */}
      <div className={styles.calendarViewControls}>
        <button type="button" className={`${styles.controlButton} ${styles.active}`}>Mes</button>
        <button type="button" className={styles.controlButton}>Semanas</button>
      </div>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={handleSelect}
        month={currentMonth}
        onMonthChange={setCurrentMonth} // Permite la navegación
        locale={es} // Nombres de meses y días en español
        showOutsideDays // Muestra días del mes anterior/siguiente
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        disabled={{ before: new Date() }} // Deshabilita días pasados directamente
        // Personalización de componentes internos (opcional, para iconos propios)
        // components={{
        //   IconLeft: () => <IconChevronLeft size={20} />,
        //   IconRight: () => <IconChevronRight size={20} />,
        // }}
        // Aplica clases CSS Module a elementos específicos de react-day-picker
        classNames={{
          root: styles.rdpRoot, // Contenedor principal de DayPicker
          caption: styles.rdpCaption, // Contenedor del mes/año y navegación
          caption_label: styles.rdpCaptionLabel, // Texto "Mes Año"
          nav: styles.rdpNav, // Contenedor botones navegación
          nav_button: styles.rdpNavButton, // Botones < >
          nav_button_previous: styles.rdpNavButtonPrev,
          nav_button_next: styles.rdpNavButtonNext,
          table: styles.rdpTable, // Tabla del calendario
          head: styles.rdpHead, // Cabecera de la tabla (días semana)
          head_row: styles.rdpHeadRow,
          head_cell: styles.rdpHeadCell, // Celda día semana (L, M, ...)
          tbody: styles.rdpTbody,
          row: styles.rdpRow, // Fila de días
          cell: styles.rdpCell, // Celda de un día
          day: styles.rdpDay, // Contenido del día (el número)
          day_selected: styles.selectedDay, // Redundante con modifiersClassNames pero asegura override
          day_today: styles.today,
          day_outside: styles.rdpDayOutside, // Días fuera del mes actual
          day_disabled: styles.disabledDay,
          // ... otras clases si necesitas más personalización
        }}
      />
       {/* Mostrar error global si existe */}
       {/* {error && <span className={styles.errorText}>{error}</span>} */}
    </div>
  );
};

export default CalendarPicker;