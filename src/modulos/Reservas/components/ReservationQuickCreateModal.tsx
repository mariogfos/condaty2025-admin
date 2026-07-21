"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getUrlImages } from "@/mk/utils/string";
import type {
  ReservationArea,
  ReservationExtraData,
  ReservationUnit,
} from "@/modulos/Reservas/types";
import {
  buildReservationUnitChoices,
  getReservationUnitDisplayLabel,
  getReservationUnitOwnerId,
  type ReservationUnitChoice,
} from "@/modulos/Reservas/utils/reservationUnits";
import {
  buildAreaAvailabilitySnapshot,
  extractDayAvailabilityFromCalendarResponse,
  getAreaName,
  getResidentName,
  type ReservationCalendarDayAvailability,
} from "@/modulos/Calendar/helpers";
import styles from "@/modulos/Calendar/CalendarPage.module.css";

type ReservationQuickCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type ReservationDraft = {
  areaId: string;
  unitOptionId: string;
  date: string;
  slot: string;
  note: string;
};

const getTodayKey = () => format(new Date(), "yyyy-MM-dd");

const emptyDraft = (): ReservationDraft => ({
  areaId: "",
  unitOptionId: "",
  date: getTodayKey(),
  slot: "",
  note: "",
});

const getAreaAvatarSrc = (area?: ReservationArea | null) => {
  const raw = area?.images?.[0];
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return getUrlImages(raw.startsWith("/") ? raw : `/${raw}`);
};

const unwrapReservationCalendarPayload = (payload: unknown) => {
  const root =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, any>)
      : {};
  const nestedData =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, any>)
      : {};

  return Object.keys(nestedData).length > 0 &&
    !root.days &&
    !root.available &&
    !root.unavailable
    ? nestedData
    : root;
};

const formatReservationSlotForApi = (slot: string) => {
  const normalized = slot.trim();
  if (!normalized) return "";

  const dayLabels = new Set(["todo el dia", "todo el día"]);
  if (dayLabels.has(normalized.toLowerCase())) return "00:00-23:59";

  return normalized.replace(/\s*-\s*/, "-");
};

