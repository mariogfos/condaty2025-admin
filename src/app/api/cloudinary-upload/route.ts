import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_CLOUDINARY_API_SECRET,
});

export async function DELETE(request: Request) {
  try {
    const { public_id, resource_type = "image" } = await request.json();

    if (typeof public_id !== "string" || !public_id.trim()) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }
    // Esta ruta se usa para fotos. No ampliar un DELETE público a otros recursos.
    if (resource_type !== "image") {
      return NextResponse.json(
        { error: "Only image resources are supported" },
        { status: 400 }
      );
    }

    let extractedPublicId = public_id.trim();
    if (/^https?:\/\//i.test(extractedPublicId)) {
      const url = new URL(extractedPublicId);
      const uploadPath = `/${resource_type}/upload/`;
      const uploadIndex = url.pathname.indexOf(uploadPath);
      if (url.hostname !== "res.cloudinary.com" || uploadIndex < 0) {
        return NextResponse.json({ error: "Invalid Cloudinary URL" }, { status: 400 });
      }
      extractedPublicId = decodeURIComponent(url.pathname.slice(uploadIndex + uploadPath.length))
        .replace(/^v\d+\//, "");
      extractedPublicId = extractedPublicId.replace(/\.[^./]+$/, "");
    }

    if (!extractedPublicId) {
      return NextResponse.json(
        { error: "Could not extract public ID from the provided value" },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(extractedPublicId, {
      resource_type,
      invalidate: true,
    });

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json(
        { message: "Asset deleted successfully", result },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to delete asset", result },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Cloudinary DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
