import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_CLOUDINARY_API_SECRET,
});

export async function DELETE(request: Request) {
  try {
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    // Extract public_id if a full URL is provided
    const extractedPublicId = public_id.includes("res.cloudinary.com")
      ? public_id.split("/").pop()?.split(".")[0]
      : public_id;

    if (!extractedPublicId) {
      return NextResponse.json(
        { error: "Could not extract public ID from the provided value" },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(extractedPublicId);

    if (result.result === "ok") {
      return NextResponse.json(
        { message: "Asset deleted successfully", result },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to delete asset", result },
        { status: 500 }
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
