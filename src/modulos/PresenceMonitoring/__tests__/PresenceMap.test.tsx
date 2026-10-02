import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PresenceConnection, PresencePlace } from "../types";

const { mapInstance } = vi.hoisted(() => ({
  mapInstance: {
    addControl: vi.fn(),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    easeTo: vi.fn(),
    getContainer: vi.fn(() => ({ clientWidth: 1000, clientHeight: 700 })),
    getSource: vi.fn(),
    on: vi.fn(),
    queryRenderedFeatures: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn(function Map() { return mapInstance; }),
    NavigationControl: vi.fn(function NavigationControl() {}),
    AttributionControl: vi.fn(function AttributionControl() {}),
  },
}));

let PresenceMap: typeof import("../PresenceMap").default;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "test-map-token");
  PresenceMap = (await import("../PresenceMap")).default;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.clearAllMocks();
  mapInstance.getSource.mockReturnValue(undefined);
});

const connection = {
  id: "resident-1",
  name: "Residente",
  product: "resident",
  role: "Propietario",
  scope_name: "Condominio A",
  device: "iPhone",
  state: "active",
  last_seen_at: "2026-09-25T12:00:00Z",
  coordinates: [-63.18, -17.78],
} as PresenceConnection;

const place: PresencePlace = {
  id: 7,
  client_id: "client-7",
  name: "Condominio A",
  color: "#20e3ad",
  boundary: [[-63.19, -17.76], [-63.18, -17.76], [-63.18, -17.75], [-63.19, -17.76]],
  center: [-63.185, -17.755],
  created_at: "2026-09-25T12:00:00Z",
  updated_at: "2026-09-25T12:00:00Z",
};

describe("PresenceMap", () => {
  it("previsualiza, cancela y guarda el color del área desde el menú contextual", async () => {
    const placeSource = { setData: vi.fn() };
    mapInstance.getSource.mockReturnValue(placeSource);
    mapInstance.queryRenderedFeatures.mockImplementation((_point, options) => (
      options.layers.includes("presence-places-fill") ? [{ properties: { id: place.id } }] : []
    ));
    const onUpdatePlaceColor = vi.fn().mockResolvedValue(undefined);
    render(<PresenceMap
      connections={[]}
      selected={null}
      focusCoordinates={null}
      places={[place]}
      scopes={[]}
      onSelect={vi.fn()}
      onCreatePlace={vi.fn()}
      onUpdatePlace={vi.fn()}
      onUpdatePlaceColor={onUpdatePlaceColor}
      onDeletePlace={vi.fn()}
      onOpenHistory={vi.fn()}
    />);

    const onLoad = mapInstance.on.mock.calls.find(([event]) => event === "load")?.[1];
    expect(onLoad).toBeTypeOf("function");
    act(() => onLoad?.());
    const onContextMenu = mapInstance.on.mock.calls.find(([event]) => event === "contextmenu")?.[1];
    expect(onContextMenu).toBeTypeOf("function");
    const openColorPicker = () => {
      act(() => onContextMenu?.({
        originalEvent: { preventDefault: vi.fn() },
        point: { x: 450, y: 300 },
      }));
      fireEvent.click(screen.getByRole("menuitem", { name: /Cambiar color/ }));
    };

    openColorPicker();
    fireEvent.click(screen.getByRole("button", { name: /Violeta/ }));
    expect(screen.getByRole("button", { name: /Violeta/ })).toHaveAttribute("aria-pressed", "true");
    expect(placeSource.setData.mock.lastCall?.[0].features[0].properties.color).toBe("#a985ff");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(placeSource.setData.mock.lastCall?.[0].features[0].properties.color).toBe(place.color);
    expect(onUpdatePlaceColor).not.toHaveBeenCalled();

    openColorPicker();
    fireEvent.click(screen.getByRole("button", { name: /Violeta/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar color" }));
    await waitFor(() => expect(onUpdatePlaceColor).toHaveBeenCalledExactlyOnceWith(place.id, "#a985ff"));
    expect(mapInstance.easeTo).not.toHaveBeenCalled();
  });

  it("oculta solo el detalle de la conexión y conserva el mapa y sus controles", () => {
    const props = {
      connections: [connection],
      selected: connection,
      focusCoordinates: null,
      places: [],
      scopes: [],
      onSelect: vi.fn(),
      onCreatePlace: vi.fn(),
      onUpdatePlace: vi.fn(),
      onUpdatePlaceColor: vi.fn(),
      onDeletePlace: vi.fn(),
      onOpenHistory: vi.fn(),
    };
    const { rerender } = render(<PresenceMap {...props} showConnectionDetail />);

    expect(screen.getByRole("heading", { name: "Residente" })).toBeInTheDocument();
    rerender(<PresenceMap {...props} showConnectionDetail={false} />);

    expect(screen.queryByRole("heading", { name: "Residente" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Mapa de conexiones" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alternar mapa de calor" })).toBeInTheDocument();
    expect(mapInstance.remove).not.toHaveBeenCalled();
  });

  it("conserva la cámara al refrescar datos y solo enfoca por una selección explícita", () => {
    const props = {
      connections: [connection],
      selected: connection,
      focusCoordinates: null,
      places: [],
      scopes: [],
      onSelect: vi.fn(),
      onCreatePlace: vi.fn(),
      onUpdatePlace: vi.fn(),
      onUpdatePlaceColor: vi.fn(),
      onDeletePlace: vi.fn(),
      onOpenHistory: vi.fn(),
    };
    const { rerender } = render(<PresenceMap {...props} />);

    rerender(<PresenceMap {...props} selected={{ ...connection, last_seen_at: "2026-09-25T12:02:00Z" }} />);
    expect(mapInstance.easeTo).not.toHaveBeenCalled();

    const focusCoordinates: [number, number] = [-63.18, -17.78];
    rerender(<PresenceMap {...props} focusCoordinates={focusCoordinates} />);
    expect(mapInstance.easeTo).toHaveBeenCalledExactlyOnceWith({ center: focusCoordinates, duration: 500 });

    rerender(<PresenceMap {...props} selected={{ ...connection, last_seen_at: "2026-09-25T12:04:00Z" }} focusCoordinates={focusCoordinates} />);
    expect(mapInstance.easeTo).toHaveBeenCalledTimes(1);

    rerender(<PresenceMap {...props} focusCoordinates={[...focusCoordinates]} />);
    expect(mapInstance.easeTo).toHaveBeenCalledTimes(2);
  });
});
