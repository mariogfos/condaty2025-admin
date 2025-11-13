# Implementación de Chunking para Archivos Grandes

## Resumen
Se ha implementado la funcionalidad de división de archivos (chunking) en el hook `useCrud` para manejar la subida de archivos que superen 1MB.

## Cambios Realizados

### 1. Funciones Auxiliares Agregadas

#### `generateUUID()`
Genera un identificador único para cada upload, necesario para que el backend pueda asociar los chunks del mismo archivo.

```typescript
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, function(c) {
    const r = Math.trunc(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
```

#### `getBase64Size(base64String: string): number`
Calcula el tamaño en bytes de un string base64, considerando el padding.

```typescript
const getBase64Size = (base64String: string): number => {
  const cleanBase64 = base64String.replace(/^data:.*?;base64,/, '');
  const padding = (cleanBase64.match(/=/g) || []).length;
  return (cleanBase64.length * 3) / 4 - padding;
};
```

#### `chunkFile(base64String: string, chunkSize: number): string[]`
Divide un string base64 en chunks de tamaño específico.

```typescript
const chunkFile = (base64String: string, chunkSize: number = 1024 * 1024): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < base64String.length; i += chunkSize) {
    chunks.push(base64String.slice(i, i + chunkSize));
  }
  return chunks;
};
```

#### `sendFileInChunks()`
Maneja el envío secuencial de chunks al backend.

### 2. Modificación de la función `onSave()`

Se agregó lógica para detectar archivos grandes y enviarlos en chunks:

```typescript
// Verificar si hay archivos que necesitan ser enviados en chunks
let fileFieldToChunk: string | null = null;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

if (action !== "del") {
  for (const key in fields) {
    const field = fields[key];
    if (field.form?.type === "fileUpload" && param[key]?.file) {
      const fileSize = getBase64Size(param[key].file);
      if (fileSize > MAX_FILE_SIZE) {
        fileFieldToChunk = key;
        break;
      }
    }
  }
}
```

## Comportamiento

### Archivos < 1MB
Se envían normalmente en una sola petición con la estructura:
```json
{
  "name": "TEST 1",
  "for_to": "O",
  "descrip": "desc",
  "doc": {
    "ext": "pdf",
    "file": "JVBERi0xLjcKC..."
  }
}
```

### Archivos > 1MB
Se dividen en chunks de ~900KB y se envían secuencialmente:

**Primer chunk:**
```json
{
  "uploadId": "uuid-generado",
  "chunkIndex": 0,
  "totalChunks": 3,
  "ext": "pdf",
  "fileContents": "JVBERi0xLj...",
  "metadata": {}
}
```

**Chunks intermedios:**
```json
{
  "uploadId": "uuid-generado",
  "chunkIndex": 1,
  "totalChunks": 3,
  "ext": "pdf",
  "fileContents": "base64-del-chunk...",
  "metadata": {}
}
```

**Último chunk (incluye metadata):**
```json
{
  "uploadId": "uuid-generado",
  "chunkIndex": 2,
  "totalChunks": 3,
  "ext": "pdf",
  "fileContents": "iVBORw0KGg...",
  "metadata": {
    "name": "Manual de Usuario",
    "for_to": "A",
    "descrip": "xxx"
  }
}
```

## Características

1. **Detección automática**: El sistema detecta automáticamente archivos mayores a 1MB
2. **Feedback al usuario**: Muestra mensajes de progreso durante la subida
3. **Tamaño de chunk**: 900KB por defecto (dejando margen de seguridad)
4. **Manejo de errores**: Si falla algún chunk, se detiene el proceso y se notifica al usuario
5. **Compatibilidad**: Los archivos pequeños siguen funcionando con el método original

## Consideraciones del Backend

El backend debe:
1. Recibir y almacenar temporalmente cada chunk usando el `uploadId`
2. Responder para cada chunk con:
   - **Chunks intermedios** (Status 202 - Accepted):
     ```json
     { "success": true, "chunkIndex": 0, "msg": "Chunk recibido." }
     ```
   - **Chunks con error** (Status 400 - Bad Request):
     ```json
     { "success": false, "chunkIndex": 0, "msg": "Chunk inválido." }
     ```
3. Esperar hasta recibir todos los chunks (`chunkIndex === totalChunks - 1`)
4. En el último chunk:
   - Ensamblar los chunks en el orden correcto
   - Procesar el archivo completo junto con los metadatos
   - Responder con el resultado final (Status 200/201)
5. Limpiar los chunks temporales después del ensamblado

### Respuestas Esperadas del Backend

**Chunk intermedio exitoso (Status 202):**
```json
{
  "success": true,
  "chunkIndex": 0,
  "msg": "Chunk recibido."
}
```

**Chunk con error (Status 400):**
```json
{
  "success": false,
  "chunkIndex": 0,
  "msg": "Chunk inválido."
}
```

**Último chunk exitoso (Status 200/201):**
```json
{
  "success": true,
  "message": "Documento creado exitosamente",
  "data": {
    "id": 123,
    "name": "Manual de Usuario",
    // ... otros datos del documento
  }
}
```

## Uso

No requiere cambios en los componentes que usan `useCrud`. La funcionalidad se activa automáticamente para archivos con `form.type === "fileUpload"` que superen 1MB.

## Ejemplo de Uso (Documents.tsx)

```typescript
const fields = {
  doc: {
    rules: ["required"],
    api: "ae*",
    label: "Archivo",
    prefix: 'DOC-',
    form: {
      type: "fileUpload",
      ext: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
      maxSize: 30, // MB
      style: { width: "100%" },
    },
  },
  // ... otros campos
};
```

Automáticamente, si el archivo supera 1MB, se enviará en chunks.
