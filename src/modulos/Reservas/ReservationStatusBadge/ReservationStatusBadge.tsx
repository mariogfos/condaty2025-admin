"use client";
import { useContext, useEffect, useState } from "react";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import {
  RESERVATION_STATUS_CONFIG,
  RESERVATIONS_COPY,
} from "../config/reservas.constants";
import type { ReservationListItem } from "../Type/ReservaType";
import { resolveReservationDisplayStatus } from "../utils/reservationStatus";
import {
  fetchResolvedPaymentForReservation,
  getReservationDisplayStatusInput,
  shouldFetchReservationResolvedPayment,
  type ResolvedReservationPayment,
} from "../utils/reservationPayment";

type ReservationStatusBadgeProps = {
  item: ReservationListItem;
};

/**
 * El estado que se VE de una reserva, que no siempre es el de la columna.
 *
 * Cuando la fila está en "Pago pendiente" el estado real depende del pago, y
 * el listado no siempre lo trae: en ese caso —y sólo en ése— se pide el pago
 * resuelto de la deuda. Ver `shouldFetchReservationResolvedPayment`.
 */
const ReservationStatusBadge = ({ item }: ReservationStatusBadgeProps) => {
  const { contextInstance } = useContext(AxiosContext);
  const [resolvedPayment, setResolvedPayment] =
    useState<ResolvedReservationPayment | null>(null);

  useEffect(() => {
    setResolvedPayment(null);

    if (!contextInstance || !shouldFetchReservationResolvedPayment(item)) return;

    let cancelled = false;

    const loadResolvedPayment = async () => {
      const payment = await fetchResolvedPaymentForReservation(
        contextInstance,
        item,
      );

      if (!cancelled) {
        setResolvedPayment(payment);
      }
    };

    void loadResolvedPayment();

    return () => {
      cancelled = true;
    };
  }, [contextInstance, item]);

  const status = resolveReservationDisplayStatus(
    getReservationDisplayStatusInput(item, resolvedPayment),
  );
  const currentStatus =
    status !== undefined ? RESERVATION_STATUS_CONFIG[status] : null;

  return (
    <StatusBadge
      backgroundColor={
        currentStatus ? currentStatus.backgroundColor : "var(--cHoverLight)"
      }
      color={currentStatus ? currentStatus.color : "var(--cLightDark)"}
    >
      {currentStatus ? currentStatus.label : RESERVATIONS_COPY.unknownStatus}
    </StatusBadge>
  );
};

export default ReservationStatusBadge;
