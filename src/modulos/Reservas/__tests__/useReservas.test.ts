/**
 * El container de la lista: qué hace con el filtro de fecha.
 *
 * Lo único que este hook agrega sobre un `useCrud` pelado es el período
 * "Personalizado", que NO es un valor que el API entienda: el front lo
 * intercepta, abre un modal y traduce el resultado a un rango `desde,hasta`.
 * Si esa intercepción se rompe, el `custom` viaja tal cual y el API —que hace
 * `PeriodFilter` sobre un catálogo de períodos conocidos— no filtra nada.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReservas, validateCustomPeriod } from "../hooks/useReservas";

const onFilter = vi.fn();
let getFilterCapturado: ((opt: string, value: string, old: any) => any) | null =
  null;

vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: vi.fn((options: any) => {
    getFilterCapturado = options.getFilter;
    return {
      List: () => null,
      userCan: () => true,
      searchs: {},
      setStore: vi.fn(),
      onSearch: vi.fn(),
      onEdit: vi.fn(),
      onDel: vi.fn(),
      onFilter,
    };
  }),
}));

vi.mock("@/modulos/shared/useCrudUtils", () => ({
  default: () => ({ onLongPress: vi.fn(), selItem: null }),
}));

describe("validateCustomPeriod", () => {
  it("exige las dos fechas", () => {
    expect(validateCustomPeriod({})).toEqual({
      startDate: "La fecha de inicio es obligatoria",
      endDate: "La fecha de fin es obligatoria",
    });
  });

  it("no acepta un rango al revés", () => {
    const errores = validateCustomPeriod({
      startDate: "2026-08-20",
      endDate: "2026-08-01",
    });

    expect(errores.startDate).toBe(
      "La fecha de inicio no puede ser mayor a la de fin",
    );
  });

  it("no acepta un rango que cruza el año", () => {
    // El `PeriodFilter` del API arma la ventana sobre un año calendario; un
    // rango que lo cruza devuelve filas que el usuario no pidió.
    const errores = validateCustomPeriod({
      startDate: "2025-12-20",
      endDate: "2026-01-10",
    });

    expect(errores.startDate).toBe(
      "El periodo personalizado debe estar dentro del mismo año",
    );
    expect(errores.endDate).toBe(
      "El periodo personalizado debe estar dentro del mismo año",
    );
  });

  it("un rango válido no tiene errores", () => {
    expect(
      validateCustomPeriod({ startDate: "2026-08-01", endDate: "2026-08-20" }),
    ).toEqual({});
  });
});

describe("useReservas — el filtro de período", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFilterCapturado = null;
  });

  it("'Personalizado' NO viaja al API: abre el modal y saca el filtro", () => {
    const { result } = renderHook(() => useReservas());

    expect(result.current.openCustomFilter).toBe(false);

    let devuelto: any;
    act(() => {
      devuelto = getFilterCapturado?.("date_at", "custom", {
        filterBy: { date_at: "m", status_reservation: "5" },
      });
    });

    expect(result.current.openCustomFilter).toBe(true);
    expect(devuelto.filterBy).not.toHaveProperty("date_at");
    // Los demás filtros no se tocan.
    expect(devuelto.filterBy.status_reservation).toBe("5");
  });

  it("un período normal sí viaja, y convive con los otros filtros", () => {
    renderHook(() => useReservas());

    const devuelto = getFilterCapturado?.("date_at", "lm", {
      filterBy: { status_reservation: "5" },
    });

    expect(devuelto.filterBy).toEqual({
      date_at: "lm",
      status_reservation: "5",
    });
  });

  it("elegir el vacío saca ese filtro y deja los demás", () => {
    renderHook(() => useReservas());

    const devuelto = getFilterCapturado?.("status_reservation", "", {
      filterBy: { date_at: "m", status_reservation: "5" },
    });

    expect(devuelto.filterBy).toEqual({ date_at: "m" });
  });

  it("guardar un rango válido manda date_at=desde,hasta y cierra el modal", () => {
    const { result } = renderHook(() => useReservas());

    act(() => {
      getFilterCapturado?.("date_at", "custom", { filterBy: {} });
    });
    act(() => {
      result.current.onSaveCustomPeriod({
        startDate: "2026-08-01",
        endDate: "2026-08-20",
      });
    });

    expect(onFilter).toHaveBeenCalledWith("date_at", "2026-08-01,2026-08-20");
    expect(result.current.openCustomFilter).toBe(false);
    expect(result.current.customDateErrors).toEqual({});
  });

  it("un rango inválido NO llama al API y deja el modal abierto", () => {
    const { result } = renderHook(() => useReservas());

    act(() => {
      getFilterCapturado?.("date_at", "custom", { filterBy: {} });
    });
    act(() => {
      result.current.onSaveCustomPeriod({
        startDate: "2025-12-20",
        endDate: "2026-01-10",
      });
    });

    expect(onFilter).not.toHaveBeenCalled();
    expect(result.current.openCustomFilter).toBe(true);
    expect(result.current.customDateErrors.startDate).toBeTruthy();
  });

  it("cerrar el modal limpia los errores", () => {
    const { result } = renderHook(() => useReservas());

    act(() => {
      result.current.onSaveCustomPeriod({});
    });
    expect(result.current.customDateErrors.startDate).toBeTruthy();

    act(() => {
      result.current.onCloseCustomPeriod();
    });

    expect(result.current.openCustomFilter).toBe(false);
    expect(result.current.customDateErrors).toEqual({});
  });
});
