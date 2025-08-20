"use client";
import { useState } from "react";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import styles from "./HistoryOwnership.module.css";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import EmptyData from "@/components/NoData/EmptyData";
import { IconHomePerson2 } from "@/components/layout/icons/IconsBiblioteca";

interface HistoryOwnershipProps {
  ownershipData: any[];
  open: boolean;
  close: () => void;
}

const HistoryOwnership = ({
  ownershipData,
  open,
  close,
}: HistoryOwnershipProps) => {
  const [setDataOw] = useState<any>(null);
  const [filteredData, setFilteredData] = useState(ownershipData);

  const handleSearch = (searchTerm: string) => {
    const filtered = ownershipData.filter(
      (titular) =>
        searchTerm === "" ||
        getFullName(titular?.owner)
          .toUpperCase()
          .includes(searchTerm.toUpperCase())
    );
    setFilteredData(filtered);
  };

  return (
    <DataModal
      title="Historial de Titulares"
      open={open}
      onClose={close}
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.container}>
        <p className={styles.description}>
          Estás visualizando una lista completa de todos los titulares y sus
          respectivos dependientes que esta unidad ha tenido hasta la fecha.
        </p>

        <div className={styles.searchWrapper}>
          <DataSearch
            name="search"
            setSearch={handleSearch}
            value=""
            textButton="Buscar"
          />
        </div>

        <div className={styles.titularesList}>
          {filteredData.length === 0 ? (
            <EmptyData
              message="No existe historial de titulares"
              icon={<IconHomePerson2 size={40} color="var(--cWhiteV1)" />}
            />
          ) : (
            filteredData.map((titular, index) => (
              <button
                key={titular?.owner_id}
                className={styles.titularCard}
                onClick={() => {
                  setDataOw({});
                }}
              >
                <div className={styles.titularInfo}>
                  <Avatar
                    hasImage={titular?.owner?.has_image}
                    src={getUrlImages(
                      `/OWNER-${titular?.owner?.id}.webp?d=${titular?.owner?.updated_at}`
                    )}
                    name={getFullName(titular?.owner)}
                    className={styles.avatar}
                  />
                  <div className={styles.details}>
                    <p className={styles.name}>{getFullName(titular?.owner)}</p>
                    <div className={styles.dates}>
                      {titular.date_out ? (
                        <span>
                          Desde {getDateStrMes(titular.date_in)}, Hasta{" "}
                          {getDateStrMes(titular.date_out)}
                        </span>
                      ) : (
                        <div>
                          <span>Desde {getDateStrMes(titular.date_in)}</span>
                          <p className={styles.currentStatus}>Titular actual</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </DataModal>
  );
};

export default HistoryOwnership;
