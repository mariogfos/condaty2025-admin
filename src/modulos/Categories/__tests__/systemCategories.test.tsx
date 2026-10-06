import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CategoryCard from "../CategoryCard/CategoryCard";
import { CategoryFixed, isSystemCategory } from "../Type/CategoryType";

/**
 * System categories (created by provisioning) are not edited nor deleted: the
 * API answers 422 to both since the full review of 2026-10-06. The screen does
 * not offer what the API refuses.
 *
 * 🔴 `fixed` moved from the boolean 0/1 to the enum 1/2 the same day: the `1`
 * that meant YES now means NO. The predicate is measured against EVERY value,
 * so a `>= 1` or a truthiness check goes red.
 */
describe("isSystemCategory", () => {
  it("only YES is a system category", () => {
    expect(isSystemCategory({ fixed: CategoryFixed.YES })).toBe(true);
    expect(isSystemCategory({ fixed: String(CategoryFixed.YES) })).toBe(true);
    expect(isSystemCategory({ fixed: CategoryFixed.NO })).toBe(false);
    expect(isSystemCategory({ fixed: 0 })).toBe(false);
    expect(isSystemCategory({})).toBe(false);
    expect(isSystemCategory(null)).toBe(false);
  });

  it("YES is 2 and NO is 1, like the API", () => {
    expect(CategoryFixed.YES).toBe(2);
    expect(CategoryFixed.NO).toBe(1);
  });
});

describe("CategoryCard and system categories", () => {
  const props = {
    onEdit: vi.fn(),
    onDel: vi.fn(),
    onAddSubcategory: vi.fn(),
    categoryType: 1,
    forceOpen: true,
  };

  it("offers neither edit nor delete on a system parent and its system children", () => {
    render(
      <CategoryCard
        {...props}
        item={{
          id: 1,
          name: "Pago de expensas",
          fixed: CategoryFixed.YES,
          hijos: [{ id: 2, name: "Multa expensas", fixed: CategoryFixed.YES }],
        }}
      />,
    );

    expect(screen.queryByLabelText("Editar Pago de expensas")).toBeNull();
    expect(screen.queryByLabelText("Editar subcategoría Multa expensas")).toBeNull();
    expect(screen.queryByLabelText("Eliminar subcategoría Multa expensas")).toBeNull();
    // Adding a child of its own under a system parent is still allowed.
    expect(screen.getByText("Agregar subcategoría")).toBeInTheDocument();
  });

  it("still offers both on the condominium's own categories", () => {
    render(
      <CategoryCard
        {...props}
        item={{
          id: 3,
          name: "Mantenimiento",
          fixed: CategoryFixed.NO,
          hijos: [{ id: 4, name: "Jardin", fixed: CategoryFixed.NO }],
        }}
      />,
    );

    expect(screen.getByLabelText("Editar Mantenimiento")).toBeInTheDocument();
    expect(screen.getByLabelText("Editar subcategoría Jardin")).toBeInTheDocument();
    expect(screen.getByLabelText("Eliminar subcategoría Jardin")).toBeInTheDocument();
  });
});
