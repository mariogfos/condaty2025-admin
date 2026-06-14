import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useCategories } from "../hooks/useCategories";

// Mocks de hooks externos
const mockOnEdit = vi.fn();
const mockOnDel = vi.fn();
const mockOnAdd = vi.fn();
const mockOnSearch = vi.fn();
const mockGetExtraData = vi.fn();
const mockUserCan = vi.fn();

vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: vi.fn(({ paramsInitial, mod, fields }: any) => ({
    List: () => null,
    searchs: { searchBy: "" },
    userCan: mockUserCan,
    extraData: {},
    getExtraData: mockGetExtraData,
    onEdit: mockOnEdit,
    onDel: mockOnDel,
    onAdd: mockOnAdd,
    onSearch: mockOnSearch,
  })),
}));

// Mock de next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => ({
    get: (key: string) => null,
  })),
}));

describe("useCategories Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicializa con tipo de ingreso (INCOME = 1) por defecto", () => {
    const { result } = renderHook(() => useCategories());

    expect(result.current.typeToUse).toBe(1);
    expect(result.current.categoryTypeText).toBe("ingresos");
    expect(result.current.forceOpenAccordions).toBe(false);
  });

  it("determina el tipo de egreso cuando se le pasa el prop o URL", () => {
    const { result } = renderHook(() => useCategories("E"));

    expect(result.current.typeToUse).toBe(2); // EXPENSE = 2
    expect(result.current.categoryTypeText).toBe("egresos");
  });

  it("llama a crud.onSearch y fuerza la apertura de acordeones si hay texto de búsqueda", () => {
    const { result } = renderHook(() => useCategories());

    act(() => {
      result.current.handleSearch("agua");
    });

    expect(mockOnSearch).toHaveBeenCalledWith("agua");
    expect(result.current.forceOpenAccordions).toBe(true);
  });

  it("fuerza acordeones a false si la búsqueda se limpia", () => {
    const { result } = renderHook(() => useCategories());

    act(() => {
      result.current.handleSearch("");
    });

    expect(mockOnSearch).toHaveBeenCalledWith("");
    expect(result.current.forceOpenAccordions).toBe(false);
  });

  it("llama a onAdd pasando el tipo correcto al agregar categoría principal", () => {
    const { result } = renderHook(() => useCategories());

    act(() => {
      result.current.handleAddPrincipalCategory();
    });

    expect(mockOnAdd).toHaveBeenCalledWith({ type: 1 });
  });

  it("llama a onAdd pasando la categoría padre al agregar una subcategoría", () => {
    const { result } = renderHook(() => useCategories());

    act(() => {
      result.current.handleAddSubcategory("5");
    });

    expect(mockOnAdd).toHaveBeenCalledWith({ type: 1 });
  });

  it("llama a onEdit pasando los parámetros formateados", () => {
    const { result } = renderHook(() => useCategories());
    const testItem = { id: 10, name: "Impuestos", category_id: undefined };

    act(() => {
      result.current.handleEdit(testItem);
    });

    expect(mockOnEdit).toHaveBeenCalledWith({
      id: 10,
      name: "Impuestos",
      type: 1,
      category_id: null,
    });
  });

  it("llama a onDel al eliminar una categoría", () => {
    const { result } = renderHook(() => useCategories());
    const testItem = { id: 10, name: "Impuestos" };

    act(() => {
      result.current.handleDelete(testItem);
    });

    expect(mockOnDel).toHaveBeenCalledWith(testItem);
  });
});
