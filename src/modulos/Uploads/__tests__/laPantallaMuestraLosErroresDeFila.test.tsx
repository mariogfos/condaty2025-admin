/**
 * La carga masiva tiene que decir QUÉ FILA falló y POR QUÉ.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 LA PANTALLA TIRABA A LA BASURA LOS ERRORES QUE EL API YA MANDABA
 * ────────────────────────────────────────────────────────────────────────
 *
 * La rama de error leía sólo `error?.data?.message` y descartaba `errors[]` por
 * completo. Con 500 filas y una mala, el administrador leía *"no se pudo
 * procesar el archivo: no se guardó ningún cambio"* y nada más: ningún número
 * de fila, ningún motivo, ningún lugar donde mirar en su Excel.
 *
 * 🔴 Y `errors[]` **no tiene una forma sola**. La pantalla ofrece los tres
 * tipos y cada importador del back arma la lista a su manera, así que un test
 * con una sola forma habría dejado dos rotas:
 *
 * - `deudas` / `pagoexpensas` → `string[]`
 * - `expensas`                → `{row, error, data}[]`
 * - `owners`                  → `string[]`, y un `string` PELADO en un camino
 *
 * El último caso pinea que el cartel viejo —el mensaje suelto, sin `errors`—
 * sigue funcionando: el arreglo no puede haberse comido el camino que ya andaba.
 */
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const execute = vi.fn();
const showToast = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast }),
}));

import Uploads from "../Uploads";

/** Deja el `execute` contestando lo que contestaría el API ante un 422. */
const elApiResponde = (envelope: any) => {
  execute.mockResolvedValue({ data: null, error: { message: "Request failed", status: 422, data: envelope } });
};

const subirUnArchivo = async () => {
  const { container } = render(<Uploads />);

  const input = container.querySelector<HTMLInputElement>("#uploads-file-input");
  expect(input, "el input de archivo tiene que existir").not.toBeNull();

  const archivo = new File(["x"], "padron.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  fireEvent.change(input as HTMLInputElement, { target: { files: [archivo] } });

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /subir archivo/i }));
  });

  // 🔴 Sin esto el test mediría la pantalla ANTES de la respuesta y estaría
  // verde por no haber llegado nunca a la rama que se quiere probar.
  await waitFor(() => expect(execute).toHaveBeenCalled());
};

describe("La pantalla de carga masiva y los errores por fila", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
  });

  it("muestra la fila y el motivo de cada error cuando vienen como string[] (deudas, pagos)", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo: no se guardó ningún cambio.",
      errors: [
        "Fila 5: Unidad 101 no existe en el condominio",
        "Fila 9: Formato de fecha inválido (32/13/2026)",
      ],
    });

    await subirUnArchivo();

    expect(
      await screen.findByText("Fila 5: Unidad 101 no existe en el condominio"),
      "🔴 La pantalla se comió los errores que el API ya mandaba.",
    ).toBeTruthy();
    expect(screen.getByText("Fila 9: Formato de fecha inválido (32/13/2026)")).toBeTruthy();

    // El mensaje general sigue estando: la lista lo acompaña, no lo reemplaza.
    expect(
      screen.getByText("No se pudo procesar el archivo: no se guardó ningún cambio."),
    ).toBeTruthy();
  });

  it("también los muestra cuando vienen como objetos {row, error} (expensas)", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo. Se encontraron errores en todas las filas.",
      errors: [
        { row: 7, error: "El monto debe ser positivo. Valor recibido: -100", data: [] },
        { row: 12, error: "El departamento #404 no existe o está inactivo.", data: [] },
      ],
    });

    await subirUnArchivo();

    expect(
      await screen.findByText("Fila 7: El monto debe ser positivo. Valor recibido: -100"),
      "🔴 `expensas` manda objetos, no strings: pintarlos como strings da «[object Object]».",
    ).toBeTruthy();
    expect(
      screen.getByText("Fila 12: El departamento #404 no existe o está inactivo."),
    ).toBeTruthy();
  });

  it("y cuando `errors` es un string pelado (owners), lo muestra igual", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo: no se guardó ningún cambio.",
      errors: "Faltan datos de propietario o dpto",
    });

    await subirUnArchivo();

    expect(await screen.findByText("Faltan datos de propietario o dpto")).toBeTruthy();
  });

  it("sin `errors[]` sigue mostrando sólo el mensaje suelto, sin lista vacía", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo",
    });

    await subirUnArchivo();

    expect(await screen.findByText("No se pudo procesar el archivo")).toBeTruthy();
    expect(
      screen.queryByText(/problemas? en el archivo/i),
      "Sin errores no se pinta el cartel de la lista.",
    ).toBeNull();
  });

  it("con muchos errores aparece el buscador y filtra la lista", async () => {
    const muchos = Array.from(
      { length: 12 },
      (_, i) => `Fila ${i + 2}: Unidad U-${i + 2} no existe en el condominio`,
    );
    elApiResponde({ success: false, message: "No se pudo procesar el archivo", errors: muchos });

    await subirUnArchivo();

    expect(await screen.findByText("Se encontraron 12 problemas en el archivo:")).toBeTruthy();

    const buscador = screen.getByRole("searchbox");
    fireEvent.change(buscador, { target: { value: "Fila 9:" } });

    await waitFor(() => {
      expect(screen.getByText("Fila 9: Unidad U-9 no existe en el condominio")).toBeTruthy();
      expect(screen.queryByText("Fila 2: Unidad U-2 no existe en el condominio")).toBeNull();
    });
  });
});
