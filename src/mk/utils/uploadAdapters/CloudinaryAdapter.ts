import axios from "axios";
import { IUploadAdapter } from "./IUploadAdapter";

export class CloudinaryAdapter implements IUploadAdapter {
  async upload(
    file: File,
    context: { prefix: string; global: boolean }
  ): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration missing");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    // Add context/tags if needed
    formData.append("folder", context.prefix);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      formData
    );

    if (response.data && response.data.publicIdWithExtension) {
      return response.data.publicIdWithExtension;
    } else {
      throw new Error("Cloudinary upload failed");
    }
  }

  async delete(url: string): Promise<boolean> {
    try {
      // Extract public_id from the Cloudinary URL
      const parts = url.split("/");
      const uploadIndex = parts.indexOf("upload");
      if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) {
        console.error("Invalid Cloudinary URL for deletion:", url);
        return false;
      }
      const publicIdWithExtension = parts.slice(uploadIndex + 2).join("/");
      const public_id = publicIdWithExtension.split(".")[0]; // Remove extension

      if (!public_id) {
        console.error("Could not extract public ID from the URL:", url);
        return false;
      }

      const response = await axios.delete("/api/cloudinary-upload", {
        data: { public_id }, // Send public_id in the request body for DELETE
      });

      if (response.status === 200) {
        console.log(`Successfully deleted ${url} from Cloudinary.`);
        return true;
      } else {
        console.error("Cloudinary deletion failed:", response.data);
        return false;
      }
    } catch (error) {
      console.error("Error deleting file from Cloudinary:", error);
      return false;
    }
  }
}
