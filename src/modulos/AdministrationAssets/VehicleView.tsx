"use client";

import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./AdministrationAssets.module.css";

const fullName = (person: any) =>
  [person?.name, person?.middle_name, person?.last_name, person?.mother_last_name]
    .filter(Boolean).join(" ") || "—";

const vehicleTypes: Record<string, string> = {
  car: "Automóvil", motorcycle: "Motocicleta", truck: "Camioneta / camión", other: "Otro",
};

export default function VehicleView({ open, onClose, item }: any) {
  if (!item) return null;
  const fields = [
    ["Placa", item.plate],
    ["Vínculo", item.kind === "visitor" ? "Visita" : "Residente"],
    ["Tipo", vehicleTypes[item.vehicle_type]],
    ["Unidad", item.dpto?.nro],
    ["Persona", item.kind === "visitor" ? item.visitor_name : fullName(item.owner)],
    ["Marca", item.brand],
    ["Modelo", item.model],
    ["Color", item.color],
    ["Notas", item.notes],
  ];

  return (
    <DataModal open={open} onClose={onClose} title="Detalle del vehículo"
      buttonText="" buttonCancel="Cerrar" maxWidth={720}>
      <div className={styles.detailGrid}>
        {fields.map(([label, value]) => (
          <div className={styles.field} key={label}>
            <p className={styles.label}>{label}</p>
            <p className={styles.value}>{value || "—"}</p>
          </div>
        ))}
      </div>
    </DataModal>
  );
}
