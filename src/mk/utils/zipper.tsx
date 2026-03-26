const pako = require("pako");

export function compressBase64(base64Data: string) {
  const binaryData = Uint8Array.from(atob(base64Data), (char) =>
    char.charCodeAt(0)
  );
  const compressedData = pako.gzip(binaryData);
  return btoa(String.fromCharCode(...compressedData));
}
