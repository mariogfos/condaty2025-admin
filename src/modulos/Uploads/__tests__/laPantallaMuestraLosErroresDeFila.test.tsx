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
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 Y EL PEOR CASO ENTRA POR LA RAMA DE ÉXITO
 * ────────────────────────────────────────────────────────────────────────
 *
 * `ExpenseImportService:283-289` commitea las filas buenas y devuelve las malas
 * con `success: true`: 499 filas entran, una falla, el API contesta **200** y la
 * pantalla mostraba *"procesado correctamente"* con las filas rechazadas
 * invisibles — el defecto original servido bajo cartel de éxito.
 *
 * ⚠️ Y el sobre del 200 **envuelve** el resultado del importador: `sendResponse()`
 * lo mete en `data`, así que los errores viajan en `data.data.errors`. En la rama
 * de fallo (`sendError()`) están en la raíz. Los dos niveles se pinean acá.
 *
 * ⚠️ El importador de **pagos** NO es parcial: revierte todo y contesta
 * `success: false`. El caso parcial es de expensas, y no se generaliza.
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

/**
 * El sobre REAL de un 200: `sendResponse()` envuelve el resultado del importador
 * en `data`. Pinearlo importa — leer `data.errors` (un nivel arriba) no encuentra
 * nada nunca.
 */
