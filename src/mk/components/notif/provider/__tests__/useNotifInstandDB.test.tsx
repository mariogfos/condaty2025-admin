import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseQuery = vi.fn();
const mockQueryOnce = vi.fn(async () => ({ data: { notif: [] } }));
const mockTransact = vi.fn();
const mockDispatch = vi.fn();
const mockRegistryHandler = vi.fn();

const mockDb = {
  useQuery: mockUseQuery,
  queryOnce: mockQueryOnce,
  transact: mockTransact,
  tx: {
    notif: new Proxy(
      {},
      {
        get: () => ({
          delete: vi.fn(),
          update: vi.fn((data) => data),
        }),
      },
    ),
  },
};

vi.mock("@instantdb/react", () => ({
  id: vi.fn(() => "notif-id"),
  init: vi.fn(() => mockDb),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "admin-1",
      client_id: "client-1",
      role: { code: "admin" },
    },
  })),
}));

vi.mock("@/mk/hooks/useEvents", () => ({
  useEvent: vi.fn(() => ({
    dispatch: mockDispatch,
  })),
}));

vi.mock("@/mk/notif/notifRegistry", () => ({
  MODULE_REGISTRY: [
    {
      moduleId: "assemblies",
      events: {
        "assembly-status-change": (args: any) => mockRegistryHandler(args),
      },
    },
  ],
}));

describe("useNotifInstandDB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem("lastNotifInstantDB", "0");

    mockUseQuery.mockReturnValue({
      data: {
        notif: [
          {
            id: "notif-1",
            channel: "dev-client-1-all",
            event: "assembly-status-change",
            created_at: 123456,
            payload: JSON.stringify({
              id: 77,
              subject: "pruebas",
              status: "P",
            }),
          },
        ],
      },
    });
  });

  it("processes the same realtime notification only once across duplicated subscriptions", async () => {
    mockRegistryHandler.mockImplementation(({ showToast }) => {
      showToast("▶️ pruebas en progreso", "info");
    });

    const { default: useNotifInstandDB } = await import("../useNotifInstandDB");
    const showToast = vi.fn();

    renderHook(() => useNotifInstandDB([], showToast));
    renderHook(() => useNotifInstandDB([], showToast));

    await waitFor(() => {
      expect(mockRegistryHandler).toHaveBeenCalledTimes(1);
    });

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("lastNotifInstantDB")).toBe("123456");
  });
});
