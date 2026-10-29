"use client";

import { useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Select from "@/mk/components/forms/Select/Select";
import styles from "./ReportsPage.module.css";

export type ReportPdfPart = {
  id: string;
  startDate: string;
  endDate: string;
  startPage: number;
  pageCount: number;
  totalPages: number;
  rowCount: number;
};

export type ReportPdfParts = {
  pageLimit: number;
  snapshotId: string;
  mode?: "daily" | "weekly";
  items?: ReportPdfPart[];
};

const displayDate = (date: string) => date.split("-").reverse().join("/");

export default function ReportPdfPartsDialog({ plan, onClose, onDownload }: {
  plan: ReportPdfParts;
  onClose: () => void;
  onDownload: (part: ReportPdfPart) => void;
}) {
  const items = plan.items || [];
  const [selected, setSelected] = useState(() => items[0]?.id || "");
  const selectedPart = items.find((part) => part.id === selected) || items[0];
  const options = items.map((part) => {
    const period = part.startDate === part.endDate
      ? displayDate(part.startDate)
      : `${displayDate(part.startDate)} a ${displayDate(part.endDate)}`;
    const partCount = Math.ceil(part.totalPages / plan.pageLimit);
    const suffix = partCount > 1 ? ` · parte ${Math.floor((part.startPage - 1) / plan.pageLimit) + 1} de ${partCount}` : "";
    return { id: part.id, name: `${period}${suffix} · ${part.rowCount.toLocaleString("es-BO")} accesos` };
  });

  return (
    <DataModal
      open
      onClose={onClose}
      title={`Descargar PDF por ${plan.mode === "weekly" ? "semanas" : "días"}`}
      buttonText="Generar PDF"
      maxWidth={480}
      disabled={!selectedPart}
      onSave={() => selectedPart && onDownload(selectedPart)}
    >
      <div className={styles.pdfPartsForm}>
        <p>Dividimos el período por {plan.mode === "weekly" ? "semanas" : "días"} según la cantidad de accesos. Cada PDF incluye hasta {plan.pageLimit} páginas.</p>
        <Select
          name="pdf_part"
          label="Período del PDF"
          options={options}
          value={selectedPart?.id || ""}
          onChange={({ target }: any) => setSelected(String(target.value))}
          filter
        />
        {selectedPart ? <p>El archivo seleccionado contiene {selectedPart.rowCount.toLocaleString("es-BO")} accesos en {selectedPart.pageCount} páginas. Puedes volver para descargar los demás períodos.</p> : null}
        {items.some((part) => part.totalPages > plan.pageLimit) ? <p>Los días que superan el límite aparecen divididos en partes.</p> : null}
      </div>
    </DataModal>
  );
}
