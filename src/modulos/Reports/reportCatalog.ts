export const reportCategories = [
  { value: "all", text: "Todos" },
  { value: "finance", text: "Finanzas" },
  { value: "security", text: "Vigilancia y seguridad" },
] as const;

export const reportCatalog = [
  {
    key: "accesses",
    title: "Accesos",
    description: "Consulta los ingresos y salidas de visitantes, invitaciones QR y pedidos de tu condominio.",
    category: "security",
    permission: "accesses",
    icon: "accesses",
    period: "Mes actual",
  },
  {
    key: "payments-income",
    title: "Ingresos",
    description: "Revisa los pagos registrados, sus conceptos, unidades, estados y montos en un solo reporte.",
    category: "finance",
    permission: "payments",
    icon: "income",
    period: "Mes actual",
  },
] as const;

// Shared by the sidebar and catalog so both expose the same readable reports.
export const reportPermissions = [...new Set(reportCatalog.map((report) => report.permission))];

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
  return { startDate: `${today.slice(0, 4)}-01-01`, endDate: today, allDates: false };
}
