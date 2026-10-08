"use client";

import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import styles from "./AdministrationAssets.module.css";

const fullName = (person: any) =>
  [person?.name, person?.middle_name, person?.last_name, person?.mother_last_name]
    .filter(Boolean).join(" ") || "—";

export default function PetView({ open, onClose, item }: any) {
  if (!item) return null;
  const fields = [
    ["Nombre", item.name],
    ["Residente", fullName(item.owner)],
    ["Especie", item.specie?.name],
    ["Raza", item.breed],
    ["Sexo", item.gender === "F" ? "Hembra" : "Macho"],
    ["Color", item.color],
    ["Edad", item.age_text],
    ["Descripción", item.description],
  ];

  return (
    <DataModal open={open} onClose={onClose} title="Detalle de mascota"
      buttonText="" buttonCancel="Cerrar" maxWidth={720}>
      <div className={styles.form}>
        {item.images?.[0] ? <img className={styles.photo} src={item.images[0]} alt={`Mascota ${item.name}`} /> : null}
        <StatusBadge color={item.is_lost ? "var(--cError)" : "var(--cSuccess)"}
          backgroundColor={item.is_lost ? "var(--cHoverCompl1)" : "var(--cHoverCompl2)"}>
          {item.is_lost ? "Extraviada" : "En casa"}
        </StatusBadge>
        <div className={styles.detailGrid}>
          {fields.map(([label, value]) => (
            <div className={styles.field} key={label}>
              <p className={styles.label}>{label}</p>
              <p className={styles.value}>{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>
    </DataModal>
  );
}
