import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";
import { clearCreationIntent, loadCreationIntent, saveCreationIntent } from "../RenderForm/creationIntent";

const { toast, modal } = vi.hoisted(() => ({ toast: vi.fn(), modal: { props: null as any } }));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ user: { id: "qa-actor" }, showToast: toast }) }));
vi.mock("@/mk/components/ui/DataModalV2/DataModalV2", () => ({ default: (props: any) => {
  modal.props = props;
  return <div>{props.children}<button disabled={props.disabled} onClick={props.onSave}>{props.buttonText}</button>
    <button onClick={props.onClose}>Cerrar</button></div>;
} }));
vi.mock("@/mk/components/forms/Input/Input", () => ({ default: (props: any) =>
  <input aria-label={props.label} name={props.name} value={props.value} onChange={props.onChange} disabled={props.disabled} /> }));
vi.mock("@/mk/components/forms/Select/Select", () => ({ default: (props: any) =>
  <select aria-label={props.label} name={props.name} value={props.value} onChange={props.onChange} disabled={props.disabled}>
    <option value="">Seleccionar</option>{props.options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}</select> }));
vi.mock("@/components/layout/icons/IconsBiblioteca", () => ({ IconDepartment2: () => null }));
vi.mock("@/components/Detail/Br", () => ({ default: () => null }));

const payload = { name: "Condominio QA", type: "C", privacy: "T" };
function form(execute: any, item: any = payload) {
  const props = { open: true, item, execute, onClose: vi.fn(), reLoad: vi.fn(),
    extraData: { types: [{ id: "C", name: "Condominio" }], privacy: [{ id: "T", name: "Prueba" }] } };
  return { ...render(<RenderForm {...props} />), props };
}

beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); vi.spyOn(navigator, "onLine", "get").mockReturnValue(true); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Condominium creation protection", () => {
  it("blocks synchronous duplicate calls, fields and close while saving", async () => {
    let resolve!: (value: any) => void;
    const execute = vi.fn(() => new Promise((done) => { resolve = done; }));
    const { props } = form(execute);
    const save = modal.props.onSave;
    act(() => { void save(); void save(); void save(); });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    expect(screen.getByLabelText("Nombre del condominio")).toBeDisabled();
    fireEvent.click(screen.getByText("Cerrar"));
    expect(props.onClose).not.toHaveBeenCalled();
    await act(async () => resolve({ data: { success: true, message: "Guardado", data: "id" } }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(loadCreationIntent("qa-actor")).toBeNull();
  });

  it("retries a lost response with exactly the same payload and UUID", async () => {
    const execute = vi.fn().mockResolvedValueOnce({ data: null, error: { status: 0 } })
      .mockResolvedValueOnce({ data: { success: true } });
    form(execute);
    fireEvent.click(screen.getByText("Guardar"));
    await screen.findByText("Reintentar y verificar");
    expect(screen.getByLabelText("Nombre del condominio")).toBeDisabled();
    fireEvent.click(screen.getByText("Reintentar y verificar"));
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(execute.mock.calls[0][2]).toEqual(execute.mock.calls[1][2]);
    expect(execute.mock.calls[0][2].request_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("restores pending intent after closing/reopening and does not share it with another actor", async () => {
    const execute = vi.fn().mockRejectedValue(new Error("Disconnected"));
    const first = form(execute);
    fireEvent.click(screen.getByText("Guardar"));
    await screen.findByText("Reintentar y verificar");
    const original = execute.mock.calls[0][2];
    first.unmount();
    expect(loadCreationIntent("other-actor")).toBeNull();
    form(execute, {});
    expect(screen.getByLabelText("Nombre del condominio")).toHaveValue(payload.name);
    fireEvent.click(screen.getByText("Reintentar y verificar"));
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(execute.mock.calls[1][2]).toEqual(original);
  });

  it("retains the intent after 5xx even with an error envelope", async () => {
    form(vi.fn().mockResolvedValue({ data: { success: false }, error: { status: 500 } }));
    fireEvent.click(screen.getByText("Guardar"));
    await screen.findByText("Reintentar y verificar");
    expect(loadCreationIntent("qa-actor")).not.toBeNull();
  });

  it("keeps the same intent across remounts when session storage is unavailable", async () => {
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    const execute = vi.fn().mockResolvedValueOnce({ data: null, error: { status: 0 } })
      .mockResolvedValueOnce({ data: { success: true } });
    const first = form(execute);
    fireEvent.click(screen.getByText("Guardar"));
    await screen.findByText("Reintentar y verificar");
    const original = execute.mock.calls[0][2];
    first.unmount();
    form(execute, {});
    fireEvent.click(screen.getByText("Reintentar y verificar"));
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(execute.mock.calls[1][2]).toEqual(original);
    expect(loadCreationIntent("qa-actor")).toBeNull();
    get.mockRestore();
    set.mockRestore();
  });

  it("allows correcting validated rejection and generates a new intent", async () => {
    const execute = vi.fn().mockResolvedValue({ data: null, error: { status: 422, data: { success: false, message: "Datos inválidos" } } });
    form(execute);
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Datos inválidos", "error"));
    expect(loadCreationIntent("qa-actor")).toBeNull();
    expect(screen.getByLabelText("Nombre del condominio")).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nombre del condominio"), { target: { value: "Otro condominio" } });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(execute.mock.calls[0][2].request_id).not.toEqual(execute.mock.calls[1][2].request_id);
  });

  it("does not send while explicitly offline", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const execute = vi.fn();
    form(execute);
    fireEvent.click(screen.getByText("Guardar"));
    expect(execute).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.stringContaining("No hay conexión"), "error");
  });

  it("does not discard an intent after a malformed server response", async () => {
    form(vi.fn().mockResolvedValue({ data: { message: "Unexpected response" } }));
    fireEvent.click(screen.getByText("Guardar"));
    await screen.findByText("Reintentar y verificar");
    expect(loadCreationIntent("qa-actor")).not.toBeNull();
  });

  it("keeps edits as PUT without a creation token", async () => {
    const execute = vi.fn().mockResolvedValue({ data: { success: true } });
    form(execute, { ...payload, id: "existing-id" });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => expect(execute).toHaveBeenCalledWith("/clients/existing-id", "PUT", payload));
  });

  it("validates storage and does not clear a newer pending intent", () => {
    const intent = { request_id: crypto.randomUUID(), payload };
    saveCreationIntent("qa-actor", intent);
    clearCreationIntent("qa-actor", crypto.randomUUID());
    expect(loadCreationIntent("qa-actor")).toEqual(intent);
    sessionStorage.setItem("condaty:pending-condominium:v1:qa-actor", "invalid-json");
    expect(loadCreationIntent("qa-actor")).toBeNull();
  });
});
