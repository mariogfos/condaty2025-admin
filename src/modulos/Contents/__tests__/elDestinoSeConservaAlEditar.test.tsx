import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddContent from "@/modulos/Contents/AddContent/AddContent";
import { ContentDestiny } from "@/modulos/Contents/contentEnums";

/**
 * El formulario del admin mandaba `destiny: "T"` FIJO al guardar, también al
 * editar. El API traduce la letra a `Todos`, así que editar una publicación
 * dirigida a los guardias la dejaba visible para toda la comunidad.
 */
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn(), user: { id: "u1" } }),
}));
vi.mock("@/mk/components/forms/UploadFileV3/UploadFileV3", () => ({
  default: () => null,
}));
vi.mock("@/modulos/Contents/AddContent/Preview", () => ({
  default: () => null,
}));

const renderForm = (item: Record<string, unknown>, action: "add" | "edit") => {
  const execute = vi.fn().mockResolvedValue({ data: { success: true } });
  render(
    <AddContent
      open
      onClose={vi.fn()}
      item={item}
      setItem={vi.fn()}
      extraData={{}}
      user={{ id: "u1" }}
      execute={execute}
      reLoad={vi.fn()}
      openList
      setOpenList={vi.fn()}
      action={action}
    />,
  );
  return execute;
};

const lastSavedDestiny = (execute: ReturnType<typeof vi.fn>) => {
  const save = execute.mock.calls.find(
    ([, method]) => method === "PUT" || method === "POST",
  );
  return save?.[2]?.destiny;
};

describe("el destino de una publicación al guardar desde el admin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("al editar conserva el destino que ya tenía", async () => {
    const execute = renderForm(
      {
        id: 7,
        isType: "P",
        type: 1,
        destiny: ContentDestiny.GUARDIAS,
        description: "Revisar el portón",
      },
      "edit",
    );

    fireEvent.click(screen.getByText("Actualizar"));

    await waitFor(() =>
      expect(lastSavedDestiny(execute)).toBe(ContentDestiny.GUARDIAS),
    );
  });

  it("al publicar va para toda la comunidad, como número", async () => {
    const execute = renderForm(
      { isType: "P", type: 1, description: "Hola" },
      "add",
    );

    fireEvent.click(screen.getByText("Publicar"));

    await waitFor(() =>
      expect(lastSavedDestiny(execute)).toBe(ContentDestiny.TODOS),
    );
  });
});
