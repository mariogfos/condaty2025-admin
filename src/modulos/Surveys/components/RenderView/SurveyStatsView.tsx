"use client";
import React from "react";
import dynamic from "next/dynamic";
import styles from "../../Surveys.module.css";
import { formatNumber } from "@/mk/utils/numbers";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const CHART_COLORS = [
  "rgba(0, 227, 140, 0.9)",
  "rgba(78, 231, 172, 0.9)",
  "rgba(233, 176, 30, 0.9)",
  "rgba(247, 178, 103, 0.9)",
  "rgba(228, 96, 85, 0.9)",
  "rgba(179, 130, 217, 0.9)",
];

type SOption = {
  id: number | string;
  option_text?: string;
  text?: string;
  votes?: number;
};

type SQuestion = {
  id: number | string;
  question_text?: string;
  text?: string;
  type: "S" | "M" | "E" | "T";
  soptions?: SOption[];
  options?: SOption[];
  // open_answers?: string[];
  total_responses?: number;
  user_response?: any;
  text_responses_sample?: string[];
};

function QuestionChart({
  question,
  index,
}: {
  question: SQuestion;
  index: number;
}) {
  const isText = question.type === "T";
  const options = question.options || question.soptions || [];
  const userResponse = question.user_response;
  const questionText = question.question_text || question.text;

  const isMyResponse = (optId: any) => {
    if (userResponse === undefined || userResponse === null) return false;
    if (Array.isArray(userResponse))
      return userResponse.some((id) => id == optId);
    return userResponse == optId;
  };

  if (isText) {
    // const answers = question.text_responses_sample ?? [];
    return (
      <div>
        <p className={styles.subtitle} style={{ marginBottom: 8 }}>
          {(question.total_responses || 0) > 0
            ? `${question.total_responses} respuesta(s) de muestra:`
            : "Sin respuestas aún."}
        </p>
        {(question.total_responses || 0) > 0 && (
          <ul
            style={{
              paddingLeft: 16,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              listStyle: "disc",
            }}
          >
            {question.text_responses_sample?.slice(0, 5).map((r, i) => {
              const matchesUser = userResponse && r === userResponse;
              return (
                <li
                  key={i}
                  style={{
                    color: matchesUser ? "var(--cPrimary)" : "var(--cWhiteV1)",
                    fontSize: "0.875rem",
                    fontWeight: matchesUser ? "bold" : "normal",
                  }}
                >
                  "{r}"{" "}
                  {matchesUser && (
                    <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                      (Tu respuesta)
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  const total = options.reduce(
    (acc, o: any) => acc + (o.votes ?? o.answers_count ?? 0),
    0,
  );
  const categories = options.map((o: any) => {
    const label = o.option_text || o.text || "";
    return isMyResponse(o.id) ? `${label} (Tu respuesta)` : label;
  });
  const data = options.map((o: any) => o.votes ?? o.answers_count ?? 0);

  // Generate colors based on whether it's the user's response
  const colors = options.map((o, i) => {
    if (isMyResponse(o.id)) return "var(--cPrimary)";
    return CHART_COLORS[i % CHART_COLORS.length].replace("0.9", "0.4"); // Fade other bars
  });

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
    colors: colors,
    dataLabels: {
      enabled: true,
      formatter: (val: number) =>
        `${val} voto${val !== 1 ? "s" : ""} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`,
      style: {
        fontSize: "11px",
        fontWeight: "bold",
        colors: ["var(--cBlack)"],
      },
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 1,
        color: "var(--cWhite)",
        opacity: 1,
      },
      offsetX: -5, // Lo movemos un poco hacia la izquierda para que esté bien dentro de la barra
      textAnchor: "end",
    },
    xaxis: {
      categories,
      labels: { style: { colors: "var(--cWhiteV1)" } },
    },
    yaxis: {
      labels: {
        padding: 10,
        style: { colors: "var(--cWhiteV1)" },
        maxWidth: 200,
      },
    },
    grid: {
      borderColor: "#d7fff014",
      padding: {
        left: 20, // Espacio extra para que no pegue a la izquierda
      },
    },
    legend: { show: false },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val: number) =>
          `${val} voto${val !== 1 ? "s" : ""} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`,
      },
    },
  };

  return (
    <div>
      <p
        className={styles.subtitle}
        style={{ marginBottom: 4, fontSize: "0.8rem" }}
      >
        {formatNumber(total, 0)}{" "}
        {total === 1 ? "voto registrado" : "votos registrados"}
      </p>
      {total === 0 && !userResponse ? (
        <p className={styles.subtitle}>Sin votos aún para esta pregunta.</p>
      ) : (
        <ReactApexChart
          options={chartOptions}
          series={[{ name: "Votos", data }]}
          type="bar"
          height={Math.max(120, options.length * 48)}
        />
      )}
    </div>
  );
}

type Props = {
  squestions: SQuestion[];
  totalParticipants: number;
  showSummary?: boolean;
};

export default function SurveyStatsView({
  squestions,
  totalParticipants,
  showSummary = true,
}: Props) {
  if (!squestions?.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary */}
      {showSummary && (
        <div
          style={{
            display: "flex",
            gap: 24,
            padding: "12px 16px",
            background: "#d7fff005",
            borderRadius: "var(--bRadius)",
            border: "1px solid #d7fff014",
          }}
        >
          <div>
            <p className={styles.subtitle} style={{ marginBottom: 2 }}>
              Total participantes
            </p>
            <p
              className={styles.title}
              style={{ fontSize: "1.4rem", margin: 0 }}
            >
              {formatNumber(totalParticipants, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Per-question charts */}
      {squestions.map((q, idx) => (
        <div
          key={q.id}
          style={{
            padding: "16px",
            background: "#d7fff005",
            borderRadius: "var(--bRadius)",
            border: "1px solid #d7fff014",
            borderLeft: "3px solid var(--cPrimary)",
          }}
        >
          <p
            className={styles.subtitle}
            style={{
              marginBottom: 4,
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Pregunta {idx + 1}
          </p>
          <p
            className={styles.title}
            style={{ marginBottom: 12, fontSize: "0.95rem", marginTop: 0 }}
          >
            {q.question_text || (q as any).text}
          </p>
          <QuestionChart question={q} index={idx} />
        </div>
      ))}
    </div>
  );
}
