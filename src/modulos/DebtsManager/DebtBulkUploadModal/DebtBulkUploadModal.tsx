"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./DebtBulkUploadModal.module.css";

type Category = {
  id: number;
  name: string;
  fixed?: string;
  hijos?: { id: number; name: string }[];
};

type Preview = {
  valid: boolean;
  row_count: number;
  total_amount: string;
  fingerprint: string | null;
  rows: { row: number; unit: string; description: string; amount: string; due_at: string }[];
  errors: { row: number | null; message: string }[];
  error_count: number;
};

type Props = {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function DebtBulkUploadModal({ open, categories, onClose, onSuccess }: Props) {
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [beginAt, setBeginAt] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const categoryOptions = useMemo(
    () => categories
      .filter((category) => category.fixed === "X" && (category.hijos?.length || 0) > 0)
      .map(({ id, name }) => ({ id: String(id), name })),
    [categories],
  );
  const subcategoryOptions = useMemo(
    () => categories.find((category) => String(category.id) === categoryId)?.hijos?.map(
      ({ id, name }) => ({ id: String(id), name }),
    ) || [],
    [categories, categoryId],
  );

  const resetPreview = () => {
    setPreview(null);
    setFormError("");
  };

  const resetForm = () => {
    setFile(null);
    setCategoryId("");
    setSubcategoryId("");
    setBeginAt("");
    resetPreview();
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    if (busyRef.current) return;
    resetForm();
    onClose();
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    event.target.value = "";
    resetPreview();
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xlsx") || selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setFormError("Selecciona un único archivo .xlsx de hasta 5 MB.");
      return;
    }
    setFile(selected);
  };

  const submit = async () => {
    if (busyRef.current) return;
    if (!file || !categoryId || !subcategoryId || !beginAt) {
      setFormError("Selecciona el archivo, la categoría, la subcategoría y la fecha de inicio.");
      return;
    }

    const mode = preview?.valid ? "commit" : "preview";
    if (mode === "commit" && !preview?.fingerprint) {
      setFormError("La vista previa ya no es válida. Selecciona el archivo otra vez.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    body.append("mode", mode);
    body.append("category_id", categoryId);
    body.append("subcategory_id", subcategoryId);
    body.append("begin_at", beginAt);
    if (mode === "commit" && preview?.fingerprint) {
      body.append("fingerprint", preview.fingerprint);
    }

    busyRef.current = true;
    setBusy(true);
    setFormError("");
    try {
      const { data, error } = await execute("/debt-dptos/bulk-import", "POST", body);
      if (!data?.success || error) {
        const details = error?.data?.data as Preview | undefined;
        if (details?.errors) setPreview(details);
        setFormError(error?.data?.message || data?.message || "No se pudo procesar el archivo.");
        return;
      }
      if (mode === "preview") {
        setPreview(data.data as Preview);
        return;
      }
      showToast(data.message || "Deudas creadas correctamente.", "success");
      resetForm();
      onSuccess();
      onClose();
    } catch {
      setFormError("No se pudo conectar con el servidor. Intenta de nuevo; si ya confirmaste, revisa la lista antes de repetir la carga.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <DataModal
      open={open}
      onClose={close}
      onSave={submit}
      title="Carga masiva de deudas"
      buttonText={preview?.valid ? `Crear ${preview.row_count} deudas` : preview ? "" : "Validar archivo"}
      buttonCancel="Cancelar"
      disabled={busy}
      minWidth={620}
      maxWidth={680}
    >
      <div className={styles.content}>
        <p className={styles.intro}>
          Una deuda individual por fila. La categoría y la fecha de inicio se aplicarán a todo el archivo.
          Un concepto ya registrado para la misma unidad y subcategoría invalida la carga completa.
        </p>
        {categoryOptions.length === 0 && (
          <p className={styles.helper}>Primero crea una categoría de deudas con una subcategoría activa.</p>
        )}

        <div className={styles.fields}>
          <Select
            name="bulk-category"
            label="Categoría"
            value={categoryId}
            options={categoryOptions}
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar categoría"
            required
            filter
            disabled={busy}
            onChange={(event: any) => {
              setCategoryId(String(event.target.value));
              setSubcategoryId("");
              resetPreview();
            }}
          />
          <Select
            name="bulk-subcategory"
            label="Subcategoría"
            value={subcategoryId}
            options={subcategoryOptions}
            optionLabel="name"
            optionValue="id"
            placeholder={categoryId ? "Seleccionar subcategoría" : "Selecciona una categoría primero"}
            required
            filter
            disabled={busy || !categoryId}
            onChange={(event: any) => {
              setSubcategoryId(String(event.target.value));
              resetPreview();
            }}
          />
          <Input
            name="bulk-begin-at"
            label="Fecha de inicio"
            type="date"
            value={beginAt}
            required
            disabled={busy}
            onChange={(event: any) => {
              setBeginAt(event.target.value);
              resetPreview();
            }}
          />
        </div>

        <div className={styles.fileSection}>
          <span className={styles.label}>Archivo .xlsx</span>
          <input
            ref={inputRef}
            id="debt-bulk-file"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={styles.fileInput}
            disabled={busy}
            onChange={onFileChange}
          />
          <label htmlFor="debt-bulk-file" className={styles.filePicker}>
            <span className={styles.fileIcon}>{file ? <FileSpreadsheet size={22} /> : <UploadCloud size={22} />}</span>
            <span className={styles.fileText}>
              <strong>{file?.name || "Seleccionar archivo"}</strong>
              <small>{file ? `${(file.size / 1024).toFixed(1)} KB · Cambiar archivo` : "Una hoja, hasta 5 MB"}</small>
            </span>
          </label>
          <p className={styles.helper}>
            Columnas: Unidad, Concepto, Monto deuda (Bs), Fecha de vencimiento. Usa dd/mm/aaaa en cada fila.
          </p>
        </div>

        {formError && <p className={styles.error} role="alert"><AlertCircle size={16} />{formError}</p>}
        {preview && (
          <div className={preview.valid ? styles.validPreview : styles.invalidPreview}>
            <div className={styles.previewHeading}>
              {preview.valid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <strong>{preview.valid ? "Lista para confirmar" : "Corrige el archivo y vuelve a seleccionarlo"}</strong>
            </div>
            <p>
              {preview.row_count} deudas · Bs {preview.total_amount} · {preview.error_count} errores
            </p>
            {preview.valid && <small>Al confirmar se crearán todas las deudas. No se registrarán ingresos.</small>}
            {preview.valid && preview.rows.length > 0 && (
              <div className={styles.previewTableWrap}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr><th>Fila</th><th>Unidad</th><th>Concepto</th><th>Vence</th><th>Monto</th></tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.row}>
                        <td>{row.row}</td>
                        <td>{row.unit}</td>
                        <td>{row.description}</td>
                        <td>{row.due_at.split("-").reverse().join("/")}</td>
                        <td>Bs {row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.row_count > preview.rows.length && (
                  <small>Mostrando las primeras {preview.rows.length} deudas.</small>
                )}
              </div>
            )}
            {preview.errors.length > 0 && (
              <ul className={styles.errorList}>
                {preview.errors.map((error, index) => (
                  <li key={`${error.row || "file"}-${index}`}>
                    {error.row ? `Fila ${error.row}: ` : "Archivo: "}{error.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </DataModal>
  );
}
