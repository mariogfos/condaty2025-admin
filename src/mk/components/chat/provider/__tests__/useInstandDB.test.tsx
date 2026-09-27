import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * El chat cuelga del layout raíz: un fallo de InstantDB acá no puede dejar la
 * pantalla trabada ni una promesa sin manejar. Se importa el módulo de verdad
 * —con su `await initSocket()` de nivel de módulo— sobre un `db` falso.
 */

const showToast = vi.fn();

// Los hooks de InstantDB devuelven referencias ESTABLES entre renders; un
// objeto nuevo por render dispara el efecto de `peers` en bucle.
const presence = { user: null, peers: {}, publishPresence: vi.fn() };
const typing = { inputProps: {} };
const queryResult = { isLoading: false, error: null, data: { messages: [] } };

const fakeDb = {
  room: vi.fn(() => ({})),
  rooms: {
    usePresence: vi.fn(() => presence),
    useTypingIndicator: vi.fn(() => typing),
  },
  useQuery: vi.fn(() => queryResult),
  queryOnce: vi.fn().mockResolvedValue({ data: { notif: [] } }),
  transact: vi.fn(),
  auth: { signInWithToken: vi.fn() },
  tx: new Proxy(
    {},
    {
      get: () =>
        new Proxy({}, { get: () => ({ update: (data: any) => data }) }),
    },
  ),
};

vi.mock("@instantdb/react", () => ({
  id: vi.fn(() => "msg-id"),
  init: vi.fn(() => fakeDb),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "admin-1", client_id: "client-1", role: {} },
    showToast,
  })),
}));

vi.mock("@/mk/hooks/useEvents", () => ({
  useEvent: vi.fn(() => ({ dispatch: vi.fn() })),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: vi.fn(() => ({ data: null, reLoad: vi.fn() })),
}));

vi.mock("@/mk/notif/notifRegistry", () => ({ MODULE_REGISTRY: [] }));

vi.mock("@/components/layout/icons/IconsBiblioteca", () => ({
  IconX: () => null,
}));

const unhandled: unknown[] = [];
const collectUnhandled = (reason: unknown) => {
  unhandled.push(reason);
};

const flushRejections = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

/** Módulo de cero: la guarda `initToken` es de nivel de módulo. */
const importHook = async () => {
  vi.resetModules();
  return (await import("../useInstandDB")).default;
};

const fetchMock = vi.fn();
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  unhandled.length = 0;
  showToast.mockReset();
  fakeDb.transact.mockReset();
  fetchMock.mockReset();
  // Por defecto el login del chat no contesta: los tests que no lo miden no
  // dependen de él.
  fetchMock.mockReturnValue(new Promise(() => {}));
  vi.stubGlobal("fetch", fetchMock);
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  process.on("unhandledRejection", collectUnhandled);
});

afterEach(() => {
  process.off("unhandledRejection", collectUnhandled);
  warnSpy.mockRestore();
  vi.unstubAllGlobals();
});

describe("useInstandDB — un fallo de InstantDB no traba el chat", () => {
  it("si el envío falla, deja de estar «enviando», avisa y devuelve false", async () => {
    fakeDb.transact.mockRejectedValue(new Error("transaction timed out"));
    const useInstandDB = await importHook();
    const { result } = renderHook(() => useInstandDB());

    let sent: any;
    await act(async () => {
      sent = await result.current.sendMessage("hola", "sala-1", "admin-1");
    });

    expect(sent).toBe(false);
    expect(result.current.sending).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "No se pudo enviar el mensaje. Intenta nuevamente.",
      "error",
    );
  });

  it("marcar como leídos no deja un rechazo sin manejar", async () => {
    fakeDb.transact.mockRejectedValue(new Error("transaction timed out"));
    const useInstandDB = await importHook();
    const { result } = renderHook(() => useInstandDB());

    await act(async () => {
      await result.current.readMessage([
        { id: "m-1", sender: "otro", received_at: 1 },
        { id: "m-2", sender: "otro", received_at: 1 },
      ]);
    });
    await flushRejections();

    expect(unhandled).toEqual([]);
    // Una sola transacción para todo el lote, no una por mensaje.
    expect(fakeDb.transact).toHaveBeenCalledTimes(1);
  });

  it("si el login del chat falla, el próximo montaje lo reintenta", async () => {
    fetchMock.mockRejectedValueOnce(new Error("red caída"));
    const useInstandDB = await importHook();

    const first = renderHook(() => useInstandDB());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await flushRejections();
    first.unmount();

    renderHook(() => useInstandDB());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(unhandled).toEqual([]);
  });
});
