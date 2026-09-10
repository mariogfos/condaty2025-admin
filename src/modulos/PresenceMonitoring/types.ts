export type PresenceProduct = "admin" | "resident" | "guard";
export type PresenceState = "active" | "recent" | "offline";
export type Coordinate = [number, number];

export type PresenceConnection = {
  id: string;
  installation_id: string | null;
  actor_id: string;
  name: string;
  product: PresenceProduct;
  role: string;
  scope_id: string;
  scope_name: string;
  device: string;
  platform: string | null;
  os: string | null;
  os_name: string | null;
  os_version: string | null;
  manufacturer: string | null;
  model: string | null;
  browser_name: string | null;
  browser_version: string | null;
  app_version: string | null;
  app_build: string | null;
  locale: string | null;
  timezone: string | null;
  last_seen_at: string;
  state: PresenceState;
  source: "instrumented" | "legacy";
  session_started_at: string | null;
  session_ended_at: string | null;
  active_seconds: number | null;
  session_count: number | null;
  end_reason: string | null;
  end_quality: "explicit" | "inferred" | null;
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
  known_connections: number;
  active_connections: number;
  recent_connections: number;
  offline_connections: number;
  active_users: number;
  active_guards: number;
  active_scopes: number;
  unlocated_connections: number;
};

export type PresenceOverview = {
  generated_at: string;
  active_window_minutes: number;
  recent_window_minutes: number;
  connections: PresenceConnection[];
  map_connections: PresenceConnection[];
  places: PresencePlace[];
  scopes: PresenceScope[];
  timeline: PresenceTimelinePoint[];
  stats: PresenceStats;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  truncated: boolean;
};

export type PresenceSessionRecord = {
  id: string;
  actor_name: string;
  role: string;
  scope_name: string;
  started_at: string;
  last_seen_at: string;
  ended_at: string | null;
  active_seconds: number;
  end_reason: string | null;
  end_quality: "explicit" | "inferred" | null;
  app_version: string | null;
  app_build: string | null;
  platform: string | null;
  os_name: string | null;
  os_version: string | null;
  manufacturer: string | null;
  model: string | null;
  browser_name: string | null;
  browser_version: string | null;
};

export const productLabels: Record<PresenceProduct, string> = {
  admin: "Administración",
  resident: "Residentes",
  guard: "Guardias",
};
