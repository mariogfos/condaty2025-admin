"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAsyncExport } from "@/mk/hooks/useAsyncExport/useAsyncExport";
import ExportProgressModal from "@/mk/components/ui/ExportProgressModal/ExportProgressModal";
import Select from "@/mk/components/forms/Select/Select";
import Button from "@/mk/components/forms/Button/Button";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import TableIngresos from "./TableIngresos";
import TableEgresos from "./TableEgresos";
import TableResumenGeneral from "./TableResumenGeneral";
import {
  IconArrowDown,
  IconExport,
  LineGraphic,
  PointGraphic,
  IconGraphics,
  IconLineGraphic,
} from "@/components/layout/icons/IconsBiblioteca";
import styles from "./Balance.module.css";
import WidgetGrafEgresos from "@/components/Widgets/WidgetGrafEgresos/WidgetGrafEgresos";
import WidgetGrafIngresos from "@/components/Widgets/WidgetGrafIngresos/WidgetGrafIngresos";
import WidgetGrafBalance from "@/components/Widgets/WidgetGrafBalance/WidgetGrafBalance";
import { ChartType, COLORS20 } from "@/mk/components/ui/Graphs/GraphsTypes";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { formatNumber, roundMoney } from "@/mk/utils/numbers";
import EmptyData from "@/components/NoData/EmptyData";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import { MONTHS_GRAPH } from "@/mk/utils/date";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { IconAlertCircle } from "@/components/layout/icons/IconsBiblioteca";
// ⚠️ Esta pantalla RENDERIZA texto escrito por el servidor (CDT-99, como el muro
// y el widget «Comunidad» desde CDT-47): el `message` de un sobre que no sea 5xx
// llega tal cual a la vista. El riesgo residual —para los 4xx el único guardián
// es la lista de patrones técnicos— está medido en el docblock del helper.
import { leerElErrorDelApi } from "@/mk/hooks/useCrud/leerElErrorDelApi";
interface ChartTypeOption {
  id: ChartType;
  name: string;
}
interface FilterState {
  filter_date: string;
  filter_mov: string;
  filter_categ: string[];
}

