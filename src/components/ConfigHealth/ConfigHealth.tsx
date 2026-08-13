"use client";

import React from "react";
import useAxios from "@/mk/hooks/useAxios";
import styles from "./ConfigHealth.module.css";

/**
 * El aviso de "a este condominio le falta configurar algo".
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 POR QUÉ EXISTE
 * ────────────────────────────────────────────────────────────────────────
 *
 * Los caminos que crean deuda fallan fuerte cuando falta la categoría, en vez
 * de guardar una deuda sin clasificar. Eso es correcto —el bug anterior dejó 49
 * deudas sin categoría— pero mueve el problema de lugar: un condominio mal
 * configurado ya no genera datos sucios, ahora directamente NO DEJA OPERAR. Sin
 * este aviso, el primero en enterarse es el residente que no puede cancelar su
 * reserva.
 *
 * La lista, los textos, la gravedad y el link salen del API
 * (`GET /v3/clients/config-check`), que los lee del catálogo único del back. Este
 * componente NO decide qué es obligatorio ni redacta consecuencias: sólo pinta.
 * Agregar un requisito nuevo se hace en el back y aparece acá solo.
 */

type Faltante = {
  clave: string;
  titulo: string;
  porque: string;
  donde: string;
  /** Si el sistema puede dejarlo listo solo. Lo decide el catálogo del back. */
  auto: boolean;
  severidad: number;
  severidad_label: string;
  consecuencia: string;
};

type Resumen = {
  ok: boolean;
  auto_reparables: number;
  criticas: number;
  importantes: number;
  opcionales: number;
  faltantes: Faltante[];
};

/** Espeja `ConfigSeverity` del API: 1 crítica, 2 importante, 3 opcional. */
const SEVERIDAD_CRITICA = 1;
const SEVERIDAD_IMPORTANTE = 2;

const claseDeSeveridad = (severidad: number): string => {
  if (severidad === SEVERIDAD_CRITICA) return styles.critica;
  if (severidad === SEVERIDAD_IMPORTANTE) return styles.importante;
  return styles.opcional;
};

const ConfigHealth = () => {
  // 🔴 CON `/v3` y SIN `/api`: el baseURL ya termina en `/api`, y la ruta vive
  // bajo el prefijo `v3`. Escribirla sin el `/v3` da 404 — el mismo error que
  // tuvo el detalle de Reservas, medido acá el 2026-08-13 antes de corregirlo.
  const { data, execute, reLoad } = useAxios(
    "/v3/clients/config-check",
    "GET",
    {},
    false,
  );

  const [reparando, setReparando] = React.useState(false);
  const [errorAlReparar, setErrorAlReparar] = React.useState<string | null>(null);

  const resumen: Resumen | undefined = data?.data;

  /**
   * 🔴 El administrador NO puede arreglar esto a mano: las categorías fijas las
   * crea el sistema, no se eligen desde ninguna pantalla y no se editan ni se
   * borran. Por eso el aviso trae un botón que repara, y no un link a
   * `/categories` — que sería mandarlo a mirar una pared.
   */
  const reparar = async () => {
    if (reparando) return;

    setReparando(true);
    setErrorAlReparar(null);

    try {
      const respuesta = await execute("/v3/clients/config-repair", "POST", {}, false, true);

      if (!respuesta?.data?.success) {
        setErrorAlReparar(
          respuesta?.data?.message || "No se pudo corregir la configuración.",
        );
        return;
      }

      reLoad();
    } catch {
      setErrorAlReparar("No se pudo corregir la configuración. Reintentá en un momento.");
    } finally {
      setReparando(false);
    }
  };

  // Sin respuesta todavía, o todo en orden: el dashboard no muestra nada. Un
  // aviso que aparece cuando no hay problema enseña a ignorarlo.
  if (!resumen || resumen.ok || !resumen.faltantes?.length) return null;

  const hayCriticas = resumen.criticas > 0;

  // Dos ámbitos distintos, dos bloques: lo que el sistema crea solo y lo que
  // necesita a una persona. Mezclarlos deja al administrador apretando un botón
  // que no puede cumplir con la mitad de la lista.
  const automaticos = resumen.faltantes.filter((f) => f.auto);
  const manuales = resumen.faltantes.filter((f) => !f.auto);

  return (
    <section
      className={`${styles.panel} ${hayCriticas ? styles.panelCritico : ""}`}
      role="alert"
      aria-live="polite"
    >
      <header className={styles.encabezado}>
        <h3 className={styles.titulo}>
          {hayCriticas
            ? "Este condominio tiene configuración pendiente y hay operaciones que van a fallar"
            : "Este condominio tiene configuración pendiente"}
        </h3>
        <p className={styles.bajada}>
          {resumen.criticas > 0 && `${resumen.criticas} crítica${resumen.criticas > 1 ? "s" : ""}`}
          {resumen.criticas > 0 && resumen.importantes > 0 && " · "}
          {resumen.importantes > 0 &&
            `${resumen.importantes} importante${resumen.importantes > 1 ? "s" : ""}`}
        </p>
      </header>

      {automaticos.length ? (
        <div className={styles.bloque}>
          <h4 className={styles.bloqueTitulo}>Esto lo dejamos listo nosotros</h4>

          <ul className={styles.lista}>
            {automaticos.map((faltante) => (
              <li key={faltante.clave} className={styles.item}>
                <span className={`${styles.chip} ${claseDeSeveridad(faltante.severidad)}`}>
                  {faltante.severidad_label}
                </span>
                <div className={styles.textos}>
                  <p className={styles.itemTitulo}>{faltante.titulo}</p>
                  <p className={styles.itemPorque}>{faltante.porque}</p>
                </div>
              </li>
            ))}
          </ul>

          <footer className={styles.pie}>
            <button
              type="button"
              className={styles.accion}
              onClick={reparar}
              disabled={reparando}
            >
              {reparando ? "Corrigiendo…" : "Corregir automáticamente"}
            </button>
            <p className={styles.aclaracion}>
              Las crea el sistema: no hace falta configurarlas a mano.
            </p>
          </footer>

          {errorAlReparar ? <p className={styles.error}>{errorAlReparar}</p> : null}
        </div>
      ) : null}

      {manuales.length ? (
        <div className={styles.bloque}>
          <h4 className={styles.bloqueTitulo}>Esto necesita que lo configures vos</h4>

          <ul className={styles.lista}>
            {manuales.map((faltante) => (
              <li key={faltante.clave} className={styles.item}>
                <span className={`${styles.chip} ${claseDeSeveridad(faltante.severidad)}`}>
                  {faltante.severidad_label}
                </span>
                <div className={styles.textos}>
                  <p className={styles.itemTitulo}>{faltante.titulo}</p>
                  <p className={styles.itemPorque}>{faltante.porque}</p>
                </div>
                {/* Acá SÍ va un link: son datos que sólo puede cargar una
                    persona, así que el aviso lleva a la pantalla exacta. */}
                <a className={styles.accion} href={faltante.donde}>
                  Configurar
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default ConfigHealth;
