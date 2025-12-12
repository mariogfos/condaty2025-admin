import { logError } from "../utils/logs";

export type FileToUploadType = {
    fieldKey: string;
    value: any;
    ext: string;
    prefix: string;
};

export const estimateBase64Bytes = (b64: string) => {
    if (!b64) return 0;
    const len = b64.length;
    const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
    return Math.ceil((len * 3) / 4) - padding;
};

export const base64ToBlob = (b64: string, ext: string) => {
    // atob expects raw base64 (not URI encoded)
    const byteCharacters = atob(b64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    let mime = "application/octet-stream";
    const iext = (ext || "").toLowerCase();
    if (iext === "pdf") mime = "application/pdf";
    else if (["jpg", "jpeg"].includes(iext)) mime = "image/jpeg";
    else if (iext === "png") mime = "image/png";
    else if (iext === "webp") mime = "image/webp";
    return new Blob([byteArray], { type: mime });
};

export const detectLargeFilesAndStrip = (
    data: Record<string, any>,
    fields: Record<string, any>,
    param: Record<string, any>,
    uploadLimitMB: number = 1
) => {
    const filesToUpload: FileToUploadType[] = [];
    const uploadLimitBytes = uploadLimitMB * 1024 * 1024;

    for (const key in fields) {
        const f = fields[key];
        if (f?.form?.type === "fileUpload" && data[key]) {
            const val = data[key];
            if (val && typeof val === "object" && val.file && val.file !== "delete") {
                let b64 = val.file;
                try {
                    b64 = decodeURIComponent(b64);
                } catch (e) { }
                if (b64.includes("base64,")) b64 = b64.split("base64,")[1];
                const estBytes = estimateBase64Bytes(b64);
                if (estBytes > uploadLimitBytes) {
                    filesToUpload.push({
                        fieldKey: key,
                        value: val,
                        ext: val.ext || f?.form?.ext || "",
                        prefix: (f?.prefix || "DOC").replace(/-$/g, ""),
                    });
                    if (param[key]) delete param[key];
                }
            }
        }
    }

    return { param, filesToUpload };
};

export const uploadLargeFiles = async (
    filesToUpload: FileToUploadType[],
    createdId: number | string,
    execute: Function,
    noWaiting: boolean | undefined,
    showToast: Function
) => {
    for (const f of filesToUpload) {
        try {
            let b64 = f.value.file;
            try {
                b64 = decodeURIComponent(b64);
            } catch (e) { }
            if (b64.includes("base64,")) b64 = b64.split("base64,")[1];

            const blob = base64ToBlob(b64, f.ext);
            const formData = new FormData();
            formData.append("file", blob, `${f.prefix}-${createdId}.${f.ext}`);
            formData.append("prefix", f.prefix);
            formData.append("id", String(createdId));
            formData.append("ext", f.ext);

            // Debug: print minimal FormData summary
            try {
                const entries: any[] = [];
                for (const e of (formData as any).entries()) {
                    const key = e[0];
                    const val = e[1];
                    if (val instanceof Blob) entries.push({ key, type: val.type, size: (val as any).size });
                    else entries.push({ key, value: String(val).slice(0, 200) });
                }
                console.info("[fileUpload util] FormData summary:", entries);
            } catch (e) {
                console.info("[fileUpload util] Could not enumerate FormData entries", e);
            }

            const { data: uploadResp, error: uploadErr } = await execute(
                "/upload-file",
                "POST",
                formData,
                false,
                noWaiting
            );
            if (!uploadResp?.success) {
                showToast("No se pudo subir el archivo " + f.fieldKey, "error");
                logError("Upload file error", uploadErr || uploadResp);
            }
        } catch (e) {
            logError("Error uploading file:", e);
            showToast("Error subiendo archivo", "error");
        }
    }
};

export default {
    estimateBase64Bytes,
    base64ToBlob,
    detectLargeFilesAndStrip,
    uploadLargeFiles,
};
