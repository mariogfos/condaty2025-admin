"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { getUrlImages } from "@/mk/utils/string";
import { getDateDesdeHasta } from "@/mk/utils/date";

// Components
import Select from "@/mk/components/forms/Select/Select";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
// Tables
import TableIngresos from "./TableIngresos";
import TableEgresos from "./TableEgresos";
import TableResumenGeneral from "./TableResumenGeneral";
// Icons
import {
  IconArrowDown,
  IconExport,
  LineGraphic,
  PointGraphic,
  IconGraphics,
  IconLineGraphic,
} from "@/components/layout/icons/IconsBiblioteca";
// Styles
import styles from "./Balance.module.css";
import WidgetGrafEgresos from "@/components/Widgets/WidgetGrafEgresos/WidgetGrafEgresos";
import WidgetGrafIngresos from "@/components/Widgets/WidgetGrafIngresos/WidgetGrafIngresos";
import WidgetGrafBalance from "@/components/Widgets/WidgetGrafBalance/WidgetGrafBalance";
import { ChartType, COLORS20 } from "@/mk/components/ui/Graphs/GraphsTypes";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { formatNumber } from "@/mk/utils/numbers";
import EmptyData from "@/components/NoData/EmptyData";
// Interfaces
interface CategoryOption {
  id: string | number;
  name: string;
}

interface ChartTypeOption {
  id: ChartType;
  name: string;
}

interface FilterState {
  filter_date: string;
  filter_mov: string;
  filter_categ: string | string[];
}

interface FormStateType {
  date_inicio?: string;
  date_fin?: string;
  [key: string]: string | undefined;
}

interface FilterType {
  [key: string]: string;
}

interface ErrorType {
  [key: string]: string;
}

interface ChartTypeState {
  filter_charType: ChartType;
}

const mod = {
  modulo: "balance",
  singular: "balance",
  permiso: "",
  plural: "balances",
};

const paramsInitial = {
  searchBy: "",
};

