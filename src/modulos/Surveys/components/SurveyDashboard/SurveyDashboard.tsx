'use client';

import React, { useEffect, useState } from 'react';
import styles from './SurveyDashboard.module.css';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Cargando...</div>
});

interface SurveyDashboardProps {
  stats: any;
  filters: any;
  onFilterChange: (filters: any) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'];

export const SurveyDashboard: React.FC<SurveyDashboardProps> = ({ stats, filters, onFilterChange }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  if (!stats || !isMounted) return null;
  const { survey_info, questions } = stats;

  const renderKPIs = () => (
    <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Participantes</span>
        <span className={styles.kpiValue} style={{ color: '#3b82f6' }}>
          {survey_info.total_participants} / {survey_info.estimated_audience}
        </span>
      </div>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Tasa de Participación</span>
        <span className={styles.kpiValue} style={{ color: '#10b981' }}>{survey_info.participation_rate}%</span>
      </div>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Representatividad</span>
        <span className={styles.kpiValue} style={{ color: '#8b5cf6' }}>{survey_info.representativeness}%</span>
      </div>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Tiempo Promedio</span>
        <span className={styles.kpiValue} style={{ color: '#f59e0b' }}>
          {survey_info.avg_response_time_seconds 
            ? `${Math.round(survey_info.avg_response_time_seconds / 60)} min` 
            : 'N/A'}
        </span>
      </div>
    </div>
  );

  const renderQuestionStats = (q: any) => {
    if (q.type === 'T') {
      return (
        <div className={styles.textAnalysis}>
          <div className={styles.keywordSection}>
            <p className={styles.questionMeta}>Palabras clave más frecuentes</p>
            <div className={styles.keywordCloud}>
              {Object.entries(q.top_keywords || {}).length > 0 ? (
                Object.entries(q.top_keywords || {}).map(([word, freq]: [string, any]) => (
                  <span key={word} className={styles.keyword}>
                    {word} <span className={styles.keywordCount}>{freq}</span>
                  </span>
                ))
              ) : (
                <p className={styles.questionMeta} style={{ fontStyle: 'italic' }}>Sin palabras clave detectadas</p>
              )}
            </div>
          </div>
          <div className={styles.commentSection}>
            <p className={styles.questionMeta}>Muestra de comentarios</p>
            <div className={styles.commentList}>
              {q.text_responses_sample?.length > 0 ? (
                q.text_responses_sample.map((text: string, i: number) => (
                  <div key={i} className={styles.commentItem}>"{text}"</div>
                ))
              ) : (
                <p className={styles.questionMeta} style={{ fontStyle: 'italic' }}>Sin comentarios registrados</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    const isScale = q.type === 'E';
    
    // Categorias con labels de contexto
    const complexCategories = q.options.map((o: any, i: number) => {
        let label = String(o.text);
        if (isScale) {
            if (i === 0 && q.label_first) label = `${o.text} (${q.label_first})`;
            if (i === q.options.length - 1 && q.label_last) label = `${o.text} (${q.label_last})`;
        }
        return label;
    });

    const chartOptions: any = {
      chart: {
        id: `q-chart-${q.id}`,
        type: 'bar',
        toolbar: { show: false },
        animations: { enabled: false },
        background: 'transparent',
        foreColor: '#ffffff'
      },
      theme: { mode: 'dark' },
      colors: COLORS,
      xaxis: {
        type: 'category',
        categories: complexCategories,
        labels: { 
            style: { colors: '#ffffff', fontSize: '11px', fontWeight: 600 },
            rotate: isScale ? -20 : 0,
            offsetY: isScale ? 5 : 0
        }
      },
      yaxis: {
        labels: { style: { colors: '#ffffff', fontSize: '11px' } },
        forceNiceScale: true,
        decimalsInFloat: 0
      },
      plotOptions: {
        bar: { 
          horizontal: !isScale,
          distributed: true,
          barHeight: '65%',
          columnWidth: '55%',
          dataLabels: { 
            position: isScale ? 'top' : 'center',
          }
        }
      },
      grid: { show: true, borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
      dataLabels: { 
        enabled: true,
        textAnchor: isScale ? 'middle' : 'start',
        offsetX: isScale ? 0 : 12,
        offsetY: isScale ? -20 : 0,
        style: { fontSize: '12px', fontWeight: 700, colors: ['#ffffff'] },
        formatter: (val: any) => val,
        background: {
            enabled: true, // Always enabled for clear reading
            foreColor: '#ffffff',
            padding: 4,
            borderRadius: 4,
            borderWidth: 0,
            opacity: 1, // Solid as requested
            backgroundColor: '#000000', // Black as requested
            dropShadow: { enabled: false }
        }
      },
      padding: { top: 10, right: 30, bottom: 0, left: 10 },
      tooltip: { theme: 'dark' },
      legend: { show: false }
    };

    const series = [{ name: 'Votos', data: q.options.map((o: any) => o.votes ?? o.count ?? 0) }];
    const hasData = q.options.some((o: any) => (o.votes ?? o.count ?? 0) > 0);

    return (
      <div className={styles.questionChart}>
        <div className={styles.chartContainer} style={{ height: 300, background: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
          {hasData ? (
            <Chart 
              key={`${q.id}-stable-final-v3`}
              options={chartOptions} 
              series={series} 
              type="bar" 
              height="100%"
              width="100%"
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
              Sin respuestas aún
            </div>
          )}
        </div>
        
        {isScale && q.advanced_stats && (
          <div className={styles.statsRow}>
            <div className={styles.statBadge}>
              <span className={styles.statLabel}>Media:</span>
              <span className={styles.statValue}>{Number(q.advanced_stats.average || 0).toFixed(1)}</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statLabel}>Mediana:</span>
              <span className={styles.statValue}>{q.advanced_stats.median || 0}</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statLabel}>I. Consenso:</span>
              <span className={styles.statValue}>
                {q.advanced_stats.std_dev !== undefined ? (1 - (q.advanced_stats.std_dev / 4.5)).toFixed(2) : '1.00'}
              </span>
            </div>
          </div>
        )}

        {q.highlights && q.highlights.length > 0 && (
          <div className={styles.highlightsSection}>
            {q.highlights.map((h: string, idx: number) => (
              <div key={idx} className={styles.highlightItem}>
                <span className={styles.highlightIcon}>💡</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h2 className={styles.title}>{survey_info.title}</h2>
        <p className={styles.subtitle}>Análisis detallado de participación y resultados</p>
      </header>

      {renderKPIs()}

      <div className={styles.questionsGrid}>
        {questions.map((q: any) => {
          const totalVotes = q.total_responses ?? q.options.reduce((acc: number, o: any) => acc + (o.votes ?? o.count ?? 0), 0);
          return (
            <div key={q.id} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <h3 className={styles.questionTitle}>{q.text}</h3>
                <p className={styles.questionMeta}>
                  {q.type_label} • {totalVotes} {totalVotes === 1 ? 'respuesta' : 'respuestas'}
                </p>
              </div>
              {renderQuestionStats(q)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
