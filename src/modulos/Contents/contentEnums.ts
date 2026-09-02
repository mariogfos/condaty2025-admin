/**
 * Qué clase de publicación es — espejo de
 * `App\Modules\Contents\Enums\ContentType` del API.
 *
 * 🔴 **Era `'I'`/`'D'`/`'V'` y ahora es un número** (api#461).
 *
 * ## Por qué éste es distinto de los flips anteriores
 *
 * En `types.is_fixed` y `events.destiny` las comparaciones del front estaban
 * **inertes**. Acá **funcionan**, y son muchas: esta pantalla decide con ellas
 * qué botón queda activo, qué campo mostrar y qué columna pintar en la lista.
 *
 * Con la columna numérica todas darían `false`: el formulario se abriría sin
 * ningún tipo seleccionado y la lista dejaría de distinguir imagen de video, sin
 * un solo error.
 *
 * En producción hay **140 imágenes, 2 documentos y 1 video** sobre 143
 * publicaciones: los tres valores están en uso.
 *
 * ## Por qué desde 1 y no desde 0
 *
 * `0 == ""` es `true` en JavaScript, y el `Select` compartido del admin
 * auto-elige la opción con id 0 como si el usuario la hubiera tocado (CDT-30).
 */

export const ContentType = {
  IMAGEN: 1,
  DOCUMENTO: 2,
  VIDEO: 3,
} as const;

/**
 * 🔴 Compara contra el número **sin importar si llegó como número o como
 * string**: el payload entra sin tipo y el mismo campo viaja de las dos formas.
 */
export const esTipo = (valor: unknown, tipo: number): boolean =>
  valor !== null && valor !== undefined && valor !== "" && Number(valor) === tipo;

export const esImagen = (valor: unknown): boolean => esTipo(valor, ContentType.IMAGEN);
export const esDocumento = (valor: unknown): boolean => esTipo(valor, ContentType.DOCUMENTO);
export const esVideo = (valor: unknown): boolean => esTipo(valor, ContentType.VIDEO);

/**
 * Las opciones del selector de tipo y del filtro de la lista.
 *
 * 🔴 Vivían escritas a mano en `Contents.tsx` con los ids `"I"`, `"V"` y `"D"`,
 * o sea con los chars que la columna dejó de tener. Van acá, al lado del enum
 * que definen, para que no vuelvan a quedar de un lado del flip.
 *
 * ⚠️ El `ext` de cada tipo es del formulario, no del enum: dice qué archivos
 * acepta el input de subida.
 */
export const OPCIONES_DE_TIPO = [
  { id: ContentType.IMAGEN, name: "Imagen", ext: "png,jpg,jpeg,svg" },
  { id: ContentType.VIDEO, name: "Video", ext: "mp4" },
  { id: ContentType.DOCUMENTO, name: "Documento", ext: "pdf,doc,docx" },
];

/** El mismo catálogo con el «Todos» que el filtro de la lista necesita. */
export const FILTRO_DE_TIPO = [
  { id: "ALL", name: "Todos" },
  { id: ContentType.DOCUMENTO, name: "Documento" },
  { id: ContentType.VIDEO, name: "Video" },
  { id: ContentType.IMAGEN, name: "Imagen" },
];

/**
 * A quién va dirigida — espejo de `ContentDestiny`.
 *
 * ⚠️ En producción está **143 de 143 en "Todos"**: los otros tres existen en el
 * formulario y nunca se usaron.
 *
 * ⚠️ `lComDestinies` de `@/mk/utils/utils` sigue en letras porque lo comparte
 * **Encuestas**, que no está migrado. Por eso Contenidos se lleva su propia
 * lista, igual que Eventos.
 */
export const ContentDestiny = {
  TODOS: 1,
  DEPARTAMENTOS: 2,
  GUARDIAS: 3,
  RESIDENTES: 4,
} as const;

export const OPCIONES_DE_DESTINO = [
  { id: ContentDestiny.TODOS, name: "Todos" },
  { id: ContentDestiny.DEPARTAMENTOS, name: "Departamentos" },
  { id: ContentDestiny.GUARDIAS, name: "Guardias" },
  { id: ContentDestiny.RESIDENTES, name: "Residentes" },
];
