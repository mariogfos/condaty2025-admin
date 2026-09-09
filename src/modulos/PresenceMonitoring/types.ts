export type PresenceProduct = "admin" | "resident" | "guard";
export type PresenceState = "active" | "recent";
export type Coordinate = [number, number];

export type PresenceConnection = {
  id: string;
  actor_id: string;
  name: string;
  product: PresenceProduct;
  role: string;
  scope_id: string;
  scope_name: string;
  device: string;
  os: string | null;
  last_seen_at: string;
  state: PresenceState;
  coordinates: Coordinate | null;
  located_by: "area" | "client" | null;
};

export type PresencePlace = {
  id: number;
  client_id: string;
  name: string;
  color: string;
  boundary: Coordinate[];
  center: Coordinate;
  created_at: string;
  updated_at: string;
};

export type PresenceScope = {
  id: string;
  name: string;
  has_place: boolean;
  coordinates: Coordinate | null;
};

export type PresenceTimelinePoint = {
  at: string;
  admin: number;
  resident: number;
  guard: number;
};

export type PresenceStats = {
  active_connections: number;
  recent_connections: number;
  active_users: number;
  active_guards: number;
  active_scopes: number;
  unlocated_connections: number;
};

export type PresenceOverview = {
  generated_at: string;
  active_window_minutes: number;
  connections: PresenceConnection[];
  places: PresencePlace[];
  scopes: PresenceScope[];
  timeline: PresenceTimelinePoint[];
  stats: PresenceStats;
  truncated: boolean;
};

export const productLabels: Record<PresenceProduct, string> = {
  admin: "Administración",
  resident: "Residentes",
  guard: "Guardias",
};
