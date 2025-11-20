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

    if (response.data && response.data.secure_url) {
      return response.data.secure_url;
    } else {
      throw new Error("Cloudinary upload failed");
    }
  }
}
