// Utilities to handle chunked uploads

export const BYTES_IN_MB = 1024 * 1024;

export const DEFAULT_MAX_FILE_SIZE = 0.9 * BYTES_IN_MB; // 0.9 MB
export const DEFAULT_CHUNK_BYTES = 0.5 * BYTES_IN_MB; // 0.5 MB

export const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, function (c) {
        const r = Math.trunc(Math.random() * 16);
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const chunkFile = (base64String: string, chunkSize: number = 512 * 1024): string[] => {
    const chunks: string[] = [];
    for (let i = 0; i < base64String.length; i += chunkSize) {
        chunks.push(base64String.slice(i, i + chunkSize));
    }
    return chunks;
};

export const getBase64Size = (base64String: string): number => {
    const cleanBase64 = base64String.replace(/^data:.*?;base64,/, '');
    const padding = (cleanBase64.match(/=/g) || []).length;
    return (cleanBase64.length * 3) / 4 - padding;
};

type UploadArgs = {
    execute: Function;
    url: string;
    method: string;
    data: Record<string, any>;
    fileField: string;
    showToast: Function;
    setChunkUpload: Function;
    modNoWaiting?: boolean;
};

export const uploadFileInChunks = async ({
    execute,
    url,
    method,
    data,
    fileField,
    showToast,
    setChunkUpload,
    modNoWaiting = false,
}: UploadArgs) => {
    const fileData = data[fileField];
    if (!fileData?.file) {
        throw new Error('No se encontró el archivo para enviar');
    }

    const base64Content = fileData.file.replace(/^data:.*?;base64,/, '');
    const CHUNK_BYTES = DEFAULT_CHUNK_BYTES; // bytes per chunk
    const CHUNK_SIZE = Math.ceil(CHUNK_BYTES / 3) * 4;
    const chunks = chunkFile(base64Content, CHUNK_SIZE);
    const uploadId = generateUUID();
    const totalChunks = chunks.length;

    showToast(`Subiendo archivo en ${totalChunks} partes...`, 'info');

    // prepare metadata (all fields except file)
    const metadata: Record<string, any> = {};
    for (const key in data) {
        if (key !== fileField) metadata[key] = data[key];
    }

    let lastResponse: any = null;

    try {
        setChunkUpload({ active: true, total: totalChunks, sent: 0, pending: totalChunks, paquete: 1 });

        for (let i = 0; i < totalChunks; i++) {
            const isLastChunk = i === totalChunks - 1;
            const chunkData: Record<string, any> = {
                uploadId,
                chunkIndex: i,
                totalChunks,
                ext: fileData.ext,
                fileContents: chunks[i],
                metadata: isLastChunk ? metadata : {},
            };

            const { data: response } = await execute(url, method, chunkData, false, modNoWaiting);

            if (!response?.success) {
                const errorMsg = response?.msg || response?.message || `Error al enviar chunk ${i + 1}`;
                throw new Error(errorMsg);
            }

            lastResponse = { data: response };

            setChunkUpload((old: any) => ({ ...old, sent: i + 1, pending: Math.max(0, totalChunks - (i + 1)) }));

            if (!isLastChunk) {
                showToast(`Subiendo... ${Math.round(((i + 1) / totalChunks) * 100)}%`, 'info');
            }
        }

        return lastResponse;
    } finally {
        setChunkUpload((old: any) => ({ ...old, active: false }));
    }
};
