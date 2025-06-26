"use client";
import styles from "./HistoryAccess.module.css";
import { getDateTimeStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import EmptyData from "@/components/NoData/EmptyData";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useState } from "react";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import Select from "@/mk/components/forms/Select/Select";
import { IconExitHome } from "@/components/layout/icons/IconsBiblioteca";

interface HistoryAccessProps {
  accessData: any[];
  open: boolean;
  close: () => void;
}

const HistoryAccess = ({ accessData, open, close }: HistoryAccessProps) => {
  const [params, setParams] = useState({
    perPage: 20,
    page: 1,
  });

  // Calcula el índice inicial y final para la paginación
  const startIndex = (params.page - 1) * params.perPage;
  const endIndex = startIndex + params.perPage;
  const paginatedData = accessData.slice(startIndex, endIndex);

  const onChangePage = (page: number) => {
    setParams({ ...params, page });
  };

  return (
    <DataModal
      title="Historial de visitas"
      open={open}
      onClose={close}
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.container}>
        <div className={styles.visitHeader}>
          <div>Nombre completo</div>
          <div>Tipo de visita</div>
          <div>Ingreso</div>
          <div>Salida</div>
        </div>

        <div className={styles.visitsList}>
          {paginatedData?.map((visita, index) => (
            <div key={index} className={styles.visitRow}>
              <div className={styles.visitorInfo}>
                <Avatar
                  hasImage={visita.visit?.has_image}
                  name={getFullName(visita.visit)}
                  w={28}
                  h={28}
                  className={styles.visitorAvatar}
                />
                <div className={styles.visitorDetails}>
                  <p className={styles.visitorName}>
                    {getFullName(visita.visit)}
                  </p>
                  <p className={styles.visitorCI}>CI: {visita.visit?.ci}</p>
                </div>
              </div>

              <div>
                {visita.type === "P" ? (
                  "Pedido"
                ) : visita.type === "I" ? (
                  "Individual"
                ) : visita.type === "G" ? (
                  "Grupal"
                ) : visita.type === "C" ? (
                  "Sin Qr"
                ) : (
                  <EmptyData
                    message="No hay registros de visitas"
                    icon={<IconExitHome size={40} color="var(--cWhiteV1)" />}
                  />
                )}
              </div>

              <div>
                {visita.in_at ? getDateTimeStrMes(visita.in_at) : "Sin fecha"}
              </div>

              <div>
                {visita.out_at ? getDateTimeStrMes(visita.out_at) : "Sin fecha"}
              </div>
            </div>
          ))}

          {(!accessData || accessData.length === 0) && (
            <div className={styles.emptyState}>
              <EmptyData
                message="No hay registros de visitas"
                icon={<IconExitHome size={40} color="var(--cWhiteV1)" />}
              />
            </div>
          )}
        </div>

        <div className={styles.paginationContainer}>
          <Pagination
            currentPage={params.page}
            onPageChange={onChangePage}
            setParams={setParams}
            params={params}
            totalPages={Math.ceil(accessData.length / params.perPage)}
            total={accessData.length}
            previousLabel=""
            nextLabel=""
          />
        </div>
      </div>
    </DataModal>
  );
};

export default HistoryAccess;
