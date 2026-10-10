import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";
import { removeUnlinkedAreaImages } from "../RenderForm/areaImageCleanup";

const mocks = vi.hoisted(() => ({ showToast: vi.fn() }));

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

const advanceToSave = () => {
  fireEvent.click(screen.getByRole("button", { name: "Quitar foto" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
};

describe("edición de fotos de un área", () => {
  beforeEach(() => vi.clearAllMocks());

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
});
