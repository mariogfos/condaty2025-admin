import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";
import { removeUnlinkedAreaImages } from "../RenderForm/areaImageCleanup";

const mocks = vi.hoisted(() => ({ showToast: vi.fn(), catalogAvailable: false }));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: { data: { enabled: mocks.catalogAvailable, sectors: [{ id: 1, name: "Norte" }, { id: 2, name: "Sur" }] } },
    execute: vi.fn(),
  }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: mocks.showToast }),
}));
vi.mock("@/mk/utils/validate/Rules", () => ({
  checkRules: ({ errors }: { errors: Record<string, string> }) => errors,
  hasErrors: () => false,
}));
vi.mock("../RenderForm/areaImageCleanup", () => ({
  removeUnlinkedAreaImages: vi.fn().mockResolvedValue(0),
}));
vi.mock("../RenderForm/Partes/FirstPart", () => ({
  default: ({ setFormState, onUploadStateChange }: any) => (
    <div>
      <button onClick={() => setFormState((state: any) => ({ ...state, images: [] }))}>
        Quitar foto
      </button>
      <button onClick={() => onUploadStateChange(true)}>Subiendo</button>
    </div>
  ),
}));
vi.mock("../RenderForm/Partes/SecondPart", () => ({ default: () => <div>Paso dos</div> }));
vi.mock("../RenderForm/Partes/ThirdPart", () => ({ default: () => <div>Paso tres</div> }));
vi.mock("../RenderForm/Partes/FourPart", () => ({ default: () => <div>Paso cuatro</div> }));
vi.mock("@/components/StepProgressBar/StepProgressBar", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/HeaderBack/HeaderBack", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: () => null }));

const oldPhoto = "https://res.cloudinary.com/demo/image/upload/v1/condaty-admin/old.jpg";
const area = {
  id: 7, images: [oldPhoto], title: "Salón", description: "Área social",
  max_capacity: 10, status: "A", booking_mode: "day", available_days: ["monday"],
};

const setup = (execute: ReturnType<typeof vi.fn>) => {
  const onClose = vi.fn();
  render(
    <RenderForm
      item={area} execute={execute} onClose={onClose}
      setOpenList={vi.fn()} reLoad={vi.fn()}
    />,
  );
  return { onClose };
};

const setupCreate = (execute: ReturnType<typeof vi.fn>) => {
  const onClose = vi.fn();
  render(
    <RenderForm
      item={{ ...area, id: undefined }} execute={execute} onClose={onClose}
      setOpenList={vi.fn()} reLoad={vi.fn()}
    />,
  );
  return { onClose };
};

const advanceToSave = () => {
  fireEvent.click(screen.getByRole("button", { name: "Quitar foto" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
};

describe("formulario de área social", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.catalogAvailable = false;
  });

  it("guarda varios sectores y la restricción desde el formulario del área", async () => {
    mocks.catalogAvailable = true;
    const execute = vi.fn().mockResolvedValue({ data: { success: true, message: "Guardada" } });
    setup(execute);

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    const sectorSearch = screen.getByRole("combobox", { name: /^Sectores/ });
    const restriction = screen.getByRole("checkbox", { name: "Solo visible y reservable por residentes de estos sectores" });
    expect(restriction).toBeDisabled();
    fireEvent.focus(sectorSearch);
    fireEvent.click(screen.getByRole("option", { name: "Norte" }));
    fireEvent.click(sectorSearch);
    fireEvent.click(screen.getByRole("option", { name: "Sur" }));
    fireEvent.click(restriction);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(execute).toHaveBeenCalledWith("/areas/7", "PUT", expect.objectContaining({
      sector_ids: [1, 2],
      restrict_to_sectors: true,
    })));
  });

  it("no borra fotos anteriores si falla el guardado", async () => {
    const execute = vi.fn().mockResolvedValue({ error: { message: "Falló el guardado" } });
    const { onClose } = setup(execute);

    advanceToSave();

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    expect(removeUnlinkedAreaImages).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("limpia la foto anterior solo después de guardar el área", async () => {
    const execute = vi.fn().mockResolvedValue({ data: { success: true, message: "Guardada" } });
    const { onClose } = setup(execute);

    advanceToSave();

    await waitFor(() => expect(removeUnlinkedAreaImages).toHaveBeenCalledWith(
      [oldPhoto], [],
    ));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("impide avanzar mientras se suben las fotos", () => {
    const execute = vi.fn();
    setup(execute);

    fireEvent.click(screen.getByRole("button", { name: "Subiendo" }));

    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    expect(screen.queryByText("Paso dos")).not.toBeInTheDocument();
    expect(execute).not.toHaveBeenCalled();
  });

  it("envía una sola creación aunque se pulse Guardar dos veces", async () => {
    let finishRequest!: (value: unknown) => void;
    const execute = vi.fn().mockReturnValue(new Promise((resolve) => { finishRequest = resolve; }));
    const { onClose } = setupCreate(execute);

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardando..." }));

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][0]).toBe("/areas");
    expect(execute.mock.calls[0][1]).toBe("POST");
    expect(execute.mock.calls[0][2].request_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();

    finishRequest({ data: { success: true, message: "Guardada" } });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Guardada" }));
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("reintenta el mismo intento si no pudo confirmar la respuesta", async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce({ error: { message: "Sin respuesta", status: 0 } })
      .mockResolvedValueOnce({ data: { success: true, message: "Guardada" } });
    const { onClose } = setupCreate(execute);

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByRole("button", { name: "Verificar guardado" });
    fireEvent.click(screen.getByRole("button", { name: "Verificar guardado" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[1][2]).toEqual(execute.mock.calls[0][2]);
  });
});
