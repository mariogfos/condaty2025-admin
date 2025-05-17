"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
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
} from "@/components/layout/icons/IconsBiblioteca";
// Styles
import styles from "./Balance.module.css";
import WidgetGrafEgresos from "@/components/Widgets/WidgetGrafEgresos/WidgetGrafEgresos";
import WidgetGrafIngresos from "@/components/Widgets/WidgetGrafIngresos/WidgetGrafIngresos";
import WidgetGrafBalance from "@/components/Widgets/WidgetGrafBalance/WidgetGrafBalance";
import { ChartType } from "@/mk/components/ui/Graphs/GraphsTypes";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { formatNumber } from "@/mk/utils/numbers";
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
  // const [lcategories, setLcategories] = useState<CategoryOption[]>([]);
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [formState, setFormState] = useState<FormStateType>({});

  // const { data: categories } = useAxios("/categories", "GET", {
  //   perPage: -1,
  //   page: 1,
  //   fullType: "OC", //OC = only categories
  // });

  // const { data: categoriesI } = useAxios("/categories", "GET", {
  //   perPage: -1,
  //   page: 1,
  //   fullType: "OC", //lista de categorias con hijos
  //   type: "I",
  // });

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
      // if (formStateFilter.filter_mov === "I") {
      //   setLcategories(finanzas?.data?.categI || []);
      // } else {
      //   setLcategories(finanzas?.data?.categE || []);
      // }
      setCharType({ filter_charType: "bar" as ChartType });
      setLchars([
        { id: "bar" as ChartType, name: "Barra" },
        { id: "pie" as ChartType, name: "Torta" },
        { id: "line" as ChartType, name: "Linea" },
      ]);
    }
  }, [formStateFilter]);
  const ldate = [
    { id: "ALL", name: "Todos" },
    { id: "ld", name: "Ayer" },
    { id: "w", name: "Esta semana" },
    { id: "lw", name: "Semana pasada" },
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
    } else {
      console.log(finanzas?.message, "error");
    }
  }, [finanzas]);

  const onSaveCustomFilter = () => {
    let err: ErrorType = {};
    if (!formState.date_inicio) {
      err = {
        ...err,
        date_inicio: "La fecha de inicio es obligatoria",
      };
    }
    if (!formState.date_fin) {
      err = {
        ...err,
        date_fin: "La fecha de fin es obligatoria",
      };
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

    // ESTA ES LA CORRECCIÓN
    if (formState.date_inicio && formState.date_fin) {
      // Directamente usar las cadenas YYYY-MM-DD de los inputs
      // No convertir a objeto Date para evitar problemas de zona horaria
      setFormStateFilter({
        ...formStateFilter,
        // Usar los strings directamente tal como vienen del input type="date"
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
        const startDate = new Date(dates[0] + "T00:00:00");
        year = startDate.getFullYear();
        if (dates[1]) {
          const endDate = new Date(dates[1] + "T00:00:00");
          const endYear = endDate.getFullYear();
          if (year !== endYear) {
            return `gestión ${year} - ${endYear}`;
          }
        }
      }
    }
    return `gestión ${year}`;
  };
  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Este es un resumen general de los ingresos, egresos y el saldo a favor,
        en esta sesión puedes generar reportes financieros de manera mensual o
        anual filtrado por los datos que selecciones.
      </p>
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
            {" "}
            {/* Contenedor especial para los botones de tipo de gráfico */}
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
                  // Solo permitir 'bar' si está en las opciones disponibles en lchars
                  if (lchars.some((c) => c.id === "bar")) {
                    setCharType({ filter_charType: "bar" });
                  }
                }}
                // Deshabilitar si 'bar' no es una opción en lchars
                disabled={!lchars.some((c) => c.id === "bar")}
              >
                <LineGraphic // Este ícono parece más de barras
                  size={20} // Ajusta el tamaño según necesites
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
                  // Solo permitir 'line' si está en las opciones disponibles en lchars
                  if (lchars.some((c) => c.id === "line")) {
                    setCharType({ filter_charType: "line" });
                  }
                }}
                // Deshabilitar si 'line' no es una opción en lchars
                disabled={!lchars.some((c) => c.id === "line")}
              >
                <PointGraphic // Este ícono parece más de líneas/puntos
                  size={20} // Ajusta el tamaño según necesites
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
            {formStateFilter.filter_mov === "T" && finanzas?.data?.ingresos && (
              <>
                <h2 className={styles.chartSectionTitle}>
                  {`Balance desde ${getDateDesdeHasta(
                    formStateFilter.filter_date
                  )}`}
                </h2>
                <div className={styles.chartContainer}>
                  <div className={styles.chartActionsHeader}>
                    <Button
                      className={styles.exportButtonAsIcon} // Nueva clase para el botón de ícono
                      onClick={exportar}
                      variant="secondary"
                    >
                      <IconExport size={22} />{" "}
                      {/* Ajusta el tamaño del ícono si es necesario */}
                    </Button>
                  </div>
                  <WidgetGrafBalance
                    saldoInicial={finanzas?.data?.saldoInicial}
                    ingresos={finanzas?.data?.ingresosHist}
                    egresos={finanzas?.data?.egresosHist}
                    chartTypes={[charType.filter_charType as ChartType]}
                    subtitle={`Total de saldo inicial: ${formatNumber(
                      finanzas?.data?.saldoInicial
                    )}`}
                    title={`Bs ${formatNumber(finanzas?.data?.saldoInicial)}`}
                    periodo={formStateFilter?.filter_date}
                  />

                  <div className={styles.legendContainer}>
                    {(() => {
                      let totalEgresos = 0;
                      let totalIngresos = 0;

                      finanzas?.data?.egresos?.forEach((subcategoria: any) => {
                        totalEgresos += Number(subcategoria.amount);
                      });
                      finanzas?.data?.ingresos?.forEach((subcategoria: any) => {
                        totalIngresos += Number(subcategoria.amount);
                      });

                      const saldoFinal =
                        totalIngresos -
                        totalEgresos +
                        Number(finanzas?.data?.saldoInicial);

                      return (
                        <>
                          <div className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: "#FFD700" }}
                            ></div>
                            <span>
                              Saldo Inicial: Bs{" "}
                              {formatNumber(finanzas?.data?.saldoInicial)}
                            </span>
                          </div>
                          <div className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: "#00E38C" }}
                            ></div>
                            <span>
                              Ingresos: Bs {formatNumber(totalIngresos)}
                            </span>
                          </div>
                          <div className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: "#FF5B4D" }}
                            ></div>
                            <span>
                              Egresos: Bs {formatNumber(totalEgresos)}
                            </span>
                          </div>
                          <div className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: "#4C98DF" }}
                            ></div>
                            <span>
                              Saldo Final: Bs {formatNumber(saldoFinal)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className={styles.divider} />
                <h2 className={styles.chartSectionTitle}>
                  {`Resumen detallado de los ingresos de la ${getGestionAnio(
                    formStateFilter.filter_date
                  )}`}
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
                  {`Resumen detallado de los egresos de la ${getGestionAnio(
                    formStateFilter.filter_date
                  )}`}
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
                  {`Resumen detallado de los totales de la ${getGestionAnio(
                    formStateFilter.filter_date
                  )}`}
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

            {formStateFilter.filter_mov === "I" && finanzas?.data?.ingresos && (
              <>
                <div className={styles.chartContainer}>
                  <WidgetGrafIngresos
                    ingresos={finanzas?.data.ingresosHist}
                    chartTypes={[charType.filter_charType as ChartType]}
                    h={360}
                    title={" "}
                    subtitle={
                      "Resumen de la gestión " +
                      getDateDesdeHasta(formStateFilter.filter_date)
                    }
                  />
                </div>

                <div className={styles.exportButtonContainer}>
                  <Button className={styles.exportButton} onClick={exportar}>
                    Exportar tabla
                  </Button>
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
                  selectcategorias={
                    typeof formStateFilter.filter_categ === "string"
                      ? formStateFilter.filter_categ
                        ? [formStateFilter.filter_categ]
                        : [] // Si es string, lo convierte a array o array vacío
                      : formStateFilter.filter_categ // Si ya es array, lo usa
                  }
                />
              </>
            )}

            {formStateFilter.filter_mov === "E" && finanzas?.data?.egresos && (
              <>
                <div className={styles.chartContainer}>
                  <WidgetGrafEgresos
                    egresos={finanzas?.data.egresosHist}
                    chartTypes={[charType.filter_charType as ChartType]}
                    h={360}
                    title={" "}
                    subtitle={
                      "Resumen de la gestión " +
                      getDateDesdeHasta(formStateFilter.filter_date)
                    }
                  />
                </div>

                <div className={styles.exportButtonContainer}>
                  <Button className={styles.exportButton} onClick={exportar}>
                    Exportar tabla
                  </Button>
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
                  selectcategorias={
                    typeof formStateFilter.filter_categ === "string"
                      ? formStateFilter.filter_categ
                        ? [formStateFilter.filter_categ]
                        : [] // Si es string, lo convierte a array o array vacío
                      : formStateFilter.filter_categ // Si ya es array, lo usa
                  }
                />
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
            setFormState({
              ...formState,
              date_inicio: e.target.value,
            });
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
            setFormState({
              ...formState,
              date_fin: e.target.value,
            });
          }}
          required
        />
      </DataModal>
    </div>
  );
};

export default BalanceGeneral;
