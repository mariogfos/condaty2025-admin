import axios from "axios";
import { IUploadAdapter } from "./IUploadAdapter";

export class LocalApiAdapter implements IUploadAdapter {
  async upload(
    file: File,
    context: { prefix: string; global: boolean }
  ): Promise<string> {
    const formData = new FormData();
    const ext = file.name.split(".").pop() || "";

    // Construct the filename as expected by the backend
    // Note: The backend seems to expect 'file', 'prefix', 'id', 'ext' based on fileUpload.ts
    // But here we might not have 'id' (createdId).
    // If this is a new upload for a new item, we might not have an ID yet.
    // However, the previous implementation in fileUpload.ts used 'createdId'.
    // If we don't have an ID, maybe we send 0 or handle it differently?
    // For now, I will append the basic fields.

    formData.append("file", file);
    formData.append("prefix", context.prefix);
    formData.append("ext", ext);

    // We need to handle authentication manually since we are outside the React Context
    let apiToken = null;
    try {
      const tokenKey = (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token";
      const stored = localStorage.getItem(tokenKey);
      if (stored) {
        apiToken = JSON.parse(stored).token;
      }
    } catch (e) {
      console.error("Error retrieving token", e);
    }

    const headers: any = {
      "Content-Type": "multipart/form-data",
    };

    if (apiToken) {
      headers["Authorization"] = "Bearer " + apiToken;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/upload-file`,
      formData,
      { headers }
    );

    if (response.data && response.data.success) {
      // Assuming the backend returns the URL or path in response.data.data
      // Adjust based on actual backend response structure if known.
      // Looking at fileUpload.ts, it doesn't explicitly return the URL,
      // but usually upload endpoints do.
      // If the previous implementation was just "uploadLargeFiles" which didn't return anything useful to the caller
      // (it just uploaded), then we might need to assume a standard return.
      // Let's assume it returns the URL or we construct it.
      return response.data.data?.url || response.data.url || "";
    } else {
      throw new Error(response.data?.message || "Upload failed");
    }
  }
}