const BalanceGeneral: React.FC = () => {
  const getSearch = (search: string | boolean, _searchBy = "") => {
    if (search === true) return "";
    return "|search:" + search;
  };

  const [filter, setFilter] = useState<FilterType>({});

  const getFilter = (
    opt: { opt?: string; value?: string | boolean } | string = "",
    firstDay = "",
    lastDay = "",
    _searchBy = ""
  ) => {
    if (typeof opt === "object" && opt?.value === true) return "";

    let searchBy = "";
    Object.keys(filter).forEach((key) => {
      if (
        typeof opt === "object" &&
        key !== opt.opt &&
        filter[key] &&
        filter[key] !== ""
      ) {
        searchBy += filter[key];
      }
    });

    let _search = "";

    if (
      typeof opt === "object" &&
      opt?.opt &&
      opt?.value &&
      opt?.value !== ""
    ) {
      _search += "|" + opt.opt + ":" + opt.value;
    }

    searchBy += _search;

    if (typeof opt === "object" && opt?.opt) {
      setFilter({ ...filter, [opt.opt]: _search });
    }

    return searchBy;
  };

  const [formStateFilter, setFormStateFilter] = useState<FilterState>({
    filter_date: "m",
    filter_mov: "T",
    filter_categ: "",
  });
  const [filtered, setFiltered] = useState(true);
  const [charType, setCharType] = useState<ChartTypeState>({
    filter_charType: "bar" as ChartType,
  });
  const [errors, setErrors] = useState<ErrorType>({});
  const [lchars, setLchars] = useState<ChartTypeOption[]>([]);
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [formState, setFormState] = useState<FormStateType>({});

  const { data: finanzas, reLoad: reLoadFinanzas } = useAxios(
    "/balances",
    "GET",
    {}
  );
  const { setStore } = useAuth();
  useEffect(() => {
    setStore({ title: "BALANCE" });
  }, []);

  useEffect(() => {
    if (!filtered) {
      if (formStateFilter.filter_date === "sc") {
        setOpenCustomFilter(true);
      } else {
        reLoadFinanzas(formStateFilter);
      }
    }
    setFiltered(false);
    if (formStateFilter.filter_mov === "T") {
      setCharType({ filter_charType: "bar" as ChartType });
      setLchars([
        { id: "bar" as ChartType, name: "Barra" },
        { id: "line" as ChartType, name: "Linea" },
      ]);
    } else {
      setCharType({ filter_charType: "bar" as ChartType });
      setLchars([
        { id: "bar" as ChartType, name: "Barra" },
        { id: "pie" as ChartType, name: "Torta" },
        { id: "line" as ChartType, name: "Linea" },
      ]);
    }
  }, [formStateFilter]);

  const ldate = [
    { id: "m", name: "Este mes" },
    { id: "lm", name: "Mes anterior" },
    { id: "y", name: "Este año" },
    { id: "ly", name: "Año anterior" },
    { id: "sc", name: "Personalizado" },
  ];

  const exportar = () => {
    reLoadFinanzas({ ...formStateFilter, exportar: true });
  };

  useEffect(() => {
    if (finanzas?.success === true && finanzas?.data?.export) {
      window.open(getUrlImages("/" + finanzas.data.export.path), "_blank");
    } else if (
      finanzas?.success === false &&
      finanzas?.message &&
      finanzas?.data?.export !== undefined
    ) {
      console.log(finanzas?.message, "error al exportar");
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
      data = finanzas?.data?.categI || [];
    } else {
      data = finanzas?.data?.categE || [];
    }
    return data;
  };

  const getGestionAnio = (filterDateValue: string) => {
    const now = new Date();
    let year = now.getFullYear();
    if (filterDateValue === "ly") {
      year = now.getFullYear() - 1;
    } else if (filterDateValue === "lm") {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      year = prevMonthDate.getFullYear();
    } else if (filterDateValue.startsWith("c:")) {
      const dates = filterDateValue.substring(2).split(",");
      if (dates[0]) {
        const startDate = new Date(dates[0] + "T00:00:00"); // Asegurar que se interprete como local
        year = startDate.getFullYear();
        if (dates[1]) {
          const endDate = new Date(dates[1] + "T00:00:00"); // Asegurar que se interprete como local
          const endYear = endDate.getFullYear();
          if (year !== endYear) {
            return `gestión ${year} - ${endYear}`;
          }
        }
      }
    }
    return `gestión ${year}`;
  };

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
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    switch (filterDateValue) {
      case "d":
        return `Balance del ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
      case "ld":
        const ayer = new Date(now);
        ayer.setDate(now.getDate() - 1);
        return `Balance del ${ayer.getDate()} de ${meses[ayer.getMonth()]} de ${ayer.getFullYear()}`;
      case "w":
        const inicioSemana = new Date(now);
        inicioSemana.setDate(now.getDate() - now.getDay() + 1);
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        return `Balance desde ${inicioSemana.getDate()} de ${meses[inicioSemana.getMonth()]} hasta ${finSemana.getDate()} de ${meses[finSemana.getMonth()]} de ${finSemana.getFullYear()}`;
      case "lw":
        const inicioSemanaAnterior = new Date(now);
        inicioSemanaAnterior.setDate(now.getDate() - now.getDay() - 6);
        const finSemanaAnterior = new Date(inicioSemanaAnterior);
        finSemanaAnterior.setDate(inicioSemanaAnterior.getDate() + 6);
        return `Balance desde ${inicioSemanaAnterior.getDate()} de ${meses[inicioSemanaAnterior.getMonth()]} hasta ${finSemanaAnterior.getDate()} de ${meses[finSemanaAnterior.getMonth()]} de ${finSemanaAnterior.getFullYear()}`;
      case "m":
        return `Balance de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
      case "lm":
        const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1);
        return `Balance de ${meses[mesAnterior.getMonth()]} de ${mesAnterior.getFullYear()}`;
      case "y":
        return `Balance del año ${now.getFullYear()}`;
      case "ly":
        return `Balance del año ${now.getFullYear() - 1}`;
      default:
        if (filterDateValue.startsWith("c:")) {
          const dates = filterDateValue.substring(2).split(",");
          if (dates[0] && dates[1]) {
            // Crear las fechas y ajustarlas a UTC-4
            const fechaInicio = new Date(dates[0] + "T00:00:00-04:00");
            const fechaFin = new Date(dates[1] + "T00:00:00-04:00");
            
            // Asegurarse de que las fechas se muestren correctamente
            fechaInicio.setHours(fechaInicio.getHours() + 4); // Ajustar a UTC-4
            fechaFin.setHours(fechaFin.getHours() + 4); // Ajustar a UTC-4
            
            return `Balance desde ${fechaInicio.getDate()} de ${meses[fechaInicio.getMonth()]} de ${fechaInicio.getFullYear()} hasta ${fechaFin.getDate()} de ${meses[fechaFin.getMonth()]} de ${fechaFin.getFullYear()}`;
          }
        }
        return "Balance general";
    }
  };

  // Agrupar y sumar categorías únicas para ingresos
  const legendCategoriasIngresos = React.useMemo(() => {
    const map = new Map();
    (finanzas?.data?.ingresosHist || []).forEach((item: any) => {
      if (!map.has(item.categ_id)) {
        map.set(item.categ_id, { name: item.categoria, total: 0 });
      }
      map.get(item.categ_id).total += parseFloat(item.ingresos || 0);
    });
    return Array.from(map.values());
  }, [finanzas?.data?.ingresosHist]);

  // Agrupar y sumar categorías únicas para egresos
  const legendCategoriasEgresos = React.useMemo(() => {
    const map = new Map();
    (finanzas?.data?.egresosHist || []).forEach((item: any) => {
      if (!map.has(item.categ_id)) {
        map.set(item.categ_id, { name: item.categoria, total: 0 });
      }
      map.get(item.categ_id).total += parseFloat(item.egresos || 0);
    });
    return Array.from(map.values());
  }, [finanzas?.data?.egresosHist]);

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
                setFormStateFilter({
                  ...formStateFilter,
                  filter_mov: e.target.value,
                  filter_categ: "",
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
                  setFormStateFilter({
                    ...formStateFilter,
                    filter_categ: e.target.value,
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
              <button
                type="button"
                title="Gráfico de Barras"
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
                disabled={!lchars.some((c) => c.id === "bar")}
              >
                <LineGraphic
                  size={20}
                  color={
                    charType.filter_charType === "bar"
                      ? "var(--cAccent, #00E38C)"
                      : "var(--cWhiteV1, #A7A7A7)"
                  }
                />
              </button>
              <button
                type="button"
                title="Gráfico de Línea"
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
                {(!finanzas?.data?.ingresos || finanzas?.data?.ingresos?.length === 0) && 
                 (!finanzas?.data?.egresos || finanzas?.data?.egresos?.length === 0) ? (
                  <EmptyData
                    message="Gráfica y tablas financieras sin datos. verás la evolución del flujo de efectivo"
                    line2="a medida que tengas ingresos y egresos."
                    h={400}
                    icon={
                      charType.filter_charType === "line"
                        ? <IconLineGraphic size={80} color="var(--cWhiteV1)" />
                        : <IconGraphics size={80} color="var(--cWhiteV1)" />
                    }
                  />
                ) : (
                  <>
                    <h2 className={styles.chartSectionTitle}>
                      {formStateFilter.filter_date == "d" ||
                      formStateFilter.filter_date == "ld"
                        ? "Balance de " +
                          (formStateFilter.filter_date == "d" ? "Hoy" : "Ayer")
                        : getPeriodoText(formStateFilter.filter_date)}
                    </h2>
                    <div className={styles.chartContainer}>
                      <WidgetGrafBalance
                        saldoInicial={finanzas?.data?.saldoInicial}
                        ingresos={finanzas?.data?.ingresosHist}
                        egresos={finanzas?.data?.egresosHist}
                        chartTypes={[charType.filter_charType as ChartType]}
                        subtitle={`Saldo Final del Periodo`}
                        title={`Bs ${formatNumber(calculatedTotals.saldoFinal)}`}
                        periodo={formStateFilter?.filter_date}
                      />
                      <div className={styles.legendAndExportWrapper}>
                        <div className={styles.legendContainer}>
                          <div className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: "#FFD700" }}
                            ></div>
                            <span>
                              Saldo Inicial: Bs{" "}
                              {formatNumber(calculatedTotals.saldoInicial)}
                            </span>
                          </div>
                          <div className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: "#00E38C" }}
                            ></div>
                            <span>
                              Ingresos: Bs{" "}
                              {formatNumber(calculatedTotals.totalIngresos)}
                            </span>
                          </div>
                          <div className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: "#FF5B4D" }}
                            ></div>
                            <span>
                              Egresos: Bs{" "}
                              {formatNumber(calculatedTotals.totalEgresos)}
                            </span>
                          </div>
                          <div className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: "#4C98DF" }}
                            ></div>
                            <span>
                              Saldo Final: Bs{" "}
                              {formatNumber(calculatedTotals.saldoFinal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.divider} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                      <Button
                        onClick={exportar}
                        variant="secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'auto' }}
                      >
                        <IconExport size={22} />
                        Descargar tablas
                      </Button>
                    </div>
                    <h2 className={styles.chartSectionTitle}>
                      {`Resumen detallado de los ingresos`}
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
                      {`Resumen detallado de los egresos`}
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

            {formStateFilter.filter_mov === "I" && (
              <>
                {(!finanzas?.data?.ingresos || finanzas?.data?.ingresos?.length === 0) ? (
                  <EmptyData
                    message="Gráfica y tablas financieras sin datos. verás la evolución del flujo de efectivo"
                    line2="a medida que tengas ingresos y egresos."
                    h={400}
                    icon={
                      charType.filter_charType === "line"
                        ? <IconLineGraphic size={80} color="var(--cWhiteV1)" />
                        : <IconGraphics size={80} color="var(--cWhiteV1)" />
                    }
                  />
                ) : (
                  <>
                    <div className={styles.chartContainer}>
                      <div className={styles.chartAndLegendContainer}>
                        <WidgetGrafIngresos
                          ingresos={(() => {
                            const ingresosHist = finanzas?.data.ingresosHist || [];
                            const selectcategorias = typeof formStateFilter.filter_categ === "string"
                              ? formStateFilter.filter_categ
                                ? [formStateFilter.filter_categ]
                                : []
                              : formStateFilter.filter_categ;
                            if (selectcategorias && selectcategorias.length > 0) {
                              // Mostrar solo subcategorías/hijas cuyo category_id coincida con la categoría padre seleccionada
                              return ingresosHist.filter((item: any) => selectcategorias.includes(item.category_id));
                            }
                            return ingresosHist;
                          })()}
                          chartTypes={[charType.filter_charType as ChartType]}
                          h={360}
                          title={" "}
                          subtitle={getPeriodoText(formStateFilter.filter_date)}
                          periodo={formStateFilter?.filter_date}
                        />
                        <div className={styles.legendAndExportWrapper}>
                          <div className={styles.legendContainer}>
                            {(() => {
                              const selectcategorias = typeof formStateFilter.filter_categ === "string"
                                ? formStateFilter.filter_categ
                                  ? [formStateFilter.filter_categ]
                                  : []
                                : formStateFilter.filter_categ;
                              let legend = legendCategoriasIngresos;
                              if (selectcategorias && selectcategorias.length > 0) {
                                // Mostrar solo subcategorías/hijas cuyo category_id coincida con la categoría padre seleccionada
                                legend = (finanzas?.data?.ingresosHist || [])
                                  .filter((item: any) => selectcategorias.includes(item.category_id))
                                  .reduce((acc: any[], item: any) => {
                                    let found = acc.find((a) => a.id === item.categ_id);
                                    if (found) {
                                      found.total += parseFloat(item.ingresos || 0);
                                    } else {
                                      acc.push({ id: item.categ_id, name: item.categoria, total: parseFloat(item.ingresos || 0) });
                                    }
                                    return acc;
                                  }, []);
                              }
                              return legend.map((cat, idx) => (
                                <div className={styles.legendItem} key={cat.name || idx}>
                                  <div
                                    className={styles.legendColor}
                                    style={{ backgroundColor: COLORS20[idx % COLORS20.length] }}
                                  ></div>
                                  <span>
                                    {cat.name}: Bs {formatNumber(cat.total)}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.divider} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                      <Button
                        onClick={exportar}
                        variant="secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'auto' }}
                      >
                        <IconExport size={22} />
                        Descargar tablas
                      </Button>
                    </div>
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
                      selectcategorias={
                        typeof formStateFilter.filter_categ === "string"
                          ? formStateFilter.filter_categ
                            ? [formStateFilter.filter_categ]
                            : []
                          : formStateFilter.filter_categ
                      }
                    />
                  </>
                )}
              </>
            )}

            {formStateFilter.filter_mov === "E" && (
              <>
                {(!finanzas?.data?.egresos || finanzas?.data?.egresos?.length === 0) ? (
                  <EmptyData
                    message="Gráfica y tablas financieras sin datos. verás la evolución del flujo de efectivo"
                    line2="a medida que tengas ingresos y egresos."
                    h={400}
                    icon={
                      charType.filter_charType === "line"
                        ? <IconLineGraphic size={60} color="var(--cWhiteV1)" />
                        : <IconGraphics size={60} color="var(--cWhiteV1)" />
                    }
                  />
                ) : (
                  <>
                    <div className={styles.chartContainer}>
                      <div className={styles.chartAndLegendContainer}>
                        <WidgetGrafEgresos
                          egresos={(() => {
                            const egresosHist = finanzas?.data.egresosHist || [];
                            const selectcategorias = typeof formStateFilter.filter_categ === "string"
                              ? formStateFilter.filter_categ
                                ? [formStateFilter.filter_categ]
                                : []
                              : formStateFilter.filter_categ;
                            if (selectcategorias && selectcategorias.length > 0) {
                              // Mostrar solo subcategorías/hijas cuyo category_id coincida con la categoría padre seleccionada
                              return egresosHist.filter((item: any) => selectcategorias.includes(item.category_id));
                            }
                            return egresosHist;
                          })()}
                          chartTypes={[charType.filter_charType as ChartType]}
                          h={360}
                          title={" "}
                          subtitle={getPeriodoText(formStateFilter.filter_date)}
                          periodo={formStateFilter?.filter_date} 
                        />
                        <div className={styles.legendAndExportWrapper}>
                          <div className={styles.legendContainer}>
                            {(() => {
                              const selectcategorias = typeof formStateFilter.filter_categ === "string"
                                ? formStateFilter.filter_categ
                                  ? [formStateFilter.filter_categ]
                                  : []
                                : formStateFilter.filter_categ;
                              let legend = legendCategoriasEgresos;
                              if (selectcategorias && selectcategorias.length > 0) {
                                // Mostrar solo subcategorías/hijas cuyo category_id coincida con la categoría padre seleccionada
                                legend = (finanzas?.data?.egresosHist || [])
                                  .filter((item: any) => selectcategorias.includes(item.category_id))
                                  .reduce((acc: any[], item: any) => {
                                    let found = acc.find((a) => a.id === item.categ_id);
                                    if (found) {
                                      found.total += parseFloat(item.egresos || 0);
                                    } else {
                                      acc.push({ id: item.categ_id, name: item.categoria, total: parseFloat(item.egresos || 0) });
                                    }
                                    return acc;
                                  }, []);
                              }
                              return legend.map((cat, idx) => (
                                <div className={styles.legendItem} key={cat.name || idx}>
                                  <div
                                    className={styles.legendColor}
                                    style={{ backgroundColor: COLORS20[idx % COLORS20.length] }}
                                  ></div>
                                  <span>
                                    {cat.name}: Bs {formatNumber(cat.total)}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.divider} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                      <Button
                        onClick={exportar}
                        variant="secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'auto' }}
                      >
                        <IconExport size={22} />
                        Descargar tablas
                      </Button>
                    </div>
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
                      selectcategorias={
                        typeof formStateFilter.filter_categ === "string"
                          ? formStateFilter.filter_categ
                            ? [formStateFilter.filter_categ]
                            : []
                          : formStateFilter.filter_categ
                      }
                    />
                  </>
                )}
              </>
            )}
          </LoadingScreen>
        </div>
      </div>

      <DataModal
        open={openCustomFilter}
        title="Personalizar"
        onSave={onSaveCustomFilter}
        onClose={() => {
          setFormState({});
          setOpenCustomFilter(false);
          setErrors({});
        }}
      >
        <Input
          type="date"
          label="Fecha de inicio"
          name="date_inicio"
          error={errors}
          value={formState["date_inicio"]}
          onChange={(e) => {
            setFormState({ ...formState, date_inicio: e.target.value });
          }}
          required
        />
        <Input
          type="date"
          label="Fecha de fin"
          name="date_fin"
          error={errors}
          value={formState["date_fin"]}
          onChange={(e) => {
            setFormState({ ...formState, date_fin: e.target.value });
          }}
          required
        />
      </DataModal>
    </div>
  );
};

export default BalanceGeneral;
