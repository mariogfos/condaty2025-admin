/**
 * La simulación de la carga masiva tiene que ser ALCANZABLE.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 LA RED DE SEGURIDAD EXISTÍA EN EL API Y NINGUNA PANTALLA LA OFRECÍA
 * ────────────────────────────────────────────────────────────────────────
 *
 * `POST /api/masivexls` acepta `simular=1` desde CDT-73: corre el importador
 * de verdad —para que los errores sean los reales— y revierte siempre, salga
 * bien o mal. Sirve para ver qué filas están mal sin arriesgar el padrón.
 *
 * Medido el 2026-08-30: `Uploads.tsx` es la ÚNICA pantalla que llama al
 * endpoint en los tres fronts, y mandaba sólo `file`, `type` y `_debug`. El
 * flag no se enviaba nunca. La feature estaba construida, testeada del lado
 * del API, y era inalcanzable.
 *
 * Importa porque `type=owners` con `clean=1` arranca con cuatro `forceDelete()`
 * sobre las unidades del condominio, y eso no es borrado lógico: no vuelve.
 *
 * ⚠️ Y el modo se pasa EXPLÍCITO: `onClick={onUpload}` le pasaría el evento de
 * React como primer argumento, así que con una firma `onUpload(simular)` todo
 * click simularía — incluido el de "Subir archivo", que dejaría de importar
 * nada sin dar un solo error.
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

/** El sobre real de una simulación que sale bien. */
const elApiRespondeUnaSimulacion = (errors: string[] = []) => {
  execute.mockResolvedValue({
    data: {
      success: true,
      message:
        "Simulación: el archivo se puede importar. No se guardó ningún cambio.",
      data: { simulado: true, errors, total_rows: 3 },
    },
    error: null,
  });
};

const elegirArchivo = () => {
  const { container } = render(<Uploads />);
  const input = container.querySelector<HTMLInputElement>("#uploads-file-input");
  expect(input, "el input de archivo tiene que existir").not.toBeNull();

  const archivo = new File(["x"], "padron.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  fireEvent.change(input as HTMLInputElement, { target: { files: [archivo] } });
  return container;
};

const apretar = async (nombre: RegExp) => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: nombre }));
  });
  await waitFor(() => expect(execute).toHaveBeenCalled());
};

/** El `FormData` con el que se llamó al endpoint. */
const loQueSeMando = () => execute.mock.calls[0][2] as FormData;

describe("La simulación de la carga masiva", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
  });

  it("manda simular=1 cuando se aprieta Simular", async () => {
    elApiRespondeUnaSimulacion();
    elegirArchivo();

    await apretar(/^simular$/i);

    expect(
      loQueSeMando().get("simular"),
      "🔴 El botón Simular no mandó el flag: la pantalla estaría importando de verdad.",
    ).toBe("1");
    expect(loQueSeMando().get("type")).toBe("owners");
  });

  it("NO manda simular cuando se aprieta Subir archivo", async () => {
    elApiRespondeUnaSimulacion();
    elegirArchivo();

    await apretar(/subir archivo/i);

    // 🔴 La contraprueba del caso de arriba. Sin ella, un `onUpload` cableado
    // directo al `onClick` —que recibe el evento y lo lee como `true`— pasaría
    // el primer test y dejaría la pantalla sin poder importar nada.
    expect(
      loQueSeMando().get("simular"),
      "🔴 Subir archivo mandó simular: no importaría nada y diría que salió bien.",
    ).toBeNull();
  });

  it("después de simular el archivo sigue elegido", async () => {
    elApiRespondeUnaSimulacion(["Fila 4: la unidad Z-9 no existe"]);
    elegirArchivo();

    await apretar(/^simular$/i);

    // El paso siguiente de quien simula es subir ESE mismo archivo. Vaciar la
    // selección lo obliga a elegirlo de nuevo y vuelve estorbo a la red de
    // seguridad.
    expect(
      await screen.findByText("padron.xlsx"),
      "🔴 La simulación limpió el archivo: hay que volver a elegirlo para importarlo.",
    ).toBeTruthy();
    expect(screen.getByText("Fila 4: la unidad Z-9 no existe")).toBeTruthy();
  });
});
