import React, { useEffect, useRef, useState } from "react";
import styles from "../RenderForm.module.css";
import Radio from "@/mk/components/forms/Ratio/Radio";
import Input from "@/mk/components/forms/Input/Input";
import WeekdayToggleGroup from "../WeekdayToggleGroup/WeekdayToggleGroup";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Select from "@/mk/components/forms/Select/Select";
import { hours } from "@/mk/utils/utils";
import Switch from "@/mk/components/forms/Switch/Switch";
import { useAuth } from "@/mk/contexts/AuthProvider";

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
  const prevBookingMode = useRef(formState?.booking_mode);
  // const [selectdHour, setSelectdHour]: any = useState("");
  const [periods, setPeriods]: any = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const { showToast } = useAuth();

  const handleChangeWeekday = (day: string) => {
    if (
      !formState?.reservation_duration &&
      formState?.booking_mode === "hour"
    ) {
      return showToast("Debe seleccionar una hora primero", "error");
    }
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

  const handleChangePeriods = (newPeriod: string) => {
    // setSelectdHour(newPeriod);

    setFormState({
      ...formState,
      available_days: [],
      available_hours: {},
      reservation_duration: newPeriod,
    });

    // Limpiar estados relacionados
    setSelectedDays([]);
    setPeriods([]);
  };
  // useEffect(() => {
  //   if (
  //     formState?.start_hour &&
  //     formState?.end_hour &&
  //     formState?.booking_mode === "hour"
  //   ) {
  //     getHours();
  //   }
  //   setPeriods([]);
  //   setSelectdHour("");
  // }, [formState?.start_hour, formState?.end_hour]);
  const Br = () => {
    return (
      <div
        style={{
          backgroundColor: "var(--cWhiteV1)",
          height: 0.5,
          margin: "16px 0px",
        }}
      />
    );
  };

  const parseTimeToMinutes = (timeStr: string) => {
    // console.log(timeStr);
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
    if (
      !formState?.reservation_duration ||
      !formState?.start_hour ||
      !formState?.end_hour
    )
      return;

    const periodLength = parseFloat(formState?.reservation_duration) * 60;
    const start = parseTimeToMinutes(formState?.start_hour);
    const end = parseTimeToMinutes(formState?.end_hour);

    const result: string[] = [];
    for (let t = start; t + periodLength <= end; t += periodLength) {
      result.push(
        `${minutesToTimeString(t)}-${minutesToTimeString(t + periodLength)}`
      );
    }
    console.log(result, "RESUKT");
    setPeriods(result);
  }, [
    formState?.reservation_duration,
    formState?.start_hour,
    formState?.end_hour,
  ]);

  const handleSave = () => {
    if (
      !selectedDays.length ||
      !formState?.start_hour ||
      !formState?.end_hour ||
      (!formState?.reservation_duration && formState?.booking_mode == "hour")
    )
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
    // setFormState({ ...formState, start_hour: "", end_hour: "" });
    // setPeriods([]);
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
        reservation_duration: "",
      });
      // setSelectdHour("");
      setSelectedDays([]);
      setPeriods([]);
    }
  }, [formState?.booking_mode]);

  const prevHasPrice = useRef(formState?.has_price);
  useEffect(() => {
    if (prevHasPrice.current === "S" && formState?.has_price === "N") {
      setFormState({
        ...formState,
        price: "",
        min_cancel_hours: "",
        penalty_fee: "",
      });
    }

    // Actualiza el valor anterior
    prevHasPrice.current = formState?.has_price;
  }, [formState?.has_price]);

  const getEndHours = () => {
    if (!formState?.start_hour) return [];

    if (formState?.booking_mode == "hour") {
      const durationInMinutes =
        parseFloat(formState?.reservation_duration) * 60;
      const startMinutes = parseTimeToMinutes(formState.start_hour);
      const allHourMinutes = hours.map((h: any) => ({
        ...h,
        minutes: parseTimeToMinutes(h.name),
      }));

      // Encuentra los saltos exactos en función de la duración
      const validHours = allHourMinutes.filter((hour) => {
        const diff = hour.minutes - startMinutes;
        return hour.minutes > startMinutes && diff % durationInMinutes === 0;
      });
      return validHours.map(({ id, name }) => ({ id, name }));
    } else {
      let h: any = [];
      hours.map((hour: any) => {
        if (hour.name > formState?.start_hour) {
          h.push(hour);
        }
      });
      return h;
    }
  };
  const sortedDays = () => {
    const dayOrder: any = {
      Lunes: 0,
      Martes: 1,
      Miércoles: 2,
      Jueves: 3,
      Viernes: 4,
      Sábado: 5,
      Domingo: 6,
    };

    return Object.keys(formState?.available_hours || {}).sort(
      (a, b) => dayOrder[a] - dayOrder[b]
    );
  };

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
      <Br />
      {formState?.booking_mode == "hour" && (
        <>
          <p className={styles.title}>Duración de reserva</p>
          <p className={styles.subtitle}>
            Selecciona cuántas horas durará cada reserva. Los horarios de
            disponibilidad se verán afectados por el periodo de duración
          </p>
          <WeekdayToggleGroup
            // days={getHours()}
            days={["1h", "2h", "3h", "4h"]}
            selectedDays={
              formState?.id
                ? formState?.reservation_duration + "h"
                : formState?.reservation_duration
            }
            onClick={handleChangePeriods}
          />
          <Br />
        </>
      )}
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
      {formState?.available_hours &&
        formState?.booking_mode &&
        sortedDays()?.length > 0 && (
          <div
            style={{
              display: "flex",
              overflowX: "scroll",
              gap: 8,
              marginTop: 12,
              scrollbarColor: "var(--cBlackV1) var(--cBlackV2)",
            }}
          >
            {sortedDays().map((day: any, index: any) => (
              <div
                key={index}
                style={{
                  width: 216,
                  border: "0.5px solid var(--cWhiteV1)",
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: "var(--cWhiteV2)",
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
                    scrollbarColor: "var(--cBlackV2) var(--cWhiteV2)",
                  }}
                >
                  {formState?.available_hours[day]?.map(
                    (period: any, index: any) => (
                      <div
                        key={index}
                        style={{
                          border: "0.5px solid var(--cWhiteV1)",
                          minWidth: "100px",
                          flex: "0 0 auto",
                          padding: "8px",
                          borderRadius: 8,
                          backgroundColor: "transparent",
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
            ))}
          </div>
        )}
      {formState?.booking_mode == "hour" && (
        <>
          <Br />
          <p className={styles.title}>Reservaciones por día</p>
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
      <Br />
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
      <Br />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div>
          <p className={styles.title}>
            ¿El área social tiene un costo por uso?
          </p>
          <p className={styles.subtitle}>
            Si tiene un costo, activa el botón e ingresa el costo total del
            periodo
          </p>
        </div>
        <Switch
          name="has_price"
          optionValue={["S", "N"]}
          onChange={(e: any) => {
            handleChange({
              target: {
                name: "has_price",
                value: e.target.checked ? "S" : "N",
              },
            });
          }}
          value={formState?.has_price}
        />
      </div>
      {formState?.has_price == "S" && (
        <>
          <Input
            type="number"
            label="Monto (Bs)"
            name="price"
            value={formState?.price}
            onChange={handleChange}
            error={errors}
          />
          <Br />
          <p className={styles.title}>Tiempo de cancelación sin multa</p>
          <p className={styles.subtitle}>
            Define el tiempo permitido que un residente puede cancelar la
            reserva sin cobrarle multa
          </p>
          <Input
            type="number"
            label="Tiempo"
            name="min_cancel_hours"
            required
            placeholder="Usa el formato: 2h, 4h, 6h"
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
            suffix="%"
            value={formState?.penalty_fee}
            placeholder="Coloca 0% si no aplicas multas"
            onChange={handleChange}
            error={errors}
          />
        </>
      )}

      {openModal && (
        <DataModal
          title="Periodo"
          open={openModal}
          onClose={() => {
            setFormState({ ...formState, start_hour: "", end_hour: "" });
            setSelectedDays([]);
            // setPeriods([]);
            setOpenModal(false);
          }}
          onSave={handleSave}
        >
          <p className={styles.title}>Periodo de disponibilidad</p>
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
              options={getEndHours() || []}
              onChange={handleChange}
              error={errors}
            />
          </div>

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
          {formState?.reservation_duration && periods.length > 0 && (
            <>
              <p className={styles.title} style={{ marginTop: 12 }}>
                Periodos actuales
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                {selectedDays.map((day: any) => (
                  <div
                    key={day}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <p style={{ fontSize: 14 }}>{day}</p>

                    {periods.map((period: any, index: any) => (
                      <div
                        key={index}
                        style={{
                          border: "0.5px solid var(--cWhiteV1) ",
                          padding: 8,
                          borderRadius: 8,
                        }}
                      >
                        <p style={{ color: "var(--cWhiteV1)", fontSize: 14 }}>
                          {period}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </DataModal>
      )}
    </>
  );
};

export default SecondPart;
