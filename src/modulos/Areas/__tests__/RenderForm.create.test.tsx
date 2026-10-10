import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";

const mocks = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: mocks.showToast }),
}));
vi.mock("@/mk/utils/validate/Rules", () => ({
  checkRules: ({ errors }: { errors: Record<string, string> }) => errors,
  hasErrors: () => false,
}));
vi.mock("../RenderForm/Partes/FirstPart", () => ({ default: () => <div>Paso uno</div> }));
vi.mock("../RenderForm/Partes/SecondPart", () => ({ default: () => <div>Paso dos</div> }));
vi.mock("../RenderForm/Partes/ThirdPart", () => ({ default: () => <div>Paso tres</div> }));
vi.mock("../RenderForm/Partes/FourPart", () => ({ default: () => <div>Paso cuatro</div> }));
vi.mock("@/components/StepProgressBar/StepProgressBar", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/HeaderBack/HeaderBack", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: () => null }));

const area = {
  images: ["https://example.com/area.jpg"],
  title: "Terraza",
  description: "Área social",
  max_capacity: 10,
  status: "A",
  booking_mode: "day",
  available_days: ["monday"],
};

const setup = (execute: ReturnType<typeof vi.fn>) => {
  const onClose = vi.fn();
  render(
    <RenderForm
      item={area}
      execute={execute}
      onClose={onClose}
      setOpenList={vi.fn()}
      reLoad={vi.fn()}
    />,
  );
  return { onClose };
};

const advanceToSave = () => {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
};

describe("creación de área social", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envía una sola creación aunque se pulse Guardar dos veces", async () => {
    let finishRequest!: (value: unknown) => void;
    const execute = vi.fn().mockReturnValue(new Promise((resolve) => { finishRequest = resolve; }));
    const { onClose } = setup(execute);

    advanceToSave();
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
    const { onClose } = setup(execute);

    advanceToSave();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByRole("button", { name: "Verificar guardado" });
    fireEvent.click(screen.getByRole("button", { name: "Verificar guardado" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[1][2]).toEqual(execute.mock.calls[0][2]);
  });
});
