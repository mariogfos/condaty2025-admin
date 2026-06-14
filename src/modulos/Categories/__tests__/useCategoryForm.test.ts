import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useCategoryForm } from "../hooks/useCategoryForm";

describe("useCategoryForm Hook", () => {
  const mockOnClose = vi.fn();
  const mockSetItem = vi.fn();
  const mockOnSave = vi.fn();
  const mockGetExtraData = vi.fn();

  const defaultProps = {
    item: { id: 1, name: "Mantenimiento" },
    setItem: mockSetItem,
    onClose: mockOnClose,
    onSave: mockOnSave,
    extraData: {
      categories: [{ id: "5", name: "Servicios" }],
      bankAccounts: [{ id: "2", holder: "Pedro", alias_holder: "Banco B", account_number: "987" }],
    },
    action: "add",
    categoryType: 1,
    getExtraData: mockGetExtraData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicializa el estado del formulario con el ítem prop", () => {
    const { result } = renderHook(() => useCategoryForm(defaultProps));

    expect(result.current._Item).toEqual({ id: 1, name: "Mantenimiento" });
    expect(result.current.isSubcategoryMode).toBe(false);
  });

  it("identifica el modo subcategoría cuando el item tiene category_id", () => {
    const props = {
      ...defaultProps,
      item: { id: 1, name: "Sub", category_id: "5" },
    };
    const { result } = renderHook(() => useCategoryForm(props));

    expect(result.current.isSubcategoryMode).toBe(true);
    expect(result.current.parentCategory).toEqual({ id: "5", name: "Servicios" });
  });

  it("actualiza el valor local al dispararse handleChange", () => {
    const { result } = renderHook(() => useCategoryForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "name", value: "Jardinería" },
      });
    });

    expect(result.current._Item.name).toBe("Jardinería");
  });

  it("mapea las opciones de cuenta bancaria correctamente", () => {
    const { result } = renderHook(() => useCategoryForm(defaultProps));

    expect(result.current.bankAccountOptions).toEqual([
      { id: "2", name: "Pedro - Banco B - 987" },
    ]);
  });

  it("no ejecuta onSave si no pasa las reglas de validación (name vacío)", () => {
    const props = {
      ...defaultProps,
      item: { name: "" }, // Nombre vacío falla validación required
    };
    const { result } = renderHook(() => useCategoryForm(props));

    act(() => {
      result.current.handleSave();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(result.current._errors.name).toBe("Este campo es requerido");
  });

  it("ejecuta onSave y filtra props cuando los datos son válidos", () => {
    const { result } = renderHook(() => useCategoryForm(defaultProps));

    act(() => {
      result.current.handleSave();
    });

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: "Mantenimiento",
        type: 1,
        category_id: null,
      })
    );
    expect(mockGetExtraData).toHaveBeenCalled();
  });
});