interface ErrorType {
  [key: string]: string;
}
interface ChartTypeState {
  filter_charType: ChartType;
}
const BalanceGeneral: React.FC = () => {
  const [formStateFilter, setFormStateFilter] = useState<FilterState>({
    filter_date: "m",
    filter_mov: "T",
    filter_categ: [],
  });

  const [charType, setCharType] = useState<ChartTypeState>({
    filter_charType: "bar" as ChartType,
  });
  const [errors, setErrors] = useState<ErrorType>({});
  const [lchars, setLchars] = useState<ChartTypeOption[]>([]);
  const [openCustomFilter, setOpenCustomFilter] = useState(false);

  const chartRefBalance = useRef<HTMLDivElement>(null);
  const chartRefIngresos = useRef<HTMLDivElement>(null);
  const chartRefEgresos = useRef<HTMLDivElement>(null);

  const { setStore, userCan, showToast } = useAuth();

  const {
    data: finanzas,
    reLoad: reLoadFinanzas,
    loaded,
    error,
    isStale,
  } = useAxios("/v3/balances", "POST", {});

  const [loadingLocal, setLoadingLocal] = useState(false);
  useEffect(() => {
    setStore({ title: "BALANCE" });
  }, []);

  useEffect(() => {
    if (formStateFilter.filter_date === "sc") {
      // 🔴 Bajar `loadingLocal` acá NO es de adorno (review 4R). Sube al
      // cambiar «Tipo de transacción» (`:796`) y sólo baja en el efecto que
      // escucha CAMBIOS de `loaded`. Por esta rama no sale ningún pedido, así
      // que `loaded` no transiciona, ese efecto no vuelve a correr y la
      // pantalla queda cargando PARA SIEMPRE. Se llega así: elegir
      // «Personalizado», descartar el modal, y cambiar el tipo de transacción.
      setLoadingLocal(false);
      setOpenCustomFilter(true);
    } else {
      reLoadFinanzas(formStateFilter);
    }
    let newLchars: ChartTypeOption[];
    if (formStateFilter.filter_mov === "T") {
      newLchars = [
        { id: "bar" as ChartType, name: "Barra" },
        { id: "line" as ChartType, name: "Linea" },
      ];
    } else {
      newLchars = [
        { id: "bar" as ChartType, name: "Barra" },
        { id: "pie" as ChartType, name: "Torta" },
        { id: "line" as ChartType, name: "Linea" },
      ];
    }

    setLchars(newLchars);
    if (!newLchars.some((c) => c.id === charType.filter_charType)) {
      setCharType({ filter_charType: newLchars[0].id });
    }
  }, [formStateFilter]);

  useEffect(() => {
    if (loaded) setLoadingLocal(false);
  }, [loaded]);

  const ldate = [
    { id: "m", name: "Este mes" },
    { id: "lm", name: "Mes anterior" },
    { id: "y", name: "Este año" },
    { id: "ly", name: "Año anterior" },
    { id: "sc", name: "Personalizado" },
  ];

  // 🔴 2026-08-07: el botón "Descargar reporte" NO descargaba nada.
  //
  // `POST /v3/balances` con `exportar: true` encola el reporte y responde 202
  // con `{job_id, status, status_url, download_url}` — el flujo async, desde
  // S35. Pero acá se seguía esperando `finanzas.data.export.path`, que es el
  // shape del camino LEGACY síncrono: esa clave nunca llega, así que el
  // `window.open` no se ejecutaba nunca. El usuario apretaba, el PDF se
  // generaba en el worker y no se abría solo.
  //
  // Ahora usa el mismo hook que el resto de los módulos migrados: encola,
  // hace polling del estado y descarga cuando termina.
  //
  // ⚠️ La captura del gráfico se sacó de acá: el front hacía `html2canvas`,
  // subía un PNG en base64 en cada export y el backend NO lo recibe —medido:
  // cero referencias a `grafica` en todo `app/`—. Queda pendiente meterlo
  // dentro del PDF (decisión de Mario, 2026-08-07); mientras tanto no se sube
  // una imagen al vacío.
  // 🔴 El modal de progreso es el MISMO que usa el resto de los módulos
  // (`AsyncExportButton` lo arma junto al hook). Acá el botón es propio —tiene
  // su ícono y su estilo—, así que el hook se usa directo; pero sin el modal el
  // usuario apretaba y no veía absolutamente nada mientras el worker armaba el
  // PDF, que en un balance grande tarda varios segundos.
  const [modalExport, setModalExport] = useState(false);

  const {
    state: exportState,
    start: startExport,
    download: downloadExport,
    reset: resetExport,
  } = useAsyncExport({
    type: "balance",
    onCompleted: () => setModalExport(true),
    // 🔴 Un export que falla TIENE que decirlo. Sin esto el botón no hacía
    // nada visible: el back respondía 400 y el error moría adentro del hook.
    onError: (msg) => {
      setModalExport(true);
      showToast(msg || "No se pudo generar el reporte", "error");
    },
  });

  const exportando = exportState.isExporting;

  const exportar = async () => {
    setModalExport(true);
    await startExport({
      // 🔴 `format` VA en los params: el hook los manda tal cual en el body y
      // el back, sin este campo, asume `xlsx` — que este reporte no genera —
      // y devuelve 400 "Format 'xlsx' no soportado". El botón se quedaba
      // mudo por esto.
      format: "pdf",
      filter_date: formStateFilter.filter_date,
      filter_mov: formStateFilter.filter_mov,
      filter_categ: formStateFilter.filter_categ,
    });
  };
  const getCategories = () => {
    let data = [];

    if (formStateFilter.filter_mov === "I") {
      data = finanzas?.data?.categI ?? [];
    } else {
      data = finanzas?.data?.categE ?? [];
    }
    return data;
  };
  useEffect(() => {
    const categoriasDisponibles = getCategories().map((cat: any) => cat.id);
    const currentCateg = formStateFilter.filter_categ;
    if (Array.isArray(currentCateg)) {
      const nuevas = currentCateg.filter((cat: string) =>
        categoriasDisponibles.includes(cat),
      );

      if (nuevas.length !== currentCateg.length) {
        setFormStateFilter((prev) => ({ ...prev, filter_categ: nuevas }));
      }
    }
  }, [formStateFilter.filter_mov]);

  const calculatedTotals = useMemo(() => {
    let totalEgresos = 0;
    let totalIngresos = 0;
    const saldoInicial = Number(finanzas?.data?.saldoInicial) || 0;
    finanzas?.data?.egresosHist?.forEach((subcategoria: any) => {
      totalEgresos += Number(subcategoria.amount) || 0;
    });
    finanzas?.data?.ingresosHist?.forEach((subcategoria: any) => {
      totalIngresos += Number(subcategoria.amount) || 0;
    });
    const saldoFinal = totalIngresos - totalEgresos + saldoInicial;
    return { totalIngresos, totalEgresos, saldoInicial, saldoFinal };
  }, [
    finanzas?.data?.ingresosHist,
    finanzas?.data?.egresosHist,

    finanzas?.data?.saldoInicial,
  ]);

  const getPeriodoText = (filterDateValue: string) => {
    const now = new Date();
    const meses = MONTHS_GRAPH;
    let ayer = new Date(now);
    switch (filterDateValue) {
      case "d":
        return `Balance del ${now.getDate()} de ${
          meses[now.getMonth()]
        } de ${now.getFullYear()}`;
      case "ld":
        ayer = new Date(now.getDate() - 1);
        return `Balance del ${ayer.getDate()} de ${
          meses[ayer.getMonth()]
        } de ${ayer.getFullYear()}`;
      case "w":
        const inicioSemana = new Date(now);
        inicioSemana.setDate(now.getDate() - now.getDay() + 1);
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        return `Balance desde ${inicioSemana.getDate()} de ${
          meses[inicioSemana.getMonth()]
        } hasta ${finSemana.getDate()} de ${
          meses[finSemana.getMonth()]
        } de ${finSemana.getFullYear()}`;

      case "lw":
        const inicioSemanaAnterior = new Date(now);
        inicioSemanaAnterior.setDate(now.getDate() - now.getDay() - 6);
        const finSemanaAnterior = new Date(inicioSemanaAnterior);
        finSemanaAnterior.setDate(inicioSemanaAnterior.getDate() + 6);
        return `Balance desde ${inicioSemanaAnterior.getDate()} de ${
          meses[inicioSemanaAnterior.getMonth()]
        } hasta ${finSemanaAnterior.getDate()} de ${
          meses[finSemanaAnterior.getMonth()]
        } de ${finSemanaAnterior.getFullYear()}`;
      case "m":
        return `Balance de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
      case "lm":
        const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1);
        return `Balance de ${
          meses[mesAnterior.getMonth()]
        } de ${mesAnterior.getFullYear()}`;
      case "y":
        return `Balance desde Enero hasta ${
          meses[now.getMonth()]
        } de ${now.getFullYear()}`;
      case "ly":
        return `Balance desde Enero hasta Diciembre de ${
          now.getFullYear() - 1
        }`;
      default:
        if (filterDateValue.startsWith("c:")) {
          const dates = filterDateValue.substring(2).split(",");
          if (dates[0] && dates[1]) {
            // Crear las fechas y ajustarlas a UTC-4
            const fechaInicio = new Date(dates[0] + "T00:00:00-04:00");
            const fechaFin = new Date(dates[1] + "T00:00:00-04:00");
            fechaInicio.setHours(fechaInicio.getHours() + 4);
            return `Balance desde ${fechaInicio.getDate()} de ${
              meses[fechaInicio.getMonth()]
            } de ${fechaInicio.getFullYear()} hasta ${fechaFin.getDate()} de ${
              meses[fechaFin.getMonth()]
            } de ${fechaFin.getFullYear()}`;
          }
        }
        return "Balance general";
    }
  };
  const legendCategoriasIngresos = React.useMemo(() => {
    const map = new Map();
    (finanzas?.data?.ingresosHist ?? []).forEach((item: any) => {
      if (!map.has(item.categ_id)) {
        map.set(item.categ_id, { name: item.name, total: 0 });
      }
      const entry = map.get(item.categ_id);
      entry.total = roundMoney(entry.total + parseFloat(item.amount ?? 0));
    });
    return Array.from(map.values());
  }, [finanzas?.data?.ingresosHist]);
  const legendCategoriasEgresos = React.useMemo(() => {
    const map = new Map();
    (finanzas?.data?.egresosHist ?? []).forEach((item: any) => {
      if (!map.has(item.categ_id)) {
        map.set(item.categ_id, { name: item.name, total: 0 });
      }
      const entry = map.get(item.categ_id);
      entry.total = roundMoney(entry.total + parseFloat(item.amount ?? 0));
    });
    return Array.from(map.values());
  }, [finanzas?.data?.egresosHist]);
  const getSubtitle = () => {
    if (formStateFilter.filter_date === "y") {
      return `Total del saldo acumulado · Gestión ${new Date().getFullYear()}`;
    }
    if (formStateFilter.filter_date === "ly") {
      return `Total del saldo acumulado · Gestión ${
        new Date().getFullYear() - 1
      }`;
    }
    return "Total del saldo acumulado";
  };
  const filtrarHastaMesActual = (data: any[]) => {
    if (formStateFilter.filter_date === "y" && Array.isArray(data)) {
      const mesActual = new Date().getMonth();
      return data.filter((item: any) => {
        let mes = item.mes;
        if (typeof mes === "string") mes = parseInt(mes, 10) - 1;
        return mes - 1 <= mesActual;
      });
    }
    return data;
  };
  let tituloBalance;
  if (
    formStateFilter.filter_date == "d" ||
    formStateFilter.filter_date == "ld"
  ) {
    tituloBalance =
      "Balance de " + (formStateFilter.filter_date == "d" ? "Hoy" : "Ayer");
  } else {
    tituloBalance = getPeriodoText(formStateFilter.filter_date);
  }

  const getSelectCategorias = () => {
    if (typeof formStateFilter.filter_categ === "string") {
      return formStateFilter.filter_categ ? [formStateFilter.filter_categ] : [];
    }
    return formStateFilter.filter_categ;
  };

  // 🔴 CDT-31: la gráfica quedaba VACÍA al elegir una categoría.
  //
  // Acá vivían tres filtros por categoría del lado del cliente —uno para la
  // gráfica y uno por cada leyenda— y los tres comparaban con `includes()`
  // estricto contra `item.category_id`. Ese campo lo estampa la API como
  // CADENA (`UtilsGraph::formatExpenseResultsWithAllMonths` hace
  // `'' . $category['category_id']`, y un padre sin padre se vuelve `""`),
  // mientras que las opciones del Select salen de `categI`/`categE`, cuyo `id`
  // es bigint y viaja como NÚMERO. `[12].includes("12")` es `false`: el filtro
  // devolvía SIEMPRE un arreglo vacío, la gráfica no dibujaba nada y el total
  // del título daba 0.
  //
  // No se arreglaron las tres comparaciones: se BORRARON. `POST /v3/balances`
  // ya filtra por categoría en SQL (`UtilsGraph::getEgresosHist`, y el
  // `getIncomeReport` del lado de ingresos, con
  // `whereIn('e.category_id', $categ)->orWhereIn('cat.category_id', $categ)`),
  // así que `ingresosHist`/`egresosHist` llegan filtrados. Volver a filtrarlos
  // acá era una segunda fuente de verdad que sólo podía equivocarse.
  //
  // ⚠️ Las tablas (`TableIngresos`/`TableEgresos`) SÍ siguen recibiendo
  // `selectcategorias`: ellas arman sus filas desde `categI`/`categE`, que
  // llega COMPLETO, y sin ese filtro mostrarían las categorías no elegidas en
  // cero. Ahí la comparación es número contra número —por eso el resumen sí
  // funcionaba mientras la gráfica no—.

  /**
   * ────────────────────────────────────────────────────────────────────────
   * 🔴 CDT-99 — la pantalla afirmaba que el condominio no tiene finanzas.
   * ────────────────────────────────────────────────────────────────────────
   *
   * `useAxios` pone `loaded = true` en su `finally` pase lo que pase y deja
   * `data` en `null` (`useAxios.tsx:234`). Sin mirar `error` —que acá ni se
   * desestructuraba— un fallo de red y un condominio recién creado son el
   * mismo render: «Gráfica y tablas financieras sin datos. verás la evolución
   * del flujo de efectivo a medida que tengas ingresos y egresos».
   *
   * Es una afirmación FALSA sobre las finanzas del condominio, en la pantalla
   * entera de Balance, y con el mismo tono tranquilizador que el vacío real.
   *
   * ⚠️ SON TRES RENDERS, NO DOS. El mismo `EmptyData` está escrito tres veces
   * —«Ingresos» (`ingresosContent`), «Egresos» (`egresosContent`) y el
   * combinado «Ingresos y egresos», que vive suelto en el JSX del filtro `T`—.
   * Los tres cuelgan del MISMO y ÚNICO pedido a `/v3/balances`, así que un
   * fallo los rompe a los tres a la vez; arreglar sólo los dos que el ticket
   * nombraba dejaba mintiendo justo al que está seleccionado por defecto.
   *
   * Las dos formas del fallo, las mismas que cerró CDT-47:
   * - `error` — axios rechazó (5xx, 4xx, red caída, timeout).
   * - sin `data` en el sobre — el HTTP 200 rechazado en el cuerpo
   *   (`sendError($msg, [], 200)` devuelve `{success:false, message}` y NINGÚN
   *   `data`). Axios no rechaza un 200: ahí no hay `error` que mirar.
   *
   * ⚠️ Un condominio sin movimientos SÍ trae `data`, con sus listas vacías:
   * `sendResponse` siempre arma la clave. El vacío legítimo sigue cayendo en
   * el `EmptyData` de siempre — que es lo que tiene que pasar, y por eso el
   * cartel de fallo se ve distinto (ícono ámbar + botón).
   *
   * ⚠️ NO se toca el resto de la pantalla: filtros, período y tipo de
   * transacción quedan operativos, porque son los que disparan el pedido.
   */
  /**
   * 🔴 Pregunta por el DATO, no por `error` (review de CDT-99): `useAxios` no
   * limpia `data` al fallar, así que preguntar por `error` haría que un
   * refresco fallado le borre al usuario un balance correcto y lo reemplace
   * por un cartel. Para «hay dato viejo y el refresco falló» está `isStale`.
   */
  const cargaFallida = loaded && !finanzas?.data;
  /**
   * 🔴 El `!estaCargando` NO es de adorno (review 4R de CDT-99).
   *
   * `isStale` sigue prendido mientras el reintento está EN VUELO —el hook lo
   * apaga recién cuando el refresco entra bien—, así que sin esta condición la
   * banda «no se pudo actualizar» y su botón de Reintentar quedan pintados
   * ENCIMA del `LoadingScreen`: el usuario ve al mismo tiempo que está
   * cargando y que falló.
   *
   * ⚠️ El panel resuelve lo mismo, pero NO con la misma forma, y acá antes
   * decía que sí: allá la guarda es `loaded` a secas (`Index.tsx:173`).
   * `!estaCargando` es `!loadingLocal && loaded`, un conjunto más angosto,
   * porque esta pantalla tiene además su propio `loadingLocal`.
   */  const estaCargando = loadingLocal || !loaded;
  const datoDesactualizado = isStale && !cargaFallida && !estaCargando;

  // Manda el código HTTP (CDT-94): 5xx y red caída caen al genérico; un 4xx
  // —un 403 de permisos— trae su propio texto, porque reintentar no arregla un
  // permiso. El sobre del 200 rechazado viaja en `finanzas`, no en `error`.
  const { mensaje: mensajeDeCargaFallida } = leerElErrorDelApi(
    finanzas,
    error,
    "Revisa tu conexión e intenta de nuevo.",
  );

  /**
   * 🔴 El reintento tiene que volver al estado de CARGA, no repintar el viejo:
   * `useAxios` limpia su `error` al ARRANCAR la petición, así que el render de
   * en medio ya no sabe que hubo un fallo.
   *
   * ⚠️ Acá NO hace falta un `setLoadingLocal(true)`, y se MIDIÓ: `execute`
   * hace `setLoaded(false)` de forma síncrona dentro del mismo evento, así que
   * el primer render después del click ya entra por `estaCargando`.
   *
   * 🔴 CORRECCIÓN DEL REVIEW 4R. Antes acá decía que el invariante lo sostenía
   * el ORDEN de las ramas, y que estaba pineado. Era cierto para DOS de los
   * tres renders y FALSO justo para el tercero: el de `filter_mov === "T"`, que
   * es el que viene seleccionado por defecto, no tenía rama de carga. Con un
   * reintento en vuelo y sin dato caía a las gráficas con las series en
   * `undefined`; lo único que lo tapaba era el contador global del
   * `LoadingScreen` compartido, que no es de este código. Los tres abren ahora
   * por `estaCargando`.
   *
   * Se le pasan los filtros vigentes porque `reLoad` sin payload manda el del
   * montaje (`payloadRef`), o sea `{}`: el reintento traería el período por
   * defecto en vez del que el usuario tiene elegido.
   */
  const handleRetryBalance = () => {
    // 🔴 La misma guarda que el efecto de arriba (`:87`), y por el mismo
    // motivo: `sc` no es un período, es «abrí el modal de rango
    // personalizado». Sin esto, reintentar después de abrir y descartar ese
    // modal le manda el centinela al API en vez de un rango.
    if (formStateFilter.filter_date === "sc") {
      setOpenCustomFilter(true);
      return;
    }
    reLoadFinanzas(formStateFilter);
  };

  /**
   * Un solo cartel para los tres renders: es un solo pedido el que falló.
   *
   * ⚠️ Queda como constante local y NO como componente compartido, pero eso es
   * una DEUDA, no una decisión cómoda: con esta pantalla la misma forma queda
   * escrita CINCO veces en el repo (muro, widget «Comunidad», formulario de
   * cobro, el panel y acá). Extraerla es un refactor de otro tamaño que no
   * entra en este ticket — y el que llegue sexto que no lo escriba de nuevo:
   * que la extraiga.
   */  const contenidoDeCargaFallida = (
    <div className={styles.loadErrorState} role="alert">
      <IconAlertCircle size={40} color="var(--cWarning)" />
      <p>No se pudo cargar la información financiera.</p>
      <span>{mensajeDeCargaFallida}</span>
      <button
        type="button"
        className={styles.retryButton}
        onClick={handleRetryBalance}
      >
        Reintentar
      </button>
    </div>
  );

  let ingresosContent;
  if (estaCargando) {
    ingresosContent = <LoadingScreen />;
  } else if (cargaFallida) {
    // Va ANTES del vacío: si no, un fallo sigue cayendo en el `EmptyData`.
    ingresosContent = contenidoDeCargaFallida;
  } else if (
    !finanzas?.data?.ingresosHist ||
    finanzas?.data?.ingresosHist?.length === 0
  ) {
    ingresosContent = (
      <EmptyData
        message="Gráfica y tablas financieras sin datos. verás la evolución del flujo de efectivo"
        line2="a medida que tengas ingresos y egresos."
        h={400}
        icon={
          charType.filter_charType === "line" ? (
            <IconLineGraphic size={80} color="var(--cWhiteV1)" />
          ) : (
            <IconGraphics size={80} color="var(--cWhiteV1)" />
          )
        }
      />
    );
  } else {
    ingresosContent = (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2 className={styles.chartSectionTitle} style={{ margin: 0 }}>
            {tituloBalance}
          </h2>
          <Button
            onClick={exportar}
            disabled={exportando}
            variant="secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              width: "auto",
              background: "var(--cWhiteV2)",
              color: "var(--cWhite)",
              border: "none",
              borderRadius: "12px",
            }}
          >
            <IconExport size={22} />
            Descargar reporte
          </Button>
        </div>
        <div className={styles.chartContainerOuter} ref={chartRefIngresos}>
          <div className={styles.chartContainer}>
            <WidgetGrafIngresos
              ingresos={filtrarHastaMesActual(
                finanzas?.data.ingresosHist || [],
              )}
              chartTypes={[charType.filter_charType]}
              h={360}
              title={`Bs ${formatNumber(
                legendCategoriasIngresos.reduce(
                  (acc: number, cat: any) => acc + cat.total,
                  0,
                ),
              )}`}
              subtitle={"Total de ingresos"}
              periodo={formStateFilter?.filter_date}
            />
            <div className={styles.legendAndExportWrapper}>
              <div className={styles.legendContainer}>
                {legendCategoriasIngresos.map((cat, idx) => (
                  <div className={styles.legendItem} key={cat.name ?? idx}>
                    <div
                      className={styles.legendColor}
                      style={{
                        backgroundColor: COLORS20[idx % COLORS20.length],
                      }}
                    ></div>
                    <span>
                      <span>{cat.name}:</span>
                      <span
                        className={styles.legendAmount}
                      >
                        {" "}
                        Bs {formatNumber(cat.total)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.divider} />

        <TableIngresos
          title="Ingresos"
          title2="Total"
          categorias={finanzas?.data?.categI}
          subcategorias={finanzas?.data?.ingresosHist}
          anual={
            formStateFilter?.filter_date === "y" ||
            formStateFilter?.filter_date === "ly" ||
            formStateFilter?.filter_date.indexOf("c:") > -1
          }
          selectcategorias={getSelectCategorias()}
        />
      </div>
    );
  }

  // --- Render condicional para egresos ---
  let egresosContent;
  if (estaCargando) {
    egresosContent = <LoadingScreen />;
  } else if (cargaFallida) {
    egresosContent = contenidoDeCargaFallida;
  } else if (
    !finanzas?.data?.egresosHist ||
    finanzas?.data?.egresosHist?.length === 0
  ) {
    egresosContent = (
      <EmptyData
        message="Gráfica y tablas financieras sin datos. verás la evolución del flujo de efectivo"
        line2="a medida que tengas ingresos y egresos."
        h={400}
        icon={
          charType.filter_charType === "line" ? (
            <IconLineGraphic size={60} color="var(--cWhiteV1)" />
          ) : (
            <IconGraphics size={60} color="var(--cWhiteV1)" />
          )
        }
      />
    );
  } else {
    egresosContent = (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2 className={styles.chartSectionTitle} style={{ margin: 0 }}>
            {tituloBalance}
          </h2>
          <Button
            onClick={exportar}
            disabled={exportando}
            variant="secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              width: "auto",
              background: "var(--cWhiteV2)",
              color: "var(--cWhite)",
              border: "none",
              borderRadius: "12px",
            }}
          >
            <IconExport size={22} />
            Descargar reporte
          </Button>
        </div>
        <div ref={chartRefEgresos} className={styles.chartContainerOuter}>
          <div className={styles.chartContainer}>
            <WidgetGrafEgresos
              egresos={filtrarHastaMesActual(finanzas?.data.egresosHist || [])}
              chartTypes={[charType.filter_charType]}
              h={360}
              title={`Bs ${formatNumber(
                legendCategoriasEgresos.reduce(
                  (acc: number, cat: any) => acc + cat.total,
                  0,
                ),
              )}`}
              subtitle={"Total de egresos"}
              periodo={formStateFilter?.filter_date}
            />
            <div className={styles.legendAndExportWrapper}>
              <div className={styles.legendContainer}>
                {legendCategoriasEgresos.map((cat, idx) => (
                  <div className={styles.legendItem} key={cat.name ?? idx}>
                    <div
                      className={styles.legendColor}
                      style={{
                        backgroundColor: COLORS20[idx % COLORS20.length],
                      }}
                    ></div>
                    <span>
                      <span>{cat.name}:</span>
                      <span
                        className={styles.legendAmount}
                      >
                        {" "}
                        Bs {formatNumber(cat.total)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.divider} />

        <TableEgresos
          title="Egresos"
          title2="Total"
          categorias={finanzas?.data?.categE}
          subcategorias={finanzas?.data?.egresosHist}
          anual={
            formStateFilter?.filter_date === "y" ||
            formStateFilter?.filter_date === "ly" ||
            formStateFilter?.filter_date.indexOf("c:") > -1
          }
          selectcategorias={getSelectCategorias()}
        />
      </div>
    );
  }
  if (!userCan("balance", "R")) {
    return <NotAccess />;
  }
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Flujo de efectivo</h1>
      {/* No saca de pantalla el balance que el usuario está leyendo: sólo
          avisa que no se pudo actualizar. */}
      {datoDesactualizado && (
        <div className={styles.staleBanner} role="status">
          <IconAlertCircle size={20} color="var(--cWarning)" />
          <span>No se pudo actualizar: estás viendo el último dato que cargó.</span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleRetryBalance}
          >
            Reintentar
          </button>
        </div>
      )}
      <div>
        <div className={styles.filterContainer}>
          <div className={styles.filterItem}>
            <Select
              label="Periodo"
              value={formStateFilter?.filter_date}
              name="periodo"
              error={errors}
              onChange={(e) => {
                setFormStateFilter({
                  ...formStateFilter,
                  filter_date: e.target.value,
                });
              }}
              options={ldate}
              required
              iconLeft={<IconArrowDown />}
              inputStyle={{
                height: 44,
                backgroundColor: "#d7fff005",
                border: "1px solid #d7fff014",
                borderRadius: 12,
                color: "#878f9a",
              }}
              style={{
                height: 44,
                border: "none",
                backgroundColor: "transparent",
              }}
            />
          </div>
          <div className={styles.filterItem}>
            <Select
              label="Tipo de transacción"
              value={formStateFilter?.filter_mov}
              name="mov"
              error={errors}
              onChange={(e) => {
                setLoadingLocal(true);
                setFormStateFilter({
                  ...formStateFilter,
                  filter_mov: e.target.value,
                  filter_categ: [],
                });
              }}
              options={[
                { id: "T", name: "Ingresos y egresos" },
                { id: "I", name: "Ingresos" },
                { id: "E", name: "Egresos" },
              ]}
              required
              iconLeft={<IconArrowDown />}
              inputStyle={{
                height: 44,
                backgroundColor: "#d7fff005",
                border: "1px solid #d7fff014",
                borderRadius: 12,
                color: "#878f9a",
              }}
              style={{
                height: 44,
                border: "none",
                backgroundColor: "transparent",
              }}
            />
          </div>

          <div className={styles.filterItem}>
            <div className={styles.relativeContainer}>
              {formStateFilter.filter_mov === "T" && (
                <div className={styles.overlayDisabled}></div>
              )}

              <Select
                label="Categoría"
                value={formStateFilter?.filter_categ}
                placeholder="Todas"
                name="categ"
                error={errors}
                multiSelect={true}
                onChange={(e) => {
                  let value = e.target.value;

                  if (Array.isArray(value) && value.length === 0) value = "";

                  setFormStateFilter({
                    ...formStateFilter,

                    filter_categ: value,
                  });
                }}
                options={getCategories()}
                required
                iconLeft={<IconArrowDown />}
                inputStyle={{
                  height: 44,
                  backgroundColor: "#d7fff005",
                  border: "1px solid #d7fff014",
                  borderRadius: 12,
                  color: "#878f9a",
                }}
                style={{
                  height: 44,
                  border: "none",
                  backgroundColor: "transparent",
                }}
              />
            </div>
          </div>

          <div
            className={`${styles.filterItem} ${styles.chartTypeSelectorContainer}`}
          >
            <div className={styles.chartTypeButtonWrapper}>
              <div
                // type="button"
                // title="Gráfico de Barras"
                className={`${styles.chartTypeButton} ${
                  charType.filter_charType === "bar"
                    ? styles.chartTypeButtonActive
                    : ""
                }`}
                onClick={() => {
                  if (lchars.some((c) => c.id === "bar")) {
                    setCharType({ filter_charType: "bar" });
                  }
                }}
                // disabled={!lchars.some((c) => c.id === "bar")}
              >
                <LineGraphic
                  size={20}
                  title="Ver gráfica en barra"
                  color={
                    charType.filter_charType === "bar"
                      ? "var(--cAccent, #00E38C)"
                      : "var(--cWhiteV1, #A7A7A7)"
                  }
                />
              </div>

              <button
                type="button"
                className={`${styles.chartTypeButton} ${
                  charType.filter_charType === "line"
                    ? styles.chartTypeButtonActive
                    : ""
                }`}
                onClick={() => {
                  if (lchars.some((c) => c.id === "line")) {
                    setCharType({ filter_charType: "line" });
                  }
                }}
                disabled={!lchars.some((c) => c.id === "line")}
              >
                <PointGraphic
                  title="Ver gráfica en línea"
                  size={20}
                  color={
                    charType.filter_charType === "line"
                      ? "var(--cAccent, #00E38C)"
                      : "var(--cWhiteV1, #A7A7A7)"
                  }
                />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.loadingContainer}>
          <LoadingScreen>
            {formStateFilter.filter_mov === "T" && (
              <>
                {/* El fallo se pregunta ANTES que el vacío: es la tercera
                    puerta al mismo `EmptyData` mentiroso, y la del filtro que
                    viene seleccionado por defecto. */}
                {estaCargando ? (
                  <LoadingScreen />
                ) : cargaFallida ? (
                  contenidoDeCargaFallida
                ) : loaded &&
                  (!finanzas?.data?.ingresosHist ||
                    finanzas?.data?.ingresosHist?.length === 0) &&
                  (!finanzas?.data?.egresosHist ||
                    finanzas?.data?.egresosHist?.length === 0) ? (
                  <EmptyData
                    message="Gráfica y tablas financieras sin datos. verás la evolución del flujo de efectivo"
                    line2="a medida que tengas ingresos y egresos."
                    h={400}
                    icon={
                      charType.filter_charType === "line" ? (
                        <IconLineGraphic size={80} color="var(--cWhiteV1)" />
                      ) : (
                        <IconGraphics size={80} color="var(--cWhiteV1)" />
                      )
                    }
                  />
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                      }}
                    >
                      <h2
                        className={styles.chartSectionTitle}
                        style={{ margin: 0 }}
                      >
                        {tituloBalance}
                      </h2>
                      <Button
                        onClick={exportar}
                        disabled={exportando}
                        variant="secondary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          width: "auto",
                          background: "var(--cWhiteV2)",
                          color: "var(--cWhite)",
                          border: "none",
                          borderRadius: "12px",
                        }}
                      >
                        <IconExport size={22} />
                        Descargar reporte
                      </Button>
                    </div>
                    <div
                      ref={chartRefBalance}
                      className={styles.chartContainerOuter}
                    >
                      <div className={styles.chartContainer}>
                        <WidgetGrafBalance
                          saldoInicial={finanzas?.data?.saldoInicial}
                          ingresos={finanzas?.data?.ingresosHist}
                          egresos={finanzas?.data?.egresosHist}
                          chartTypes={[charType.filter_charType]}
                          subtitle={getSubtitle()}
                          title={`Bs ${formatNumber(
                            calculatedTotals.saldoFinal,
                          )}`}
                          periodo={formStateFilter?.filter_date}
                          className={styles.lightChart}
                        />
                        <div className={styles.legendAndExportWrapper}>
                          <div className={styles.legendContainer}>
                            <div className={styles.legendItem}>
                              <div
                                className={styles.legendColor}
                                style={{ backgroundColor: "var(--cCompl1)" }}
                              ></div>

                              <span>
                                Saldo Inicial:{" "}
                                <span
                                  className={styles.legendAmount}
                                >
                                  Bs{" "}
                                  {formatNumber(calculatedTotals.saldoInicial)}
                                </span>
                              </span>
                            </div>

                            <div className={styles.legendItem}>
                              <div
                                className={styles.legendColor}
                                style={{ backgroundColor: "var(--cCompl7)" }}
                              ></div>

                              <span>
                                <span>Total de ingresos:</span>

                                <span
                                  className={styles.legendAmount}
                                >
                                  {" "}
                                  Bs{" "}
                                  {formatNumber(calculatedTotals.totalIngresos)}
                                </span>
                              </span>
                            </div>

                            <div className={styles.legendItem}>
                              <div
                                className={styles.legendColor}
                                style={{ backgroundColor: "var(--cCompl8)" }}
                              ></div>

                              <span>
                                Total de egresos:{" "}
                                <span
                                  className={styles.legendAmount}
                                >
                                  Bs{" "}
                                  {formatNumber(calculatedTotals.totalEgresos)}
                                </span>
                              </span>
                            </div>

                            <div className={styles.legendItem}>
                              <div
                                className={styles.legendColor}
                                style={{ backgroundColor: "var(--cCompl9)" }}
                              ></div>

                              <span>
                                Total de saldo acumulado:{" "}
                                <span
                                  className={styles.legendAmount}
                                >
                                  Bs {formatNumber(calculatedTotals.saldoFinal)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.divider} />

                    <h2 className={styles.chartSectionTitle}>
                      {`Resumen detallado de todos los ingresos`}
                    </h2>
                    <TableIngresos
                      title="Ingresos"
                      title2="Total"
                      categorias={finanzas?.data?.categI}
                      subcategorias={finanzas?.data?.ingresosHist}
                      anual={
                        formStateFilter?.filter_date === "y" ||
                        formStateFilter?.filter_date === "ly" ||
                        formStateFilter?.filter_date.indexOf("c:") > -1
                      }
                    />
                    <div className={styles.divider} />
                    <h2 className={styles.chartSectionTitle}>
                      {`Resumen detallado de todos los egresos`}
                    </h2>
                    <TableEgresos
                      title="Egresos"
                      title2="Total"
                      categorias={finanzas?.data?.categE}
                      subcategorias={finanzas?.data?.egresosHist}
                      anual={
                        formStateFilter?.filter_date === "y" ||
                        formStateFilter?.filter_date === "ly" ||
                        formStateFilter?.filter_date.indexOf("c:") > -1
                      }
                    />
                    <div className={styles.divider} />
                    <h2 className={styles.chartSectionTitle}>
                      {`Resumen detallado de totales`}
                    </h2>
                    <TableResumenGeneral
                      subcategoriasE={finanzas?.data?.egresosHist}
                      subcategoriasI={finanzas?.data?.ingresosHist}
                      title={"Resumen general"}
                      title2={"Total"}
                      titleTotal={"Total acumulado"}
                      saldoInicial={finanzas?.data?.saldoInicial}
                    />
                  </>
                )}
              </>
            )}

            {formStateFilter.filter_mov === "I" && <>{ingresosContent}</>}

            {formStateFilter.filter_mov === "E" && <>{egresosContent}</>}
          </LoadingScreen>
        </div>
      </div>

      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          let err: ErrorType = {};
          if (!startDate)
            err = { ...err, date_inicio: "La fecha de inicio es obligatoria" };
          if (!endDate)
            err = { ...err, date_fin: "La fecha de fin es obligatoria" };
          if (startDate && endDate && startDate > endDate)
            err = {
              ...err,
              date_inicio: "La fecha de inicio no puede ser mayor a la de fin",
            };
          if (
            startDate &&
            endDate &&
            startDate.slice(0, 4) !== endDate.slice(0, 4)
          ) {
            err = {
              ...err,
              date_inicio:
                "El periodo personalizado debe estar dentro del mismo año",
              date_fin:
                "El periodo personalizado debe estar dentro del mismo año",
            };
          }
          if (Object.keys(err).length > 0) {
            setErrors(err);
            return;
          }
          setFormStateFilter({
            ...formStateFilter,
            filter_date: "c:" + startDate + "," + endDate,
          });
          setOpenCustomFilter(false);
          setErrors({});
        }}
        errorStart={errors.date_inicio}
        errorEnd={errors.date_fin}
      />

      <ExportProgressModal
        open={modalExport}
        state={exportState}
        reportTypeLabel="flujo de efectivo"
        onDownload={async () => {
          await downloadExport();
          setModalExport(false);
          resetExport();
        }}
        onClose={() => {
          setModalExport(false);
          resetExport();
        }}
      />
    </div>
  );
};

export default BalanceGeneral;
