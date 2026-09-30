/**
 * Enviar los borradores a aprobación dice lo que respondió el API.
 *
 * Desde el 2026-09-30 `send-budget-approval` contesta **422** cuando no hay
 * borradores. `execute` no lanza, así que ese 422 llega en `error` con `data`
 * en `null`, y la pantalla mostraba el texto de axios («Request failed with
 * status code 422») en vez del motivo. Se miden el 422, el 200 con
 * `success: false` (la forma vieja, por si vuelve), la red caída y el éxito.
 */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { sendToApproval, SEND_TO_APPROVAL_FALLBACK } from "../sendToApproval";

const execute = vi.fn();
const showToast = vi.fn();

describe("enviar a aprobación mira la respuesta del API", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
  });

  it("un 422 muestra el motivo del sobre, no el texto de axios", async () => {
    execute.mockResolvedValue({
      data: null,
      error: {
        message: "Request failed with status code 422",
        status: 422,
        data: {
          success: false,
          message: "No hay presupuestos en borrador para enviar a aprobación.",
        },
      },
    });

    expect(await sendToApproval(execute, showToast)).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "No hay presupuestos en borrador para enviar a aprobación.",
      "error",
    );
    expect(showToast).not.toHaveBeenCalledWith(expect.anything(), "success");
  });

  it("un 200 con success:false tampoco es éxito", async () => {
    execute.mockResolvedValue({
      data: { success: false, message: "Ocurrió un problema al realizar la operación" },
      error: null,
    });

    expect(await sendToApproval(execute, showToast)).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "Ocurrió un problema al realizar la operación",
      "error",
    );
  });

  it("sin sobre (red caída) dice que no se pudo", async () => {
    execute.mockResolvedValue({
      data: null,
      error: { message: "Network Error", status: 0, data: {} },
    });

    expect(await sendToApproval(execute, showToast)).toBe(false);
    expect(showToast).toHaveBeenCalledWith(SEND_TO_APPROVAL_FALLBACK, "error");
  });

  it("con success:true avisa el éxito", async () => {
    execute.mockResolvedValue({
      data: { success: true, message: "Operación realizada con éxito", data: { count: 2 } },
      error: null,
    });

    expect(await sendToApproval(execute, showToast)).toBe(true);
    expect(execute).toHaveBeenCalledWith(
      "/v3/budgets/send-budget-approval",
      "POST",
      {},
      false,
      false,
    );
    expect(showToast).toHaveBeenCalledWith("Operación realizada con éxito", "success");
  });
});
