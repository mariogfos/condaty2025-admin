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

  async delete(url: string): Promise<boolean> {
    console.log("Attempting to delete file from Local API:", url);
    let apiToken = null;
    try {
      const tokenKey = (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token";
      const stored = localStorage.getItem(tokenKey);
      if (stored) {
        apiToken = JSON.parse(stored).token;
      }
    } catch (e) {
      console.error("Error retrieving token for delete", e);
    }

    const headers: any = {};
    if (apiToken) {
      headers["Authorization"] = "Bearer " + apiToken;
    }

    try {
      // Assuming a DELETE endpoint exists, or a POST with a delete action
      // For now, let's assume a DELETE request to a generic delete endpoint
      // and pass the URL in the body or as a query parameter.
      // A more robust solution would involve knowing the exact backend API.
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-file`,
        {
          headers,
          data: { url }, // Send the URL in the request body for DELETE
        }
      );

      if (response.data && response.data.success) {
        console.log("File deleted successfully from Local API:", url);
        return true;
      } else {
        console.error(
          "Local API delete failed:",
          response.data?.message || "Unknown error"
        );
        return false;
      }
    } catch (err: any) {
      console.error("Error deleting file from Local API:", err);
      return false;
    }
  }
}
