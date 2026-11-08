import type { FinancialDetailField } from "./FinancialDetailPrimitives";
import type { FinancialWorkspace, UsdComponent } from "./types";

const usdFormat = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

function componentFields(id: string, label: string, subject: string, component: UsdComponent): FinancialDetailField[] {
  if (component.currency !== "USD") return [];
  const { rate } = component;
  const fields: FinancialDetailField[] = [
    { id: `${id}-usd`, label: `${label} (USD)`, value: usdFormat.format(Number(component.amount)) },
  ];
  if (component.remaining != null) {
    fields.push({
      id: `${id}-usd-balance`,
      label: `Saldo ${subject} (USD)`,
      value: usdFormat.format(Number(component.remaining)),
    });
  }
  fields.push({
    id: `${id}-usd-rate`,
    label: `Cotización ${subject}`,
    value: `Bs ${rate.value} por USD · ${rate.source === "fixed" ? "Cambio fijo" : "BCB"} · ${rate.effective_date || rate.date}`,
  });
  return fields;
}

export function getUsdDebtFields(terms?: FinancialWorkspace["record"]["usd_terms"]): FinancialDetailField[] {
  if (!terms) return [];

  const fields = [
    ...componentFields("principal", "Capital", "del capital", terms.principal),
    ...componentFields("penalty", "Multa", "de la multa", terms.penalty),
  ];
  if (terms.quote_error) {
    fields.push({
      id: "usd-quote-warning",
      label: "Cotización USD",
      value: <span role="alert">{terms.quote_error}</span>,
      wide: true,
      tone: "warning",
    });
  }
  return fields;
}
