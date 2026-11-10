export const reportCategories = [
  { value: "all", text: "Todos" },
  { value: "finance", text: "Finanzas" },
  { value: "security", text: "Vigilancia y seguridad" },
] as const;

const receivableDefaults = {
  category: "finance",
  permissions: ["debts_manager", "debts"],
} as const;

const receivableReports = [
  {
    ...receivableDefaults,
    key: "accounts-receivable",
    title: "Cuentas por cobrar",
    description: "Consulta las deudas con saldo pendiente por unidad y su detalle de capital y multas.",
    icon: "receivables",
    period: "Todos los vencimientos",
  },
  {
    ...receivableDefaults,
    key: "accounts-receivable-by-period",
    title: "Cuentas por cobrar por período",
    description: "Compara cuántas unidades tienen saldo en cada mes y cuánto queda por cobrar en expensas y otras deudas.",
    icon: "period",
    period: "Todos los períodos",
  },
  {
    ...receivableDefaults,
    key: "accounts-receivable-by-unit",
    title: "Cuentas por cobrar por unidad",
    description: "Ve en una fila por unidad la cantidad de deudas y los saldos pendientes, separados por expensas y otras deudas.",
    icon: "unit",
    period: "Todos los vencimientos",
  },
  {
    ...receivableDefaults,
    key: "overdue-expenses-by-unit",
    title: "Expensas en mora por unidad",
    description: "Identifica las unidades con expensas vencidas, los días de atraso y los importes por confirmar.",
    icon: "overdue",
    period: "Todos los vencimientos",
  },
] as const;

export const reportCatalog = [
  {
    key: "accesses",
    title: "Accesos",
    description: "Consulta los ingresos y salidas de visitantes, invitaciones QR y pedidos de tu condominio.",
    category: "security",
    permissions: ["accesses"],
    icon: "accesses",
    period: "Mes actual",
  },
  {
    key: "payments-income",
    title: "Ingresos",
    description: "Revisa los pagos registrados, sus conceptos, unidades, estados y montos en un solo reporte.",
    category: "finance",
    permissions: ["payments"],
    icon: "income",
    period: "Mes actual",
  },
  ...receivableReports,
] as const;

export const isReceivablesReport = (key: string) => receivableReports.some((report) => report.key === key);

// Shared by the sidebar and catalog so both expose the same readable reports.
export const reportPermissions = [...new Set(reportCatalog.flatMap((report) => [...report.permissions]))];

export function getCurrentMonthRange(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)!.value;
  const year = part("year");
  const month = part("month");

  const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();

  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${lastDay}`,
    allDates: false,
  };
}

export function getDefaultReportRange(reportKey: string, date = new Date()) {
  if (reportKey === "accesses") return getCurrentMonthRange(date);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
  return { startDate: `${today.slice(0, 4)}-01-01`, endDate: today, allDates: isReceivablesReport(reportKey) };
}
