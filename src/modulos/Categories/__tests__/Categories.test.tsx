import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Categories from "../Categories";

// Mock del custom hook
const mockHandleAddPrincipalCategory = vi.fn();
const mockHandleSearch = vi.fn();
const mockUserCan = vi.fn();

const MockList = ({ onRenderBody }: any) => {
  const mockItem = { id: 1, name: "Categoria Test" };
  const mockClick = vi.fn();
  return (
    <div data-testid="mock-list">
      {onRenderBody(mockItem, 0, mockClick)}
    </div>
  );
};

vi.mock("../hooks/useCategories", () => ({
  default: () => ({
    List: MockList,
    searchs: { searchBy: "" },
    userCan: mockUserCan,
    extraData: { searchMsg: "Buscar..." },
    modPermission: "categories",
    originalType: "E",
    categoryTypeText: "egresos",
    typeToUse: 2,
    forceOpenAccordions: false,
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleAddSubcategory: vi.fn(),
    handleAddPrincipalCategory: mockHandleAddPrincipalCategory,
    handleSearch: mockHandleSearch,
  }),
}));

vi.mock("@/components/layout/NotAccess/NotAccess", () => ({
  default: () => <div data-testid="not-access">Not Access</div>,
}));

vi.mock("../CategoryCard/CategoryCard", () => ({
  default: ({ item, onEdit, onDel }: any) => (
    <div data-testid="category-card">
      <span>{item.name}</span>
      <button onClick={() => onEdit(item)}>Editar</button>
      <button onClick={() => onDel(item)}>Eliminar</button>
    </div>
  ),
}));

describe("Categories Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserCan.mockReturnValue(true);
  });

  it("renderiza el título y la navegación correctamente", () => {
    render(<Categories />);
    expect(screen.getByText("Categorías de egresos")).toBeInTheDocument();
    expect(screen.getByText("Volver a sección egresos")).toBeInTheDocument();
  });

  it("muestra NotAccess si el usuario no tiene permisos de lectura ('R')", () => {
    mockUserCan.mockReturnValue(false);
    render(<Categories />);
    expect(screen.getByTestId("not-access")).toBeInTheDocument();
  });

  it("llama a handleAddPrincipalCategory cuando se da clic en 'Nueva categoría'", () => {
    render(<Categories />);
    const btn = screen.getByRole("button", { name: /nueva categoría/i });
    fireEvent.click(btn);
    expect(mockHandleAddPrincipalCategory).toHaveBeenCalled();
  });

  it("renderiza el listado y la tarjeta de categoría", () => {
    render(<Categories />);
    expect(screen.getByTestId("mock-list")).toBeInTheDocument();
    expect(screen.getByTestId("category-card")).toBeInTheDocument();
    expect(screen.getByText("Categoria Test")).toBeInTheDocument();
  });
});
