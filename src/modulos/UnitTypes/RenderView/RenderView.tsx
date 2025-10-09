import React, { memo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";

interface UnitTypeDetailProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  extraData?: any;
}

// eslint-disable-next-line react/display-name
const RenderView = memo((props: UnitTypeDetailProps) => {
  const { open, onClose, item, extraData } = props;

  // Prioriza los campos provenientes del item (incluye posibles ubicaciones alternativas)
  const fieldsFromItemBase = Array.isArray(item?.fields) ? item.fields : [];
  const fieldsFromItemExtras = Array.isArray(item?.extras?.fields) ? item.extras.fields : [];
  const fieldsFromItem = [...fieldsFromItemBase, ...fieldsFromItemExtras];

  // Fallback: obtiene campos desde extraData, soportando varias estructuras
  let fieldsFromExtra: any[] = [];
  const extraFields = extraData?.fields;

  if (Array.isArray(extraFields)) {
    const typeId = item?.id ?? item?.type_id;
    fieldsFromExtra = extraFields.filter((f: any) => {
      const fTypeId = f?.type_id ?? f?.typeId ?? f?.unit_type_id;
      return fTypeId === typeId;
    });
  } else if (extraFields && typeof extraFields === "object") {
    // Si viene agrupado por keys (p. ej. extraData.fields[{type_id}]: Field[])
    const key = String(item?.id ?? item?.type_id ?? "");
    const grouped = extraFields[key];
    if (Array.isArray(grouped)) fieldsFromExtra = grouped;
  }

  // Une y desduplica por id o por nombre+type_id
  const mergedFields = [...fieldsFromItem, ...fieldsFromExtra];
  const dedupFields: any[] = [];
  const seen = new Set<string>();
  for (const f of mergedFields) {
    const k = String(f?.id ?? `${f?.name}-${f?.type_id ?? f?.typeId ?? f?.unit_type_id ?? ""}`);
    if (!seen.has(k)) {
      seen.add(k);
      dedupFields.push(f);
    }
  }
  const fields = dedupFields;

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de tipo de unidad"
      buttonText=""
      buttonCancel=""
      style={{ maxWidth: 670 }}
    >
      <div className={styles.container}>
        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.label}>Tipo de unidad</div>
            <div className={styles.value}>{item?.name || "-/-"}</div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Descripción</div>
            <div className={styles.value}>
              {item?.description || "Sin descripción"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Campos</div>
            <div className={styles.value}>
              {fields.length === 0 ? (
                <span>-/-</span>
              ) : (
                <div className={styles.fieldsList}>
                  {fields.map((field: any, index: number) => (
                    <div
                      key={field.id || `field-${item?.id}-${index}`}
                      className={styles.fieldItem}
                    >
                      <span className={styles.fieldName}>{field.name}</span>
                      {field?.description && (
                        <span className={styles.fieldDescription}>
                          {field.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DataModal>
  );
});

export default RenderView;
