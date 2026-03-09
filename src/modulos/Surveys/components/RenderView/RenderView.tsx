import React, { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import styles from "../../Surveys.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { getStatusLabel } from "../../config/surveys.constants";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onEdit?: Function;
}) => {
  const { user, showToast } = useAuth();
  const { execute } = useAxios();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (props.open && props.item?.id && !details) {
        setLoading(true);
        try {
          const { data } = await execute("/surveys", "GET", {
            fullType: "DET",
            searchBy: props.item.id,
          });
          if (data?.data) {
            setDetails(data.data);
          }
        } catch (error) {
          showToast("Error al obtener detalle de la encuesta", "error");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDetails();
  }, [props.open, props.item]);

  const surveyData = details?.survey || props.item;
  const audience = details?.estimated_audience || props.item?.estimated_audience || 0;
  const realResponses = details?.real_responses_count || props.item?.total_voters || 0;

  return (
    <DataModal
      open={props.open}
      onClose={props.onClose}
      title="Detalle de la encuesta"
      buttonText=""
      buttonCancel=""
    >
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {loading && <p>Cargando detalles...</p>}
        
        {!loading && (
          <>
            <div>
              <p className={styles.title} style={{ fontSize: "1.2rem", marginBottom: "4px" }}>
                {surveyData?.name || surveyData?.title}
              </p>
              <p className={styles.subtitle} style={{ color: "var(--cSuccess)" }}>
                {surveyData?.status ? getStatusLabel(surveyData.status) : "Desconocido"}
                {surveyData?.is_mandatory === "Y" ? " • Obligatoria" : ""}
              </p>
            </div>

            <p style={{ color: "var(--cWhiteV1)" }}>{surveyData?.description}</p>
            
            <div style={{ padding: "16px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "var(--bRadius)"}}>
              <p className={styles.title}>Métricas de Audiencia</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                <div>
                  <p className={styles.subtitle}>Audiencia estimada</p>
                  <p className={styles.title} style={{ fontSize: "1.2rem" }}>{audience}</p>
                </div>
                <div>
                  <p className={styles.subtitle}>Participantes reales</p>
                  <p className={styles.title} style={{ fontSize: "1.2rem" }}>{realResponses}</p>
                </div>
                <div>
                  <p className={styles.subtitle}>Participación</p>
                  <p className={styles.title} style={{ fontSize: "1.2rem" }}>
                    {audience > 0 ? Math.round((realResponses / audience) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
              {surveyData?.begin_at && (
                <div>
                  <p className={styles.subtitle}>Fecha de inicio</p>
                  <p>{getDateTimeStrMesShort(surveyData.begin_at)}</p>
                </div>
              )}
              {surveyData?.end_at && (
                <div>
                  <p className={styles.subtitle}>Fecha de fin</p>
                  <p>{getDateTimeStrMesShort(surveyData.end_at)}</p>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </DataModal>
  );
};

export default RenderView;
