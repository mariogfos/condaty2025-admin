"use client";

import { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import { FinancialDetailModal } from "./FinancialDetailModal";
import {
  FinancialDetailMessage,
  FinancialDetailSection,
} from "./FinancialDetailPrimitives";
import type { FinancialRecordReference } from "./types";

type Props = {
  record: FinancialRecordReference;
  title: string;
  onRecordChanged?: () => void | Promise<void>;
};

/**
 * El acceso al historial y a las correcciones desde el detalle que cada
 * pantalla ya tiene.
 *
 * ⚠️ Producción reescribió los cuatro detalles (Pagos, Deudas, Egresos,
 * Expensas) sobre el modal financiero. En `dev` esos detalles se apartaron de
 * producción con arreglos propios, y Mario eligió (2026-09-25) conservarlos y
 * sumar este botón: abre el modal financiero encima, en la pestaña Historial.
 */
export const FinancialRecordHistoryButton = ({
  record,
  title,
  onRecordChanged,
}: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Historial y correcciones
      </Button>
      <FinancialDetailModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        record={record}
        initialTab="history"
        onRecordChanged={onRecordChanged}
      >
        <FinancialDetailSection>
          <FinancialDetailMessage>
            Los datos del registro están en el detalle de la pantalla. Acá se ven
            su historial y las correcciones disponibles, en el menú de arriba.
          </FinancialDetailMessage>
        </FinancialDetailSection>
      </FinancialDetailModal>
    </>
  );
};
