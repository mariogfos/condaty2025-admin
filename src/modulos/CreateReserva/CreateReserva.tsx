"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./CreateReserva.module.css";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconGroup,
  IconMonedas,
  IconZoomDetail,
} from "@/components/layout/icons/IconsBiblioteca";
import CalendarPicker from "./CalendarPicker/CalendarPicker";
import useAxios from "@/mk/hooks/useAxios";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { ApiArea, FormState } from "./Type";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import Button from "@/mk/components/forms/Button/Button";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import { getDateStrMes } from "../../mk/utils/date1";
import StepProgressBar from "@/components/StepProgressBar/StepProgressBar";
import HeaderBack from "@/mk/components/ui/HeaderBack/HeaderBack";
import { formatBs, formatNumber } from "@/mk/utils/numbers";
import Tooltip from "@/mk/components/ui/Tooltip/Tooltip";

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
const weekDay = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const CreateReserva = ({ extraData, setOpenList, onClose, reLoad }: any) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busyDays, setBusyDays] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [unavailableTimeSlots, setUnavailableTimeSlots] = useState([]);
  const [openComfirm, setOpenComfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [dataReserv, setDataReserv]: any = useState([]);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState(false);
  const [monthChangeTimer, setMonthChangeTimer] = useState(null);
  const [selectedUnit, setSelectedUnit]: any = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const { execute } = useAxios();
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const { showToast } = useAuth();

  useEffect(() => {
    setOpenList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formState?.area_social && formState?.unidad) {
      getCalendar();
      setCurrentImageIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState?.area_social, formState.unidad]);
  useEffect(() => {
    setFormState({ ...formState, unidad: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState?.area_social]);
  useEffect(() => {
    if (formState?.unidad) {
      const selectedUnit = extraData?.dptos?.find(
        (u: any) => String(u.id) === formState.unidad
      );
      setSelectedUnit(selectedUnit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState?.unidad]);

  const getCalendar = useCallback(
    async (date?: any) => {
      setLoadingCalendar(true);
      const ownerId = selectedUnit?.titular?.owner_id;
      const { data } = await execute(
        "/reservations-calendar",
        "GET",
        {
          area_id: formState?.area_social || "none",
          date_at: date || new Date().toISOString()?.split("T")[0],
          owner_id:
            ownerId ||
            extraData?.dptos?.find(
              (u: any) => String(u.id) === formState.unidad
            )?.titular?.owner_id,
        },
        false,
        true
      );
      if (data?.success) {
        setDataReserv(data?.data);
        setBusyDays(data?.data?.reserved.concat(data?.data?.maintenance) || []);
        setLoadingCalendar(false);
      } else {
        showToast("Ocurrió un error", "errror");
      }
    },
    [
      formState.area_social,
      execute,
      setDataReserv,
      setBusyDays,
      selectedUnit,
      setLoadingCalendar,
      showToast,
      formState?.unidad,
      extraData?.dptos,
    ]
  );

  const unidadesOptions = () => {
    let data: any = [];
    extraData?.dptos?.map((unidad: any) => {
      if (selectedAreaDetails?.penalty_or_debt_restriction == "A") {
        if (unidad?.defaulter == "X") {
          data.push({
            id: String(unidad.id),
            name: `Unidad: ${unidad.nro}, ${unidad.description || ""}`,
          });
        }
      } else {
        data.push({
          id: String(unidad.id),
          name: `Unidad: ${unidad.nro}, ${unidad.description || ""}`,
        });
      }
    });
    return data;
  };

  const selectedAreaDetails: ApiArea | undefined = useMemo(() => {
    if (!formState.area_social) {
      return;
    }
    return extraData?.areas.find(
      (area: ApiArea) => area.id === formState.area_social
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.area_social]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const isAreaChange = name === "area_social";
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      ...(isAreaChange && { fecha: "" }),
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePeriodToggle = (period: string) => {
    setSelectedPeriods((prevSelected) => {
      const isCurrentlySelected =
        prevSelected.length === 1 && prevSelected[0] === period;

      if (isCurrentlySelected) {
        return [];
      } else {
        return [period];
      }
    });
    if (errors.selectedPeriods) {
      setErrors((prev) => ({ ...prev, selectedPeriods: undefined }));
    }
  };

  const onMonth = useCallback(
    (dateString: any) => {
      if (monthChangeTimer) {
        clearTimeout(monthChangeTimer);
      }
      const timer: any = setTimeout(() => {
        if (formState.area_social && dateString && formState.unidad) {
          getCalendar(dateString);
        } else {
          setAvailableTimeSlots([]);
        }
      }, 300);

      setMonthChangeTimer(timer);
      return () => {
        if (monthChangeTimer) {
          clearTimeout(monthChangeTimer);
        }
      };
    },
    [formState.area_social, formState.unidad, getCalendar, monthChangeTimer]
  );

  const handleDateChange = (dateString?: string | undefined) => {
    setFormState({ ...formState, fecha: dateString || "" });
    setSelectedPeriods([]);
    const day: any = parseFloat(dateString?.split("-")[2] || "");
    let dataDay = dataReserv.days[day];
    let daysAvailable = [];
    let unavailableSlots = [];

    if (dateString == new Date().toISOString().split("T")?.[0]) {
      daysAvailable = dataDay?.available.filter(
        (d: any) => parseInt(d.split("-")[1]) > new Date().getHours()
      );

      unavailableSlots = dataDay?.available.filter(
        (d: any) => parseInt(d.split("-")[1]) <= new Date().getHours()
      );
    } else {
      daysAvailable = dataDay?.available;
    }
    if (
      dataReserv?.reserved?.includes(dateString) ||
      dataDay?.available.length === 0
    ) {
      setShowMessage(true);
    } else {
      setShowMessage(false);
    }
    setUnavailableTimeSlots(
      unavailableSlots.concat(dataDay?.unavailable, dataDay?.maintenance)
    );
    if (Array.isArray(daysAvailable)) {
      setAvailableTimeSlots(daysAvailable);
    } else {
      setAvailableTimeSlots([]);
    }
  };

  const validateStep2 = () => {
    if (!formState.fecha) {
      showToast("Selecciona una fecha", "error");
      return;
    }

    if (selectedPeriods.length === 0) {
      showToast("Debes seleccionar al menos un periodo disponible", "error");
      return;
    }
    if (!formState.cantidad_personas) {
      return showToast("Ingresa la cantidad de personas", "error");
    }
    setCurrentStep((prev) => prev + 1);
  };
  const nextStep = (): void => {
    if (currentStep === 1) {
      const dateNow = new Date().toISOString().split("T")?.[0];
      const day = new Date(dateNow).getDay();
      const weekday = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
      ];

      if (
        selectedAreaDetails?.available_days?.includes(weekday[day]) &&
        !formState?.fecha
      ) {
        handleDateChange(dateNow);
      }
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 2) {
      validateStep2();
    }
  };

  const prevStep = (): void => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (isSubmitting) {
      if (!isSubmitting) {
        showToast("Por favor, revisa los campos requeridos.", "warning");
      }
      return;
    }

    setIsSubmitting(true);

    const selectedUnit = extraData?.dptos.find(
      (u: any) => String(u.id) === formState.unidad
    );
    const ownerId = selectedUnit?.titular?.owner_id;
    if (!ownerId) {
      setIsSubmitting(false);
      return;
    }
    let startTime = "";
    const sortedSelectedPeriods = [...selectedPeriods];
    if (sortedSelectedPeriods.length > 0) {
      startTime = sortedSelectedPeriods[0].split("-")[0];
    }

    const payload = {
      area_id: formState.area_social,
      owner_id: ownerId,
      date_at: formState.fecha,
      people_count: Number(formState.cantidad_personas),
      amount: Number(selectedAreaDetails?.price || 0),
      obs:
        formState.motivo ||
        `Reserva de ${selectedAreaDetails?.title || "área"}`,
      start_time: startTime,
      periods: sortedSelectedPeriods,
    };
    try {
      const response = await execute(
        "/reservations",
        "POST",
        payload,
        false,
        false
      );
      if (response?.data?.success) {
        showToast(
          response?.data?.message || "Reserva creada exitosamente",
          "success"
        );
        if (reLoad) reLoad();
        if (onClose) onClose();
      } else {
        showToast(
          response?.data?.message || "Error al crear la reserva.",
          "error"
        );
      }
    } catch (error) {
      console.error(error);
      showToast("Ocurrió un error inesperado al crear la reserva.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (newValue: number | string) => {
    let finalValue: string;
    if (String(newValue).trim() === "") {
      finalValue = ""; // Permitir que el campo se quede vacío
    } else {
      const numValue = Number(newValue);
      const min = 1; // El mínimo lógico para la cantidad sigue siendo 1
      const max = selectedAreaDetails?.max_capacity;
      if (isNaN(numValue)) {
        finalValue = ""; // Dejar vacío para que el usuario corrija, o podrías usar el valor anterior: formState.cantidad_personas
      } else if (max !== undefined && max !== null && numValue > max) {
        finalValue = String(max);
      } else if (numValue < min) {
        finalValue = String(min);
      } else {
        finalValue = String(newValue); // Usar newValue directamente si ya es un string numérico válido
      }
    }

    setFormState((prev) => ({
      ...prev,
      cantidad_personas: finalValue,
    }));

    if (errors.cantidad_personas) {
      if (finalValue.trim() !== "") {
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
    const currentValue = Number(formState.cantidad_personas || 0);
    const newValue = currentValue + 1;
    handleQuantityChange(newValue);
  };

  const decrementPeople = () => {
    const currentValue = Number(formState.cantidad_personas || 1);
    const newValue = currentValue - 1;
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
    return [...available, ...unavailable].sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }, [availableTimeSlots, unavailableTimeSlots]);

  const _onClose = () => {
    if (currentStep == 3) {
      setOpenComfirm(true);
      return;
    }
    onClose();
  };
  return (
    <div className={styles.pageWrapper}>
      <HeaderBack label="Volver a lista de reservas" onClick={_onClose} />
      <div className={styles.createReservaContainer}>
        <div className={styles.header}>
          <p style={{ fontSize: "24px", fontWeight: 600 }}>
            Reservar un área social
          </p>
          <StepProgressBar currentStep={currentStep} totalSteps={3} />
        </div>
        {/* Se ha eliminado la clase `styles.formContainer` que no estaba definida */}
        <div>
          <div className={styles.formCard}>
            {currentStep === 1 && (
              <div className={`${styles.stepContent} ${styles.step1Content}`}>
                {/* Sección Datos Generales (Unidad) */}

                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Datos de la reserva</h3>
                  <div className={styles.formField}>
                    <Select
                      label="Área social"
                      name="area_social"
                      value={formState.area_social}
                      options={extraData?.areas}
                      optionLabel="title"
                      optionValue="id"
                      onChange={handleChange}
                      error={errors}
                    />
                  </div>
                </div>
                <hr
                  className={styles.areaSeparator}
                  style={{ marginBottom: 12 }}
                />
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Datos generales</h3>
                  <div className={styles.formField}>
                    <Select
                      label="Unidad"
                      name="unidad"
                      value={formState.unidad}
                      options={unidadesOptions()}
                      onChange={handleChange}
                      error={errors}
                    />
                  </div>
                </div>
                {selectedAreaDetails && selectedUnit && (
                  <>
                    <div className={styles.areaPreview}>
                      {selectedAreaDetails.images &&
                        selectedAreaDetails.images.length > 0 && (
                          <div className={styles.imageContainer}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              key={
                                selectedAreaDetails?.images[currentImageIndex]
                                  ?.id
                              }
                              className={styles.previewImage}
                              src={getUrlImages(
                                `/AREA-${selectedAreaDetails?.id}-${selectedAreaDetails?.images[currentImageIndex]?.id}.webp?d=${selectedAreaDetails?.updated_at}`
                              )}
                              alt={`Imagen ${currentImageIndex + 1} de ${
                                selectedAreaDetails.title
                              }`}
                            />
                            {selectedAreaDetails?.images?.length > 1 && (
                              <div className={styles.imagePagination}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCurrentImageIndex((prev) =>
                                      prev > 0
                                        ? prev - 1
                                        : (selectedAreaDetails?.images
                                            ?.length || 1) - 1
                                    )
                                  }
                                  disabled={
                                    selectedAreaDetails?.images?.length <= 1
                                  }
                                  aria-label="Imagen anterior"
                                >
                                  <IconArrowLeft color="var(--cWhite)" />
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
                                      (selectedAreaDetails?.images?.length ||
                                        1) -
                                        1
                                        ? prev + 1
                                        : 0
                                    )
                                  }
                                  disabled={
                                    selectedAreaDetails?.images?.length <= 1
                                  }
                                  aria-label="Siguiente imagen"
                                >
                                  <IconArrowRight color="var(--cWhite)" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      <div className={styles.areaInfo}>
                        <h4 className={styles.areaTitle}>Datos generales</h4>
                        <KeyValue
                          title={"Estado"}
                          value={
                            selectedAreaDetails.status === "A"
                              ? "Disponible"
                              : "No Disponible"
                          }
                          colorValue={
                            selectedAreaDetails.status === "A"
                              ? "var(--cSuccess)"
                              : "var(--cError)"
                          }
                        />
                        <KeyValue
                          title={"Cantidad máx. de personas"}
                          value={selectedAreaDetails.max_capacity ?? "-/-"}
                        />
                        <KeyValue
                          title={"Restricción por mora"}
                          value={
                            selectedAreaDetails?.penalty_or_debt_restriction ===
                            "A"
                              ? "Si"
                              : "No"
                          }
                        />
                        <KeyValue
                          title={"Aprobación de administración"}
                          value={
                            selectedAreaDetails?.requires_approval === "A"
                              ? "Si"
                              : "No"
                          }
                        />
                        {selectedAreaDetails.booking_mode == "hour" && (
                          <KeyValue
                            title={"Reservación por día"}
                            value={
                              selectedAreaDetails?.max_reservations_per_day ??
                              "-/-"
                            }
                          />
                        )}
                        <KeyValue
                          title={"Reservación por semana"}
                          value={
                            selectedAreaDetails?.max_reservations_per_week ??
                            "-/-"
                          }
                        />
                        {selectedAreaDetails.price && (
                          <>
                            <KeyValue
                              title={"Cancelación sin multa"}
                              value={
                                selectedAreaDetails?.min_cancel_hours + "h" ||
                                "-/-"
                              }
                            />
                            <KeyValue
                              title={"Porcentaje por cancelación"}
                              value={
                                selectedAreaDetails?.penalty_fee + "%" || "-/-"
                              }
                            />
                          </>
                        )}
                      </div>
                    </div>
                    <hr className={styles.areaSeparator} />
                    <div className={styles.detailBlock}>
                      <span className={styles.detailLabel}>Políticas</span>

                      <IconZoomDetail
                        onClick={() => setIsRulesModalVisible(true)}
                      />
                    </div>
                    <hr className={styles.areaSeparator} />
                  </>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className={`${styles.stepContent} ${styles.step2Content}`}>
                <div className={styles.dateSection}>
                  <p className={styles.sectionLabel}>
                    Selecciona la fecha del evento
                  </p>
                  <CalendarPicker
                    selectedDate={formState.fecha}
                    onDateChange={handleDateChange}
                    onMonthSelect={onMonth}
                    loading={loadingCalendar}
                    busyDays={busyDays}
                    available_days={selectedAreaDetails?.available_days}
                  />
                  {errors.fecha && (
                    <span className={styles.errorText}>{errors.fecha}</span>
                  )}
                </div>

                {formState.fecha && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--cWhiteV1)",
                      }}
                    >
                      <IconCalendar />
                      <p>
                        {weekDay[new Date(formState.fecha).getDay()] +
                          ", " +
                          getDateStrMes(formState.fecha)}
                      </p>
                    </div>
                    <hr
                      className={styles.areaSeparator}
                      style={{ margin: "12px 0px" }}
                    />
                    {formState.fecha && (
                      <div>
                        <p className={styles.sectionLabel}>
                          Duración de reserva
                        </p>
                        <p
                          style={{
                            color: !showMessage
                              ? "var(--cWhiteV1)"
                              : "var(--cError)",
                          }}
                        >
                          {!showMessage
                            ? "Sólo se permite 1 periodo por reserva"
                            : "Todos los periodos reservados"}
                        </p>

                        {allTimeSlots.length > 0 && (
                          <div className={styles.periodSelectionContainer}>
                            {allTimeSlots.map((slot) => {
                              const isSelected = selectedPeriods.includes(
                                slot.period
                              );
                              const isDisabled = !slot.isAvailable;

                              return (
                                <button
                                  type="button"
                                  key={slot.period}
                                  className={`${styles.periodButton} ${
                                    isSelected && slot.isAvailable
                                      ? styles.selectedPeriod
                                      : ""
                                  } ${
                                    !slot.isAvailable
                                      ? styles.unavailablePeriod
                                      : ""
                                  }`}
                                  onClick={() => {
                                    if (slot.isAvailable) {
                                      handlePeriodToggle(slot.period);
                                    }
                                  }}
                                  disabled={isDisabled}
                                >
                                  <Tooltip
                                    title={
                                      !slot.isAvailable
                                        ? "Período no disponible"
                                        : ""
                                    }
                                  >
                                    {slot?.period?.replace("-", " a ")}
                                  </Tooltip>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {errors.selectedPeriods && (
                          <span className={styles.errorText}>
                            {errors.selectedPeriods}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}

                <hr
                  className={styles.areaSeparator}
                  style={{ margin: "12px 0px" }}
                />
                <div style={{ display: "flex" }}>
                  <div className={styles.peopleLabelContainer}>
                    <p className={styles.sectionLabel}>Cantidad de personas</p>
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
                          handleQuantityChange(currentValue);
                        }}
                        min={1}
                        max={selectedAreaDetails?.max_capacity || undefined}
                        aria-label="Cantidad de personas"
                        styleInput={{
                          textAlign: "center",
                          paddingLeft: "0",
                          width: "30px",
                          paddingRight: "0",
                        }}
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
                <hr className={styles.areaSeparator} />
              </div>
            )}

            {currentStep === 3 && (
              <div className={`${styles.stepContent} ${styles.step3Content}`}>
                <h2 className={styles.summaryTitle}>Resumen de la reserva</h2>

                <div className={styles.summaryOwnerInfoContainer}>
                  <div className={styles.summaryOwnerInfo}>
                    <div className={styles.ownerIdentifier}>
                      <Avatar
                        src={getUrlImages(
                          `/OWNER-${
                            selectedUnit?.titular?.owner_id
                          }.webp?d=${Date.now().toString()}`
                        )}
                        name={getFullName(selectedUnit?.titular?.owner)}
                        w={40}
                        h={40}
                      />
                      <div className={styles.ownerText}>
                        <span className={styles.ownerName}>
                          {getFullName(selectedUnit?.titular?.owner)}
                        </span>
                        <span className={styles.ownerUnit}>
                          Unidad {selectedUnit?.nro}
                        </span>
                      </div>
                    </div>
                    <span className={styles.reservationStatus}>
                      Reserva: En proceso
                    </span>
                  </div>
                </div>
                <hr className={styles.areaSeparator} />

                <div className={styles.summaryContainer}>
                  {selectedAreaDetails ? (
                    <div className={styles.summaryContent}>
                      <div className={styles.summaryDetailsContainer}>
                        <div className={styles.summaryBookingDetails}>
                          <span className={styles.summaryDetailsTitle}>
                            Área social: {selectedAreaDetails?.title}
                          </span>
                          <div style={{ display: "flex", gap: 12 }}>
                            <div className={styles.summaryDetailItem}>
                              <span className={styles.detailIcon}>
                                <IconCalendar />
                              </span>
                              <span>
                                {getDateStrMes(formState.fecha) ||
                                  "Fecha no seleccionada"}
                              </span>
                            </div>

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

                            <div className={styles.summaryDetailItem}>
                              <span className={styles.detailIcon}>
                                <IconGroup />
                              </span>
                              <span>
                                {formState.cantidad_personas || 0} personas
                              </span>
                            </div>
                            <div className={styles.summaryDetailItem}>
                              <span className={styles.detailIcon}>
                                <IconMonedas />
                              </span>
                              {selectedAreaDetails.price != null ? (
                                <span className={styles.summaryPricePerUnit}>
                                  {formatBs(selectedAreaDetails.price)}
                                  /periodo
                                </span>
                              ) : (
                                <span className={styles.summaryPricePerUnit}>
                                  Gratis
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>No se pudo cargar el resumen.</p>
                  )}
                </div>
                <hr className={styles.areaSeparator} />
              </div>
            )}
            <div className={styles.formActions}>
              {currentStep === 1 && selectedAreaDetails && selectedUnit && (
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      color: "var(--cWhiteV1)",
                      fontSize: 16,
                    }}
                  >
                    Reserva por periodo
                  </p>
                  <span className={styles.priceInfoBottom}>
                    {selectedAreaDetails.is_free === "A"
                      ? "Gratis"
                      : `Bs ${formatNumber(selectedAreaDetails.price || 0)}`}
                  </span>
                </div>
              )}
              {currentStep !== 1 && <div style={{ flexGrow: 1 }}></div>}{" "}
              <div className={styles.actionButtonsContainer}>
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
                {currentStep === 1 && (
                  <Button
                    className={`${styles.button} ${styles.nextBtn}`}
                    onClick={nextStep}
                    disabled={
                      loadingCalendar ||
                      !selectedAreaDetails ||
                      !formState?.unidad
                    }
                  >
                    Continuar
                  </Button>
                )}
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
            </div>
          </div>
        </div>
        {selectedAreaDetails && (
          <DataModal
            open={isRulesModalVisible}
            onClose={() => setIsRulesModalVisible(false)}
            title={"Políticas"}
            buttonText=""
            buttonCancel=""
          >
            <div className={styles.rulesModalContent}>
              <p className={styles.title}>Políticas de uso</p>
              <p className={styles.subtitle}>
                {selectedAreaDetails?.usage_rules ||
                  "No hay reglas de uso especificadas para esta área."}
              </p>
              <hr
                className={styles.areaSeparator}
                style={{ margin: "12px 0px" }}
              />
              <p className={styles.title}>Políticas de reembolso</p>
              <p className={styles.subtitle}>
                {selectedAreaDetails?.cancellation_policy}
              </p>
            </div>
          </DataModal>
        )}
        {openComfirm && (
          <DataModal
            title="Volver a lista de reservas"
            open={openComfirm}
            onClose={() => setOpenComfirm(false)}
            onSave={() => onClose()}
            buttonText="Volver"
            buttonCancel="Continuar creación"
          >
            <p>
              ¿Seguro que quieres volver? Recuerda que si realizas esta acción,
              los cambios que has cargado en todos los pasos se eliminarán.
            </p>
          </DataModal>
        )}
      </div>
    </div>
  );
};

export default CreateReserva;
