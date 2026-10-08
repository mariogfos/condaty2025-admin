import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFileUpload } from "../useFileUpload";
import { storage } from "@/mk/services/storage/storage.service";

vi.mock("@/mk/services/storage/storage.service", () => ({
  storage: {
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));

const fileList = (file: File) =>
  ({
    0: file,
    item: (index: number) => (index === 0 ? file : null),
    length: 1,
    *[Symbol.iterator]() { yield file; },
  }) as FileList;

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:guard-photo"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("informa el fallo de la primera foto en vez de dejar el formulario ambiguo", async () => {
    const showToast = vi.fn();
    const setFormState = vi.fn();
    vi.mocked(storage.upload).mockRejectedValueOnce(
      new Error("Cloudinary unavailable"),
    );

    const { result } = renderHook(() =>
      useFileUpload({
        formState: {},
        name: "url_avatar",
        setFormState,
        showToast,
      }),
    );

    await act(async () => {
      await result.current.handleFiles(
        fileList(new File(["photo"], "guard.jpg", { type: "image/jpeg" })),
      );
    });

    expect(showToast).toHaveBeenCalledWith(
      "No se pudo subir la imagen. Revisa el archivo e intenta nuevamente.",
      "error",
    );
    expect(result.current.filePreviews).toEqual([]);
  });

  it("conserva en Cloudinary una foto ya guardada al retirarla de un formulario aún no confirmado", async () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/vehicle.jpg";
    const { result } = renderHook(() => useFileUpload({
      formState: { images: [url] }, name: "images", setFormState: vi.fn(),
      showToast: vi.fn(), preserveExistingOnRemove: true,
    }));

    expect(result.current.filePreviews).toHaveLength(1);
    await act(async () => result.current.handleDelete(0));
    expect(storage.delete).not.toHaveBeenCalled();
    expect(result.current.filePreviews).toHaveLength(0);
  });
});
