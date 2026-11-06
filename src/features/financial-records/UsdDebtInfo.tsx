import type { FinancialWorkspace, UsdComponent } from "./types";
import styles from "./FinancialDetail.module.css";

function ComponentInfo({ title, component }: { title: string; component: UsdComponent }) {
  if (component.currency !== "USD") return null;
  const money = (value: string) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(Number(value));
  return <div>
    <strong>{title}: {money(component.amount)}</strong>
    {component.remaining != null && <p>Saldo: {money(component.remaining)}</p>}
    <p>Bs {component.rate.value} por USD · {component.rate.source === "fixed" ? "Cambio fijo" : "BCB"} · {component.rate.effective_date || component.rate.date}</p>
  </div>;
}

export function UsdDebtInfo({ terms }: { terms: FinancialWorkspace["record"]["usd_terms"] }) {
  if (!terms) return null;
  return <section className={styles.usdInfo} aria-label="Importes en dólares">
    {terms.quote_error && <p role="alert">{terms.quote_error}</p>}
    <ComponentInfo title="Capital" component={terms.principal} />
    <ComponentInfo title="Multa" component={terms.penalty} />
  </section>;
}
