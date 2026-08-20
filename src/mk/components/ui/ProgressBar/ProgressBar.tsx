"use client";
import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { formatNumber } from "@/mk/utils/numbers";

const ProgressBar = ({ total, sent, pending, paquete }: any) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [intervalId, setIntervalId] = useState<any>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [estimated, setEstimated] = useState(0);

  const sentPercentage = (sent / total) * 100;
  const pendingPercentage = (pending / total) * 100;

  useEffect(() => {
    if (!intervalId) {
      const id = setInterval(() => {
        setElapsedTime((prevTime) => Date.now() - startTime);
      }, 500);
      setIntervalId(id);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const [lastStart, setLastStart] = useState(Date.now());
  useEffect(() => {
    const lStart = lastStart;
    setLastStart(Date.now());
    if (sent == 0) {
      setEstimated(0);
      return;
    }
    const t = Math.ceil(total / paquete);
    let t2 = 0;
    if (sent > 0) t2 = Math.ceil(sent / paquete);
    const l = t - t2;
    const transcurrido = Date.now() - lStart;
    const estimado = Date.now() - startTime * 1 + transcurrido * l;

    setEstimated(estimado);
    if (sent == total && intervalId) {
      clearInterval(intervalId);
    }
  }, [sent]);

  // const averageTimePerSend = sent > 0 ? elapsedTime / sent : 0;
  // const estimatedTotalTime = averageTimePerSend * total;
  // const estimatedRemainingTime = estimatedTotalTime - elapsedTime;

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "Calculando...";
    const minutes = Math.floor(seconds / 1000 / 60);
    const secs = (seconds / 1000) % 60;
    return `${minutes}m ${formatNumber(secs, 2)}s`;
  };

  return (
    <>
      Importando un total de {total} registros
      <div className={styles.progressBar}>
        <div
          className={styles.progressBarSent}
          style={{ width: `${sentPercentage}%` }}
        >
          {formatNumber(sentPercentage, 1)}%
        </div>
        <div
          className={styles.progressBarPending}
          style={{ width: `${pendingPercentage}%`, left: `${sentPercentage}%` }}
        >
          {formatNumber(pendingPercentage, 1)}%
        </div>
      </div>
      <div className={styles.timeInfo}>
        <div>Tiempo transcurrido: {formatTime(elapsedTime)}</div>
        <div>Tiempo estimado: {formatTime(estimated)}</div>
      </div>
    </>
  );
};

export default ProgressBar;
