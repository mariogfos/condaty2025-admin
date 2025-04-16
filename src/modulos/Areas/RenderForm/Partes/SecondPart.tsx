import React, { useEffect, useState } from "react";
import styles from "../RenderForm.module.css";
import Radio from "@/mk/components/forms/Ratio/Radio";
import Input from "@/mk/components/forms/Input/Input";
import WeekdayToggleGroup from "../WeekdayToggleGroup/WeekdayToggleGroup";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Select from "@/mk/components/forms/Select/Select";
import { hours } from "@/mk/utils/utils";

interface PropsType {
  handleChange: any;
  errors: any;
  formState: any;
  setFormState: any;
}
const days = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const SecondPart = ({
  handleChange,
  errors,
  formState,
  setFormState,
}: PropsType) => {
  const [selectedDays, setSelectedDays]: any = useState(
    formState?.available_days || []
  );
  const prevBookingMode = React.useRef(formState?.booking_mode);
  const [selectdHour, setSelectdHour]: any = useState("");
  const [periods, setPeriods]: any = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const handleChangeWeekday = (day: string) => {
    if (
      selectedDays.includes(day) ||
      formState?.available_days?.includes(day)
    ) {
      setSelectedDays(selectedDays.filter((d: any) => d !== day));
      const updatedHours = { ...formState?.available_hours };
      delete updatedHours[day];

      setFormState({
        ...formState,
        available_days: formState?.available_days?.filter(
          (d: any) => d !== day
        ),
        available_hours: updatedHours,
      });
    } else {
      setSelectedDays([...selectedDays, day]);
      setOpenModal(true);
    }
  };

  const handleChangePeriods = (period: string) => {
    setSelectdHour(period);
  };
  const getHours = () => {
    const periods = [];
    let start = formState?.start_hour?.split(":")[0] * 60;
    let end = formState?.end_hour?.split(":")[0] * 60;
    let diff = end - start;

    if (diff % 60 === 0) {
      periods.push("1h");
    }
    if (diff % 90 === 0) {
      periods.push("1.5h");
    }
    if (diff % 120 === 0) {
      periods.push("2h");
    }
    if (diff % 150 === 0) {
      periods.push("2.5h");
    }
    if (diff % 180 === 0) {
      periods.push("3h");
    }
    if (diff % 240 === 0) {
      periods.push("4h");
    }
    return periods;
  };

  useEffect(() => {
    if (
      formState?.start_hour &&
      formState?.end_hour &&
      formState?.booking_mode === "hour"
    ) {
      getHours();
    }
    setPeriods([]);
    setSelectdHour("");
  }, [formState?.start_hour, formState?.end_hour]);

  const parseTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTimeString = (mins: number) => {
    const h = Math.floor(mins / 60)
      .toString()
      .padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  useEffect(() => {
    if (!selectdHour || !formState?.start_hour || !formState?.end_hour) return;

    const periodLength = parseFloat(selectdHour) * 60;
    const start = parseTimeToMinutes(formState.start_hour);
    const end = parseTimeToMinutes(formState.end_hour);

    let result = [];
    for (let t = start; t + periodLength <= end; t += periodLength) {
      const from = minutesToTimeString(t);
      const to = minutesToTimeString(t + periodLength);
      result.push(`${from}-${to}`);
    }

    setPeriods(result);
  }, [selectdHour]);

  const handleSave = () => {
    if (!selectedDays.length || !formState?.start_hour || !formState?.end_hour)
      return;

    const updatedHours: any = {};

    selectedDays.forEach((day: string) => {
      if (formState?.booking_mode === "hour") {
        // Por hora: guardar todos los periodos generados
        updatedHours[day] = [...(periods || [])];
      } else {
        // Por día: guardar el rango completo
        updatedHours[day] = [`${formState?.start_hour}-${formState.end_hour}`];
      }
    });

    setFormState({
      ...formState,
      available_days: [
        ...new Set([...(formState?.available_days || []), ...selectedDays]),
      ],
      available_hours: {
        ...formState?.available_hours,
        ...updatedHours,
      },
    });

    // Limpiar modal
    setOpenModal(false);
    setSelectedDays([]);
    setSelectdHour("");
    setPeriods([]);
  };

  useEffect(() => {
    if (prevBookingMode.current === formState?.booking_mode) {
      prevBookingMode.current = formState?.booking_mode;
      return;
    }
    if (!formState?.id) {
      setFormState({
        ...formState,
        start_hour: "",
        end_hour: "",
        available_hours: {},
        available_days: [],
        max_reservations_per_day: "",
      });
      setSelectdHour("");
      setSelectedDays([]);
      setPeriods([]);
    }
  }, [formState?.booking_mode]);
  return (
    <>
      <p className={styles.title}>Define el tipo de reserva</p>
      <div style={{ display: "flex", width: "100%", gap: 8 }}>
        <Radio
          disabled={formState?.id}
          checked={formState?.booking_mode == "day"}
          label="Por dia"
          onChange={() => setFormState({ ...formState, booking_mode: "day" })}
        />
        <Radio
          disabled={formState?.id}
          checked={formState?.booking_mode == "hour"}
          label="Por hora"
          onChange={() => setFormState({ ...formState, booking_mode: "hour" })}
        />
      </div>
      <p className={styles.title} style={{ marginTop: 12 }}>
        ¿Esta área tiene un costo de uso?
      </p>
      <p className={styles.subtitle}>
        Si tiene costo ingresa el monto, si no tiene costo omite este paso
      </p>
      <Input
        type="number"
        label="Monto (Bs)"
        name="price"
        value={formState?.price}
        onChange={handleChange}
        error={errors}
      />
      {formState?.booking_mode && (
        <>
          <p className={styles.title}>
            {formState?.booking_mode == "day"
              ? "Días disponibles"
              : "Días y periodos disponibles"}
          </p>
          <p className={styles.subtitle}>
            {formState?.booking_mode == "day"
              ? "Selecciona los días en que esta área estará disponible para reservar"
              : "Selecciona los días y crea los periodos de horas en que esta área estará disponible para reservar"}
          </p>
          <WeekdayToggleGroup
            days={days}
            selectedDays={formState?.available_days}
            onClick={handleChangeWeekday}
          />
        </>
      )}
      {formState?.available_hours && formState?.booking_mode && (
        <div
          style={{
            display: "flex",
            overflowX: "scroll",
            gap: 8,
            marginTop: 12,
            scrollbarColor: "var(--cBlackV2) var(--cBlackV1)",
          }}
        >
          {Object.keys(formState?.available_hours).map(
            (day: any, index: any) => (
              <div
                key={index}
                style={{
                  width: 216,
                  border: "1px solid var(--cWhiteV1)",
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: "var(--cBlackV1)",
                }}
              >
                <p style={{ fontSize: 14 }}>{day}</p>
                <p
                  style={{
                    marginBottom: 8,
                    fontSize: 12,
                    color: "var(--cWhiteV1)",
                  }}
                >
                  {formState?.booking_mode == "hour"
                    ? "periodos de horas"
                    : "Horario disponible"}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    width: "100%",
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--cBlackV2) var(--cBlackV1)",
                  }}
                >
                  {formState?.available_hours[day]?.map(
                    (period: any, index: any) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid var(--cWhiteV1)",
                          minWidth: "100px",
                          flex: "0 0 auto",
                          padding: "8px",
                          borderRadius: 8,
                        }}
                      >
                        <p style={{ color: "var(--cWhite)", fontSize: 14 }}>
                          {period}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
      {formState?.booking_mode == "hour" && (
        <>
          <p className={styles.title} style={{ marginTop: 12 }}>
            Reservaciones por día
          </p>
          <p className={styles.subtitle}>
            Define la cantidad máxima de reservas que un residente puede
            realizar en un solo día
          </p>

          <Input
            label="Reservas máximas por día"
            name="max_reservations_per_day"
            type="number"
            required
            value={formState?.max_reservations_per_day}
            onChange={handleChange}
            error={errors}
          />
        </>
      )}
      <p className={styles.title}>Reservaciones por semana</p>
      <p className={styles.subtitle}>
        Define la cantidad máxima de reservas que un residente puede realizar en
        una semana
      </p>
      <Input
        type="number"
        label="Reservas máximas por semana"
        required
        name="max_reservations_per_week"
        value={formState?.max_reservations_per_week}
        onChange={handleChange}
        error={errors}
      />
      <p className={styles.title}>Tiempo de cancelación sin multa</p>
      <p className={styles.subtitle}>
        Define el tiempo permitido que un residente puede cancelar la reserva
        sin cobrarle multa
      </p>
      <Input
        type="number"
        label="Tiempo"
        name="min_cancel_hours"
        required
        // placeholder="Usa el formato: 2h, 4h, 6"
        placeholder="El tiempo debe ser en horas"
        value={formState?.min_cancel_hours}
        onChange={handleChange}
        error={errors}
      />
      <p className={styles.title}>Porcentaje de multa por cancelación</p>
      <p className={styles.subtitle}>
        Indica el porcentaje de multa que un residente tendrá si cancela la
        reserva fuera del tiempo permitido
      </p>
      <Input
        type="number"
        label="Tarifa de penalización"
        required
        name="penalty_fee"
        value={formState?.penalty_fee}
        placeholder="Coloca 0% si no aplicas multas"
        onChange={handleChange}
        error={errors}
      />

      {openModal && (
        <DataModal
          title="Periodo"
          open={openModal}
          onClose={() => {
            setFormState({ ...formState, start_hour: "", end_hour: "" });
            setSelectedDays([]);
            setSelectdHour("");
            setPeriods([]);
            setOpenModal(false);
          }}
          onSave={handleSave}
        >
          <p className={styles.title}>Horario de disponibilidad</p>
          <div style={{ display: "flex", gap: 12 }}>
            <Select
              label="Hora de inicio"
              name="start_hour"
              value={formState?.start_hour}
              options={hours || []}
              onChange={handleChange}
              error={errors}
            />
            <Select
              label="Hora de fin"
              name="end_hour"
              value={formState?.end_hour}
              options={hours || []}
              onChange={handleChange}
              error={errors}
            />
          </div>
          {formState?.start_hour &&
            formState?.end_hour &&
            formState?.booking_mode == "hour" && (
              <>
                <p className={styles.title}>Duración de reserva</p>
                <p className={styles.subtitle}>
                  Selecciona cuántas horas durará cada reserva. Solo se
                  permitirán duraciones que encajen de forma exacta en el
                  horario disponible, sin dejar espacios vacíos.
                </p>

                <WeekdayToggleGroup
                  days={getHours()}
                  selectedDays={selectdHour}
                  onClick={handleChangePeriods}
                />
              </>
            )}
          {selectdHour && periods.length > 0 && (
            <>
              <p className={styles.subtitle} style={{ marginTop: 12 }}>
                Estos son los periodos que verá el usuario para reservar esta
                área
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                {periods.map((period: any, index: any) => (
                  <div key={index}>
                    <p style={{ fontSize: 12 }}>Periodo{index + 1}</p>
                    <p style={{ color: "var(--cWhite)", fontSize: 14 }}>
                      {period}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className={styles.title} style={{ marginTop: 12 }}>
            {formState?.booking_mode == "hour"
              ? "Aplicar periodos a los demás días"
              : "Aplicar horarios a los demás días"}
          </p>
          <p className={styles.subtitle}>
            {formState?.booking_mode == "hour"
              ? "Simplifica tu tarea aplicando los mismos bloques a los demás días. Selecciona los días en los que quieras repetir estos mismos bloques"
              : "Simplifica tu tarea aplicando el mismo horario a los demás días. Selecciona los días en los que quieras repetir este mismo horario"}
          </p>
          <WeekdayToggleGroup
            days={days}
            selectedDays={selectedDays}
            onClick={handleChangeWeekday}
          />
        </DataModal>
      )}
    </>
  );
};

export default SecondPart;
