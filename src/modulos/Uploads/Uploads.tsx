"use client";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import {
  IconArrowUp,
  IconCash,
  IconDocs,
  IconDownload,
  IconHomeOwner,
} from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import List from "@/mk/components/ui/List/List";
import Input from "@/mk/components/forms/Input/Input";
import styles from "./Uploads.module.css";

type UploadType = "propietarios" | "expensas" | "deudas";

/** A partir de cuántos errores aparece el buscador. Con tres, estorba. */
const MINIMO_PARA_BUSCAR = 6;

/**
 * Pasa cualquier valor a un texto legible. Nunca devuelve "descartalo".
 *
 * 🔴 El normalizador viejo devolvía `""` para todo lo que no fuera un string ni
 * un objeto con `error`, y el `.filter()` de abajo lo borraba: un número pelado,
 * un objeto sin esa clave o un array anidado desaparecían **en silencio**. Un
 * error que no se pinta se lee igual que un error que no existe.
 */
const comoTexto = (valor: unknown): string => {
  if (typeof valor === "string") return valor;
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object") {
    try {
      return JSON.stringify(valor);
    } catch {
      // Referencia circular: no se puede serializar, pero algo hay que mostrar.
      return String(valor);
    }
  }
  return String(valor);
};

/** Un elemento suelto de `errors[]` → las líneas que le corresponden. */
const comoLineas = (item: unknown): string[] => {
  // ⚠️ Recursivo, no `.flat()`: `.flat()` baja UN solo nivel y lo que quedaba
  // más adentro se descartaba sin dejar rastro.
  if (Array.isArray(item)) return item.flatMap(comoLineas);

  // Un hueco no trae ningún dato que mostrar, y pintar «null» es peor que no
  // pintar nada. Es lo ÚNICO que se descarta.
  if (item === null || item === undefined) return [];

  if (typeof item === "object" && "error" in item) {
    const { row, error } = item as { row?: unknown; error?: unknown };
    // `String(error)` daba «[object Object]» cuando el motivo venía anidado y
    // «undefined» cuando no venía: dos carteles que no dicen nada.
    const motivo = comoTexto(error).trim() || "sin motivo";
    // ⚠️ `row === undefined || row === null`, no `!row`: la fila 0 es una fila.
    return row === undefined || row === null
      ? [motivo]
      : [`Fila ${comoTexto(row)}: ${motivo}`];
  }

  const texto = comoTexto(item).trim();
  return texto ? [texto] : [];
};

/**
 * Deja la lista de errores del API en `string[]`, venga como venga.
 *
 * 🔴 `errors` NO tiene una forma sola, y suponerla era el bug: la pantalla
 * ofrece los tres tipos y cada importador del back arma la lista a su manera.
 * Medido leyendo los cuatro services el 2026-08-18:
 *
 * | `type`                   | forma real                                            |
 * |--------------------------|-------------------------------------------------------|
 * | `deudas`, `pagoexpensas` | `string[]` — `"Fila 5: Unidad 101 no existe…"`        |
 * | `expensas`               | `{row, error, data}[]`, cortada en 20/50 por el back  |
 * | `owners`                 | `string[]`, y **un `string` pelado** en el camino de  |
 * |                          | "Faltan datos de propietario o dpto"                  |
 *
 * Y con `400` de validación llega el bag de Laravel, que es un objeto
 * `{campo: [mensaje]}`. Son cuatro formas para un mismo cartel — más las que
 * todavía no vimos, que por eso no se descartan: se muestran como se pueda.
 */
const comoListaDeErrores = (errors: unknown): string[] => {
  if (errors === null || errors === undefined) return [];
  // El bag de Laravel es un objeto SUELTO, sin `error`: sus valores son la
  // lista. Adentro de un array, en cambio, un objeto es una fila.
  if (
    typeof errors === "object" &&
    !Array.isArray(errors) &&
    !("error" in errors)
  ) {
    return Object.values(errors as Record<string, unknown>).flatMap(comoLineas);
  }
  return comoLineas(errors);
};

