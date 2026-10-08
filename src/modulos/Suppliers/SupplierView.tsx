"use client";

import { useEffect, useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./Suppliers.module.css";

const fields = [
  ["service_category", "Rubro o servicio"],
  ["document_number", "CI / NIT"],
  ["contact_name", "Persona de contacto"],
  ["phone", "Teléfono"],
  ["email", "Correo electrónico"],
  ["address", "Dirección"],
  ["expenses_count", "Egresos vinculados"],
  ["notes", "Notas internas"],
] as const;

export default function SupplierView({
  open,
  onClose,
  item,
  onEdit,
  execute,
  reLoad,
  showToast,
  setItem,
}: any) {
  const { userCan } = useAuth();
  const [supplier, setSupplier] = useState<any>(item);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSupplier(item), [item]);

  const setStatus = async () => {
    if (!supplier?.id || saving) return;
    setSaving(true);
    const nextStatus = supplier.status === "A" ? "I" : "A";
    const { data, error } = await execute(
      `/suppliers/${supplier.id}`,
      nextStatus === "I" ? "DELETE" : "PUT",
      nextStatus === "I"
        ? {}
        : {
            type: supplier.type,
            name: supplier.name,
            service_category: supplier.service_category,
            document_number: supplier.document_number,
            contact_name: supplier.contact_name,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            notes: supplier.notes,
            status: "A",
          },
      false,
      true,
    );
    setSaving(false);
    if (!data?.success) {
      showToast(data?.message || error?.data?.message || "No se pudo actualizar el proveedor", "error");
      return;
    }

    const updated = { ...supplier, status: nextStatus };
    setSupplier(updated);
    setItem?.(updated);
    setConfirmOpen(false);
    reLoad?.();
    showToast(nextStatus === "I" ? "Proveedor desactivado" : "Proveedor reactivado", "success");
  };

  if (!supplier) return null;

  return (
    <>
      <DataModal
        open={open}
        onClose={onClose}
        title="Detalle del proveedor"
        buttonText=""
        buttonCancel="Cerrar"
        maxWidth={720}
        buttonExtra={
          <div className={styles.actions}>
            {userCan("outlays", "U") ? (
              <Button
                variant="secondary"
                onClick={() => {
                  onClose();
                  onEdit(supplier);
                }}
              >
                Editar datos
              </Button>
            ) : null}
            {userCan("outlays", supplier.status === "A" ? "D" : "U") ? (
              <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
                {supplier.status === "A" ? "Desactivar" : "Reactivar"}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className={styles.detailGrid}>
          <div className={styles.detailField}>
            <p className={styles.detailLabel}>Nombre</p>
            <p className={styles.detailValue}>{supplier.name}</p>
          </div>
          <div className={styles.detailField}>
            <p className={styles.detailLabel}>Tipo</p>
            <p className={styles.detailValue}>{supplier.type === "company" ? "Empresa" : "Persona"}</p>
          </div>
          <div className={styles.detailField}>
            <p className={styles.detailLabel}>Estado</p>
            <StatusBadge
              color={supplier.status === "A" ? "var(--cSuccess)" : "var(--cWhiteV1)"}
              backgroundColor={supplier.status === "A" ? "var(--cHoverCompl2)" : "var(--cHoverCompl1)"}
            >
              {supplier.status === "A" ? "Activo" : "Inactivo"}
            </StatusBadge>
          </div>
          {fields.map(([key, label]) => (
            <div className={styles.detailField} key={key}>
              <p className={styles.detailLabel}>{label}</p>
              <p className={styles.detailValue}>{supplier[key] ?? "—"}</p>
            </div>
          ))}
        </div>
      </DataModal>
      <DataModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onSave={setStatus}
        title={supplier.status === "A" ? "Desactivar proveedor" : "Reactivar proveedor"}
        buttonText={saving ? "Guardando…" : supplier.status === "A" ? "Desactivar" : "Reactivar"}
        buttonCancel="Cancelar"
        disabled={saving}
        variant="mini"
      >
        <p className={styles.helper}>
          {supplier.status === "A"
            ? "No aparecerá en nuevos egresos. Los egresos históricos conservarán su nombre."
            : "Volverá a estar disponible para seleccionarlo en nuevos egresos."}
        </p>
      </DataModal>
    </>
  );
}
