import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActiveOwner from "@/components/ActiveOwner/ActiveOwner";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  showToast: vi.fn(),
  useAxios: vi.fn(),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    showToast: mocks.showToast,
    user: { client_id: 10 },
  }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: mocks.useAxios,
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, onSave }: any) => (
    <section>
      {children}
      <button onClick={onSave} type="button">
        Guardar
      </button>
    </section>
  ),
}));

vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ label, name, onChange, options, value }: any) => (
    <label>
      {label}
      <select
        aria-label={label}
        name={name}
        onChange={onChange}
        value={value ?? ""}
      >
        <option value="">Seleccionar</option>
        {options.map((option: any) => (
          <option key={option.id} value={option.id}>
            {option.nro}
          </option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: ({ label, name, onChange, value }: any) => (
    <label>
      {label}
      <textarea
        aria-label={label}
        name={name}
        onChange={onChange}
        value={value ?? ""}
      />
    </label>
  ),
}));

const pendingResident = {
  id: 25,
  name: "Ana",
  last_name: "Pérez",
  type_owner: "Residente",
  clients: [
    {
      id: 10,
      pivot: { type: "T", status: "W", preunidad: "A-12" },
    },
  ],
};

const renderModal = (typeActive: "A" | "X", data = pendingResident) => {
  const props = {
    open: true,
    data,
    typeActive,
    onClose: vi.fn(),
    onCloseOwner: vi.fn(),
    reLoad: vi.fn(),
  };

  render(<ActiveOwner {...props} />);
  return props;
};

describe("ActiveOwner", () => {
  it("consulta y vincula una unidad sin residente al aprobar un residente pendiente", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true } });
    mocks.useAxios.mockReturnValue({
      data: { data: [{ id: 9, nro: "A-12", type: { name: "Torre" } }] },
      execute: mocks.execute,
    });

    const props = renderModal("A");

    expect(mocks.useAxios).toHaveBeenCalledWith(
      "/dptos",
      "GET",
      expect.objectContaining({ fullType: "PR" }),
      true
    );
    expect(screen.getByRole("option", { name: "Torre A-12" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Selecciona la unidad"), {
      target: { name: "dpto_id", value: "9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mocks.execute).toHaveBeenCalledWith("/activeRegister", "POST", {
        id: 25,
        dpto_id: "9",
        confirm: "A",
      });
    });
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(props.onCloseOwner).toHaveBeenCalledOnce();
    expect(props.reLoad).toHaveBeenCalledOnce();
  });

  it("rechaza la solicitud con su motivo y refresca el listado", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true } });
    mocks.useAxios.mockReturnValue({ data: { data: [] }, execute: mocks.execute });

    const props = renderModal("X");

    fireEvent.change(screen.getByLabelText("Motivo del rechazo de cuenta"), {
      target: { name: "obs", value: "La unidad indicada no coincide." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mocks.execute).toHaveBeenCalledWith("/activeRegister", "POST", {
        id: 25,
        confirm: "X",
        obs: "La unidad indicada no coincide.",
      });
    });
    expect(mocks.showToast).toHaveBeenCalledWith(
      "La cuenta fue rechazada con éxito",
      "info"
    );
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(props.onCloseOwner).toHaveBeenCalledOnce();
    expect(props.reLoad).toHaveBeenCalledOnce();
  });

  it("consulta unidades sin propietario para una solicitud de propietario", () => {
    mocks.useAxios.mockReturnValue({ data: { data: [] }, execute: mocks.execute });

    renderModal("A", {
      ...pendingResident,
      type_owner: "Propietario",
      clients: [{ id: 10, pivot: { type: "H", status: "W" } }],
    });

    expect(mocks.useAxios).toHaveBeenLastCalledWith(
      "/dptos",
      "GET",
      expect.objectContaining({ fullType: "PH" }),
      true
    );
  });
});
