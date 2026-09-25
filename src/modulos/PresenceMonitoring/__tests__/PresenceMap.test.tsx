import { render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PresenceConnection } from "../types";

const { mapInstance } = vi.hoisted(() => ({
  mapInstance: {
    addControl: vi.fn(),
    easeTo: vi.fn(),
    getSource: vi.fn(),
    on: vi.fn(),
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

describe("PresenceMap", () => {
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
