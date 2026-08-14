/**
 * CDT-30 — una opción cuyo id vale 0 no puede aparecer elegida sola.
 *
 * El bug: `Select` resolvía la opción seleccionada con `==` flojo contra el
 * "sin selección", que es la cadena vacía. En JavaScript `0 == ""` es `true`,
 * así que cualquier opción con id 0 se mostraba como elegida sin que el usuario
 * tocara nada. Se vio en el filtro de estado de Condominios, donde
 * `ClientStatus.INACTIVE` vale 0.
 *
 * Se mira el TEXTO DEL CONTROL CERRADO, que es lo que ve el usuario, y no el
 * estado interno: el estado interno estaba bien y el usuario igual leía
 * "Inactivo".
 *
 * ## Reinyección verificada (2026-08-13)
 *
 * Volvé a poner `option?.[optionValue] == value` en `selectedOption` y sacá la
 * guarda de "sin selección": se pone ROJO `sin selección no elige la opción con
 * id 0`.
 *
 * ⚠️ NO hay test del inicializador de `selectValue` en modo múltiple, y es a
 * propósito: se escribió uno, se reinyectó el `value ?? (...)` que deja pasar
 * un escalar falsy, y quedó VERDE. El spread y el `.includes()` que consumen
 * `selectValue` van los dos detrás de un `Array.isArray`, así que no hay
 * comportamiento observable que medir. La guarda del componente queda como
 * invariante defensivo, no como arreglo de un defecto reproducible.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Select from "../Select";

/** Las dos opciones de ClientStatus, con el 0 que dispara el bug. */
const ESTADOS = [
  { id: 0, name: "Inactivo" },
  { id: 1, name: "Activo" },
];

describe("Select — ids con valor 0", () => {
  it("sin selección no elige la opción con id 0", () => {
    render(
      <Select name="estado" value="" options={ESTADOS} placeholder="Seleccionar" />,
    );

    expect(screen.getByText("Seleccionar")).toBeTruthy();
    expect(screen.queryByText("Inactivo")).toBeNull();
  });

  it("con el 0 elegido de verdad, muestra su etiqueta", () => {
    render(
      <Select name="estado" value={0} options={ESTADOS} placeholder="Seleccionar" />,
    );

    expect(screen.getByText("Inactivo")).toBeTruthy();
  });

  it("un id numérico engancha con un value string, y al revés", () => {
    // Lo único útil que hacía el `==` flojo: el backend manda 1, la pantalla
    // arma "1". Se conserva comparando como texto.
    const { unmount } = render(
      <Select name="a" value="1" options={ESTADOS} placeholder="Seleccionar" />,
    );
    expect(screen.getByText("Activo")).toBeTruthy();
    unmount();

    render(
      <Select
        name="b"
        value={1}
        options={[
          { id: "0", name: "Inactivo" },
          { id: "1", name: "Activo" },
        ]}
        placeholder="Seleccionar"
      />,
    );
    expect(screen.getByText("Activo")).toBeTruthy();
  });

  it("null y undefined tampoco eligen el 0", () => {
    const { unmount } = render(
      <Select name="c" value={null} options={ESTADOS} placeholder="Seleccionar" />,
    );
    expect(screen.queryByText("Inactivo")).toBeNull();
    unmount();

    render(
      <Select name="d" value={undefined} options={ESTADOS} placeholder="Seleccionar" />,
    );
    expect(screen.queryByText("Inactivo")).toBeNull();
  });
});
