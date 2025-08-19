"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { getUrlImages } from "@/mk/utils/string";
import html2canvas from "html2canvas";
import Select from "@/mk/components/forms/Select/Select";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
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
import { formatNumber } from "@/mk/utils/numbers";
import EmptyData from "@/components/NoData/EmptyData";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import { MONTHS_GRAPH } from "@/mk/utils/date";
interface ChartTypeOption {
  id: ChartType;
  name: string;
}
interface FilterState {
  filter_date: string;
  filter_mov: string;
  filter_categ: string[];
}
interface FormStateType {
  date_inicio?: string;
  date_fin?: string;
  [key: string]: string | undefined;
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
  const [formState, setFormState] = useState<FormStateType>({});

  const chartRefBalance = useRef<HTMLDivElement>(null);
  const chartRefIngresos = useRef<HTMLDivElement>(null);
  const chartRefEgresos = useRef<HTMLDivElement>(null);

  const [exportando, setExportando] = useState(false);

  const {
    data: finanzas,

    reLoad: reLoadFinanzas,

    loaded,
  } = useAxios("/balances", "POST", {});
  const { setStore } = useAuth();
  const [loadingLocal, setLoadingLocal] = useState(false);
  useEffect(() => {
    setStore({ title: "BALANCE" });
  }, []);

