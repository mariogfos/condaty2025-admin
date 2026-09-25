import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Coordinate, PresenceConnection, PresenceOverview } from "../types";
import PresenceMonitoring from "../PresenceMonitoring";

type MockMapProps = {
  selected: PresenceConnection | null;
  focusCoordinates: Coordinate | null;
  onSelect: (connection: PresenceConnection | null) => void;
};

const { executeMock, mapPropsRef, setStoreMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  mapPropsRef: { current: null as MockMapProps | null },
  setStoreMock: vi.fn(),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { fosrole_id: 1 }, setStore: setStoreMock, showToast: vi.fn() }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock }),
}));

vi.mock("../PresenceMap", () => ({
  default: (props: MockMapProps) => {
    mapPropsRef.current = props;
    return <div data-testid="presence-map" />;
  },
}));

const connection = {
  id: "resident-1",
  name: "Residente",
  product: "resident",
  role: "Propietario",
  scope_name: "Condominio A",
  device: "iPhone",
  state: "active",
  last_seen_at: "2026-09-25T12:00:00Z",
  source: "instrumented",
  coordinates: [-63.18, -17.78],
} as PresenceConnection;

const overview: PresenceOverview = {
  generated_at: "2026-09-25T12:00:00Z",
  active_window_minutes: 5,
  recent_window_minutes: 15,
  connections: [connection],
  map_connections: [connection],
  places: [],
  scopes: [],
  timeline: [],
  stats: {
    known_connections: 1,
    active_connections: 1,
    recent_connections: 0,
    offline_connections: 0,
    active_users: 1,
    active_guards: 0,
    active_scopes: 1,
    unlocated_connections: 0,
  },
  pagination: { page: 1, per_page: 50, total: 1, last_page: 1 },
  truncated: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mapPropsRef.current = null;
  executeMock.mockImplementation(async () => ({
    data: { success: true, data: { ...overview, connections: [{ ...connection }] } },
    error: null,
  }));
});

describe("PresenceMonitoring", () => {
  it("solo solicita centrar el mapa al pulsar la card de un usuario", async () => {
    render(<PresenceMonitoring />);
    await waitFor(() => expect(mapPropsRef.current?.selected?.id).toBe(connection.id));
    expect(mapPropsRef.current?.focusCoordinates).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Días" }));
    await waitFor(() => expect(executeMock).toHaveBeenCalledWith(
      "/backoffice/presence-monitoring/overview",
      "GET",
      expect.objectContaining({ range: "days" }),
      false,
      true,
    ));
    expect(mapPropsRef.current?.focusCoordinates).toBeNull();

    act(() => mapPropsRef.current?.onSelect(connection));
    expect(mapPropsRef.current?.focusCoordinates).toBeNull();

    fireEvent.click(screen.getByText("Residente").closest("button")!);
    expect(mapPropsRef.current?.focusCoordinates).toEqual(connection.coordinates);
    const requestedFocus = mapPropsRef.current?.focusCoordinates;

    fireEvent.click(screen.getByRole("button", { name: "Actualizar conexiones" }));
    await waitFor(() => expect(executeMock).toHaveBeenCalledTimes(3));
    expect(mapPropsRef.current?.focusCoordinates).toBe(requestedFocus);
  });
});
