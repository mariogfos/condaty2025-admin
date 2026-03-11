"use client";
import React from "react";
import dynamic from "next/dynamic";
import styles from "../../Surveys.module.css";
import { formatNumber } from "@/mk/utils/numbers";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CHART_COLORS = [
  "rgba(103, 194, 171, 0.9)",
  "rgba(131, 147, 237, 0.9)",
  "rgba(237, 179, 86, 0.9)",
  "rgba(239, 120, 120, 0.9)",
  "rgba(130, 210, 232, 0.9)",
  "rgba(200, 150, 230, 0.9)",
];

type SOption = {
  id: number;
  option_text: string;
  votes: number;
};

type SQuestion = {
  id: number;
  question_text: string;
  type: "S" | "M" | "E" | "T";
  soptions: SOption[];
  open_answers?: string[];
};

function QuestionChart({ question, index }: { question: SQuestion; index: number }) {
  const isText = question.type === "T";

  if (isText) {
    const answers = question.open_answers ?? [];
    return (
      <div>
        <p className={styles.subtitle} style={{ marginBottom: 8 }}>
          {answers.length > 0 ? `${answers.length} respuesta(s) de muestra:` : "Sin respuestas aún."}
        </p>
        {answers.length > 0 && (
          <ul style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6, listStyle: "disc" }}>
            {answers.slice(0, 5).map((r, i) => (
              <li key={i} style={{ color: "var(--cWhiteV1)", fontSize: "0.875rem" }}>
                "{r}"
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const total = question.soptions.reduce((acc, o) => acc + (o.votes ?? 0), 0);
  const categories = question.soptions.map((o) => o.option_text);
  const data = question.soptions.map((o) => o.votes ?? 0);

  const chartOptions: any = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: true, speed: 500 },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        distributed: true,
        dataLabels: { position: "right" },
      },
    },
    colors: CHART_COLORS,
    dataLabels: {
      enabled: true,
      formatter: (val: number) =>
        `${val} voto${val !== 1 ? "s" : ""} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`,
      style: { fontSize: "11px", colors: ["#C6C6C6"] },
      offsetX: 5,
    },
    xaxis: {
      categories,
      labels: { style: { colors: "#A0A0A0" } },
    },
    yaxis: { labels: { style: { colors: "#A0A0A0" } } },
    grid: { borderColor: "#2a2a2a" },
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (val: number) =>
          `${val} voto${val !== 1 ? "s" : ""} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`,
      },
    },
  };

  return (
    <div>
      <p className={styles.subtitle} style={{ marginBottom: 4, fontSize: "0.8rem" }}>
        {formatNumber(total, 0)} {total === 1 ? "voto registrado" : "votos registrados"}
      </p>
      {total === 0 ? (
        <p className={styles.subtitle}>Sin votos aún para esta pregunta.</p>
      ) : (
        <ReactApexChart
          options={chartOptions}
          series={[{ name: "Votos", data }]}
          type="bar"
          height={Math.max(100, question.soptions.length * 48)}
        />
      )}
    </div>
  );
}

type Props = {
  squestions: SQuestion[];
  totalParticipants: number;
};

export default function SurveyStatsView({ squestions, totalParticipants }: Props) {
  if (!squestions?.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary */}
      <div
        style={{
          display: "flex",
          gap: 24,
          padding: "12px 16px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "var(--bRadius)",
        }}
      >
        <div>
          <p className={styles.subtitle} style={{ marginBottom: 2 }}>Total participantes</p>
          <p className={styles.title} style={{ fontSize: "1.4rem", margin: 0 }}>
            {formatNumber(totalParticipants, 0)}
          </p>
        </div>
      </div>

      {/* Per-question charts */}
      {squestions.map((q, idx) => (
        <div
          key={q.id}
          style={{
            padding: "16px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "var(--bRadius)",
            borderLeft: "3px solid var(--cPrimary, #6366f1)",
          }}
        >
          <p className={styles.subtitle} style={{ marginBottom: 4, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pregunta {idx + 1}
          </p>
          <p className={styles.title} style={{ marginBottom: 12, fontSize: "0.95rem", marginTop: 0 }}>
            {q.question_text}
          </p>
          <QuestionChart question={q} index={idx} />
        </div>
      ))}
    </div>
  );
}
