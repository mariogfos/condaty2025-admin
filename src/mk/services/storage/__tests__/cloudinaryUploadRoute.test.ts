import { beforeEach, describe, expect, it, vi } from "vitest";
import { v2 as cloudinary } from "cloudinary";
import { DELETE } from "@/app/api/cloudinary-upload/route";

vi.mock("cloudinary", () => ({
  v2: { config: vi.fn(), uploader: { destroy: vi.fn() } },
}));

const request = (body: unknown) => new Request("http://localhost/api/cloudinary-upload", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("DELETE /api/cloudinary-upload", () => {
  beforeEach(() => vi.clearAllMocks());

  it("extrae el public ID con carpetas y acepta un recurso ya inexistente", async () => {
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValueOnce({ result: "not found" });
    const response = await DELETE(request({
      public_id: "https://res.cloudinary.com/demo/image/upload/v42/condaty-admin/uploads/old.jpg",
      resource_type: "image",
    }));

    expect(response.status).toBe(200);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      "condaty-admin/uploads/old",
      { resource_type: "image", invalidate: true },
    );
  });

  it("rechaza URLs ajenas antes de llamar a Cloudinary", async () => {
    const response = await DELETE(request({
      public_id: "https://example.com/image/upload/v1/area.jpg",
      resource_type: "image",
    }));

    expect(response.status).toBe(400);
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });
});
