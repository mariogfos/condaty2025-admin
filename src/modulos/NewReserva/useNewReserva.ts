"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type Event as DayFlowEvent } from "@dayflow/core";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { useAuth } from "@/mk/contexts/AuthProvider";
import type { ReservationListItem, ReservationVisibleRange } from "./types";
import {
  buildVisibleRangeSegments,
  dedupeReservationsById,
  formatDateKey,
  mapReservationsToCalendarEvents,
} from "./helpers";

export const useNewReserva = () => {
  const { contextInstance } = useContext(AxiosContext);
  const { showToast, userCan } = useAuth();

  const [visibleRange, setVisibleRange] = useState<ReservationVisibleRange | null>(
    null,
  );
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(
    null,
  );
  const [detailItem, setDetailItem] = useState<ReservationListItem | null>(null);

  const requestRangeRef = useRef("");

  const loadReservations = useCallback(
    async (range: ReservationVisibleRange) => {
      if (!contextInstance) return;

      const rangeKey = `${formatDateKey(range.start)}:${formatDateKey(range.end)}`;
      requestRangeRef.current = rangeKey;
      setLoading(true);

      try {
        const responses = await Promise.all(
          buildVisibleRangeSegments(range.start, range.end).map((segment) =>
            contextInstance.request({
              method: "GET",
              url: "/reservations",
              params: {
                fullType: "L",
                page: 1,
                perPage: 1000,
                filterBy: `date_at:${formatDateKey(segment.start)},${formatDateKey(
                  segment.end,
                )}`,
              },
            }),
          ),
        );

        if (requestRangeRef.current !== rangeKey) return;

        const merged = dedupeReservationsById(
          responses.flatMap((response) =>
            Array.isArray(response?.data?.data) ? response.data.data : [],
          ),
        );

        setReservations(merged);
        setSelectedReservationId((previous) =>
          previous && merged.some((item) => String(item.id) === previous)
            ? previous
            : null,
        );
      } catch (_error) {
        if (requestRangeRef.current !== rangeKey) return;
        setReservations([]);
        setSelectedReservationId(null);
        showToast("No pudimos cargar las reservas del calendario", "error");
      } finally {
        if (requestRangeRef.current === rangeKey) {
          setLoading(false);
        }
      }
    },
    [contextInstance, showToast],
  );

  useEffect(() => {
    if (!visibleRange) return;
    void loadReservations(visibleRange);
  }, [loadReservations, visibleRange]);

  const handleVisibleRangeChange = useCallback((start: Date, end: Date) => {
    setVisibleRange((previous) => {
      const nextKey = `${formatDateKey(start)}:${formatDateKey(end)}`;
      if (!previous) {
        return { start, end };
      }

      const previousKey = `${formatDateKey(previous.start)}:${formatDateKey(
        previous.end,
      )}`;

      return previousKey === nextKey ? previous : { start, end };
    });
  }, []);

  const calendarEvents = useMemo<DayFlowEvent[]>(
    () => mapReservationsToCalendarEvents(reservations),
    [reservations],
  );

  const selectedReservation = useMemo(
    () =>
      reservations.find(
        (reservation) => String(reservation.id) === selectedReservationId,
      ) || null,
    [reservations, selectedReservationId],
  );

  const selectReservationById = useCallback((reservationId?: string | number | null) => {
    setSelectedReservationId(reservationId ? String(reservationId) : null);
  }, []);

  const selectReservation = useCallback(
    (reservation: ReservationListItem) => {
      selectReservationById(reservation.id);
    },
    [selectReservationById],
  );

  const openReservationDetail = useCallback(
    (reservation: ReservationListItem) => {
      selectReservation(reservation);
      setDetailItem(reservation);
    },
    [selectReservation],
  );

  const reloadCurrentRange = useCallback(() => {
    if (!visibleRange) return;
    void loadReservations(visibleRange);
  }, [loadReservations, visibleRange]);

  return {
    canView: userCan("reservations", "R"),
    canCreate: userCan("reservations", "C"),
    loading,
    calendarEvents,
    selectedReservation,
    selectedReservationId,
    detailItem,
    setDetailItem,
    handleVisibleRangeChange,
    selectReservation,
    selectReservationById,
    openReservationDetail,
    reloadCurrentRange,
  };
};
