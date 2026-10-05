import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RenderDel from "../RenderDel/RenderDel";

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ showToast: toast }) }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: (props: any) => <div>{props.children}<button onClick={props.onSave}>{props.buttonText}</button></div>,
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const props = (execute: any) => ({ open: true, onClose: vi.fn(), item: { id: "c-1" }, onSave: vi.fn(), execute, reLoad: vi.fn() });

describe("Deleting a condominium", () => {
  // The API refuses with a 4xx (403/422): the reason travels in `error.data`.
  it("shows the API's reason when the deletion is refused", async () => {
    const execute = vi.fn().mockResolvedValue({
      data: null,
      error: { status: 422, data: { success: false, message: "Este condominio no se puede eliminar, ya que es público." } },
    });
    render(<RenderDel {...props(execute)} />);
    fireEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Este condominio no se puede eliminar, ya que es público.", "error"));
  });

  it("closes and reloads on success", async () => {
    const p = props(vi.fn().mockResolvedValue({ data: { success: true }, error: null }));
    render(<RenderDel {...p} />);
    fireEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => expect(p.reLoad).toHaveBeenCalledTimes(1));
    expect(p.onClose).toHaveBeenCalledTimes(1);
  });
});
