// src/modulos/Assemblies/components/AssemblyDetail/AssemblyDetail.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AssemblyDetail.module.css";
import { useAssemblies } from "../../hooks/useAssemblies";
import { 
  API_STATUS_LABELS, 
  STATUS_STYLE, 
  TYPE_LABELS, 
  MODALITY_LABELS 
} from "../../config/assemblies.constants";
import { Assembly, AssemblySurvey, AssemblyStats } from "../../types/assemblies.types";
import { 
  IconEdit, 
  IconAdd, 
  IconCirclePlay, 
  IconTrash, 
  IconArrowDown, 
  IconArrowUp,
  IconArrowLeft
} from "@/components/layout/icons/IconsBiblioteca";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";

interface AssemblyDetailProps {
  id: string | number;
}

const AssemblyDetail: React.FC<AssemblyDetailProps> = ({ id }) => {
  const router = useRouter();
  const { fetchAssemblyDetail, fetchAssemblyStats, loading, error } = useAssemblies();
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [stats, setStats] = useState<AssemblyStats | null>(null);
  
  // Accordion states
  const [showDetails, setShowDetails] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await fetchAssemblyDetail(id);
      if (data) {
        setAssembly(data);
        const statsData = await fetchAssemblyStats(id);
        if (statsData) setStats(statsData);
      }
    };
    load();
  }, [id, fetchAssemblyDetail, fetchAssemblyStats]);

  if (loading && !assembly) return <div className={styles.container}>Cargando...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!assembly) return <div className={styles.container}>No se encontró la asamblea</div>;

  const statusStyle = STATUS_STYLE[assembly.status] || { color: "#fff", backgroundColor: "#333" };

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span onClick={() => router.push("/assemblies")}>Asambleas</span>
        <span>{">"}</span>
        <span className={styles.active}>{assembly.subject}</span>
      </div>

      <div className={styles.layout}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* ASUNTO Card */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>ASUNTO</h2>
              <StatusBadge 
                color={statusStyle.color} 
                backgroundColor={statusStyle.backgroundColor}
              >
                {API_STATUS_LABELS[assembly.status] || assembly.status}
              </StatusBadge>
            </div>
            
            <h1 className={styles.mainSubject}>{assembly.subject}</h1>
            <span className={styles.typeLabel}>{TYPE_LABELS[assembly.type as any] || assembly.type}</span>

            <div className={styles.metricsGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Participación</span>
                <span className={styles.metricValue}>
                  {stats?.quorum?.attendees || assembly.attendances_count || 0} residentes / {stats?.quorum?.total_units || assembly.participation || "0"} unidades
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Quórum</span>
                <span className={styles.metricValue}>{stats?.quorum?.quorum_percentage || 0}%</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Fecha de inicio</span>
                <span className={styles.metricValue}>{assembly.start_date}</span>
              </div>
            </div>
          </section>

          {/* DESCRIPCIÓN Card */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>DESCRIPCIÓN</h2>
              <button className={styles.editButton}>
                <IconEdit size={14} /> Editar
              </button>
            </div>
            <p className={styles.descriptionText}>
              {assembly.description || "Sin descripción proporcionada."}
            </p>
          </section>

          {/* VOTACIONES Card */}
          <section className={styles.card}>
            <div className={styles.votacionesHeader}>
              <h2 className={styles.votacionesTitle}>VOTACIONES</h2>
              {/* <button className={styles.actionBtn}>
                <IconAdd size={14} /> Nueva pregunta
              </button> */}
            </div>

            {/* Simulated Voting Question based on image */}
            {assembly.surveys && assembly.surveys.length > 0 ? (
                assembly.surveys.map((survey: any) => (
                    <div key={survey.id} className={styles.votacionCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 className={styles.votacionTitle}>{survey.title}</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <IconCirclePlay size={18} color="#888" style={{ cursor: 'pointer' }} />
                                <IconEdit size={18} color="#888" style={{ cursor: 'pointer' }} />
                                <IconTrash size={18} color="#888" style={{ cursor: 'pointer' }} />
                            </div>
                        </div>
                        <div className={styles.votacionMeta}>
                            <span className={styles.votacionCount}>0 votos en total</span>
                            <span className={styles.votacionStatus}>Finalizada</span>
                        </div>

                        <div className={styles.optionItem}>
                            <div className={styles.optionHeader}>
                                <span>Sí estoy de acuerdo</span>
                                <span>68% (31 votos)</span>
                            </div>
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar} style={{ width: '68%' }}></div>
                            </div>
                        </div>

                        <div className={styles.optionItem}>
                            <div className={styles.optionHeader}>
                                <span>Voto nulo</span>
                                <span>24% (11 votos)</span>
                            </div>
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar} style={{ width: '24%', background: '#444' }}></div>
                            </div>
                        </div>

                        <div className={styles.optionItem}>
                            <div className={styles.optionHeader}>
                                <span>No estoy de acuerdo</span>
                                <span>8% (3 votos)</span>
                            </div>
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar} style={{ width: '8%', background: '#EF4444' }}></div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No hay votaciones registradas.
                </div>
            )}
            
            <button className={styles.addQuestionBtn} style={{ marginTop: 16 }}>
                <IconAdd size={14} /> Nueva pregunta
            </button>
          </section>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* DETALLES */}
          <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => setShowDetails(!showDetails)} style={{ cursor: 'pointer' }}>
              <h2 className={styles.sectionTitle}>DETALLES</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <IconEdit size={14} color="#888" />
                {showDetails ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
              </div>
            </div>
            
            {showDetails && (
              <div className={styles.card}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Fecha de inicio:</span>
                  <span className={styles.detailValue}>{assembly.start_date}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Horario:</span>
                  <span className={styles.detailValue}>{assembly.start_time} a {assembly.end_time || "?"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Ubicación:</span>
                  <span className={styles.detailValue}>{assembly.address || "No definida"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>URL de ubicación:</span>
                  <span className={styles.detailValue}>{assembly.address_url || "(Vacío)"}</span>
                </div>
              </div>
            )}
          </div>

          {/* DOCUMENTOS */}
          <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => setShowDocs(!showDocs)} style={{ cursor: 'pointer' }}>
              <h2 className={styles.sectionTitle}>DOCUMENTOS</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className={styles.actionBtn}>
                  <IconAdd size={12} /> Subir
                </button>
                {showDocs ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
              </div>
            </div>
            {showDocs && (
               <div className={styles.card} style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>
                  No hay documentos subidos.
               </div>
            )}
          </div>

          {/* PARTICIPANTES */}
          <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => setShowParticipants(!showParticipants)} style={{ cursor: 'pointer' }}>
              <h2 className={styles.sectionTitle}>PARTICIPANTES</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className={styles.actionBtn}>
                  <IconAdd size={12} /> Registrar
                </button>
                {showParticipants ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
              </div>
            </div>
            {showParticipants && (
               <div className={styles.card} style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>
                  No hay participantes registrados.
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssemblyDetail;
