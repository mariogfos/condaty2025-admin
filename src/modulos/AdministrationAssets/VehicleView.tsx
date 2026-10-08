"use client";

import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import styles from "./AdministrationAssets.module.css";

const fullName = (person: any) =>
  [person?.name, person?.middle_name, person?.last_name, person?.mother_last_name]
    .filter(Boolean).join(" ") || "—";

const vehicleTypes: Record<string, string> = {
  car: "Automóvil", motorcycle: "Motocicleta", truck: "Camioneta / camión", other: "Otro",
};

export default function VehicleView({ open, onClose, item, onEdit, onDel }: any) {
  const { userCan } = useAuth();
  const router = useRouter();
  if (!item) return null;
  const isVisitor = item.kind === "visitor";
  const canEdit = !isVisitor && userCan("units", "U");
  const canDelete = !isVisitor && userCan("units", "D");
  const fields = isVisitor ? [
    ["Placa", item.plate],
    ["Vínculo", "Visita"],
    ["Último ingreso", item.last_in_at ? String(item.last_in_at).replace("T", " ").slice(0, 16) : null],
    ["Ingresos registrados", item.access_count],
    ["Visitante del último ingreso", item.visitor_name],
    ["Unidad del último ingreso", item.dpto?.nro],
  ] : [
    ["Placa", item.plate],
    ["Vínculo", item.kind === "visitor" ? "Visita" : "Residente"],
    ["Tipo", vehicleTypes[item.vehicle_type]],
    ["Unidad", item.dpto?.nro],
    ["Persona", fullName(item.owner)],
    ["Marca", item.brand],
    ["Modelo", item.model],
    ["Color", item.color],
    ["Notas", item.notes],
  ];

  const openHistory = () => {
    localStorage.setItem("accessesParams", JSON.stringify({
      fullType: "L", page: 1, searchBy: item.plate, searchById: "", plateExact: item.plate,
      filterBy: "",
    }));
    onClose();
    router.push("/activities");
  };

  return (
    <DataModal open={open} onClose={onClose} title="Detalle del vehículo"
      buttonText={isVisitor ? "Ver historial" : canEdit ? "Editar" : ""} buttonCancel="" maxWidth={720}
      onSave={() => { if (isVisitor) openHistory(); else if (canEdit) { onClose(); onEdit(item); } }}
      buttonExtra={canDelete ? <Button variant="danger" onClick={() => onDel(item)}>Eliminar</Button> : null}>
      <div className={styles.detailGrid}>
        {fields.map(([label, value]) => (
          <div className={styles.field} key={label}>
            <p className={styles.label}>{label}</p>
            <p className={styles.value}>{value || "—"}</p>
          </div>
        ))}
      </div>
      {Array.isArray(item.images) && item.images.length > 0 ? (
        <div className={styles.vehiclePhotos}>
          <p className={styles.label}>Fotografías</p>
          <div className={styles.vehiclePhotoGrid}>
            {item.images.map((url: string, index: number) => (
              <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer"
                aria-label={`Abrir fotografía ${index + 1} del vehículo ${item.plate}`}>
                <img src={url} alt={`Vehículo ${item.plate}, fotografía ${index + 1}`} />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </DataModal>
  );
}