const ReservationQuickCreateModal = ({
  open,
  onClose,
  onCreated,
}: ReservationQuickCreateModalProps) => {
  const { contextInstance } = useContext(AxiosContext);
  const { showToast } = useAuth();
  const [areas, setAreas] = useState<ReservationArea[]>([]);
  const [units, setUnits] = useState<ReservationUnit[]>([]);
  const [draft, setDraft] = useState<ReservationDraft>(() => emptyDraft());
  const [step, setStep] = useState(0);
  const [loadingExtraData, setLoadingExtraData] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [liveAvailability, setLiveAvailability] =
    useState<ReservationCalendarDayAvailability | null>(null);
  const [liveCanBook, setLiveCanBook] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const availabilityRequestRef = useRef(0);

  const selectedDate = useMemo(() => {
    const date = new Date(`${draft.date}T00:00:00`);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }, [draft.date]);

  const areaChoices = useMemo(
    () =>
      [...areas]
        .sort((left, right) =>
          getAreaName(left).localeCompare(getAreaName(right), "es"),
        )
        .map((area) => buildAreaAvailabilitySnapshot(area, selectedDate)),
    [areas, selectedDate],
  );

  const unitOptions = useMemo<ReservationUnitChoice[]>(
    () => buildReservationUnitChoices(units),
    [units],
  );

  const selectedAreaChoice = useMemo(
    () => areaChoices.find((choice) => choice.areaId === draft.areaId) || null,
    [areaChoices, draft.areaId],
  );

  const selectedArea = useMemo(
    () => areas.find((area) => String(area.id) === draft.areaId) || null,
    [areas, draft.areaId],
  );

  const selectedUnitChoice = useMemo(
    () => unitOptions.find((option) => option.id === draft.unitOptionId) || null,
    [draft.unitOptionId, unitOptions],
  );

  const selectedUnit = selectedUnitChoice?.unit || null;
  const selectedOwnerId = String(getReservationUnitOwnerId(selectedUnit) || "");

  const selectedAvailability = useMemo(() => {
    if (!selectedArea) return null;
    return buildAreaAvailabilitySnapshot(
      selectedArea,
      selectedDate,
      liveAvailability || undefined,
    );
  }, [liveAvailability, selectedArea, selectedDate]);

  const effectiveSlot =
    draft.slot ||
    selectedAvailability?.slots[0] ||
    (selectedAvailability?.bookingMode === "day" ? "Todo el dia" : "");

  const canContinue = Boolean(
    selectedAreaChoice &&
      selectedAreaChoice.isAvailable &&
      selectedUnitChoice &&
      selectedOwnerId &&
      selectedAvailability?.isAvailable &&
      effectiveSlot &&
      liveCanBook !== false &&
      !availabilityLoading,
  );

  const priceLabel =
    selectedArea?.is_free === "A" || Number(selectedArea?.price || 0) <= 0
      ? "Gratis"
      : `Bs ${Number(selectedArea?.price || 0)}`;

  useEffect(() => {
    if (!open) return;

    setDraft(emptyDraft());
    setStep(0);
    setAvailabilityMessage("");
    setLiveAvailability(null);
    setLiveCanBook(null);
  }, [open]);

  useEffect(() => {
    if (!open || !contextInstance) return;

    let cancelled = false;

    const loadExtraData = async () => {
      setLoadingExtraData(true);

      try {
        const response = await contextInstance.request({
          method: "GET",
          url: "/reservations",
          params: {
            fullType: "EXTRA",
            page: 1,
            perPage: -1,
          },
        });
        const extraData = (response?.data?.data || {}) as ReservationExtraData;

        if (cancelled) return;

        setAreas(Array.isArray(extraData.areas) ? extraData.areas : []);
        setUnits(Array.isArray(extraData.dptos) ? extraData.dptos : []);
      } catch (_error) {
        if (cancelled) return;
        setAreas([]);
        setUnits([]);
        showToast("No pudimos cargar las áreas para crear la reserva", "error");
      } finally {
        if (!cancelled) setLoadingExtraData(false);
      }
    };

    void loadExtraData();

    return () => {
      cancelled = true;
    };
  }, [contextInstance, open, showToast]);

  useEffect(() => {
    if (!selectedAreaChoice) return;

    setDraft((current) => {
      if (current.areaId !== selectedAreaChoice.areaId) return current;

      const nextSlot =
        selectedAreaChoice.slots[0] ||
        (selectedAreaChoice.bookingMode === "day" ? "Todo el dia" : "");

      return current.slot === nextSlot ? current : { ...current, slot: nextSlot };
    });
  }, [selectedAreaChoice]);

  useEffect(() => {
    if (!open || !contextInstance || !draft.areaId || !draft.unitOptionId) {
      setAvailabilityLoading(false);
      setAvailabilityMessage("");
      setLiveAvailability(null);
      setLiveCanBook(null);
      return;
    }

    if (!selectedOwnerId) {
      setAvailabilityLoading(false);
      setLiveAvailability(null);
      setLiveCanBook(false);
      setAvailabilityMessage(
        "La unidad elegida no tiene un titular configurado para crear la reserva.",
      );
      return;
    }

    const requestId = availabilityRequestRef.current + 1;
    availabilityRequestRef.current = requestId;
    let cancelled = false;

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityMessage("");
      setLiveAvailability(null);
      setLiveCanBook(null);

      try {
        const response = await contextInstance.request({
          method: "GET",
          url: "/reservations-calendar",
          params: {
            area_id: draft.areaId,
            date_at: draft.date,
            owner_id: selectedOwnerId,
          },
        });

        if (cancelled || availabilityRequestRef.current !== requestId) return;

        const payload = response?.data?.data ?? response?.data;
        const root = unwrapReservationCalendarPayload(payload);
        const availability = extractDayAvailabilityFromCalendarResponse(
          payload,
          selectedDate,
        );

        setLiveAvailability(availability);
        setLiveCanBook(
          typeof root.reservations === "boolean" ? root.reservations : null,
        );
        setAvailabilityMessage(
          typeof root.message === "string" ? root.message : "",
        );
      } catch (error: any) {
        if (cancelled || availabilityRequestRef.current !== requestId) return;

        setLiveAvailability(null);
        setLiveCanBook(null);
        setAvailabilityMessage(
          error?.response?.data?.message ||
            error?.message ||
            "No pudimos cargar la disponibilidad.",
        );
      } finally {
        if (!cancelled && availabilityRequestRef.current === requestId) {
          setAvailabilityLoading(false);
        }
      }
    };

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [
    contextInstance,
    draft.areaId,
    draft.date,
    draft.unitOptionId,
    open,
    selectedDate,
    selectedOwnerId,
  ]);

  useEffect(() => {
    if (!selectedAvailability) return;

    setDraft((current) => {
      const nextSlot =
        selectedAvailability.slots[0] ||
        (selectedAvailability.bookingMode === "day" ? "Todo el dia" : "");

      if (current.slot && selectedAvailability.slots.includes(current.slot)) {
        return current;
      }

      return current.slot === nextSlot ? current : { ...current, slot: nextSlot };
    });
  }, [selectedAvailability]);

  const handleAreaSelect = useCallback((areaId: string) => {
    setDraft((current) => ({
      ...current,
      areaId,
      slot: "",
    }));
  }, []);

  const handleDraftChange = useCallback(
    (event: { target: { name: string; value: string } }) => {
      const { name, value } = event.target;

      setDraft((current) => ({
        ...current,
        [name]: value,
        ...(name === "date" || name === "areaId" ? { slot: "" } : {}),
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!contextInstance || !selectedArea || !selectedUnitChoice || !selectedUnit) {
      return;
    }

    if (!canContinue) {
      showToast("Completa la selección del área, unidad y turno.", "warning");
      return;
    }

    const selectedResidentName = selectedUnitChoice.resident
      ? `${getResidentName(selectedUnitChoice.resident)} · ${selectedUnitChoice.roleLabel}`
      : selectedUnitChoice.roleLabel || "Responsable";
    const baseNote = draft.note.trim() || `Reserva de ${getAreaName(selectedArea)}`;
    const obs = selectedResidentName
      ? `${baseNote} · Responsable: ${selectedResidentName}`
      : baseNote;
    const payload: Record<string, any> = {
      area_id: draft.areaId,
      owner_id: selectedOwnerId,
      date_at: draft.date,
      people_count: Math.max(1, Number(selectedArea.max_capacity || 1)),
      amount: Number(selectedArea.price || 0),
      obs,
      dpto_id: selectedUnit.id,
    };

    if (effectiveSlot) {
      const period = formatReservationSlotForApi(effectiveSlot);
      payload.start_time = period.split("-")[0];
      payload.periods = [period];
    }

    setSubmitting(true);

    try {
      const response = await contextInstance.request({
        method: "POST",
        url: "/reservations",
        data: payload,
      });

      if (response?.data?.success) {
        showToast(response?.data?.message || "Reserva creada exitosamente", "success");
        onCreated?.();
        onClose();
        return;
      }

      showToast(response?.data?.message || "No se pudo crear la reserva", "error");
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          "Ocurrió un error inesperado al crear la reserva.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    canContinue,
    contextInstance,
    draft.areaId,
    draft.date,
    draft.note,
    effectiveSlot,
    onClose,
    onCreated,
    selectedArea,
    selectedOwnerId,
    selectedUnit,
    selectedUnitChoice,
    showToast,
  ]);

  const dayLabel = useMemo(
    () => format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es }),
    [selectedDate],
  );

  const statusNotice = !draft.unitOptionId
    ? "Selecciona una unidad para validar disponibilidad."
    : !selectedOwnerId
      ? "La unidad elegida no tiene un titular configurado para crear la reserva."
      : availabilityLoading
        ? "Validando disponibilidad..."
        : liveCanBook === false || selectedAvailability?.isAvailable === false
          ? availabilityMessage ||
            selectedAvailability?.note ||
            "No disponible para esta selección."
          : availabilityMessage;

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={step === 0 ? "Nueva reserva" : "Confirmación"}
      buttonText=""
      buttonCancel=""
      variant="mini"
      maxWidth={760}
      className="contScrollable"
    >
      <div className={styles.flowModalBody}>
        {step === 0 ? (
          <div className={styles.flowContent}>
            <div className={styles.flowSection}>
              <div className={styles.sectionHeading}>
                <h4 className={styles.sectionTitle}>Áreas sociales</h4>
                <p className={styles.sectionDescription}>
                  Selecciona el área que se reservará.
                </p>
              </div>

              {loadingExtraData ? (
                <div className={styles.inlineNotice}>Cargando datos...</div>
              ) : (
                <div className={styles.areaChoiceGrid}>
                  {areaChoices.map((choice) => {
                    const area = areas.find(
                      (candidate) => String(candidate.id) === choice.areaId,
                    );
                    const isSelected = draft.areaId === choice.areaId;

                    return (
                      <button
                        key={choice.areaId}
                        type="button"
                        className={[
                          styles.areaChoiceCard,
                          isSelected ? styles.areaChoiceCardSelected : "",
                          !choice.isAvailable ? styles.areaChoiceCardDisabled : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => handleAreaSelect(choice.areaId)}
                        disabled={!choice.isAvailable}
                      >
                        <div className={styles.areaChoiceTop}>
                          <Avatar
                            name={choice.areaName}
                            src={getAreaAvatarSrc(area)}
                            w={42}
                            h={42}
                            square={false}
                          />
                          <div className={styles.areaChoiceText}>
                            <p className={styles.areaChoiceTitle}>
                              {choice.areaName}
                            </p>
                            <p className={styles.areaChoiceMeta}>
                              {choice.isAvailable
                                ? choice.bookingMode === "day"
                                  ? "Disponible"
                                  : "Turnos disponibles"
                                : choice.note || "No disponible"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.flowSection}>
              <div className={styles.sectionHeading}>
                <h4 className={styles.sectionTitle}>Datos de la reserva</h4>
              </div>

              <div className={styles.modalFieldGrid}>
                <Input
                  type="date"
                  name="date"
                  label="Fecha"
                  value={draft.date}
                  min={getTodayKey()}
                  onChange={handleDraftChange}
                  className={styles.modalDateField}
                />
                <Select
                  name="unitOptionId"
                  label="Unidad"
                  value={draft.unitOptionId}
                  options={unitOptions}
                  onChange={handleDraftChange}
                  filter
                  placeholder="Selecciona una unidad"
                />
              </div>

              {statusNotice ? (
                <div className={styles.inlineNotice}>{statusNotice}</div>
              ) : null}
            </div>

            {selectedAvailability?.isAvailable ? (
              <div className={styles.flowSection}>
                <div className={styles.sectionHeading}>
                  <h4 className={styles.sectionTitle}>Turnos disponibles</h4>
                </div>

                {selectedAvailability.slots.length > 0 ? (
                  <div className={styles.slotGrid}>
                    {selectedAvailability.slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={[
                          styles.slotChip,
                          draft.slot === slot ? styles.slotChipSelected : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() =>
                          setDraft((current) => ({ ...current, slot }))
                        }
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.inlineNotice}>
                    {availabilityMessage || "Sin turnos disponibles."}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.flowContent}>
            <div className={styles.flowSection}>
              <div className={styles.sectionHeading}>
                <h4 className={styles.sectionTitle}>Revisa la reserva</h4>
              </div>

              <div className={styles.reviewTable}>
                {[
                  ["Área social", selectedArea ? getAreaName(selectedArea) : "Sin área"],
                  ["Fecha", dayLabel],
                  [
                    "Unidad",
                    selectedUnit
                      ? getReservationUnitDisplayLabel(selectedUnit)
                      : "Sin unidad",
                  ],
                  [
                    "Responsable",
                    selectedUnitChoice?.resident
                      ? `${getResidentName(selectedUnitChoice.resident)} · ${selectedUnitChoice.roleLabel}`
                      : selectedUnitChoice?.roleLabel || "Sin responsable",
                  ],
                  ["Turno", effectiveSlot || "Sin turno"],
                  ["Costo", priceLabel],
                ].map(([label, value]) => (
                  <div className={styles.reviewRow} key={label}>
                    <span className={styles.reviewKey}>{label}</span>
                    <strong className={styles.reviewValue}>{value}</strong>
                  </div>
                ))}
              </div>

              <TextArea
                name="note"
                label="Observación"
                value={draft.note}
                onChange={handleDraftChange}
                placeholder="Agrega una observación opcional"
                required={false}
              />
            </div>
          </div>
        )}

        <div className={styles.flowFooter}>
          <p className={styles.flowFooterHint}>
            {step === 0
              ? "Valida área, fecha, unidad y turno antes de continuar."
              : "Se creará la reserva con los datos seleccionados."}
          </p>
          <div className={styles.flowFooterActions}>
            {step > 0 ? (
              <Button
                variant="secondary"
                onClick={() => setStep(0)}
                disabled={submitting}
              >
                Volver
              </Button>
            ) : null}
            <Button
              variant="primary"
              onClick={() => {
                if (step === 0) {
                  setStep(1);
                  return;
                }
                void handleSubmit();
              }}
              disabled={step === 0 ? !canContinue : submitting}
            >
              {step === 0
                ? "Continuar"
                : submitting
                  ? "Reservando..."
                  : "Reservar"}
            </Button>
          </div>
        </div>
      </div>
    </DataModal>
  );
};

export default ReservationQuickCreateModal;
