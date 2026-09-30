/**
 * Aprobar o rechazar un presupuesto dice lo que respondió el API.
 *
 * ## 🔴 Qué se rompía
 *
 * `execute` de `useAxios` NO lanza: un no-2xx vuelve en `{ data: null, error }`.
 * El modal ignoraba los dos y mostraba «Presupuesto aprobado correctamente»
 * pasara lo que pasara, así que un 404 de `change-budget` estuvo oculto meses.
 * Y el API rechaza hoy con HTTP 200 y `success: false` («No tienes el rol
 * necesario…», «No se encontró el presupuesto»): también se pintaba verde.
 *
 * Se miden los tres: el `success: false` con 200, el no-2xx (un 403 si la ruta
 * pasa a pedir la letra) y el éxito de verdad.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, onSave, buttonText, buttonExtra }: any) => (
    <div>
      {children}
      {buttonExtra}
      <button onClick={onSave}>{buttonText}</button>
    </div>
  ),
}));
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({ Avatar: () => null }));

import BudgetApprovalView from "../BudgetDirApprovalModal";

const execute = vi.fn();
const showToast = vi.fn();
const reLoad = vi.fn();
const onClose = vi.fn();

const renderModal = () =>
  render(
    <BudgetApprovalView
      open
      onClose={onClose}
      item={{ id: 42, status: "P", amount: 100 }}
      execute={execute}
      reLoad={reLoad}
      showToast={showToast}
    />,
  );

const approve = async () => {
  fireEvent.click(screen.getByText("Aprobar"));
  await waitFor(() => expect(showToast).toHaveBeenCalled());
};

describe("aprobar un presupuesto mira la respuesta del API", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
    reLoad.mockReset();
    onClose.mockReset();
  });

  it("HTTP 200 con success:false muestra el error del API y no cierra", async () => {
    execute.mockResolvedValue({
      data: {
        success: false,
        message: "No tienes el rol necesario para realizar esta acción",
      },
      error: null,
    });
    renderModal();
    await approve();

    expect(showToast).toHaveBeenCalledWith(
      "No tienes el rol necesario para realizar esta acción",
      "error",
    );
    expect(showToast).not.toHaveBeenCalledWith(expect.anything(), "success");
    expect(reLoad).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("un no-2xx (403) muestra el mensaje del sobre y no cierra", async () => {
    execute.mockResolvedValue({
      data: null,
      error: {
        message: "Request failed with status code 403",
        status: 403,
        data: { success: false, message: "No tiene permiso: budgets:U" },
      },
    });
    renderModal();
    await approve();

    expect(showToast).toHaveBeenCalledWith(
      "No tiene permiso: budgets:U",
      "error",
    );
    expect(showToast).not.toHaveBeenCalledWith(expect.anything(), "success");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("un 404 sin sobre usable dice que no se pudo, no que se aprobó", async () => {
    execute.mockResolvedValue({
      data: null,
      error: { message: "Request failed with status code 404", status: 404, data: {} },
    });
    renderModal();
    await approve();

    expect(showToast).toHaveBeenCalledWith(
      "No se pudo dejar el presupuesto aprobado.",
      "error",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("con success:true avisa el éxito, recarga y cierra", async () => {
    execute.mockResolvedValue({
      data: { success: true, message: "Presupuesto aprobado", data: { id: 42 } },
      error: null,
    });
    renderModal();
    await approve();

    expect(execute).toHaveBeenCalledWith(
      "/v3/budgets/change-budget",
      "POST",
      expect.objectContaining({ id: 42, status: "A" }),
      false,
      true,
    );
    expect(showToast).toHaveBeenCalledWith("Presupuesto aprobado", "success");
    expect(reLoad).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
