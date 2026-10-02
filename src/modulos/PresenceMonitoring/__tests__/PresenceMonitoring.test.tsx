import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Coordinate, PresenceConnection, PresenceOverview } from "../types";
import PresenceMonitoring from "../PresenceMonitoring";

type MockMapProps = {
  selected: PresenceConnection | null;
  focusCoordinates: Coordinate | null;
  showConnectionDetail: boolean;
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
  time_zone: "America/La_Paz",
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
  // 🔴 Una zona que no es la de Bolivia: con La Paz en el sobre, un rótulo
  // escrito a mano con "America/La_Paz" coincidiría por azar.
  it("rotula la línea de tiempo en la zona que dice el API, no en una escrita a mano", async () => {
    executeMock.mockImplementation(async () => ({
      data: {
        success: true,
        data: {
          ...overview,
          time_zone: "Asia/Tokyo",
          timeline: [{ at: "2026-09-25T12:00:00Z", admin: 1, resident: 0, guard: 0 }],
        },
      },
      error: null,
    }));
    render(<PresenceMonitoring />);

    const timeline = await screen.findByRole("region", { name: "Historial agregado de conexiones" });
    await waitFor(() => expect(timeline.textContent).toContain("21"));
    expect(timeline.textContent).not.toContain("08");
  });

  it("despeja los paneles sin desmontar ni recentrar el mapa y permite restaurarlos", async () => {
    render(<PresenceMonitoring />);
    await waitFor(() => expect(mapPropsRef.current?.selected?.id).toBe(connection.id));

    const map = screen.getByTestId("presence-map");
    expect(screen.getByRole("heading", { name: "Dispositivos y sesiones" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resumen de actividad" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Historial agregado de conexiones" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ocultar paneles del monitoreo" }));

    expect(screen.getByTestId("presence-map")).toBe(map);
    expect(screen.queryByRole("heading", { name: "Dispositivos y sesiones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Resumen de actividad" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Historial agregado de conexiones" })).not.toBeInTheDocument();
    expect(mapPropsRef.current?.showConnectionDetail).toBe(false);
    expect(mapPropsRef.current?.focusCoordinates).toBeNull();
    expect(executeMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar paneles" }));

    expect(screen.getByTestId("presence-map")).toBe(map);
    expect(screen.getByRole("heading", { name: "Dispositivos y sesiones" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resumen de actividad" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Historial agregado de conexiones" })).toBeInTheDocument();
    expect(mapPropsRef.current?.showConnectionDetail).toBe(true);
    expect(mapPropsRef.current?.focusCoordinates).toBeNull();
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

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