const elApiRespondeOk = (resultadoDelImportador: any) => {
  execute.mockResolvedValue({
    data: {
      success: true,
      message: "Se termino de procesar vínculos",
      data: resultadoDelImportador,
    },
    error: null,
  });
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

    // ⚠️ Sin `total_errors` el back puede haber cortado la lista: el cartel habla
    // de lo que MUESTRA, no afirma un total que no sabe.
    expect(await screen.findByText("Se muestran 12 problemas del archivo:")).toBeTruthy();

    const buscador = screen.getByRole("searchbox");
    fireEvent.change(buscador, { target: { value: "Fila 9:" } });

    await waitFor(() => {
      expect(screen.getByText("Fila 9: Unidad U-9 no existe en el condominio")).toBeTruthy();
      expect(screen.queryByText("Fila 2: Unidad U-2 no existe en el condominio")).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // 🔴 La importación PARCIAL: 200, `success: true`, y errores adentro
  // ──────────────────────────────────────────────────────────────────────

  it("🔴 muestra los errores cuando el API contesta 200 con `success: true` (importación parcial de expensas)", async () => {
    elApiRespondeOk({
      success: true,
      message: "Importación completada exitosamente.",
      stats: { successful: 462, failed: 37 },
      errors: [
        { row: 14, error: "El monto debe ser positivo. Valor recibido: -100", data: [] },
        { row: 22, error: "El departamento #404 no existe o está inactivo.", data: [] },
      ],
      total_errors: 37,
    });

    await subirUnArchivo();

    expect(
      await screen.findByText("Fila 14: El monto debe ser positivo. Valor recibido: -100"),
      "🔴 `success: true` NO es «sin errores»: las filas rechazadas quedaban invisibles bajo cartel de éxito.",
    ).toBeTruthy();
    expect(screen.getByText("Fila 22: El departamento #404 no existe o está inactivo.")).toBeTruthy();

    // El total real está sólo en `total_errors`: el back corta `errors` en 20.
    expect(
      screen.getByText("Se encontraron 37 problemas en el archivo (se muestran los primeros 2):"),
      "🔴 El título tiene que decir 37, no 2: la lista viene cortada por el back.",
    ).toBeTruthy();

    // Y el mensaje no puede decir sólo «correctamente».
    expect(
      screen.getByText("Importación completada exitosamente. Se rechazaron 37 filas."),
      "🔴 El mensaje mentía: entró con 37 filas rechazadas y no lo decía.",
    ).toBeTruthy();
  });

  it("🔴 el toast de una importación parcial NO es verde", async () => {
    elApiRespondeOk({
      success: true,
      message: "Importación completada exitosamente.",
      errors: [{ row: 14, error: "El monto debe ser positivo", data: [] }],
      total_errors: 1,
    });

    await subirUnArchivo();

    await waitFor(() => expect(showToast).toHaveBeenCalled());
    const [mensaje, tipo] = showToast.mock.calls[0];
    expect(tipo, "🔴 Un `success` verde con filas rechazadas adentro miente.").toBe("warning");
    expect(mensaje).toBe("Importación completada exitosamente. Se rechazaron 1 fila.");
  });

  it("EL CONTROL: un éxito SIN errores sigue diciendo «correctamente», sin lista y sin alarma", async () => {
    elApiRespondeOk({
      success: true,
      message: "Importación completada exitosamente.",
      stats: { successful: 499, failed: 0 },
      errors: [],
      total_errors: 0,
    });

    await subirUnArchivo();

    expect(await screen.findByText("Importación completada exitosamente.")).toBeTruthy();
    expect(
      screen.queryByText(/problemas? (en|del) el? ?archivo/i),
      "Sin errores no se pinta ningún cartel de problemas.",
    ).toBeNull();

    await waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(
      showToast.mock.calls[0][1],
      "Sin errores el toast sigue siendo verde: el arreglo no puede hacer que todo grite.",
    ).toBe("success");
  });

  it("si `total_errors` no viaja, el título no afirma un total que no sabe", async () => {
    // ⚠️ Medido: de los cuatro importers, `total_errors` lo manda SÓLO expensas.
    elApiRespondeOk({
      success: true,
      message: "Importación completada.",
      errors: ["Fila 3: Unidad U-3 no existe en el condominio"],
    });

    await subirUnArchivo();

    expect(await screen.findByText("Se muestra 1 problema del archivo:")).toBeTruthy();
    expect(
      screen.getByText("Importación completada. Se rechazaron al menos 1 fila."),
      "Sin `total_errors` la lista puede venir cortada: lo que hay es un piso, no un total.",
    ).toBeTruthy();
  });

  // ──────────────────────────────────────────────────────────────────────
  // Las formas de `errors[]` que el normalizador se tragaba en silencio
  // ──────────────────────────────────────────────────────────────────────

  it("🔴 un objeto SIN la clave `error` se muestra igual, no se descarta", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo",
      errors: [{ fila: 8, motivo: "CI duplicado" }],
    });

    await subirUnArchivo();

    // No importa la forma exacta, importa que el dato NO se pierda.
    expect(
      await screen.findByText(/CI duplicado/),
      "🔴 Una forma que no sabemos leer se muestra como se pueda; descartarla borra un error real.",
    ).toBeTruthy();
  });

  it("🔴 un `error` que es un objeto no se pinta «[object Object]»", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo",
      errors: [{ row: 4, error: { campo: "monto", detalle: "no numérico" } }],
    });

    await subirUnArchivo();

    expect(screen.queryByText(/\[object Object\]/)).toBeNull();
    expect(await screen.findByText(/Fila 4:.*monto/)).toBeTruthy();
    expect(screen.getByText(/no numérico/)).toBeTruthy();
  });

  it("un `error` nulo dice «sin motivo», no «undefined»", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo",
      errors: [{ row: 4, error: null }],
    });

    await subirUnArchivo();

    expect(await screen.findByText("Fila 4: sin motivo")).toBeTruthy();
    expect(screen.queryByText(/undefined|null/)).toBeNull();
  });

  it("🔴 la fila 0 es una fila: `!row` la trataría como ausente", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo",
      errors: [{ row: 0, error: "Encabezado ilegible" }],
    });

    await subirUnArchivo();

    expect(
      await screen.findByText("Fila 0: Encabezado ilegible"),
      "🔴 Con `!row` esto saldría «Encabezado ilegible» a secas y el admin no sabría dónde mirar.",
    ).toBeTruthy();
  });

  it("🔴 un anidamiento de profundidad 2 no se descarta (`.flat()` baja UN nivel)", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo",
      errors: [[["Fila 6: Unidad U-6 no existe en el condominio"]]],
    });

    await subirUnArchivo();

    expect(
      await screen.findByText("Fila 6: Unidad U-6 no existe en el condominio"),
      "🔴 Con `.flat()` de un nivel esto desaparecía sin dejar rastro.",
    ).toBeTruthy();
  });

  it("🔴 un número pelado en la lista tampoco desaparece", async () => {
    elApiResponde({
      success: false,
      message: "No se pudo procesar el archivo",
      errors: [17, "Fila 18: Unidad inexistente"],
    });

    await subirUnArchivo();

    expect(await screen.findByText("17")).toBeTruthy();
    expect(screen.getByText("Fila 18: Unidad inexistente")).toBeTruthy();
  });

  it("🔴 el bag de validación de Laravel (`{campo: [mensaje]}`) se despliega", async () => {
    elApiResponde({
      success: false,
      message: "Error de validación",
      errors: {
        file: ["El archivo debe ser un xls o xlsx."],
        type: ["El tipo seleccionado no es válido."],
      },
    });

    await subirUnArchivo();

    expect(
      await screen.findByText("El archivo debe ser un xls o xlsx."),
      "🔴 Sin `Object.values` el bag entero se descarta y el 400 no dice nada.",
    ).toBeTruthy();
    expect(screen.getByText("El tipo seleccionado no es válido.")).toBeTruthy();
  });

  // ──────────────────────────────────────────────────────────────────────
  // El 400 de "archivo vacío" manda la clave en SINGULAR
  // ──────────────────────────────────────────────────────────────────────

  it("🔴 el 400 de archivo vacío manda `error` en singular y el motivo se ve", async () => {
    // `BulkOperationsController:158` → {'error': '...'}, sin `message` ni `errors`.
    execute.mockResolvedValue({
      data: null,
      error: {
        message: "Request failed",
        status: 400,
        data: { error: "El archivo Excel está vacío o mal formateado." },
      },
    });

    await subirUnArchivo();

    expect(
      await screen.findByText("El archivo Excel está vacío o mal formateado."),
      "🔴 Ninguna rama leía `error` en singular: el motivo se perdía y salía un genérico.",
    ).toBeTruthy();
    expect(screen.queryByText("No se pudo procesar el archivo")).toBeNull();
  });
});
