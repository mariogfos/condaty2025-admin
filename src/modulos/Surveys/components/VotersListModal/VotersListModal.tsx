"use client";

import { useEffect, useState, useRef } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { IconHousing } from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import styles from "./VotersListModal.module.css";

type Voter = {
  respondent_id: string;
  respondent_type: string;
  dpto_nro: string;
  owner_name: string;
  owner_url_avatar?: string;
};

type VotersListModalProps = {
  open: boolean;
  onClose: () => void;
  soptionId: number | string;
  soptionText: string;
  totalVoters: number;
  surveyId?: number | string;
};

const VotersListModal: React.FC<VotersListModalProps> = ({
  open,
  onClose,
  soptionId,
  soptionText,
  totalVoters,
  surveyId,
}) => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const { execute } = useAxios();
  const fetchedRef = useRef<string | number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Build URL with optional survey_id param for abstention case
      let url = `/surveys/soptions/${soptionId}/voters`;
      if (soptionId === "abstention" && surveyId) {
        url += `?survey_id=${surveyId}`;
      }

      const { data: response, loaded: loadedState } = await execute(url, "GET");
      setLoaded(loadedState);

      if (response.success) {
        // console.error("[VotersListModal] API error:", error);
        console.log(response.data);
        setVoters(response.data.voters || response.data?.data?.voters || []);
      } else {
        setVoters([]);
      }
    };

    if (!open || !soptionId) {
      setVoters([]);
      fetchedRef.current = null;
      return;
    }
    // Evitar llamada duplicada si ya sefetcheó este soptionId
    if (fetchedRef.current === soptionId) {
      return;
    }
    fetchedRef.current = soptionId;
    fetchData();
  }, [open, soptionId, surveyId, execute]);

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Votantes"
      buttonText=""
      buttonCancel="Cerrar"
      maxWidth={500}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.optionBadge}>
            <span className={styles.optionLabel}>Opción:</span>
            <span className={styles.optionText}>{soptionText}</span>
          </div>
          <p className={styles.totalCount}>
            {totalVoters} {totalVoters === 1 ? "votante" : "votantes"}
          </p>
        </div>

        {!loaded && (
          <div className={styles.loading}>
            <p>Cargando votantes...</p>
          </div>
        )}

        {loaded && voters.length === 0 && (
          <div className={styles.empty}>
            <p>No hay votantes para esta opción</p>
          </div>
        )}

        {loaded && voters.length > 0 && (
          <div className={styles.votersList}>
            {voters.map((voter, index) => (
              <div key={index} className={styles.voterItem}>
                <Avatar
                  name={voter.owner_name || "?"}
                  src={voter.owner_url_avatar}
                  w={36}
                  h={36}
                />
                <div className={styles.voterInfo}>
                  <p className={styles.voterName}>{voter.owner_name}</p>
                  <p className={styles.voterUnit}>
                    <IconHousing size={14} />
                    <span>Unidad {voter.dpto_nro || "N/A"}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DataModal>
  );
};

export default VotersListModal;
