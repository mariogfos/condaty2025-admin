import type { ReservationStatus } from "@/modulos/Reservas/constants/reservationConstants";

export type ReservationListItem = {
  id: number | string;
  area_id?: number | string | null;
  owner_id?: number | string | null;
  dpto_id?: number | string | null;
  debt_id?: number | string | null;
  debt_dpto_id?: number | string | null;
  status?: ReservationStatus | "X" | string;
  amount?: string | number | null;
  obs?: string | null;
  reason?: string | null;
  created_at?: string | null;
  date_at?: string | null;
  date_end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  people_count?: number | null;
  time_limit?: string | null;
  payment_id?: number | string | null;
  resolved_payment_id?: number | string | null;
  resolved_payment_status?: string | null;
  payment_status?: string | null;
  debt_status?: string | null;
  payment?: {
    status?: string | null;
  } | null;
  debt_dpto?: {
    id?: number | string | null;
    payment_id?: number | string | null;
    resolved_payment_id?: number | string | null;
    resolved_payment_status?: string | null;
    status?: string | null;
    payment?: {
      status?: string | null;
    } | null;
  } | null;
  periods?:
    | Array<{
        time_from?: string | null;
        time_to?: string | null;
      }>
    | null;
  area?: ReservationArea | null;
  owner?: ReservationResident | null;
  dpto?: ReservationUnit | null;
};

export type ReservationResidentDependent = {
  id?: number | string;
  owner_id?: number | string;
  owner?: ReservationResident | null;
};

export type ReservationResident = {
  id?: number | string;
  name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  mother_last_name?: string | null;
  url_avatar?: string | null;
  email?: string | null;
  dependientes?: ReservationResidentDependent[] | null;
};

export type ReservationUnit = {
  id: number | string;
  nro?: string | null;
  description?: string | null;
  type_id?: number | string | null;
  type?: {
    id?: number | string;
    name?: string | null;
    description?: string | null;
  } | null;
  defaulter?: string | null;
  homeowner?: ReservationResident | null;
  tenant?: ReservationResident | null;
  titular?: {
    id?: number | string;
    owner_id?: number | string;
    owner?: ReservationResident | null;
  } | null;
};

export type ReservationArea = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  max_capacity?: number | null;
  available_days?: string[] | null;
  available_hours?: Record<string, string[]> | null;
  price?: string | number | null;
  is_free?: string | null;
  booking_mode?: string | null;
  max_reservations_per_day?: number | null;
  max_booking_duration?: number | null;
  usage_rules?: string | null;
  special_restrictions?: string | null;
  cancellation_policy?: string | null;
  penalty_or_debt_restriction?: string | null;
  requires_approval?: string | null;
  show_real_time_availability?: string | null;
  show_in_calendar?: string | null;
  images?: string[] | null;
};

export type ReservationExtraData = {
  areas?: ReservationArea[];
  dptos?: ReservationUnit[];
};

export type ReservationVisibleRange = {
  start: Date;
  end: Date;
};
