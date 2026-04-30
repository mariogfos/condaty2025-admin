import type { ReservationStatus } from "@/modulos/Reservas/constants/reservationConstants";

export type ReservationListItem = {
  id: number | string;
  status?: ReservationStatus | "X" | string;
  amount?: string | number | null;
  obs?: string | null;
  created_at?: string | null;
  date_at?: string | null;
  date_end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  people_count?: number | null;
  periods?:
    | Array<{
        time_from?: string | null;
        time_to?: string | null;
      }>
    | null;
  area?: NewReservaArea | null;
  owner?: NewReservaResident | null;
  dpto?: NewReservaUnit | null;
};

export type NewReservaResident = {
  id?: number | string;
  name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  mother_last_name?: string | null;
  url_avatar?: string | null;
  email?: string | null;
};

export type NewReservaUnit = {
  id: number | string;
  nro?: string | null;
  defaulter?: string | null;
  homeowner?: NewReservaResident | null;
  tenant?: NewReservaResident | null;
  titular?: {
    id?: number | string;
    owner_id?: number | string;
    owner?: NewReservaResident | null;
  } | null;
};

export type NewReservaArea = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  max_capacity?: number | null;
  available_days?: string[] | null;
  price?: string | number | null;
  is_free?: string | null;
  booking_mode?: string | null;
  max_booking_duration?: number | null;
  usage_rules?: string | null;
  special_restrictions?: string | null;
  cancellation_policy?: string | null;
  penalty_or_debt_restriction?: string | null;
  requires_approval?: string | null;
  show_real_time_availability?: string | null;
  images?: string[] | null;
};

export type NewReservaExtraData = {
  areas?: NewReservaArea[];
  dptos?: NewReservaUnit[];
};

export type ReservationCalendarKey =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "maintenance";

export type ReservationVisibleRange = {
  start: Date;
  end: Date;
};

export type ReservationCalendarMeta = {
  reservation: ReservationListItem;
  areaName: string;
  residentName: string;
  unitLabel: string;
  statusKey: ReservationCalendarKey;
  statusLabel: string;
  dateKey: string;
  searchText: string;
};
