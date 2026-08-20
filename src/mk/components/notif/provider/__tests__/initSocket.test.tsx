import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CDT-95 — `initSocket()` se dispara a nivel de módulo y nadie espera esa
 * promesa. Si `init()`, `queryOnce()` o `transact()` fallan, el rechazo queda
 * SIN MANEJAR: en el navegador del usuario en cada carga, y en la suite hacía
 * que vitest saliera con código 1 aunque todos los tests estuvieran verdes
 * (la rejection se le colgaba, al azar, al archivo que estuviera corriendo).
 *
 * Estos tests importan el módulo de verdad — con el efecto de módulo incluido —
 * y afirman que ningún camino de fallo deja una promesa sin manejar.
 */

const initMock = vi.fn();

vi.mock("@instantdb/react", () => ({
  id: vi.fn(() => "notif-id"),
  init: (...args: any[]) => initMock(...args),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

vi.mock("@/mk/hooks/useEvents", () => ({
  useEvent: vi.fn(() => ({ dispatch: vi.fn() })),
}));

vi.mock("@/mk/notif/notifRegistry", () => ({
  MODULE_REGISTRY: [],
}));

const unhandled: unknown[] = [];
const collectUnhandled = (reason: unknown) => {
  unhandled.push(reason);
};

/** Dos macrotareas: node emite `unhandledRejection` recién cuando drena las microtareas. */
const flushRejections = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

/** Importa el módulo de cero, para que el `initSocket()` de nivel de módulo vuelva a correr. */
const importModule = async () => {
  vi.resetModules();
  const mod = await import("../useNotifInstandDB");
  await flushRejections();
  return mod;
};

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  unhandled.length = 0;
  initMock.mockReset();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  process.on("unhandledRejection", collectUnhandled);
});

afterEach(() => {
  process.off("unhandledRejection", collectUnhandled);
  warnSpy.mockRestore();
});

describe("initSocket (CDT-95)", () => {
  it("un appId inválido no deja una promesa sin manejar y avisa con el error", async () => {
    const boom = new Error(
      "Instant must be initialized with a valid appId. `test-app-id` is not a valid uuid.",
    );
    initMock.mockImplementation(() => {
      throw boom;
    });

    await importModule();

    expect(unhandled).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[notif] no se pudo inicializar InstantDB",
      boom,
    );
  });

  it("si falla la purga de notificaciones viejas, initSocket igual devuelve db", async () => {
    const boom = new Error("queryOnce caído");
    const db = {
      queryOnce: vi.fn().mockRejectedValue(boom),
      transact: vi.fn(),
      tx: { notif: {} },
      useQuery: vi.fn(() => ({ data: null })),
    };
    initMock.mockReturnValue(db);

    const { initSocket } = await importModule();

    expect(unhandled).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[notif] no se pudieron purgar las notificaciones viejas de InstantDB",
      boom,
    );
    // La firma no cambia: los cuatro consumidores siguen recibiendo `db`.
    await expect(initSocket()).resolves.toBe(db);
  });

  it("un transact rechazado tampoco queda flotando", async () => {
    const boom = new Error("transact caído");
    const db = {
      queryOnce: vi.fn().mockResolvedValue({
        data: { notif: [{ id: "viejo-1" }] },
      }),
      transact: vi.fn().mockRejectedValue(boom),
      tx: { notif: { "viejo-1": { delete: () => ({ op: "delete" }) } } },
      useQuery: vi.fn(() => ({ data: null })),
    };
    initMock.mockReturnValue(db);

    await importModule();

    expect(db.transact).toHaveBeenCalled();
    expect(unhandled).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[notif] no se pudieron purgar las notificaciones viejas de InstantDB",
      boom,
    );
  });
});