  useEffect(() => {
    if (formStateFilter.filter_date === "sc") {
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

  const exportar = async () => {
    setExportando(true);

    // Esperar a que el gráfico se re-renderice con fondo blanco

    await new Promise((resolve) => setTimeout(resolve, 100));

    let fileObj = null;
    let refToCapture = chartRefBalance;
    let fileName = "grafica-balance.png";
    if (formStateFilter.filter_mov === "I") {
      refToCapture = chartRefIngresos;
      fileName = "grafica-ingresos.png";
    } else if (formStateFilter.filter_mov === "E") {
      refToCapture = chartRefEgresos;
      fileName = "grafica-egresos.png";
    } else if (formStateFilter.filter_mov === "T") {
      refToCapture = chartRefBalance;
      fileName = "grafica-balance-claro.png";
    }
    if (refToCapture.current) {
      const canvas = await html2canvas(refToCapture.current);
      const base64 = canvas.toDataURL("image/png");
      let base64String = base64.replace("data:image/png;base64,", "");
      base64String = encodeURIComponent(base64String);
      fileObj = { ext: "png", file: base64String };
    }
    setExportando(false);
    reLoadFinanzas({
      ...formStateFilter,
      exportar: true,
      grafica: fileObj ?? null,
    });
  };
  useEffect(() => {
    if (finanzas?.success === true && finanzas?.data?.export) {
      window.open(getUrlImages("/" + finanzas.data.export.path), "_blank");
    }
  }, [finanzas]);
  const onSaveCustomFilter = () => {
    let err: ErrorType = {};
    if (!formState.date_inicio) {
      err = { ...err, date_inicio: "La fecha de inicio es obligatoria" };
    }
    if (!formState.date_fin) {
      err = { ...err, date_fin: "La fecha de fin es obligatoria" };
    }
    if (
      formState.date_inicio &&
      formState.date_fin &&
      formState.date_inicio > formState.date_fin
    ) {
      err = {
        ...err,
        date_inicio: "La fecha de inicio no puede ser mayor a la de fin",
      };
    }
    if (
      formState.date_inicio &&
      formState.date_fin &&
      formState.date_inicio.slice(0, 4) !== formState.date_fin.slice(0, 4)
    ) {
      err = {
        ...err,
        date_inicio: "El periodo personalizado debe estar dentro del mismo año",
        date_fin: "El periodo personalizado debe estar dentro del mismo año",
      };
    }
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }
    if (formState.date_inicio && formState.date_fin) {
      setFormStateFilter({
        ...formStateFilter,
        filter_date: "c:" + formState.date_inicio + "," + formState.date_fin,
      });
    }
    setOpenCustomFilter(false);
    setErrors({});
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
        categoriasDisponibles.includes(cat)
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
    finanzas?.data?.egresos?.forEach((subcategoria: any) => {
      totalEgresos += Number(subcategoria.amount) || 0;
    });
    finanzas?.data?.ingresos?.forEach((subcategoria: any) => {
      totalIngresos += Number(subcategoria.amount) || 0;
    });
    const saldoFinal = totalIngresos - totalEgresos + saldoInicial;
    return { totalIngresos, totalEgresos, saldoInicial, saldoFinal };
  }, [
    finanzas?.data?.ingresos,
    finanzas?.data?.egresos,

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
        map.set(item.categ_id, { name: item.categoria, total: 0 });
      }
      map.get(item.categ_id).total += parseFloat(item.ingresos ?? 0);
    });
    return Array.from(map.values());
  }, [finanzas?.data?.ingresosHist]);
  const legendCategoriasEgresos = React.useMemo(() => {
    const map = new Map();
    (finanzas?.data?.egresosHist ?? []).forEach((item: any) => {
      if (!map.has(item.categ_id)) {
        map.set(item.categ_id, { name: item.categoria, total: 0 });
      }
      map.get(item.categ_id).total += parseFloat(item.egresos ?? 0);
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
  const filtrarHastaMesActual = (data: any[], tipo: string) => {
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

  const filtrarPorCategorias = (data: any[], key: string) => {
    const selectcategorias = getSelectCategorias();
    if (selectcategorias && selectcategorias.length > 0) {
      return data.filter((item: any) => selectcategorias.includes(item[key]));
    }
    return data;
  };

  const getLegendIngresos = () => {
    const selectcategorias = getSelectCategorias();
    let legend = legendCategoriasIngresos;
    if (selectcategorias && selectcategorias.length > 0) {
      legend = (finanzas?.data?.ingresosHist ?? [])
        .filter((item: any) => selectcategorias.includes(item.category_id))
        .reduce((acc: any[], item: any) => {
          let found = acc.find((a) => a.id === item.categ_id);
          if (found) {
            found.total += parseFloat(item.ingresos ?? 0);
          } else {
            acc.push({
              id: item.categ_id,
              name: item.categoria,
              total: parseFloat(item.ingresos ?? 0),
            });
          }
          return acc;
        }, []);
    }
    return legend;
  };

  const getLegendEgresos = () => {
    const selectcategorias = getSelectCategorias();
    let legend = legendCategoriasEgresos;
    if (selectcategorias && selectcategorias.length > 0) {
      legend = (finanzas?.data?.egresosHist ?? [])
        .filter((item: any) => selectcategorias.includes(item.category_id))
        .reduce((acc: any[], item: any) => {
          let found = acc.find((a) => a.id === item.categ_id);
          if (found) {
            found.total += parseFloat(item.egresos ?? 0);
          } else {
            acc.push({
              id: item.categ_id,
              name: item.categoria,
              total: parseFloat(item.egresos ?? 0),
            });
          }
          return acc;
        }, []);
    }
    return legend;
  };

  let ingresosContent;
  if (loadingLocal || !loaded) {
    ingresosContent = <LoadingScreen />;
  } else if (
    !finanzas?.data?.ingresos ||
    finanzas?.data?.ingresos?.length === 0
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
                filtrarPorCategorias(
                  finanzas?.data.ingresosHist || [],
                  "category_id"
                ),
                "I"
              )}
              chartTypes={[charType.filter_charType]}
              h={360}
              title={`Bs ${formatNumber(
                getLegendIngresos().reduce(
                  (acc: number, cat: any) => acc + cat.total,
                  0
                )
              )}`}
              subtitle={"Total de ingresos"}
              periodo={formStateFilter?.filter_date}
              exportando={exportando}
            />
            <div className={styles.legendAndExportWrapper}>
              <div className={styles.legendContainer}>
                {getLegendIngresos().map((cat, idx) => (
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
                        className={`${styles.legendAmount} ${
                          exportando ? styles.exportando : ""
                        }`}
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
          subcategorias={finanzas?.data?.ingresos}
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
  if (loadingLocal || !loaded) {
    egresosContent = <LoadingScreen />;
  } else if (
    !finanzas?.data?.egresos ||
    finanzas?.data?.egresos?.length === 0
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
              egresos={filtrarHastaMesActual(
                filtrarPorCategorias(
                  finanzas?.data.egresosHist || [],
                  "category_id"
                ),
                "E"
              )}
              chartTypes={[charType.filter_charType]}
              h={360}
              title={`Bs ${formatNumber(
                getLegendEgresos().reduce(
                  (acc: number, cat: any) => acc + cat.total,
                  0
                )
              )}`}
              subtitle={"Total de egresos"}
              periodo={formStateFilter?.filter_date}
              exportando={exportando}
            />
            <div className={styles.legendAndExportWrapper}>
              <div className={styles.legendContainer}>
                {getLegendEgresos().map((cat, idx) => (
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
                        className={`${styles.legendAmount} ${
                          exportando ? styles.exportando : ""
                        }`}
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
          subcategorias={finanzas?.data?.egresos}
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Flujo de efectivo</h1>
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
                {loaded &&
                (!finanzas?.data?.ingresos ||
                  finanzas?.data?.ingresos?.length === 0) &&
                (!finanzas?.data?.egresos ||
                  finanzas?.data?.egresos?.length === 0) ? (
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
                            calculatedTotals.saldoFinal
                          )}`}
                          periodo={formStateFilter?.filter_date}
                          className={styles.lightChart}
                          exportando={exportando}
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
                                  className={`${styles.legendAmount} ${
                                    exportando ? styles.exportando : ""
                                  }`}
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
                                  className={`${styles.legendAmount} ${
                                    exportando ? styles.exportando : ""
                                  }`}
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
                                  className={`${styles.legendAmount} ${
                                    exportando ? styles.exportando : ""
                                  }`}
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
                                  className={`${styles.legendAmount} ${
                                    exportando ? styles.exportando : ""
                                  }`}
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
                      subcategorias={finanzas?.data?.ingresos}
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
                      subcategorias={finanzas?.data?.egresos}
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
                      subcategoriasE={finanzas?.data?.egresos}
                      subcategoriasI={finanzas?.data?.ingresos}
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
          setFormState({});
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
    </div>
  );
};

export default BalanceGeneral;