/**
 * El renglón que acompaña al mensaje del API cuando la importación entró igual.
 *
 * `exacto` es si el back mandó `total_errors`. Sin ese dato la lista puede venir
 * cortada y el número que tenemos es un piso, no un total: se dice "al menos".
 */
const textoDeRechazadas = (cantidad: number, exacto: boolean): string => {
  const filas = cantidad === 1 ? "1 fila" : `${cantidad} filas`;
  return exacto
    ? `Se rechazaron ${filas}.`
    : `Se rechazaron al menos ${filas}.`;
};

const options = [
  {
    id: "propietarios" as UploadType,
    title: "Propietarios / Unidades",
    subtitle: "Gestionar información de propietarios.",
    icon: IconHomeOwner,
  },
  {
    id: "expensas" as UploadType,
    title: "Expensas",
    subtitle: "Gestionar información de expensas.",
    icon: IconCash,
  },
  {
    id: "deudas" as UploadType,
    title: "Deudas",
    subtitle: "Gestionar información de deudas.",
    icon: IconDocs,
  },
];

export default function Uploads() {
  const [selectedType, setSelectedType] = useState<UploadType>("propietarios");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<"subir" | "simular" | null>(
    null,
  );
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  /** `total_errors` del API, o `null` si ese importador no lo manda. */
  const [totalErrores, setTotalErrores] = useState<number | null>(null);
  const [errorFilter, setErrorFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { execute } = useAxios();
  const { showToast } = useAuth();

  const selectedTitle = useMemo(() => {
    return (
      options.find((item) => item.id === selectedType)?.title || "Propietarios"
    );
  }, [selectedType]);

  const erroresVisibles = useMemo(() => {
    const buscado = errorFilter.trim().toLowerCase();
    if (!buscado) return uploadErrors;
    return uploadErrors.filter((linea) =>
      linea.toLowerCase().includes(buscado),
    );
  }, [uploadErrors, errorFilter]);

  /**
   * ⚠️ El título NO puede afirmar un total que no sabe. `total_errors` lo manda
   * sólo `expensas` (medido: es el único de los cuatro services que lo pone en
   * el sobre), y es el único caso en el que la cantidad real se conoce — el back
   * corta `errors` en 20/50. Sin ese dato el cartel habla de lo que MUESTRA.
   */
  const tituloErrores = useMemo(() => {
    const mostrados = uploadErrors.length;
    if (totalErrores === null) {
      return mostrados === 1
        ? "Se muestra 1 problema del archivo:"
        : `Se muestran ${mostrados} problemas del archivo:`;
    }
    if (totalErrores > mostrados) {
      return `Se encontraron ${totalErrores} problemas en el archivo (se muestran los primeros ${mostrados}):`;
    }
    return totalErrores === 1
      ? "Se encontró 1 problema en el archivo:"
      : `Se encontraron ${totalErrores} problemas en el archivo:`;
  }, [uploadErrors.length, totalErrores]);

  const isAllowedFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    return extension === "xls" || extension === "xlsx";
  };

  const apiTypeBySelection: Record<
    UploadType,
    "owners" | "expensas" | "deudas"
  > = {
    propietarios: "owners",
    expensas: "expensas",
    deudas: "deudas",
  };

  const templateUrlBySelection: Record<UploadType, string> = {
    propietarios:
      "https://docs.google.com/spreadsheets/d/1VXEh5m2MFjkWlQN71Jnww9hS4Hu-8UDF9NIuXoIW5SM/edit?gid=822536245#gid=822536245",
    expensas:
      "https://docs.google.com/spreadsheets/d/1na5SIOQ4bsACujQ3WHuhNDO_hola2Dca_Psya87Yv8c/edit?gid=53833243#gid=53833243",
    deudas:
      "https://docs.google.com/spreadsheets/d/1WiXlx-fTCtoEr3KTt90Ue0eALuGjOOtPthu57tW78YQ/edit?gid=765600991#gid=765600991",
  };

  const setNewFile = (file?: File) => {
    if (!file) return;
    if (!isAllowedFile(file)) {
      setSelectedFile(null);
      setFileError("Solo se permiten archivos .xls o .xlsx");
      limpiarResultado();
      return;
    }
    setSelectedFile(file);
    setFileError("");
    limpiarResultado();
  };

  const onInputFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewFile(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setNewFile(event.dataTransfer.files?.[0]);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const limpiarResultado = () => {
    setUploadMessage("");
    setUploadErrors([]);
    setTotalErrores(null);
    setErrorFilter("");
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileError("");
    limpiarResultado();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileSize = (size: number) => {
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * `simular` corre el importador de verdad y revierte SIEMPRE, así que
   * devuelve los errores reales sin tocar el padrón.
   *
   * 🔴 El backend lo soporta desde CDT-73 y hasta el 2026-08-30 esta pantalla
   * —la única que llama al endpoint— nunca mandaba el flag: la red de
   * seguridad existía y no había forma de usarla. Importa porque
   * `type=owners` con `clean=1` arranca con cuatro `forceDelete()` sobre las
   * unidades del condominio, y eso no vuelve.
   *
   * ⚠️ Se recibe el modo explícito y NO se pasa `onUpload` directo a un
   * `onClick`: React le pasaría el evento como primer argumento y todo click
   * simularía.
   */
  const onUpload = async (simular: boolean) => {
    if (!selectedFile || isUploading) return;
    if (!isAllowedFile(selectedFile)) {
      setFileError("Solo se permiten archivos .xls o .xlsx");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile, selectedFile.name);
    formData.append("type", apiTypeBySelection[selectedType]);
    formData.append("_debug", "2");
    if (simular) {
      formData.append("simular", "1");
    }

    setIsUploading(true);
    setAccionEnCurso(simular ? "simular" : "subir");
    limpiarResultado();

    const { data, error } = await execute("/masivexls", "POST", formData);

    // 🔴 El sobre del 200 ENVUELVE el resultado del importador: `sendResponse()`
    // mete lo que devolvió el service en `data`, así que los errores de una
    // importación parcial viajan en `data.data.errors` — nunca hubo nada en
    // `data.errors`. El sobre de fallo (`sendError()`) sí los deja en la raíz.
    // Se leen los dos niveles porque el mismo endpoint contesta de las dos
    // formas según por dónde salga.
    const cuerpo: any = error?.data ?? data;
    const detalle: any = cuerpo?.data ?? cuerpo;
    const errores = comoListaDeErrores(cuerpo?.errors ?? detalle?.errors);
    const total = detalle?.total_errors ?? cuerpo?.total_errors;
    const totalConocido = typeof total === "number";

    // La lista se alimenta en las DOS ramas: una importación parcial es un 200.
    setUploadErrors(errores);
    setTotalErrores(totalConocido ? total : null);

    if (data?.success) {
      // 🔴 `success: true` NO quiere decir "sin errores". El importador de
      // expensas commitea las filas buenas y devuelve las malas adentro del
      // mismo sobre (`ExpenseImportService:283-289`): 499 filas entran, una
      // falla, y la pantalla decía "Archivo procesado correctamente" con las
      // filas rechazadas invisibles. Es el defecto original servido bajo cartel
      // de éxito, que es peor que no mostrarlas en la rama de fallo.
      // ⚠️ El de pagos NO es así: revierte todo y contesta `success: false`.
      const okMessage =
        detalle?.message || data?.message || "Archivo procesado correctamente";
      const mensaje = errores.length
        ? `${okMessage} ${textoDeRechazadas(totalConocido ? total : errores.length, totalConocido)}`
        : okMessage;
      setUploadMessage(mensaje);
      // "Salió, pero con reparos" es `warning` en este admin (14 archivos lo
      // usan así). Un verde con filas rechazadas adentro miente.
      showToast(mensaje, errores.length ? "warning" : "success");
      // ⚠️ Una simulación NO limpia el archivo: el paso siguiente de quien
      // simula es subir ese mismo archivo. Vaciarlo lo obliga a elegirlo otra
      // vez y convierte la red de seguridad en un estorbo.
      if (!simular) {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setSelectedFile(null);
      }
    } else {
      // ⚠️ El 400 de "archivo vacío" manda la clave `error`, en SINGULAR, y sin
      // `message` (`BulkOperationsController:158`): leyendo sólo `message` el
      // motivo se perdía y la pantalla mostraba un genérico.
      // Se toma el primer candidato que sea texto: si viniera un objeto, React
      // reventaría al pintarlo.
      const errMessage =
        [error?.data?.message, error?.data?.error, data?.message].find(
          (candidato) =>
            typeof candidato === "string" && candidato.trim() !== "",
        ) || "No se pudo procesar el archivo";
      setUploadMessage(errMessage);
      showToast(errMessage, "error");
    }

    setIsUploading(false);
    setAccionEnCurso(null);
  };

  const onDownloadTemplate = () => {
    const templateUrl = templateUrlBySelection[selectedType];
    if (!templateUrl) {
      showToast("No se encontró la plantilla seleccionada", "error");
      return;
    }
    window.open(templateUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>Carga Masiva de Datos</h1>

      <div className={styles.cardsGrid}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.id === selectedType;

          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.card} ${active ? styles.cardActive : ""}`}
              onClick={() => setSelectedType(option.id)}
            >
              <Icon
                size={46}
                color={active ? "var(--cPrimary)" : "var(--cWhite)"}
              />
              <p className={styles.cardTitle}>{option.title}</p>
              <p className={styles.cardSubtitle}>{option.subtitle}</p>
            </button>
          );
        })}
      </div>

      <label
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        htmlFor="uploads-file-input"
      >
        <input
          id="uploads-file-input"
          ref={fileInputRef}
          type="file"
          className={styles.hiddenInput}
          accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={onInputFileChange}
        />
        <div className={styles.dropIconWrap}>
          <IconArrowUp size={30} color="#111111" />
        </div>
        <p className={styles.dropTitle}>
          Arrastra y suelta archivos aquí o haz clic para seleccionar
        </p>
        <p className={styles.dropSubtitle}>Archivos permitidos: .xls, .xlsx</p>
        {!!selectedFile && !fileError && (
          <div className={styles.fileInfo}>
            <p className={styles.fileName}>{selectedFile.name}</p>
            <p className={styles.fileMeta}>{getFileSize(selectedFile.size)}</p>
            <button
              type="button"
              className={styles.removeFileButton}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                clearSelectedFile();
              }}
            >
              Quitar archivo
            </button>
          </div>
        )}
        {!!fileError && <p className={styles.errorText}>{fileError}</p>}
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onDownloadTemplate}
        >
          <IconDownload size={18} color="var(--cWhite)" />
          Descargar plantilla ({selectedTitle})
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={!selectedFile || !!fileError || isUploading}
          onClick={() => onUpload(true)}
        >
          {accionEnCurso === "simular" ? "Simulando..." : "Simular"}
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!selectedFile || !!fileError || isUploading}
          onClick={() => onUpload(false)}
        >
          {accionEnCurso === "subir" ? "Subiendo..." : "Subir archivo"}
        </button>
      </div>
      {!!uploadMessage && (
        <p className={styles.uploadMessage}>{uploadMessage}</p>
      )}

      {uploadErrors.length > 0 && (
        <div className={styles.errorList}>
          <p className={styles.errorListTitle}>{tituloErrores}</p>

          {uploadErrors.length >= MINIMO_PARA_BUSCAR && (
            <Input
              type="search"
              name="errorFilter"
              label="Buscar (por fila o por motivo)"
              value={errorFilter}
              required={false}
              onChange={(event: any) => setErrorFilter(event.target.value)}
            />
          )}

          {/* ⚠️ El scroll vive acá y no en la lista: con 500 filas malas el
              cartel empujaba la pantalla entera hacia abajo. */}
          <div className={styles.errorListScroll}>
            <List
              data={erroresVisibles}
              emptyLabel="Ningún problema coincide con la búsqueda"
              renderItem={(linea: string) => (
                <p className={styles.errorItem}>{linea}</p>
              )}
            />
          </div>
        </div>
      )}
    </section>
  );
}
