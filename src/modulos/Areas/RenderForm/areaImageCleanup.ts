import { storage } from "@/mk/services/storage/storage.service";

const isCloudinaryImage = (value: string) => {
  try {
    const url = new URL(value);
    return url.hostname === "res.cloudinary.com" && url.pathname.includes("/image/upload/");
  } catch {
    return false;
  }
};

export const removeUnlinkedAreaImages = async (
  originalImages: unknown,
  savedImages: unknown,
): Promise<number> => {
  if (!Array.isArray(originalImages)) return 0;

  const retained = new Set(Array.isArray(savedImages) ? savedImages : []);
  const removed = [...new Set(originalImages)].filter(
    (url): url is string =>
      typeof url === "string" && !retained.has(url) && isCloudinaryImage(url),
  );

  const results = await Promise.allSettled(
    removed.map((url) =>
      storage.delete({ path: url, url, name: "", resource_type: "image" }),
    ),
  );

  return results.filter((result) => result.status === "rejected").length;
};
