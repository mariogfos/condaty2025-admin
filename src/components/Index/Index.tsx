import { ReactNode, useEffect } from "react";
import Link from "next/link";
import {
  ChartColumnBig,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";
import useAxios from "@/mk/hooks/useAxios";
import ConfigHealth from "@/components/ConfigHealth/ConfigHealth";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "../auth/NotAccess/NotAccess";
import styles from "./index.module.css";
import { formatNumber } from "@/mk/utils/numbers";
import WidgetBase from "../Widgets/WidgetBase/WidgetBase";
import WidgetGraphResume from "../Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume";
import { IconAlertCircle } from "../layout/icons/IconsBiblioteca";
// ⚠️ Esta pantalla RENDERIZA texto escrito por el servidor (CDT-99): el
// `message` de un sobre que no sea 5xx llega tal cual a la vista. El riesgo
// residual de eso —para los 4xx el único guardián es la lista de patrones
// técnicos— está medido y explicado en el docblock de `leerElErrorDelApi`.
import { leerElErrorDelApi } from "@/mk/hooks/useCrud/leerElErrorDelApi";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import { useScreenSize } from "@/mk/hooks/useScreenSize";
import { AssemblyDashboardCard } from "@/modulos/Assemblies/components/AssemblyDashboardCard/AssemblyDashboardCard";

const paramsInitial = {
  fullType: "L",
  searchBy: "",
};

type FinancialMetricProps = {
  href: string;
  icon: ReactNode;
  label: string;
  tone: "income" | "outlay" | "delinquency";
  value: number;
};

const FinancialMetric = ({
  href,
  icon,
  label,
  tone,
  value,
}: FinancialMetricProps) => (
  <Link
    href={href}
    className={`${styles.financialMetric} ${styles[`financialMetric_${tone}`] ?? ""}`}
  >
    <span className={styles.financialMetricHeader}>
      <span>{label}</span>
      <span className={styles.financialMetricIcon} aria-hidden="true">
        {icon}
      </span>
    </span>
    <strong>Bs. {formatNumber(value)}</strong>
  </Link>
);

/**
 * El inicio del administrador: cuatro paneles —resumen del mes, usuarios,
 * próxima asamblea y el gráfico financiero—, rediseño que viene de producción
 * (`547edd3f`, decisión de Mario del 2026-09-27).
 *
 * ⚠️ Las cuatro listas de antes —revisiones de pago, alertas, reservas y
 * pre-registros— y el widget «Comunidad» salieron del inicio a propósito: cada
 * una tiene su módulo (los pre-registros, su tarjeta en Residentes con
 * `pendingOwnersCount`, que viene de `v3/owners?fullType=EXTRA`). El
 * `/dashboard` del API ya no las arma (api#669).
 */
const HomePage = () => {
  const { store, setStore, userCan } = useAuth();
  const { localeTag, translate } = useScopedI18n("home");
  const { isMobile } = useScreenSize();

  useEffect(() => {
    const pageTitle = translate("pageTitle");
    if (store?.title === pageTitle) return;
    setStore({
      title: pageTitle,
    });
  }, [setStore, store?.title, translate]);

  const {
    data: dashboard,
    reLoad,
    loaded,
    error,
    isStale,
  } = useAxios("/dashboard", "GET", {
    ...paramsInitial,
  });

  /**
   * ────────────────────────────────────────────────────────────────────────
   * 🔴 CDT-99 — «no hay datos» y «no se pudo pedir» eran lo MISMO en pantalla.
   * ────────────────────────────────────────────────────────────────────────
   *
   * `useAxios` pone `loaded = true` en su `finally` pase lo que pase y deja
   * `data` en `null` (`useAxios.tsx:234`). Río abajo, un fallo de red y un
   * condominio recién creado son indistinguibles para quien no mire `error`.
   *
   * ⚠️ LO QUE HAY QUE ENTENDER ANTES DE TOCAR ESTO: el panel entero cuelga de
   * UN SOLO pedido. Ese `/dashboard` alimenta el resumen del mes, los usuarios,
   * la próxima asamblea y el gráfico financiero. Cuando falla no queda «un
   * pedazo vacío»: quedan varias afirmaciones falsas a la vez —«Bs. 0» de
   * ingresos, «Bs. 0» de cartera vencida, «0 usuarios», «Gráfica financiera sin
   * datos»—. Por eso el aviso es UNO solo: falló un pedido, se dice una vez.
   *
   * Lo que NO se toca son los pedidos que no fallaron: `ConfigHealth` tiene el
   * suyo, así que sigue en pantalla.
   *
   * Las dos formas del fallo, las mismas que cerró CDT-47:
   * - `error` — axios rechazó (5xx, 4xx, red caída, timeout).
   * - sin `data` en el sobre — el HTTP 200 rechazado en el cuerpo
   *   (`sendError($msg, [], 200)` devuelve `{success:false, message}` y NINGÚN
   *   `data`). Axios no rechaza un 200, así que ahí no hay `error` que mirar.
   *
   * ⚠️ Un condominio sin movimientos SÍ trae `data`: `sendResponse` siempre
   * arma la clave. El vacío legítimo sigue cayendo en su `EmptyData` de
   * siempre, que es lo que tiene que pasar.
   */
  const cargandoDashboard = !loaded && !dashboard?.data;
  /**
   * 🔴 La condición pregunta por el DATO, no por `error`, y eso NO es un
   * descuido (review de CDT-99).
   *
   * `useAxios` NO limpia `data` cuando falla (`useAxios.tsx:227`: `setError`
   * y nada más). Si la condición fuera `!!error || !dashboard?.data`, un
   * refresco fallado —el que dispara un modal al cerrarse, o el botón de
   * reintentar— le BORRARÍA al usuario un panel correcto que estaba mirando,
   * para poner un cartel de error. Cambiar «no se pudo actualizar» por «no
   * hay nada» es el mismo defecto que este ticket vino a cerrar, con el
   * signo al revés.
   *
   * Para ese caso —hay dato viejo en pantalla y el refresco falló— está
   * `isStale`, que el hook expone justo para esto (CDT-42).
   */
  const cargaFallida = loaded && !dashboard?.data;

  /**
   * El dato quedó viejo: se avisa SIN sacar de pantalla lo que el usuario
   * está leyendo. Se apaga solo en cuanto un refresco entra bien.
   *
   * 🔴 La guarda pregunta por `loaded`, NO por `cargandoDashboard` (review 4R).
   * `cargandoDashboard` y `cargaFallida` comparten el predicado
   * `!dashboard?.data`, así que durante un refresco fallado —el ÚNICO caso
   * donde `isStale` está prendido, porque hay dato viejo en pantalla— las dos
   * son `false` y no suprimen nada. `loaded` sí distingue: `execute` lo baja
   * de forma síncrona al arrancar cada pedido, así que mientras hay uno en
   * vuelo la banda —y su botón de Reintentar— no se pintan.
   */
  const datoDesactualizado = isStale && !cargaFallida && loaded;

  // Manda el código HTTP (CDT-94): 5xx y red caída caen al genérico; un 4xx
  // —un 403 de permisos— trae su propio texto, que es el que hay que leer,
  // porque reintentar no arregla un permiso.
  // ⚠️ El sobre del 200 rechazado viaja en `data`, no en `error`: axios no
  // rechaza un 200. `leerElErrorDelApi` mira los dos justamente por eso.
  const { mensaje: mensajeDeCargaFallida } = leerElErrorDelApi(
    dashboard,
    error,
    translate("loadErrorLine2"),
  );

  /**
   * 🔴 El reintento vuelve al estado de CARGA, no repinta el error.
   *
   * `useAxios` limpia su `error` al ARRANCAR la petición (`execute` hace
   * `setError("")` y `setLoaded(false)` de forma síncrona), así que basta con
   * pedir: `cargandoDashboard` toma la posta en el mismo render.
   */
  const handleRetryDashboard = () => {
    reLoad();
  };

  useEffect(() => {
    if (!store?.reLoadDashboard) return;
    reLoad();
  }, [store?.reLoadDashboard, reLoad]);

  if (!userCan("home", "R")) return <NotAccess />;

  const dashboardData = dashboard?.data ?? {};
  const totalIncomes = Number(dashboardData.TotalIngresos) || 0;
  const totalOutlays = Number(dashboardData.TotalEgresos) || 0;
  const delinquency = Number(dashboardData.morosos) || 0;
  const balance = totalIncomes - totalOutlays;
  const balanceMessage =
    balance >= 0 ? translate("positiveBalance") : translate("negativeBalance");

  // Las claves que devuelve `/dashboard` en `dev`: `ownersCount` son los
  // residentes activos con unidad.
  const userGroups = [
    {
      count: Number(dashboardData.adminsCount) || 0,
      key: "administrators",
      label: translate("administrators"),
      tooltip: translate("administratorsTooltip"),
    },
    {
      count: Number(dashboardData.ownersCount) || 0,
      key: "residents",
      label: translate("residents"),
      tooltip: translate("residentsTooltip"),
    },
    {
      count: Number(dashboardData.guardsCount) || 0,
      key: "guards",
      label: translate("guards"),
      tooltip: translate("guardsTooltip"),
    },
  ] as const;
  const totalUsers = userGroups.reduce((sum, { count }) => sum + count, 0);

  const today = new Date();
  const monthLabel = new Intl.DateTimeFormat(localeTag, {
    month: "long",
  }).format(today);
  const formattedDate = translate("summaryOfMonth", {
    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
  });
  const hasFinancialHistory =
    (dashboardData.ingresosHist?.length || 0) > 0 ||
    (dashboardData.egresosHist?.length || 0) > 0;
  const upcomingAssembly = dashboardData.assembly;

  return (
    <div className={styles.container} data-i18n-ignore="true">
      {/* Arriba de todo y antes del resumen: si al condominio le falta
          configuración, hay operaciones que van a fallar, y eso se tiene que
          ver antes que los números. Se pinta solo cuando falta algo. */}
      <ConfigHealth />
      {/* 🔴 CDT-99: mientras no se sepa, no se afirma. Los tres estados del
          panel son excluyentes a propósito —cargando, falló, listo— para que no
          queden dos a la vez ni parpadee del uno al otro. */}
      {cargandoDashboard ? (
        <div className={styles.loadingState}>
          {translate("loadingDashboard")}
        </div>
      ) : cargaFallida ? (
        <div className={styles.loadErrorState} role="alert">
          <IconAlertCircle size={40} color="var(--cWarning)" />
          <p>{translate("loadErrorTitle")}</p>
          <span>{mensajeDeCargaFallida}</span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleRetryDashboard}
          >
            {translate("retry")}
          </button>
        </div>
      ) : (
        <>
          {/* No saca de pantalla lo que el usuario está leyendo: sólo avisa
              que no se pudo actualizar. */}
          {datoDesactualizado && (
            <div className={styles.staleBanner} role="status">
              <IconAlertCircle size={20} color="var(--cWarning)" />
              <span>{translate("staleData")}</span>
              <button
                type="button"
                className={styles.retryButton}
                onClick={handleRetryDashboard}
              >
                {translate("retry")}
              </button>
            </div>
          )}
          <div
            className={`${styles.dashboardGrid} ${
              !upcomingAssembly ? styles.dashboardGridWithoutAssembly : ""
            }`}
            data-testid="home-dashboard-grid"
          >
            <WidgetBase
              variant="V1"
              title={translate("currentSummary")}
              subtitle={formattedDate}
              className={`${styles.dashboardPanel} ${styles.summaryArea}`}
            >
              <div className={styles.balanceHero}>
                <div className={styles.balanceCopy}>
                  <span>{balanceMessage}</span>
                  <strong className={balance < 0 ? styles.negativeValue : ""}>
                    Bs. {formatNumber(balance)}
                  </strong>
                  <p>{translate("balanceTooltip")}</p>
                </div>
                <span className={styles.balanceIcon} aria-hidden="true">
                  <WalletCards size={23} strokeWidth={1.65} />
                </span>
              </div>

              <div className={styles.financialMetrics}>
                <FinancialMetric
                  href="/payments"
                  label={translate("incomes")}
                  value={totalIncomes}
                  tone="income"
                  icon={<TrendingUp size={16} strokeWidth={1.8} />}
                />
                <FinancialMetric
                  href="/outlays"
                  label={translate("outlays")}
                  value={totalOutlays}
                  tone="outlay"
                  icon={<TrendingDown size={16} strokeWidth={1.8} />}
                />
                <FinancialMetric
                  href="/defaulters"
                  label={translate("delinquency")}
                  value={delinquency}
                  tone="delinquency"
                  icon={<ReceiptText size={16} strokeWidth={1.8} />}
                />
              </div>
            </WidgetBase>

            <WidgetBase
              variant="V1"
              title={translate("usersSummary")}
              subtitle={translate("usersSummarySubtitle")}
              className={`${styles.dashboardPanel} ${styles.usersArea}`}
            >
              <div className={styles.usersTotal}>
                <div>
                  <span>{translate("registeredUsers")}</span>
                  <strong>{formatNumber(totalUsers, 0)}</strong>
                </div>
                <span className={styles.usersIcon} aria-hidden="true">
                  <UsersRound size={21} strokeWidth={1.65} />
                </span>
              </div>

              <div className={styles.userBreakdown}>
                {userGroups.map(({ count, key, label, tooltip }) => (
                  <div key={key} className={styles.userRow} title={tooltip}>
                    <span>
                      <i
                        className={styles[`userDot_${key}`]}
                        aria-hidden="true"
                      />
                      {label}
                    </span>
                    <strong>{formatNumber(count, 0)}</strong>
                  </div>
                ))}
              </div>
            </WidgetBase>

            {upcomingAssembly && (
              <div className={styles.assemblyArea}>
                <AssemblyDashboardCard assembly={upcomingAssembly} />
              </div>
            )}

            <div className={styles.chartArea}>
              <WidgetGraphResume
                saldoInicial={dashboardData.saldoInicial}
                ingresos={dashboardData.ingresosHist || []}
                egresos={dashboardData.egresosHist || []}
                periodo="y"
                h={isMobile ? 250 : 310}
                showEmptyData={!hasFinancialHistory}
                emptyDataProps={{
                  message: translate("emptyFinancialChart"),
                  h: isMobile ? 220 : 300,
                  icon: <ChartColumnBig size={56} strokeWidth={1.35} />,
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
