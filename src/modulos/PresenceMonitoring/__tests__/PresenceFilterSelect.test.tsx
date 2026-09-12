import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PresenceFilterSelect, {
  type PresenceFilterOption,
} from "../PresenceFilterSelect";

type Product = "all" | "admin" | "resident";

const options: PresenceFilterOption<Product>[] = [
  {
    value: "all",
    label: "Todos",
    description: "Todos los productos",
    tone: "neutral",
  },
  {
    value: "admin",
    label: "Administración",
    description: "Panel de administración",
    tone: "admin",
  },
  {
    value: "resident",
    label: "Residentes",
    description: "Aplicación de residentes",
    tone: "resident",
  },
];

describe("PresenceFilterSelect", () => {
  it("abre el selector, comunica la opción y devuelve el foco al control", async () => {
    const onChange = vi.fn();
    render(
      <PresenceFilterSelect
        label="Producto"
        value="all"
        options={options}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Producto: Todos" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Filtrar por producto" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Residentes: Aplicación de residentes",
      }),
    );

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("resident");
    expect(
      screen.queryByRole("dialog", { name: "Filtrar por producto" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("permite recorrer opciones por teclado y cerrar con Escape", async () => {
    render(
      <PresenceFilterSelect
        label="Producto"
        value="admin"
        options={options}
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Producto: Administración",
    });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const adminOption = screen.getByRole("button", {
      name: "Administración: Panel de administración",
    });
    const residentOption = screen.getByRole("button", {
      name: "Residentes: Aplicación de residentes",
    });

    await waitFor(() => expect(adminOption).toHaveFocus());
    fireEvent.keyDown(adminOption, { key: "ArrowDown" });
    expect(residentOption).toHaveFocus();

    fireEvent.keyDown(residentOption, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Filtrar por producto" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("se cierra al presionar fuera del selector", () => {
    render(
      <div>
        <PresenceFilterSelect
          label="Producto"
          value="all"
          options={options}
          onChange={vi.fn()}
        />
        <button type="button">Fuera</button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Producto: Todos" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Fuera" }));

    expect(
      screen.queryByRole("dialog", { name: "Filtrar por producto" }),
    ).not.toBeInTheDocument();
  });
});
