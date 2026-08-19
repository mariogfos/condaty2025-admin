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
});
