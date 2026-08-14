/**
 * CDT-36 — el formulario de cobros precargaba la fecha con el reloj UTC.
 *
 * Bolivia es UTC-4: entre las 20:00 y la medianoche `toISOString()` ya devuelve
 * el día SIGUIENTE, así que el admin abría el form con la fecha de mañana y la
 * guardaba sin mirar. El test falsea el reloj DENTRO de esa franja (22:30 de
 * Bolivia = 02:30 UTC del día siguiente) y exige el día local.
 *
 * La zona horaria del proceso se fija acá mismo (`process.env.TZ`): si el
 * runner corre en UTC la franja rota no existe y el test pasaría por
 * casualidad. El primer `expect` de cada caso verifica que la zona quedó
 * aplicada (offset 240) — si no, el test falla en vez de mentir.
 */
process.env.TZ = "America/La_Paz";

import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePaymentsForm } from "../hooks/usePaymentsForm";

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ store: { Unitstype: null } }),
}));

const makeProps = () =>
  ({
    item: null,
    extraData: { dptos: [], categories: [], bankAccounts: [], subcategories: [] },
    execute: vi.fn().mockResolvedValue({ data: { success: true } }),
    showToast: vi.fn(),
    reLoad: vi.fn(),
    onClose: vi.fn(),
  }) as any;

describe("CDT-36 · usePaymentsForm precarga paid_at con la fecha LOCAL", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("22:30 de Bolivia (ya es el día siguiente en UTC) precarga el día local", () => {
    vi.setSystemTime(new Date("2026-08-15T02:30:00Z"));

    // La zona horaria quedó realmente aplicada y estamos en la franja rota.
    expect(new Date().getTimezoneOffset()).toBe(240);
    expect(new Date().toISOString().split("T")[0]).toBe("2026-08-15");

    const { result } = renderHook(() => usePaymentsForm(makeProps(), false));

    expect(result.current.formState.paid_at).toBe("2026-08-14");
  });

  it("mediodía: local y UTC coinciden y sigue dando el mismo día", () => {
    vi.setSystemTime(new Date("2026-08-14T16:00:00Z"));

    expect(new Date().getTimezoneOffset()).toBe(240);
    expect(new Date().toISOString().split("T")[0]).toBe("2026-08-14");

    const { result } = renderHook(() => usePaymentsForm(makeProps(), false));

    expect(result.current.formState.paid_at).toBe("2026-08-14");
  });

  it("si el item ya trae paid_at, gana el del item", () => {
    vi.setSystemTime(new Date("2026-08-15T02:30:00Z"));

    const props = { ...makeProps(), item: { paid_at: "2026-01-09" } };
    const { result } = renderHook(() => usePaymentsForm(props, false));

    expect(result.current.formState.paid_at).toBe("2026-01-09");
  });
});
