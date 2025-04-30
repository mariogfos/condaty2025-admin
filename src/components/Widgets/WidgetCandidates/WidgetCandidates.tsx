import React, { useState } from "react";
import WidgetBase from "../WidgetBase/WidgetBase";
import styles from "./WidgetCandidates.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import DetailCandidate from "./DetailCantidate";

const WidgetCandidates = ({ data, params }: any) => {
  const candidates = data;
  const [userId, setUserId]: any = useState(null);
  const [filter, setFilter] = useState("Intendentes"); // Estado para gestionar el filtro

  // Filtrar candidatos basados en el filtro seleccionado
  const filteredCandidates = candidates.filter((candidate: any) => {
    if (filter === "Intendentes") {
      return candidate.mun === null;
    }
    if (filter === "Alcaldes") {
      return candidate.mun !== null;
    }
    return true;
  });

  return (
    <>
      <WidgetBase
        title={
          <span className={styles.widgetTitle}>
            {params?.level === 1
              ? "Candidatos a nivel nacional"
              : params?.level == 2
              ? "Candidatos a nivel departamental"
              : "Candidatos a nivel municipal"}
          </span>
        }
        className={styles.widgetCandidates}
      >
        {/* Controles de filtro */}
        {params?.level <= 2 && (
          <div className={styles.filtersContainer}>
            <button
              className={`${styles.filterButton} ${
                filter === "Intendentes" ? styles.active : ""
              }`}
              onClick={() => setFilter("Intendentes")}
            >
              Intendentes
            </button>
            <button
              className={`${styles.filterButton} ${
                filter === "Alcaldes" ? styles.active : ""
              }`}
              onClick={() => setFilter("Alcaldes")}
            >
              Alcaldes
            </button>
          </div>
        )}

        {/* Lista de candidatos */}
        {filteredCandidates && filteredCandidates.length > 0 ? (
          <div
            style={{
              paddingLeft: 0,
              paddingRight: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignContent: "center",
              paddingTop: 24,
              paddingBottom: 24,
            }}
          >
            {filteredCandidates.map((candidate: any, index: number) => (
              <div
                key={candidate.id}
                className={styles.candidateCard}
                onClick={(e) => {
                  e.stopPropagation();
                  setUserId(candidate.id);
                }}
              >
                <Avatar
                  className={styles.avatar}
                  name={getFullName(candidate)}
                  src={getUrlImages(
                    `/CAND-${candidate?.id}.webp?d=${candidate?.updated_at}`
                  )}
                  h={72}
                  w={72}
                />
                <div className={styles.candidateInfo}>
                  <p>{candidate?.name}</p>
                  <p>{candidate?.last_name}</p>
                </div>
                <div className={styles.professionInfo}>
                  {candidate?.dpto?.name}
                </div>
                {/* <div className={styles.professionInfo}>
                  {candidate?.profession}
                </div> */}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noCandidates}>No tienes candidatos</p>
        )}
      </WidgetBase>

      {/* Detalle del candidato */}
      {userId && (
        <DetailCandidate
          id={userId}
          close={() => setUserId(null)}
          open={true}
        />
      )}
    </>
  );
};

export default WidgetCandidates;
