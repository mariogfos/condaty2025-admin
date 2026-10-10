import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudinaryAdapter } from "../adapters/CloudinaryAdapter";

describe("CloudinaryAdapter.delete", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("propaga un fallo HTTP para que el formulario pueda recuperarse", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    const adapter = new CloudinaryAdapter({ cloudName: "demo", uploadPreset: "test" });

    await expect(adapter.delete({
      path: "condaty-admin/uploads/photo", url: "", name: "photo.jpg",
      resource_type: "image",
    })).rejects.toThrow("No se pudo eliminar el archivo de Cloudinary.");
    expect(fetchMock).toHaveBeenCalledWith("/api/cloudinary-upload", expect.objectContaining({
      method: "DELETE",
    }));
  });
});
